const app = require('./app')
const config = require('./config/env')

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `[company-admin-backend] listening on http://localhost:${config.port} (env=${config.env}, db=${config.db.database})`
  )
})
