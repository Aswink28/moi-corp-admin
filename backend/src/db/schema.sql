-- ============================================================================
-- Company Onboarding Admin Portal — schema for database: company_admin_db
-- Completely independent from the Travel Expense Management app (traveldesk_db).
-- Idempotent: safe to run multiple times.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- provides gen_random_uuid()

-- ── Portal users (Super Admins who operate this portal) ─────────────────────
CREATE TABLE IF NOT EXISTS super_admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          VARCHAR(40) NOT NULL DEFAULT 'super_admin'
                  CHECK (role IN ('super_admin', 'admin')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Client companies (TCS, CTS, Infosys, Wipro, HCL, ...) ───────────────────
CREATE TABLE IF NOT EXISTS companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(190) NOT NULL,
  code        VARCHAR(40) NOT NULL UNIQUE,            -- short slug e.g. TCS, INFY
  legal_name  VARCHAR(190),
  industry    VARCHAR(120),
  email       VARCHAR(190),
  phone       VARCHAR(40),
  address     TEXT,
  city        VARCHAR(120),
  country     VARCHAR(120) DEFAULT 'India',
  logo_url    TEXT,
  status      VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'suspended', 'inactive')),
  created_by  UUID REFERENCES super_admins(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);

-- ── Company admins (the admin user(s) for each client company) ──────────────
CREATE TABLE IF NOT EXISTS company_admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone         VARCHAR(40),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_by    UUID REFERENCES super_admins(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_company_admins_company ON company_admins(company_id);

-- ── Subscriptions (trial / monthly / quarterly / yearly) ────────────────────
CREATE TABLE IF NOT EXISTS company_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan        VARCHAR(20) NOT NULL
                CHECK (plan IN ('trial', 'monthly', 'quarterly', 'yearly')),
  status      VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'expired', 'cancelled')),
  amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency    VARCHAR(8) NOT NULL DEFAULT 'INR',
  start_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date    DATE,
  created_by  UUID REFERENCES super_admins(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON company_subscriptions(company_id);

-- ── Company wallet (one per company) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_wallets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  balance     NUMERIC(16,2) NOT NULL DEFAULT 0,
  currency    VARCHAR(8) NOT NULL DEFAULT 'INR',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Wallet transactions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_wallet_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  wallet_id     UUID NOT NULL REFERENCES company_wallets(id) ON DELETE CASCADE,
  type          VARCHAR(20) NOT NULL
                  CHECK (type IN ('allocate', 'credit', 'debit')),
  amount        NUMERIC(16,2) NOT NULL CHECK (amount > 0),
  balance_after NUMERIC(16,2) NOT NULL,
  description   TEXT,
  performed_by  UUID REFERENCES super_admins(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wallet_txn_company ON company_wallet_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txn_created ON company_wallet_transactions(created_at DESC);

-- ── Per-company module configuration (toggles) ──────────────────────────────
CREATE TABLE IF NOT EXISTS company_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  flight_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
  hotel_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  train_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  bus_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  cab_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  expense_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  wallet_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by      UUID REFERENCES super_admins(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Audit logs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES super_admins(id) ON DELETE SET NULL,
  actor_email VARCHAR(190),
  action      VARCHAR(80) NOT NULL,         -- e.g. company.create, wallet.debit
  entity_type VARCHAR(60),                  -- e.g. company, company_admin, wallet
  entity_id   UUID,
  details     JSONB,
  ip_address  VARCHAR(60),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);

-- ============================================================================
-- Company Onboarding feature — extended schema (idempotent, safe to re-run).
-- Source of truth: ONBOARDING_CONTRACT.md §A.
-- ============================================================================

-- ── companies: extended onboarding profile fields ──────────────────────────
ALTER TABLE companies ADD COLUMN IF NOT EXISTS registration_number VARCHAR(80);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS gstin               VARCHAR(15);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pan                 VARCHAR(10);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS website             VARCHAR(190);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description         TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address_line1       VARCHAR(190);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address_line2       VARCHAR(190);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS state               VARCHAR(120);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pincode             VARCHAR(20);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS timezone            VARCHAR(64) DEFAULT 'Asia/Kolkata';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS currency            VARCHAR(8)  DEFAULT 'INR';

-- ── companies: loan / underwriting profile (for the Lender Portal API) ──────
ALTER TABLE companies ADD COLUMN IF NOT EXISTS requested_amount  NUMERIC(16,2);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS interest_rate_pct NUMERIC(5,2);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tenure_months     INTEGER;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS credit_rating     VARCHAR(10);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS purpose           VARCHAR(190);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS annual_revenue    NUMERIC(16,2);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS net_profit        NUMERIC(16,2);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS net_worth         NUMERIC(16,2);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS fiscal_year       INTEGER;

-- Demo backfill: give existing companies distinct, believable loan values so the
-- Lender Portal API returns real persisted data. Deterministic per company (via
-- hashtext(id)) and idempotent — only fills rows that don't yet have a value, so
-- it never overwrites real data entered later.
UPDATE companies SET
  requested_amount  = 1000000 + (abs(hashtext(id::text))        % 9)  * 1000000,
  interest_rate_pct = round((9 + (abs(hashtext(id::text||'i'))  % 60) / 10.0)::numeric, 2),
  tenure_months     = (ARRAY[12,24,36,48,60])[1 + abs(hashtext(id::text||'t')) % 5],
  credit_rating     = (ARRAY['AAA','AA','A','BBB','BB'])[1 + abs(hashtext(id::text||'c')) % 5],
  purpose           = (ARRAY['Working capital','Expansion','Equipment purchase','Debt refinancing','Inventory build-up'])[1 + abs(hashtext(id::text||'p')) % 5],
  annual_revenue    = 10000000 + (abs(hashtext(id::text||'ar')) % 90) * 1000000,
  net_profit        = 1000000  + (abs(hashtext(id::text||'np')) % 9)  * 1000000,
  net_worth         = 5000000  + (abs(hashtext(id::text||'nw')) % 45) * 1000000,
  fiscal_year       = 2024
WHERE requested_amount IS NULL;

-- ── company_admins: login + role + onboarding fields ───────────────────────
ALTER TABLE company_admins ADD COLUMN IF NOT EXISTS employee_id          VARCHAR(80);
ALTER TABLE company_admins ADD COLUMN IF NOT EXISTS username             VARCHAR(120) UNIQUE;
ALTER TABLE company_admins ADD COLUMN IF NOT EXISTS role                 VARCHAR(40) DEFAULT 'company_admin';
ALTER TABLE company_admins ADD COLUMN IF NOT EXISTS force_password_reset BOOLEAN DEFAULT true;

-- ── company_subscriptions: rich plan/billing fields ────────────────────────
-- NOTE: legacy 'plan' column stays NOT NULL with its CHECK (trial|monthly|quarterly|yearly).
-- It is left UNTOUCHED. Inserts MUST still populate 'plan' via the mapping in §A.3.
ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS plan_tier        VARCHAR(20);
ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS billing_cycle    VARCHAR(20);
ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS licensed_users   INTEGER;
ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS base_amount      NUMERIC(14,2);
ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS tax_percentage   NUMERIC(6,3);
ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(6,3);
ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS tax_amount       NUMERIC(14,2);
ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS total_amount     NUMERIC(14,2);
ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS auto_renewal     BOOLEAN DEFAULT false;

-- CHECK constraints on the NEW columns only, guarded so re-runs don't error.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_subscriptions_plan_tier_chk') THEN
    ALTER TABLE company_subscriptions
      ADD CONSTRAINT company_subscriptions_plan_tier_chk
      CHECK (plan_tier IS NULL OR plan_tier IN ('trial','basic','professional','enterprise'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_subscriptions_billing_cycle_chk') THEN
    ALTER TABLE company_subscriptions
      ADD CONSTRAINT company_subscriptions_billing_cycle_chk
      CHECK (billing_cycle IS NULL OR billing_cycle IN ('monthly','quarterly','half_yearly','annual'));
  END IF;
END $$;

-- ── company_wallets: onboarding wallet controls ────────────────────────────
ALTER TABLE company_wallets ADD COLUMN IF NOT EXISTS wallet_enabled        BOOLEAN DEFAULT true;
ALTER TABLE company_wallets ADD COLUMN IF NOT EXISTS credit_limit          NUMERIC(14,2) DEFAULT 0;
ALTER TABLE company_wallets ADD COLUMN IF NOT EXISTS low_balance_threshold NUMERIC(14,2) DEFAULT 0;
ALTER TABLE company_wallets ADD COLUMN IF NOT EXISTS auto_recharge_enabled BOOLEAN DEFAULT false;

-- ── company_settings: approval + reports toggles ───────────────────────────
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS approval_enabled BOOLEAN DEFAULT false;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS reports_enabled  BOOLEAN DEFAULT false;

-- ── company_contacts: primary point(s) of contact (N per company) ──────────
CREATE TABLE IF NOT EXISTS company_contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_name    VARCHAR(150) NOT NULL,
  designation     VARCHAR(120),
  email           VARCHAR(190),
  mobile          VARCHAR(20),
  alternate_phone VARCHAR(20),
  department      VARCHAR(120),
  created_by      UUID REFERENCES super_admins(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_company_contacts_company ON company_contacts(company_id);

-- ── company_billing_info: 1:1 billing/tax details ──────────────────────────
CREATE TABLE IF NOT EXISTS company_billing_info (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  billing_contact_name VARCHAR(150),
  billing_email        VARCHAR(190),
  billing_mobile       VARCHAR(20),
  billing_address      TEXT,
  gstin                VARCHAR(15),
  pan                  VARCHAR(10),
  po_number            VARCHAR(80),
  vendor_code          VARCHAR(80),
  created_by           UUID REFERENCES super_admins(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── company_modules: per-company module enablement + price ──────────────────
CREATE TABLE IF NOT EXISTS company_modules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  module_key  VARCHAR(30) NOT NULL
                CHECK (module_key IN ('flight','hotel','train','bus','cab','expense','wallet','approval','reports')),
  enabled     BOOLEAN NOT NULL DEFAULT false,
  price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_by  UUID REFERENCES super_admins(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, module_key)
);
CREATE INDEX IF NOT EXISTS idx_company_modules_company ON company_modules(company_id);

-- ── company_approval_workflow: 1:1 approval config ─────────────────────────
CREATE TABLE IF NOT EXISTS company_approval_workflow (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  approval_required BOOLEAN NOT NULL DEFAULT false,
  approval_type     VARCHAR(20) NOT NULL DEFAULT 'none'
                      CHECK (approval_type IN ('none','single','multi')),
  levels            JSONB NOT NULL DEFAULT '[]',
  created_by        UUID REFERENCES super_admins(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── company_branding: 1:1 brand theming ────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_branding (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  primary_color   VARCHAR(20),
  secondary_color VARCHAR(20),
  email_domain    VARCHAR(120),
  logo_url        TEXT,
  created_by      UUID REFERENCES super_admins(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── company_invoices: generated subscription invoices ──────────────────────
CREATE TABLE IF NOT EXISTS company_invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invoice_number  VARCHAR(60) NOT NULL UNIQUE,
  subscription_id UUID REFERENCES company_subscriptions(id) ON DELETE SET NULL,
  base_amount     NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_amount    NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency        VARCHAR(8) NOT NULL DEFAULT 'INR',
  status          VARCHAR(20) NOT NULL DEFAULT 'issued'
                    CHECK (status IN ('draft','issued','paid','void')),
  due_date        DATE,
  line_items      JSONB NOT NULL DEFAULT '[]',
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      UUID REFERENCES super_admins(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_company_invoices_company ON company_invoices(company_id);

-- ── onboarding_drafts: resumable wizard state ──────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_drafts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payload      JSONB NOT NULL DEFAULT '{}',
  current_step INTEGER NOT NULL DEFAULT 0,
  status       VARCHAR(20) NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft','submitted')),
  company_id   UUID NULL REFERENCES companies(id) ON DELETE SET NULL,
  created_by   UUID REFERENCES super_admins(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_onboarding_drafts_creator ON onboarding_drafts(created_by);

-- ============================================================================
-- 3-Level Approval Workflow (Maker → Checker → Super Admin)  — idempotent
-- A company is created by a Maker, verified by a Checker, then finally approved
-- and ACTIVATED by a Super Admin (which provisions the admin account, wallet,
-- invoice and final company code). See approvals.service.js for the state machine.
-- ============================================================================

-- ── Portal user roles: add maker + checker alongside super_admin/admin ───────
ALTER TABLE super_admins DROP CONSTRAINT IF EXISTS super_admins_role_check;
ALTER TABLE super_admins
  ADD CONSTRAINT super_admins_role_check
  CHECK (role IN ('super_admin', 'admin', 'maker', 'checker'));

-- ── User Management: profile fields + per-user screen access ─────────────────
-- `screens` holds the Admin-Portal screen keys this user may access (a
-- super_admin implicitly has all). Drives the sidebar + route guards.
ALTER TABLE super_admins ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20);
ALTER TABLE super_admins ADD COLUMN IF NOT EXISTS username      VARCHAR(120) UNIQUE;
ALTER TABLE super_admins ADD COLUMN IF NOT EXISTS screens       TEXT[] NOT NULL DEFAULT '{}';

-- ── companies: expanded workflow status + audit columns + stored payload ─────
-- New default is 'draft'; existing rows keep whatever status they already have.
-- Widen status: 'pending_super_admin_approval' (28 chars) exceeds the old VARCHAR(20).
ALTER TABLE companies ALTER COLUMN status TYPE VARCHAR(40);
ALTER TABLE companies ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_status_check;
ALTER TABLE companies
  ADD CONSTRAINT companies_status_check
  CHECK (status IN (
    'draft', 'submitted', 'under_checker_review', 'changes_requested',
    'checker_approved', 'pending_super_admin_approval',
    'active', 'rejected', 'suspended', 'inactive'
  ));

-- Full wizard payload is stored here at submit-time and used by the Super Admin
-- to provision (admin account / wallet / invoice / modules) at activation.
ALTER TABLE companies ADD COLUMN IF NOT EXISTS onboarding_payload JSONB;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS provisioned   BOOLEAN NOT NULL DEFAULT FALSE;

-- Workflow actor + timestamp trail (created_by = Maker who created the record).
ALTER TABLE companies ADD COLUMN IF NOT EXISTS submitted_by  UUID REFERENCES super_admins(id) ON DELETE SET NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reviewed_by   UUID REFERENCES super_admins(id) ON DELETE SET NULL; -- Checker
ALTER TABLE companies ADD COLUMN IF NOT EXISTS approved_by   UUID REFERENCES super_admins(id) ON DELETE SET NULL; -- Super Admin
ALTER TABLE companies ADD COLUMN IF NOT EXISTS submitted_at  TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reviewed_at   TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS approved_at   TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS review_notes  TEXT;

-- ── Moi-Corp Product provisioning tracking (multi-tenancy integration) ───────
-- Records the outcome of auto-provisioning the company + Company Admin into the
-- Product (TravelDesk) DB at activation, for monitoring + retry.
ALTER TABLE companies ADD COLUMN IF NOT EXISTS product_provisioned     BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS product_provisioned_at  TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS product_provision_error TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS product_company_id      UUID;  -- == companies.id, mirrored in Product
ALTER TABLE company_admins ADD COLUMN IF NOT EXISTS product_user_id     UUID;  -- the admin's users.id in Product

-- ── company_approval_history: full append-only approval/audit trail ──────────
CREATE TABLE IF NOT EXISTS company_approval_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  action      VARCHAR(40) NOT NULL,   -- submit | start_review | checker_approve |
                                      -- request_changes | reject | activate | suspend | reactivate | resubmit
  from_status VARCHAR(40),
  to_status   VARCHAR(40),
  actor_id    UUID REFERENCES super_admins(id) ON DELETE SET NULL,
  actor_name  VARCHAR(150),
  actor_email VARCHAR(190),
  actor_role  VARCHAR(40),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_approval_history_company ON company_approval_history(company_id, created_at);

-- ── lender_investments: investor offers POSTed to the Lender Portal ──────────
-- Stores both the structured offer fields and the full raw request/response
-- JSON, so every detail is retrievable later via the Lender Portal API.
CREATE TABLE IF NOT EXISTS lender_investments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id       VARCHAR(64) NOT NULL,        -- the id we echo back in the response
  request_id        UUID,                        -- the offer's id from the request (echoed in the decision)
  company_id        UUID,                        -- which company the offer targets
  company_name      VARCHAR(190),
  investor_id       UUID,                        -- who is offering
  investor_email    VARCHAR(190),
  amount            NUMERIC(16,2),               -- offered investment amount (INR)
  interest_rate_pct NUMERIC(8,4),                -- investor's chosen rate
  tenure_months     INTEGER,                     -- investor's chosen tenure
  total_interest    NUMERIC(16,2),               -- computed (simple interest)
  total_return      NUMERIC(16,2),               -- computed total return
  submitted_at      TIMESTAMPTZ,                 -- when the investor submitted (from request)
  schedule          JSONB,                       -- full month-by-month repayment plan
  request_payload   JSONB NOT NULL,              -- complete raw request body, as received
  response_payload  JSONB NOT NULL,              -- complete response body, as returned
  status            VARCHAR(20) NOT NULL DEFAULT 'accepted',
  received_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lender_investments_company  ON lender_investments(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lender_investments_investor ON lender_investments(investor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lender_investments_request  ON lender_investments(request_id);
