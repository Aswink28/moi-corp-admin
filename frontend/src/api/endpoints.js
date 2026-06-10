import api from './client'

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats').then((r) => r.data.data),
}

export const companiesApi = {
  list: (params) => api.get('/companies', { params }).then((r) => r.data.data),
  get: (id) => api.get(`/companies/${id}`).then((r) => r.data.data),
  create: (body) => api.post('/companies', body).then((r) => r.data.data),
  update: (id, body) => api.put(`/companies/${id}`, body).then((r) => r.data.data),
  setStatus: (id, status) => api.patch(`/companies/${id}/status`, { status }).then((r) => r.data.data),
  remove: (id) => api.delete(`/companies/${id}`).then((r) => r.data),
}

export const companyAdminsApi = {
  list: (companyId) => api.get('/company-admins', { params: { companyId } }).then((r) => r.data.data),
  create: (body) => api.post('/company-admins', body).then((r) => r.data.data),
  resetPassword: (id) => api.post(`/company-admins/${id}/reset-password`).then((r) => r.data.data),
  setActive: (id, isActive) => api.patch(`/company-admins/${id}/active`, { isActive }).then((r) => r.data.data),
  remove: (id) => api.delete(`/company-admins/${id}`).then((r) => r.data),
}

export const settingsApi = {
  get: (companyId) => api.get(`/settings/${companyId}`).then((r) => r.data.data),
  update: (companyId, body) => api.put(`/settings/${companyId}`, body).then((r) => r.data.data),
}

export const subscriptionsApi = {
  listByCompany: (companyId) => api.get(`/subscriptions/company/${companyId}`).then((r) => r.data.data),
  create: (companyId, body) => api.post(`/subscriptions/company/${companyId}`, body).then((r) => r.data.data),
  setStatus: (id, status) => api.patch(`/subscriptions/${id}/status`, { status }).then((r) => r.data.data),
}

export const walletsApi = {
  get: (companyId) => api.get(`/wallets/company/${companyId}`).then((r) => r.data.data),
  transactions: (companyId) => api.get(`/wallets/company/${companyId}/transactions`).then((r) => r.data.data),
  operate: (companyId, body) => api.post(`/wallets/company/${companyId}/transaction`, body).then((r) => r.data.data),
}

export const auditApi = {
  list: (params) => api.get('/audit-logs', { params }).then((r) => r.data.data),
}

// Company Analytics (Super Admin 360° dashboard).
export const analyticsApi = {
  company: (id) => api.get(`/analytics/company/${id}`).then((r) => r.data.data),
}

// 3-level approval workflow (Maker → Checker → Super Admin).
export const approvalsApi = {
  // Role-scoped queue (maker: own records; checker/super admin: their stage). all=true → super admin sees everything.
  queue: (all = false) =>
    api.get('/approvals/queue', { params: all ? { all: 'true' } : {} }).then((r) => r.data.data),
  get: (id) => api.get(`/approvals/${id}`).then((r) => r.data.data),
  history: (id) => api.get(`/approvals/${id}/history`).then((r) => r.data.data),

  // Checker
  startReview: (id) => api.post(`/approvals/${id}/start-review`).then((r) => r.data.data),
  checkerApprove: (id, notes) => api.post(`/approvals/${id}/checker-approve`, { notes }).then((r) => r.data.data),
  requestChanges: (id, notes) => api.post(`/approvals/${id}/request-changes`, { notes }).then((r) => r.data.data),
  checkerReject: (id, notes) => api.post(`/approvals/${id}/checker-reject`, { notes }).then((r) => r.data.data),

  // Super Admin
  activate: (id, sendEmail = false) =>
    api
      .post(`/approvals/${id}/activate`, {}, { params: { sendWelcomeEmail: sendEmail ? 'true' : 'false' } })
      .then((r) => r.data.data),
  reject: (id, notes) => api.post(`/approvals/${id}/reject`, { notes }).then((r) => r.data.data),
  suspend: (id, notes) => api.post(`/approvals/${id}/suspend`, { notes }).then((r) => r.data.data),
  reactivate: (id, notes) => api.post(`/approvals/${id}/reactivate`, { notes }).then((r) => r.data.data),

  // Retry Moi-Corp Product provisioning after a failure (Super Admin).
  reprovision: (id) => api.post(`/approvals/${id}/reprovision`).then((r) => r.data.data),
}

export const onboardingApi = {
  // GET /meta
  meta: () => api.get('/onboarding/meta').then((r) => r.data.data),

  // GET /generate-code?name=
  generateCode: (name) =>
    api.get('/onboarding/generate-code', { params: { name } }).then((r) => r.data.data),

  // GET /check-code?code=
  checkCode: (code) =>
    api.get('/onboarding/check-code', { params: { code } }).then((r) => r.data.data),

  // POST /generate-password
  generatePassword: (length) =>
    api.post('/onboarding/generate-password', length ? { length } : {}).then((r) => r.data.data),

  // POST /logo (multipart field 'logo')
  uploadLogo: (file) => {
    const fd = new FormData()
    fd.append('logo', file)
    return api
      .post('/onboarding/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data.data) // { logo_url }
  },

  // Drafts
  listDrafts: () => api.get('/onboarding/drafts').then((r) => r.data.data),
  getDraft: (id) => api.get(`/onboarding/drafts/${id}`).then((r) => r.data.data),
  // saveDraft(id?, body): create when id is falsy, else update
  saveDraft: (id, body) =>
    (id
      ? api.put(`/onboarding/drafts/${id}`, body)
      : api.post('/onboarding/drafts', body)
    ).then((r) => r.data.data),
  deleteDraft: (id) => api.delete(`/onboarding/drafts/${id}`).then((r) => r.data),

  // POST /companies — Maker submits an onboarding request for approval.
  // Returns { company }. Provisioning happens later, at Super Admin activation.
  createCompany: (body) => api.post('/onboarding/companies', body).then((r) => r.data.data),
  submitCompany: (body) => api.post('/onboarding/companies', body).then((r) => r.data.data),

  // PUT /companies/:id/resubmit — Maker resubmits after requested changes.
  resubmitCompany: (id, body) => api.put(`/onboarding/companies/${id}/resubmit`, body).then((r) => r.data.data),

  // Invoices
  getInvoiceHtmlUrl: (id) => {
    const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
    return `${base}/onboarding/invoices/${id}/html`
  },
}
