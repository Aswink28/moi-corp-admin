/**
 * OpenAPI 3.0 specification for the Company Admin Portal backend.
 *
 * Built with swagger-jsdoc: the full API is described in the `definition`
 * below, and `apis` is pointed at the route files so future `@openapi` JSDoc
 * annotations on individual routes are merged in automatically.
 *
 * This module is documentation only — it imports nothing from the app runtime
 * except the port from config (for the local-dev server URL) and does not
 * affect any request handling.
 */
const path = require('path')
const swaggerJSDoc = require('swagger-jsdoc')
const config = require('../config/env')

// ── Reusable response helpers ────────────────────────────────────────────────
const ok = (schemaRef, description = 'Success') => ({
  description,
  content: { 'application/json': { schema: schemaRef } },
})
const envelope = (dataSchema) => ({
  type: 'object',
  properties: { success: { type: 'boolean', example: true }, data: dataSchema },
})
const messageEnvelope = {
  type: 'object',
  properties: { success: { type: 'boolean', example: true }, message: { type: 'string' } },
}
const ERR = { $ref: '#/components/responses/Error' }

const idParam = {
  name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' },
  description: 'Resource id (UUID)',
}
const companyIdParam = {
  name: 'companyId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' },
  description: 'Company id (UUID)',
}

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'Company Admin Portal API',
    version: '1.0.0',
    description:
      'Backend API for the Company Onboarding Admin Portal (independent of the Travel & Expense product). ' +
      'A maker → checker → super-admin approval workflow provisions companies and their Company Admins, ' +
      'managing subscriptions, wallets, settings and audit logs.\n\n' +
      '**Auth:** all endpoints except `POST /auth/login` and `GET /health` require a Bearer JWT obtained from login. ' +
      'Click **Authorize** and paste the `token` returned by login.',
  },
  servers: [
    { url: '/api', description: 'Current host (relative)' },
    { url: `http://localhost:${config.port}/api`, description: 'Local development' },
  ],
  tags: [
    { name: 'Auth', description: 'Login, current user, password change' },
    { name: 'Dashboard', description: 'Portal summary statistics' },
    { name: 'Companies', description: 'Company CRUD and status changes' },
    { name: 'Company Admins', description: 'Company Admin accounts' },
    { name: 'Settings', description: 'Per-company module settings' },
    { name: 'Subscriptions', description: 'Company subscription plans' },
    { name: 'Wallets', description: 'Company wallet balance and transactions' },
    { name: 'Audit Logs', description: 'Activity audit trail' },
    { name: 'Onboarding', description: 'Draft + create onboarding requests, helpers, invoices' },
    { name: 'Approvals', description: '3-level approval workflow (maker → checker → super admin)' },
    { name: 'Analytics', description: 'Per-company analytics (super admin only)' },
    { name: 'Lender Portal', description: 'External company data feed (API-key auth)' },
  ],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      lenderApiKey: {
        type: 'apiKey', in: 'header', name: 'x-lender-api-key',
        description: 'Shared API key for the external Lender Portal (LENDER_API_KEY).',
      },
    },
    responses: {
      Error: {
        description: 'Error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            examples: {
              unauthorized: { value: { success: false, message: 'Missing bearer token' } },
              forbidden: { value: { success: false, message: 'Forbidden' } },
              notFound: { value: { success: false, message: 'Company not found' } },
              validation: { value: { success: false, message: 'Company name is required' } },
            },
          },
        },
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Invalid token' },
        },
      },
      PortalUser: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Super Admin' },
          email: { type: 'string', format: 'email', example: 'superadmin@company-admin.local' },
          role: { type: 'string', enum: ['super_admin', 'admin', 'checker', 'maker'] },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'superadmin@company-admin.local' },
          password: { type: 'string', format: 'password', example: 'Admin@12345' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string', description: 'JWT bearer token' },
              user: { $ref: '#/components/schemas/PortalUser' },
            },
          },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', format: 'password' },
          newPassword: { type: 'string', format: 'password' },
        },
      },
      Company: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Acme Corp' },
          code: { type: 'string', example: 'ACME' },
          legal_name: { type: 'string', nullable: true },
          industry: { type: 'string', nullable: true },
          email: { type: 'string', format: 'email', nullable: true },
          phone: { type: 'string', nullable: true },
          address: { type: 'string', nullable: true },
          city: { type: 'string', nullable: true },
          country: { type: 'string', example: 'India' },
          logo_url: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['active', 'suspended', 'inactive'], example: 'active' },
          wallet_balance: { type: 'number', example: 0 },
          admin_count: { type: 'integer', example: 1 },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      CompanyCreate: {
        type: 'object',
        required: ['name', 'code'],
        properties: {
          name: { type: 'string', example: 'Acme Corp' },
          code: { type: 'string', description: 'Uppercased server-side', example: 'ACME' },
          legal_name: { type: 'string' },
          industry: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          address: { type: 'string' },
          city: { type: 'string' },
          country: { type: 'string', default: 'India' },
          logo_url: { type: 'string' },
          status: { type: 'string', enum: ['active', 'suspended', 'inactive'], default: 'active' },
        },
      },
      CompanyStatusRequest: {
        type: 'object',
        required: ['status'],
        properties: { status: { type: 'string', enum: ['active', 'suspended', 'inactive'] } },
      },
      CompanyAdmin: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          company_id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          username: { type: 'string' },
          phone: { type: 'string', nullable: true },
          is_active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      CompanyAdminCreate: {
        type: 'object',
        required: ['companyId', 'name', 'email', 'username'],
        properties: {
          companyId: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          username: { type: 'string' },
          phone: { type: 'string' },
          password: { type: 'string', format: 'password', description: 'Optional; auto-generated if omitted' },
        },
      },
      Wallet: {
        type: 'object',
        properties: {
          company_id: { type: 'string', format: 'uuid' },
          balance: { type: 'number', example: 50000 },
          currency: { type: 'string', example: 'INR' },
        },
      },
      WalletTransactionRequest: {
        type: 'object',
        required: ['type', 'amount'],
        properties: {
          type: { type: 'string', enum: ['allocate', 'credit', 'debit'] },
          amount: { type: 'number', example: 10000 },
          description: { type: 'string' },
        },
      },
      Subscription: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          company_id: { type: 'string', format: 'uuid' },
          plan: { type: 'string' },
          status: { type: 'string', example: 'active' },
          start_date: { type: 'string', format: 'date' },
          end_date: { type: 'string', format: 'date' },
        },
      },
      AuditLog: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          action: { type: 'string', example: 'company.create' },
          entity_type: { type: 'string', example: 'company' },
          entity_id: { type: 'string' },
          actor_id: { type: 'string', format: 'uuid' },
          details: { type: 'object', additionalProperties: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      OnboardingPayload: {
        type: 'object',
        description: 'Full onboarding request payload (validated server-side).',
        properties: {
          company: {
            type: 'object',
            required: ['name', 'code'],
            properties: {
              name: { type: 'string' },
              code: { type: 'string' },
              gstin: { type: 'string', description: '15-char GSTIN (when provided)' },
              pan: { type: 'string', description: '10-char PAN, e.g. ABCDE1234F' },
              email: { type: 'string', format: 'email' },
            },
          },
          contact: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
              mobile: { type: 'string', description: 'India 10-digit or +E.164' },
            },
          },
          admin: {
            type: 'object',
            required: ['name', 'email', 'username'],
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              username: { type: 'string' },
              phone: { type: 'string' },
            },
          },
          subscription: {
            type: 'object',
            required: ['plan_tier', 'billing_cycle', 'subscription_amount', 'licensed_users'],
            properties: {
              plan_tier: { type: 'string', enum: ['trial', 'basic', 'professional', 'enterprise'] },
              billing_cycle: { type: 'string', enum: ['monthly', 'quarterly', 'half_yearly', 'annual'] },
              subscription_amount: { type: 'number', minimum: 0.01 },
              licensed_users: { type: 'integer', minimum: 1 },
              contract_start_date: { type: 'string', format: 'date' },
              contract_end_date: { type: 'string', format: 'date' },
            },
          },
          billing: {
            type: 'object',
            properties: {
              billing_email: { type: 'string', format: 'email' },
              gstin: { type: 'string' },
              pan: { type: 'string' },
            },
          },
        },
      },
      LenderCompany: {
        type: 'object',
        additionalProperties: true,
        description:
          'Company record for the Lender Portal. Future-proof: every field from the Companies ' +
          'API is passed through automatically (new company fields appear here with no code ' +
          'change), and the required fields below are always populated — dynamic value, else ' +
          'derived from other fields, else a sensible default (never a "NOT_PROVIDED"/"N/A" ' +
          'placeholder). The properties listed are the guaranteed core; additional fields may appear.',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          legal_name: { type: 'string', description: 'Falls back to name when not set' },
          code: { type: 'string' },
          registration_number: { type: 'string' },
          pan: { type: 'string' },
          gstin: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          website: { type: 'string' },
          industry: { type: 'string', description: 'Default "Unspecified"' },
          status: { type: 'string', enum: ['active', 'suspended', 'inactive'] },
          address: { type: 'string', description: 'Falls back to address_line1 + address_line2' },
          city: { type: 'string' },
          state: { type: 'string' },
          country: { type: 'string', description: 'Default "India"' },
          pincode: { type: 'string' },
          currency: { type: 'string', description: 'Default "INR"' },
          created_at: { type: 'string', format: 'date-time' },
          requested_amount: { type: 'number' },
          interest_rate_pct: { type: 'number' },
          tenure_months: { type: 'integer' },
          credit_rating: { type: 'string', description: 'Default "Unrated"' },
          purpose: { type: 'string', description: 'Default "General corporate purpose"' },
          annual_revenue: { type: 'number' },
          net_profit: { type: 'number' },
          net_worth: { type: 'number' },
          fiscal_year: { type: 'integer', description: 'Falls back to the created_at year' },
        },
        example: {
          id: 'f0c851d5-eaf4-4c20-b801-ce7c9db3802e',
          name: 'HCL Technologies (Demo 0J16)',
          legal_name: 'HCL Technologies Limited',
          code: 'HCLTEC-0J16',
          registration_number: 'U72200KA2009PLC123456',
          pan: 'AABCT1234C',
          gstin: '27AABCT1234C1ZV',
          email: 'contact@hcltech.com',
          phone: '9876500000',
          website: 'https://www.hcltech.com',
          industry: 'IT Services',
          status: 'active',
          address: 'Tower A, Tech Park, Outer Ring Road',
          city: 'Gautam Buddha Nagar',
          state: 'Uttar Pradesh',
          country: 'India',
          pincode: '201304',
          currency: 'INR',
          created_at: '2026-06-09T09:02:11.161Z',
          requested_amount: 5000000,
          interest_rate_pct: 11.5,
          tenure_months: 24,
          credit_rating: 'A',
          purpose: 'Working capital',
          annual_revenue: 42000000,
          net_profit: 5200000,
          net_worth: 18000000,
          fiscal_year: 2024,
        },
      },
      InvestmentScheduleRow: {
        type: 'object',
        description: 'One month of the repayment plan.',
        properties: {
          period: { type: 'integer', description: 'Month number (1-based)' },
          interest: { type: 'number', description: 'Interest component for the period' },
          principal: { type: 'number', description: 'Principal component for the period' },
          payment: { type: 'number', description: 'Total payment for the period' },
          balance: { type: 'number', description: 'Outstanding balance after the period' },
        },
      },
      InvestmentOffer: {
        type: 'object',
        description:
          'One investor offer, fired once per offer on submit so the company can compare all offers. ' +
          'Any 2xx response means accepted (the external id is optionally echoed back).',
        required: [
          'requestId', 'companyId', 'companyName', 'investorId', 'investorEmail',
          'amount', 'interestRatePct', 'tenureMonths', 'totalInterest', 'totalReturn',
          'submittedAt', 'schedule',
        ],
        properties: {
          requestId: { type: 'string', format: 'uuid', description: 'Our offer id — echoed back in the decision' },
          companyId: { type: 'string', format: 'uuid', description: 'Which company the offer targets' },
          companyName: { type: 'string', description: 'Target company name' },
          investorId: { type: 'string', format: 'uuid', description: 'Who is offering' },
          investorEmail: { type: 'string', format: 'email', description: 'Investor email' },
          amount: { type: 'number', description: 'Offered investment amount (INR)' },
          interestRatePct: { type: 'number', description: "Investor's chosen rate (≤ company's offered rate)" },
          tenureMonths: { type: 'integer', description: "Investor's chosen tenure" },
          totalInterest: { type: 'number', description: 'Computed (simple interest)' },
          totalReturn: { type: 'number', description: 'Computed total return' },
          submittedAt: { type: 'string', format: 'date-time', description: 'ISO-8601 submission time' },
          schedule: {
            type: 'array',
            description: 'Full month-by-month repayment plan',
            items: { $ref: '#/components/schemas/InvestmentScheduleRow' },
          },
        },
        example: {
          requestId: '',
          companyId: '',
          companyName: '',
          investorId: '',
          investorEmail: '',
          amount: '',
          interestRatePct: '',
          tenureMonths: '',
          totalInterest: '',
          totalReturn: '',
          submittedAt: '',
          schedule: [
            { period: '', interest: '', principal: '', payment: '', balance: '' },
          ],
        },
      },
      InvestmentAck: {
        type: 'object',
        description: 'Acknowledgement that the offer was accepted (and stored).',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Stored row id (lender_investments.id)' },
          externalId: { type: 'string', example: 'INV-1837465021' },
          requestId: { type: 'string', format: 'uuid', nullable: true },
          status: { type: 'string', example: 'accepted' },
          receivedAt: { type: 'string', format: 'date-time' },
        },
      },
      StoredInvestment: {
        type: 'object',
        description:
          'One persisted investor offer from the `lender_investments` table. Includes the structured ' +
          'fields plus the full raw request and response payloads, so every detail is retrievable.',
        properties: {
          id: { type: 'string', format: 'uuid' },
          external_id: { type: 'string', example: 'INV-1837465021' },
          request_id: { type: 'string', format: 'uuid', nullable: true },
          company_id: { type: 'string', format: 'uuid', nullable: true },
          company_name: { type: 'string', nullable: true },
          investor_id: { type: 'string', format: 'uuid', nullable: true },
          investor_email: { type: 'string', nullable: true },
          amount: { type: 'number', nullable: true },
          interest_rate_pct: { type: 'number', nullable: true },
          tenure_months: { type: 'integer', nullable: true },
          total_interest: { type: 'number', nullable: true },
          total_return: { type: 'number', nullable: true },
          submitted_at: { type: 'string', format: 'date-time', nullable: true },
          schedule: { type: 'array', items: { $ref: '#/components/schemas/InvestmentScheduleRow' } },
          request_payload: { type: 'object', additionalProperties: true, description: 'Full raw request body, as received' },
          response_payload: { type: 'object', additionalProperties: true, description: 'Full response body, as returned' },
          status: { type: 'string', example: 'accepted' },
          received_at: { type: 'string', format: 'date-time' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      ApprovalActionRequest: {
        type: 'object',
        description: 'Optional note/comment attached to a workflow action.',
        properties: {
          note: { type: 'string' },
          comment: { type: 'string' },
          reason: { type: 'string' },
        },
      },
    },
  },

  paths: {
    // ── Auth ──────────────────────────────────────────────────────────────
    '/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login and obtain a JWT', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
        responses: { 200: ok({ $ref: '#/components/schemas/LoginResponse' }, 'Authenticated'), 401: ERR },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'], summary: 'Current authenticated portal user',
        responses: { 200: ok(envelope({ $ref: '#/components/schemas/PortalUser' })), 401: ERR },
      },
    },
    '/auth/change-password': {
      post: {
        tags: ['Auth'], summary: 'Change own password',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ChangePasswordRequest' } } } },
        responses: { 200: ok(messageEnvelope), 400: ERR, 401: ERR },
      },
    },

    // ── Dashboard ─────────────────────────────────────────────────────────
    '/dashboard/stats': {
      get: {
        tags: ['Dashboard'], summary: 'Portal summary statistics',
        responses: { 200: ok(envelope({ type: 'object', additionalProperties: true })), 401: ERR },
      },
    },

    // ── Companies ─────────────────────────────────────────────────────────
    '/companies': {
      get: {
        tags: ['Companies'], summary: 'List companies',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Match name or code' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'suspended', 'inactive'] } },
        ],
        responses: { 200: ok(envelope({ type: 'array', items: { $ref: '#/components/schemas/Company' } })), 401: ERR },
      },
      post: {
        tags: ['Companies'], summary: 'Create a company',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CompanyCreate' } } } },
        responses: { 201: ok(envelope({ $ref: '#/components/schemas/Company' }), 'Created'), 400: ERR, 409: ERR },
      },
    },
    '/companies/{id}': {
      get: {
        tags: ['Companies'], summary: 'Get a company by id', parameters: [idParam],
        responses: { 200: ok(envelope({ $ref: '#/components/schemas/Company' })), 404: ERR },
      },
      put: {
        tags: ['Companies'], summary: 'Update a company', parameters: [idParam],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CompanyCreate' } } } },
        responses: { 200: ok(envelope({ $ref: '#/components/schemas/Company' })), 400: ERR, 404: ERR },
      },
      delete: {
        tags: ['Companies'], summary: 'Delete a company', parameters: [idParam],
        responses: { 200: ok(messageEnvelope), 404: ERR },
      },
    },
    '/companies/{id}/status': {
      patch: {
        tags: ['Companies'], summary: 'Activate / suspend / inactivate a company', parameters: [idParam],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CompanyStatusRequest' } } } },
        responses: { 200: ok(envelope({ $ref: '#/components/schemas/Company' })), 400: ERR, 404: ERR },
      },
    },

    // ── Company Admins ────────────────────────────────────────────────────
    '/company-admins': {
      get: {
        tags: ['Company Admins'], summary: 'List company admins',
        parameters: [{ name: 'companyId', in: 'query', schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: ok(envelope({ type: 'array', items: { $ref: '#/components/schemas/CompanyAdmin' } })), 401: ERR },
      },
      post: {
        tags: ['Company Admins'], summary: 'Create a company admin',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CompanyAdminCreate' } } } },
        responses: { 201: ok(envelope({ $ref: '#/components/schemas/CompanyAdmin' }), 'Created'), 400: ERR, 409: ERR },
      },
    },
    '/company-admins/{id}/reset-password': {
      post: {
        tags: ['Company Admins'], summary: 'Reset a company admin password', parameters: [idParam],
        responses: { 200: ok(messageEnvelope), 404: ERR },
      },
    },
    '/company-admins/{id}/active': {
      patch: {
        tags: ['Company Admins'], summary: 'Enable/disable a company admin', parameters: [idParam],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['isActive'], properties: { isActive: { type: 'boolean' } } } } } },
        responses: { 200: ok(envelope({ $ref: '#/components/schemas/CompanyAdmin' })), 404: ERR },
      },
    },
    '/company-admins/{id}': {
      delete: {
        tags: ['Company Admins'], summary: 'Delete a company admin', parameters: [idParam],
        responses: { 200: ok(messageEnvelope), 404: ERR },
      },
    },

    // ── Settings ──────────────────────────────────────────────────────────
    '/settings/{companyId}': {
      get: {
        tags: ['Settings'], summary: 'Get a company’s module settings', parameters: [companyIdParam],
        responses: { 200: ok(envelope({ type: 'object', additionalProperties: true })), 404: ERR },
      },
      put: {
        tags: ['Settings'], summary: 'Update a company’s module settings', parameters: [companyIdParam],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } } },
        responses: { 200: ok(envelope({ type: 'object', additionalProperties: true })), 400: ERR, 404: ERR },
      },
    },

    // ── Subscriptions ─────────────────────────────────────────────────────
    '/subscriptions/company/{companyId}': {
      get: {
        tags: ['Subscriptions'], summary: 'List a company’s subscriptions', parameters: [companyIdParam],
        responses: { 200: ok(envelope({ type: 'array', items: { $ref: '#/components/schemas/Subscription' } })), 404: ERR },
      },
      post: {
        tags: ['Subscriptions'], summary: 'Create a subscription for a company', parameters: [companyIdParam],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Subscription' } } } },
        responses: { 201: ok(envelope({ $ref: '#/components/schemas/Subscription' }), 'Created'), 400: ERR },
      },
    },
    '/subscriptions/{id}/status': {
      patch: {
        tags: ['Subscriptions'], summary: 'Change a subscription status', parameters: [idParam],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string' } } } } } },
        responses: { 200: ok(envelope({ $ref: '#/components/schemas/Subscription' })), 404: ERR },
      },
    },

    // ── Wallets ───────────────────────────────────────────────────────────
    '/wallets/company/{companyId}': {
      get: {
        tags: ['Wallets'], summary: 'Get a company wallet', parameters: [companyIdParam],
        responses: { 200: ok(envelope({ $ref: '#/components/schemas/Wallet' })), 404: ERR },
      },
    },
    '/wallets/company/{companyId}/transactions': {
      get: {
        tags: ['Wallets'], summary: 'List wallet transactions', parameters: [companyIdParam],
        responses: { 200: ok(envelope({ type: 'array', items: { type: 'object', additionalProperties: true } })), 404: ERR },
      },
    },
    '/wallets/company/{companyId}/transaction': {
      post: {
        tags: ['Wallets'], summary: 'Allocate / credit / debit the wallet', parameters: [companyIdParam],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/WalletTransactionRequest' } } } },
        responses: { 200: ok(envelope({ $ref: '#/components/schemas/Wallet' })), 400: ERR, 404: ERR },
      },
    },

    // ── Audit Logs ────────────────────────────────────────────────────────
    '/audit-logs': {
      get: {
        tags: ['Audit Logs'], summary: 'List audit log entries',
        parameters: [
          { name: 'action', in: 'query', schema: { type: 'string' } },
          { name: 'entityType', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 100 } },
        ],
        responses: { 200: ok(envelope({ type: 'array', items: { $ref: '#/components/schemas/AuditLog' } })), 401: ERR },
      },
    },

    // ── Onboarding ────────────────────────────────────────────────────────
    '/onboarding/meta': {
      get: { tags: ['Onboarding'], summary: 'Form metadata (plans, cycles, etc.)', responses: { 200: ok(envelope({ type: 'object', additionalProperties: true })), 401: ERR } },
    },
    '/onboarding/generate-code': {
      get: { tags: ['Onboarding'], summary: 'Generate a unique company code', responses: { 200: ok(envelope({ type: 'object', additionalProperties: true })), 401: ERR } },
    },
    '/onboarding/check-code': {
      get: {
        tags: ['Onboarding'], summary: 'Check a company code availability',
        parameters: [{ name: 'code', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { 200: ok(envelope({ type: 'object', additionalProperties: true })), 401: ERR },
      },
    },
    '/onboarding/generate-password': {
      post: { tags: ['Onboarding'], summary: 'Generate a strong password', responses: { 200: ok(envelope({ type: 'object', additionalProperties: true })), 401: ERR } },
    },
    '/onboarding/logo': {
      post: {
        tags: ['Onboarding'], summary: 'Upload a company logo',
        requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', properties: { logo: { type: 'string', format: 'binary' } } } } } },
        responses: { 200: ok(envelope({ type: 'object', additionalProperties: true })), 400: ERR },
      },
    },
    '/onboarding/drafts': {
      get: { tags: ['Onboarding'], summary: 'List onboarding drafts', responses: { 200: ok(envelope({ type: 'array', items: { type: 'object', additionalProperties: true } })), 401: ERR } },
      post: {
        tags: ['Onboarding'], summary: 'Create an onboarding draft',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } } },
        responses: { 201: ok(envelope({ type: 'object', additionalProperties: true }), 'Created'), 400: ERR },
      },
    },
    '/onboarding/drafts/{id}': {
      get: { tags: ['Onboarding'], summary: 'Get a draft', parameters: [idParam], responses: { 200: ok(envelope({ type: 'object', additionalProperties: true })), 404: ERR } },
      put: {
        tags: ['Onboarding'], summary: 'Update a draft', parameters: [idParam],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } } },
        responses: { 200: ok(envelope({ type: 'object', additionalProperties: true })), 404: ERR },
      },
      delete: { tags: ['Onboarding'], summary: 'Delete a draft', parameters: [idParam], responses: { 200: ok(messageEnvelope), 404: ERR } },
    },
    '/onboarding/companies': {
      post: {
        tags: ['Onboarding'], summary: 'Submit a new company onboarding request (maker)',
        description: 'Requires role maker / super_admin / admin.',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/OnboardingPayload' } } } },
        responses: { 201: ok(envelope({ type: 'object', additionalProperties: true }), 'Submitted'), 400: ERR, 403: ERR },
      },
    },
    '/onboarding/companies/{id}/resubmit': {
      put: {
        tags: ['Onboarding'], summary: 'Resubmit a changes-requested onboarding request (maker)', parameters: [idParam],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/OnboardingPayload' } } } },
        responses: { 200: ok(envelope({ type: 'object', additionalProperties: true })), 400: ERR, 403: ERR, 404: ERR },
      },
    },
    '/onboarding/invoices/{id}': {
      get: { tags: ['Onboarding'], summary: 'Get invoice (JSON)', parameters: [idParam], responses: { 200: ok(envelope({ type: 'object', additionalProperties: true })), 404: ERR } },
    },
    '/onboarding/invoices/{id}/html': {
      get: {
        tags: ['Onboarding'], summary: 'Get invoice (rendered HTML)', parameters: [idParam],
        responses: { 200: { description: 'Invoice HTML', content: { 'text/html': { schema: { type: 'string' } } } }, 404: ERR },
      },
    },

    // ── Approvals ─────────────────────────────────────────────────────────
    '/approvals/queue': {
      get: { tags: ['Approvals'], summary: 'Approval queue for the current user', responses: { 200: ok(envelope({ type: 'array', items: { type: 'object', additionalProperties: true } })), 401: ERR } },
    },
    '/approvals/{id}': {
      get: { tags: ['Approvals'], summary: 'Get a workflow', parameters: [idParam], responses: { 200: ok(envelope({ type: 'object', additionalProperties: true })), 404: ERR } },
    },
    '/approvals/{id}/history': {
      get: { tags: ['Approvals'], summary: 'Workflow history', parameters: [idParam], responses: { 200: ok(envelope({ type: 'array', items: { type: 'object', additionalProperties: true } })), 404: ERR } },
    },
    '/approvals/{id}/start-review': {
      post: { tags: ['Approvals'], summary: 'Checker: start review', parameters: [idParam], responses: { 200: ok(messageEnvelope), 403: ERR, 404: ERR } },
    },
    '/approvals/{id}/checker-approve': {
      post: {
        tags: ['Approvals'], summary: 'Checker: approve', parameters: [idParam],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/ApprovalActionRequest' } } } },
        responses: { 200: ok(messageEnvelope), 403: ERR, 404: ERR },
      },
    },
    '/approvals/{id}/request-changes': {
      post: {
        tags: ['Approvals'], summary: 'Checker: request changes', parameters: [idParam],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ApprovalActionRequest' } } } },
        responses: { 200: ok(messageEnvelope), 400: ERR, 403: ERR, 404: ERR },
      },
    },
    '/approvals/{id}/checker-reject': {
      post: {
        tags: ['Approvals'], summary: 'Checker: reject', parameters: [idParam],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ApprovalActionRequest' } } } },
        responses: { 200: ok(messageEnvelope), 400: ERR, 403: ERR, 404: ERR },
      },
    },
    '/approvals/{id}/activate': {
      post: { tags: ['Approvals'], summary: 'Super admin: approve & activate (provisions Product)', parameters: [idParam], responses: { 200: ok(messageEnvelope), 403: ERR, 404: ERR } },
    },
    '/approvals/{id}/reject': {
      post: {
        tags: ['Approvals'], summary: 'Super admin: reject', parameters: [idParam],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ApprovalActionRequest' } } } },
        responses: { 200: ok(messageEnvelope), 400: ERR, 403: ERR, 404: ERR },
      },
    },
    '/approvals/{id}/suspend': {
      post: { tags: ['Approvals'], summary: 'Super admin: suspend', parameters: [idParam], responses: { 200: ok(messageEnvelope), 403: ERR, 404: ERR } },
    },
    '/approvals/{id}/reactivate': {
      post: { tags: ['Approvals'], summary: 'Super admin: reactivate', parameters: [idParam], responses: { 200: ok(messageEnvelope), 403: ERR, 404: ERR } },
    },
    '/approvals/{id}/reprovision': {
      post: { tags: ['Approvals'], summary: 'Super admin: retry Product provisioning', parameters: [idParam], responses: { 200: ok(messageEnvelope), 403: ERR, 404: ERR } },
    },

    // ── Analytics ─────────────────────────────────────────────────────────
    '/analytics/company/{id}': {
      get: {
        tags: ['Analytics'], summary: 'Company analytics (super admin only)', parameters: [idParam],
        responses: { 200: ok(envelope({ type: 'object', additionalProperties: true })), 403: ERR, 404: ERR },
      },
    },

    // ── Lender Portal (API-key auth) ───────────────────────────────────────
    '/lender/companies': {
      get: {
        tags: ['Lender Portal'],
        summary: 'List companies for the Lender Portal',
        description: 'Company data sourced dynamically from the Company List; loan/underwriting fields default to null.',
        security: [{ lenderApiKey: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Match name or code' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'suspended', 'inactive'] } },
        ],
        responses: {
          200: ok({
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              count: { type: 'integer', example: 1 },
              data: { type: 'array', items: { $ref: '#/components/schemas/LenderCompany' } },
            },
          }),
          401: ERR, 503: ERR,
        },
      },
    },
    '/lender/companies/{id}': {
      get: {
        tags: ['Lender Portal'],
        summary: 'Get one company for the Lender Portal',
        security: [{ lenderApiKey: [] }],
        parameters: [idParam],
        responses: { 200: ok(envelope({ $ref: '#/components/schemas/LenderCompany' })), 401: ERR, 404: ERR, 503: ERR },
      },
    },
    '/lender/investments': {
      post: {
        tags: ['Lender Portal'],
        summary: 'Submit one investor offer to the Lender Portal',
        description:
          'Fired once per investor offer (on submit) so the company can compare all offers. ' +
          'Any 2xx means accepted; the external id is echoed back.',
        security: [{ lenderApiKey: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/InvestmentOffer' } } } },
        responses: {
          201: ok(envelope({ $ref: '#/components/schemas/InvestmentAck' }), 'Accepted & stored'),
          400: ERR, 401: ERR, 503: ERR,
        },
      },
      get: {
        tags: ['Lender Portal'],
        summary: 'List stored investor offers',
        description: 'Returns persisted offers from the lender_investments table. Optional companyId / investorId filters.',
        security: [{ lenderApiKey: [] }],
        parameters: [
          { name: 'companyId', in: 'query', schema: { type: 'string', format: 'uuid' }, description: 'Filter by target company' },
          { name: 'investorId', in: 'query', schema: { type: 'string', format: 'uuid' }, description: 'Filter by investor' },
        ],
        responses: {
          200: ok({
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              count: { type: 'integer', example: 1 },
              data: { type: 'array', items: { $ref: '#/components/schemas/StoredInvestment' } },
            },
          }),
          401: ERR, 503: ERR,
        },
      },
    },
    '/lender/investments/{id}': {
      get: {
        tags: ['Lender Portal'],
        summary: 'Get one stored investor offer',
        security: [{ lenderApiKey: [] }],
        parameters: [idParam],
        responses: { 200: ok(envelope({ $ref: '#/components/schemas/StoredInvestment' })), 401: ERR, 404: ERR, 503: ERR },
      },
    },
  },
}

// Merge any future @openapi JSDoc annotations on route files into the spec.
const spec = swaggerJSDoc({
  definition,
  apis: [path.join(__dirname, '..', 'routes', '*.js')],
})

module.exports = spec
