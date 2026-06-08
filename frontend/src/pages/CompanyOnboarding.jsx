import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box, Card, CardContent, Button, Stack, Typography, CircularProgress, Divider,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { AnimatePresence, motion } from 'framer-motion'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded'
import CloudSyncRoundedIcon from '@mui/icons-material/CloudSyncRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded'

import { PageHeader, ConfirmDialog } from '../components/ui'
import WizardStepper from '../components/onboarding/WizardStepper'
import { onboardingApi } from '../api/endpoints'
import { errMsg } from '../api/client'
import { useToast } from '../context/ToastContext'
import useOnboardingForm from '../hooks/useOnboardingForm'

// The 11 wizard steps (default exports). Each receives { data, setField, errors, meta }
// exactly as specified in §E.2 of ONBOARDING_CONTRACT.md.
import Step1Company from '../components/onboarding/Step1CompanyInfo.jsx'
import Step2Address from '../components/onboarding/Step2Address.jsx'
import Step3Contact from '../components/onboarding/Step3Contact.jsx'
import Step4Admin from '../components/onboarding/Step4Admin.jsx'
import Step5Modules from '../components/onboarding/Step8Modules.jsx'
import Step6Subscription from '../components/onboarding/Step5Subscription.jsx'
import Step7Billing from '../components/onboarding/Step6Billing.jsx'
import Step8Wallet from '../components/onboarding/Step7Wallet.jsx'
import Step10Branding from '../components/onboarding/Step10Branding.jsx'
import Step11Review from '../components/onboarding/Step11Review.jsx'

// Canonical step order: title + component. Index = step number - 1.
const STEPS = [
  { title: 'Company', Component: Step1Company },
  { title: 'Address', Component: Step2Address },
  { title: 'Contact', Component: Step3Contact },
  { title: 'Admin', Component: Step4Admin },
  { title: 'Modules', Component: Step5Modules },
  { title: 'Subscription', Component: Step6Subscription },
  { title: 'Billing', Component: Step7Billing },
  { title: 'Wallet', Component: Step8Wallet },
  { title: 'Branding', Component: Step10Branding },
  { title: 'Review', Component: Step11Review },
]
const STEP_TITLES = STEPS.map((s) => s.title)
const LAST = STEPS.length - 1

function AutosaveIndicator({ status }) {
  if (status === 'idle') return null
  const saving = status === 'saving'
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.secondary' }}>
      {saving ? <CloudSyncRoundedIcon sx={{ fontSize: 18 }} /> : <CloudDoneRoundedIcon sx={{ fontSize: 18, color: 'success.main' }} />}
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        {saving ? 'Saving…' : 'Saved'}
      </Typography>
    </Stack>
  )
}

export default function CompanyOnboarding() {
  const { draftId } = useParams()
  const navigate = useNavigate()
  const { notify } = useToast()

  // The form hook owns: payload (data), field setter, per-step validation/errors,
  // meta reference data, current step + visited tracking, and draft autosave/resume.
  const {
    data,
    setField,
    errors,
    meta,
    loading,          // initial load of meta (+ resumed draft) in progress
    step,             // current step index
    maxVisited,       // highest visited step index
    goToStep,         // (i) => void   — jump to a visited step
    next,             // () => void    — advance one step
    back,             // () => void    — go back one step
    isStepValid,      // (i) => boolean — validity of a given step (defaults to current)
    saveStatus,       // 'idle' | 'saving' | 'saved'
    saveDraft,        // () => Promise<void> — persist the draft now
    autofill,         // () => void     — fill every step with valid demo data
    draftId: resolvedDraftId, // the active draft id (after first save / resume)
  } = useOnboardingForm({ draftId })

  const [confirm, setConfirm] = useState(null) // { sendEmail: boolean }
  const [submitting, setSubmitting] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)

  const isReview = step === LAST
  const currentValid = isStepValid(step)

  function handleAutofill() {
    autofill()
    // Jump back to the first step so the user can review the filled values.
    goToStep(0)
    notify('Demo data filled in — review each step, then create the company.', 'info', { title: 'Autofilled' })
  }

  async function handleSaveDraft() {
    setSavingDraft(true)
    try {
      await saveDraft()
      notify('Draft saved', 'success', { title: 'Saved' })
    } catch (e) {
      notify(errMsg(e), 'error')
    } finally {
      setSavingDraft(false)
    }
  }

  async function submit() {
    setSubmitting(true)
    try {
      const result = await onboardingApi.submitCompany(data)
      setConfirm(null)
      notify(
        `"${result?.company?.name}" submitted for approval — a Checker will review it next.`,
        'success',
        { title: 'Submitted for approval', duration: 7000 }
      )
      navigate('/approvals')
    } catch (e) {
      notify(errMsg(e), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 320 }}>
        <CircularProgress />
      </Box>
    )
  }

  const StepComponent = STEPS[step].Component

  return (
    <Box>
      <PageHeader
        title="Onboard Company"
        subtitle="Guided wizard to create a fully provisioned client company."
        breadcrumbs={[{ label: 'Companies', to: '/companies' }, { label: 'Onboard' }]}
        actions={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AutosaveIndicator status={saveStatus} />
            <Button
              variant="text"
              color="secondary"
              startIcon={<AutoFixHighRoundedIcon />}
              onClick={handleAutofill}
              disabled={submitting}
            >
              Autofill
            </Button>
            <Button
              variant="outlined"
              startIcon={<SaveRoundedIcon />}
              onClick={handleSaveDraft}
              disabled={savingDraft || saveStatus === 'saving'}
            >
              {savingDraft ? 'Saving…' : 'Save Draft'}
            </Button>
          </Stack>
        }
      />

      <Card>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <WizardStepper
            steps={STEP_TITLES}
            active={step}
            maxVisited={maxVisited}
            onStepClick={goToStep}
          />

          <Divider sx={{ my: 2.5 }} />

          {/* Animated step body */}
          <Box sx={{ minHeight: 280 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.26, ease: 'easeOut' }}
              >
                <StepComponent data={data} setField={setField} errors={errors} meta={meta} />
              </motion.div>
            </AnimatePresence>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          {/* Footer navigation / actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="text"
              color="inherit"
              startIcon={<ArrowBackRoundedIcon />}
              onClick={back}
              disabled={step === 0}
            >
              Back
            </Button>

            {isReview ? (
              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                <Button
                  variant="outlined"
                  startIcon={<SaveRoundedIcon />}
                  onClick={handleSaveDraft}
                  disabled={savingDraft || submitting}
                >
                  Save Draft
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SendRoundedIcon />}
                  onClick={() => setConfirm(true)}
                  disabled={submitting || !currentValid}
                >
                  Submit for Approval
                </Button>
              </Stack>
            ) : (
              <Button
                variant="contained"
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={next}
                disabled={!currentValid}
              >
                Next
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirm}
        color="primary"
        title="Submit for approval?"
        message={`This submits "${data?.company?.name || 'the company'}" into the approval workflow. A Checker verifies the details, then a Super Admin approves and activates it (provisioning the admin account, wallet and invoice). You can track progress under My Requests.`}
        confirmLabel="Submit for Approval"
        loading={submitting}
        onConfirm={() => submit()}
        onClose={() => !submitting && setConfirm(null)}
      />

      {/* Subtle backdrop accent consistent with brand surfaces */}
      <Box
        aria-hidden
        sx={{
          position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none',
          background: (t) =>
            `radial-gradient(900px 400px at 100% -10%, ${alpha(t.palette.primary.main, 0.06)}, transparent 60%)`,
        }}
      />
    </Box>
  )
}
