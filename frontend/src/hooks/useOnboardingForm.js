import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { onboardingApi } from '../api/endpoints'
import { validateStep } from '../components/onboarding/validation'

const AUTOSAVE_DELAY_MS = 800
// 10 wizard steps — the Approval Workflow step was removed from onboarding.
const TOTAL_STEPS = 10

// Sensible defaults matching ONBOARDING_CONTRACT §D.2.
export function initialPayload() {
  return {
    company: {
      name: '',
      code: '',
      legal_name: '',
      registration_number: '',
      gstin: '',
      pan: '',
      industry: '',
      website: '',
      email: '',
      phone: '',
      description: '',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
    },
    address: {
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
    contact: {
      contact_name: '',
      designation: '',
      email: '',
      mobile: '',
      alternate_phone: '',
      department: '',
    },
    admin: {
      name: '',
      employee_id: '',
      email: '',
      username: '',
      phone: '',
      role: 'company_admin',
      temp_password: '',
      force_password_reset: true,
    },
    subscription: {
      plan_tier: 'trial',
      billing_cycle: 'monthly',
      licensed_users: 1,
      subscription_amount: 0,
      discount_percentage: 0,
      tax_percentage: 18,
      auto_renewal: false,
      contract_start_date: '',
      contract_end_date: '',
      currency: 'INR',
    },
    billing: {
      billing_contact_name: '',
      billing_email: '',
      billing_mobile: '',
      billing_address: '',
      gstin: '',
      pan: '',
      po_number: '',
      vendor_code: '',
    },
    wallet: {
      wallet_enabled: true,
      initial_balance: 0,
      credit_limit: 0,
      low_balance_threshold: 0,
      auto_recharge_enabled: false,
    },
    modules: [
      { module_key: 'flight', enabled: false, price: 0 },
      { module_key: 'hotel', enabled: false, price: 0 },
      { module_key: 'train', enabled: false, price: 0 },
      { module_key: 'bus', enabled: false, price: 0 },
      { module_key: 'cab', enabled: false, price: 0 },
      { module_key: 'expense', enabled: false, price: 0 },
      { module_key: 'wallet', enabled: false, price: 0 },
      { module_key: 'approval', enabled: false, price: 0 },
      { module_key: 'reports', enabled: false, price: 0 },
    ],
    approval: {
      approval_required: false,
      approval_type: 'none',
      levels: [],
    },
    branding: {
      primary_color: '#4f46e5',
      secondary_color: '#0ea5e9',
      email_domain: '',
      logo_url: '',
    },
  }
}

// Realistic demo dataset for the "Autofill" button. Every value is chosen to
// pass each step's validation (valid GSTIN/PAN/email/mobile, end date after
// start) and to use only allowed dropdown options from the wizard meta
// (industries/currencies/timezones/countries). A short random suffix keeps the
// company code, admin email and admin username unique across repeated autofills
// so the create call won't trip the server's uniqueness constraints (§C #3/#11/#13).
export function sampleData() {
  const sfx = Math.random().toString(36).slice(2, 6).toUpperCase()
  const firms = [
    { name: 'Tata Consultancy Services', domain: 'tcs.com', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
    { name: 'Infosys', domain: 'infosys.com', city: 'Bengaluru', state: 'Karnataka', pincode: '560100' },
    { name: 'Wipro', domain: 'wipro.com', city: 'Bengaluru', state: 'Karnataka', pincode: '560035' },
    { name: 'HCL Technologies', domain: 'hcltech.com', city: 'Noida', state: 'Uttar Pradesh', pincode: '201304' },
    { name: 'Cognizant', domain: 'cognizant.com', city: 'Chennai', state: 'Tamil Nadu', pincode: '600096' },
  ]
  const f = firms[Math.floor(Math.random() * firms.length)]
  const acronym = f.name.replace(/[^A-Za-z]/g, '').slice(0, 6).toUpperCase() || 'ACME'
  const code = `${acronym}-${sfx}`
  const low = sfx.toLowerCase()
  const iso = (d) => d.toISOString().slice(0, 10)
  const today = new Date()
  const end = new Date(today)
  end.setFullYear(end.getFullYear() + 1)
  const fullAddress = `Tower A, Tech Park, ${f.city}, ${f.state} ${f.pincode}, India`

  const base = initialPayload()
  return {
    ...base,
    company: {
      ...base.company,
      name: `${f.name} (Demo ${sfx})`,
      code,
      legal_name: `${f.name} Limited`,
      registration_number: 'U72200KA2009PLC123456',
      gstin: '27AABCT1234C1ZV',
      pan: 'AABCT1234C',
      industry: 'IT Services',
      website: `https://www.${f.domain}`,
      email: `contact@${f.domain}`,
      phone: '9876500000',
      description: `${f.name} — enterprise travel & expense management onboarding (demo record).`,
      timezone: 'Asia/Kolkata',
      currency: 'INR',
    },
    address: {
      ...base.address,
      address_line1: 'Tower A, Tech Park',
      address_line2: 'Outer Ring Road',
      city: f.city,
      state: f.state,
      pincode: f.pincode,
      country: 'India',
    },
    contact: {
      ...base.contact,
      contact_name: 'Rajesh Kumar',
      designation: 'VP — Travel & Administration',
      email: `rajesh.kumar@${f.domain}`,
      mobile: '9876543210',
      alternate_phone: '+914012345678',
      department: 'Administration',
    },
    admin: {
      ...base.admin,
      name: 'Priya Sharma',
      employee_id: `EMP-${sfx}`,
      email: `admin.${low}@${f.domain}`,
      username: `admin_${low}`,
      phone: '9811122233',
      role: 'company_admin',
      temp_password: `Demo@${sfx}1`,
      force_password_reset: true,
    },
    subscription: {
      ...base.subscription,
      plan_tier: 'professional',
      billing_cycle: 'annual',
      licensed_users: 250,
      subscription_amount: 500000,
      discount_percentage: 10,
      tax_percentage: 18,
      auto_renewal: true,
      contract_start_date: iso(today),
      contract_end_date: iso(end),
      currency: 'INR',
    },
    billing: {
      ...base.billing,
      billing_contact_name: 'Anita Desai',
      billing_email: `billing@${f.domain}`,
      billing_mobile: '9820012345',
      billing_address: fullAddress,
      gstin: '27AABCT1234C1ZV',
      pan: 'AABCT1234C',
      po_number: `PO-${sfx}`,
      vendor_code: `VEND-${sfx}`,
    },
    wallet: {
      ...base.wallet,
      wallet_enabled: true,
      initial_balance: 100000,
      credit_limit: 50000,
      low_balance_threshold: 10000,
      auto_recharge_enabled: true,
    },
    modules: base.modules.map((m) => {
      const enabled = ['flight', 'hotel', 'expense', 'wallet', 'approval', 'reports'].includes(m.module_key)
      const prices = { flight: 199, hotel: 149, expense: 99, wallet: 0, approval: 49, reports: 129 }
      return { ...m, enabled, price: enabled ? prices[m.module_key] ?? 0 : 0 }
    }),
    // Approval workflow is not configured during onboarding — leave it at the
    // "not required" default (the Approval step was removed from the wizard).
    approval: { ...base.approval },
    branding: {
      ...base.branding,
      primary_color: '#4f46e5',
      secondary_color: '#0ea5e9',
      email_domain: `@${f.domain}`,
      logo_url: '',
    },
  }
}

// Immutable set at a dot-path, e.g. setIn(obj, 'company.gstin', 'XX').
// Array indices in the path are handled (e.g. 'modules.0.enabled').
function setIn(obj, path, value) {
  const keys = String(path).split('.')
  const root = Array.isArray(obj) ? obj.slice() : { ...obj }
  let cursor = root
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    const child = cursor[key]
    const cloned = Array.isArray(child) ? child.slice() : { ...child }
    cursor[key] = cloned
    cursor = cloned
  }
  cursor[keys[keys.length - 1]] = value
  return root
}

/**
 * Holds the full onboarding wizard payload, fetches the wizard meta reference
 * data, runs per-step validation (§C), tracks step navigation/visited-state, and
 * debounce-autosaves to onboarding_drafts (resuming an existing draft when an id
 * is supplied).
 *
 * @param {object} opts { draftId } — optional draft id to resume.
 */
export function useOnboardingForm({ draftId: initialDraftId } = {}) {
  const [data, setData] = useState(initialPayload)
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [maxVisited, setMaxVisited] = useState(0)
  const [draftId, setDraftId] = useState(initialDraftId || null)
  const [saveStatus, setSaveStatus] = useState('idle') // 'idle' | 'saving' | 'saved'

  // Refs so the debounced timer always saves the latest values without
  // re-arming on every keystroke change of identity.
  const dataRef = useRef(data)
  const stepRef = useRef(step)
  const draftIdRef = useRef(draftId)
  const timerRef = useRef(null)
  const dirtyRef = useRef(false)
  const savingRef = useRef(false)

  useEffect(() => {
    dataRef.current = data
  }, [data])
  useEffect(() => {
    stepRef.current = step
  }, [step])
  useEffect(() => {
    draftIdRef.current = draftId
  }, [draftId])

  const flush = useCallback(async () => {
    if (!dirtyRef.current || savingRef.current) return
    savingRef.current = true
    dirtyRef.current = false
    setSaveStatus('saving')
    try {
      const body = { payload: dataRef.current, current_step: stepRef.current }
      const row = await onboardingApi.saveDraft(draftIdRef.current, body)
      if (row && row.id && !draftIdRef.current) {
        draftIdRef.current = row.id
        setDraftId(row.id)
      }
      setSaveStatus('saved')
    } catch {
      // Re-mark dirty so the next change retries; surfacing the error is the
      // wizard parent's concern.
      dirtyRef.current = true
      setSaveStatus('idle')
    } finally {
      savingRef.current = false
    }
  }, [])

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      flush()
    }, AUTOSAVE_DELAY_MS)
  }, [flush])

  // setField(dotPath, value) — immutable updater that triggers autosave.
  const setField = useCallback(
    (path, value) => {
      setData((prev) => setIn(prev, path, value))
      scheduleSave()
    },
    [scheduleSave]
  )

  // Per-step errors (live) for the current step.
  const errors = useMemo(() => validateStep(step, data), [step, data])

  const isStepValid = useCallback(
    (i = stepRef.current) => Object.keys(validateStep(i, dataRef.current)).length === 0,
    []
  )

  const goToStep = useCallback(
    (i) => {
      const next = Math.max(0, Math.min(TOTAL_STEPS - 1, i))
      setStep(next)
      setMaxVisited((m) => Math.max(m, next))
      scheduleSave()
    },
    [scheduleSave]
  )

  const next = useCallback(() => goToStep(stepRef.current + 1), [goToStep])
  const back = useCallback(() => goToStep(stepRef.current - 1), [goToStep])

  // Replace the entire payload with the demo dataset (the "Autofill" button)
  // and schedule a draft save so the filled values persist like normal edits.
  const autofill = useCallback(() => {
    const sample = sampleData()
    setData(sample)
    dataRef.current = sample
    scheduleSave()
  }, [scheduleSave])

  // Persist the current draft immediately (used by the "Save Draft" button).
  const saveDraft = useCallback(async () => {
    dirtyRef.current = true
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    await flush()
  }, [flush])

  // Initial load: fetch meta and, when resuming, the draft.
  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        // Meta failure must not block the wizard — the step components fall back
        // to local option constants (components/onboarding/options.js).
        try {
          const m = await onboardingApi.meta()
          if (alive) setMeta(m)
        } catch {
          if (alive) setMeta(null)
        }
        if (initialDraftId) {
          const row = await onboardingApi.getDraft(initialDraftId)
          if (alive && row) {
            const merged = { ...initialPayload(), ...(row.payload || {}) }
            setData(merged)
            dataRef.current = merged
            setDraftId(row.id)
            draftIdRef.current = row.id
            if (typeof row.current_step === 'number') {
              setStep(row.current_step)
              stepRef.current = row.current_step
              setMaxVisited(row.current_step)
            }
            dirtyRef.current = false
          }
        }
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [initialDraftId])

  // Clean up any pending timer on unmount.
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

  return {
    data,
    setData,
    setField,
    meta,
    loading,
    step,
    setStep,
    maxVisited,
    goToStep,
    next,
    back,
    errors,
    isStepValid,
    draftId,
    saveStatus,
    saveDraft,
    autofill,
    totalSteps: TOTAL_STEPS,
  }
}

export default useOnboardingForm
