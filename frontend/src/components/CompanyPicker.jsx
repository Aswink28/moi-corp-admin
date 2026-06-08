import { useEffect, useState } from 'react'
import { TextField, MenuItem } from '@mui/material'
import { companiesApi } from '../api/endpoints'

/** A select that loads companies and reports the chosen company object. */
export default function CompanyPicker({ value, onChange, label = 'Select Company', sx }) {
  const [companies, setCompanies] = useState([])

  useEffect(() => {
    companiesApi.list().then(setCompanies).catch(() => setCompanies([]))
  }, [])

  return (
    <TextField
      select
      label={label}
      value={value || ''}
      onChange={(e) => {
        const company = companies.find((c) => c.id === e.target.value) || null
        onChange(e.target.value, company)
      }}
      sx={{ minWidth: 280, ...sx }}
      size="small"
    >
      <MenuItem value="" disabled>
        Choose a company…
      </MenuItem>
      {companies.map((c) => (
        <MenuItem key={c.id} value={c.id}>
          {c.name} ({c.code})
        </MenuItem>
      ))}
    </TextField>
  )
}
