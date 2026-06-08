const service = require('../services/wallets.service')
const { audit } = require('../utils/audit')

async function getWallet(req, res) {
  const data = await service.getWallet(req.params.companyId)
  res.json({ success: true, data })
}

async function transactions(req, res) {
  const data = await service.transactions(req.params.companyId, Number(req.query.limit) || 100)
  res.json({ success: true, data })
}

async function operate(req, res) {
  const { type, amount, description } = req.body
  const data = await service.operate(req.params.companyId, { type, amount, description }, req.user.id)
  await audit(req, {
    action: `wallet.${type}`,
    entityType: 'company_wallet',
    entityId: data.wallet.id,
    details: { companyId: req.params.companyId, amount, balance_after: data.wallet.balance },
  })
  res.json({ success: true, data })
}

module.exports = { getWallet, transactions, operate }
