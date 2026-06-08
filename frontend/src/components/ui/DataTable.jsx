import { useMemo, useState, useEffect } from 'react'
import {
  Card, Box, Table, TableHead, TableBody, TableRow, TableCell, TableSortLabel, TableContainer,
  TablePagination, TextField, InputAdornment, Skeleton, Button, Tooltip,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import { alpha } from '@mui/material/styles'
import { motion, AnimatePresence } from 'framer-motion'
import EmptyState from './EmptyState'

function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

function toCsv(columns, rows) {
  const cols = columns.filter((c) => c.exportable !== false)
  const head = cols.map((c) => `"${c.header}"`).join(',')
  const body = rows
    .map((r) => cols.map((c) => `"${String(c.value ? c.value(r) : r[c.key] ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  return `${head}\n${body}`
}

/**
 * Generic, animated data table.
 * columns: [{ key, header, render?(row), value?(row) (for sort/search/export), sortable?, align?, width }]
 */
export default function DataTable({
  columns,
  rows = [],
  loading = false,
  searchable = true,
  searchPlaceholder = 'Search…',
  toolbar = null,
  exportable = true,
  exportName = 'export',
  empty = {},
  rowKey = (r) => r.id,
  rowsPerPageOptions = [10, 25, 50],
  dense = false,
}) {
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search, 300)
  const [orderBy, setOrderBy] = useState(null)
  const [order, setOrder] = useState('asc')
  const [page, setPage] = useState(0)
  const [rpp, setRpp] = useState(rowsPerPageOptions[0])

  useEffect(() => setPage(0), [debounced, rows])

  const valueOf = (col, row) => (col.value ? col.value(row) : row[col.key])

  const filtered = useMemo(() => {
    if (!debounced) return rows
    const q = debounced.toLowerCase()
    return rows.filter((r) =>
      columns.some((c) => {
        const v = valueOf(c, r)
        return v != null && String(v).toLowerCase().includes(q)
      })
    )
  }, [rows, debounced, columns])

  const sorted = useMemo(() => {
    if (!orderBy) return filtered
    const col = columns.find((c) => c.key === orderBy)
    if (!col) return filtered
    const arr = [...filtered].sort((a, b) => {
      const av = valueOf(col, a)
      const bv = valueOf(col, b)
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return av - bv
      return String(av).localeCompare(String(bv), undefined, { numeric: true })
    })
    return order === 'asc' ? arr : arr.reverse()
  }, [filtered, orderBy, order, columns])

  const paged = sorted.slice(page * rpp, page * rpp + rpp)

  const sort = (key) => {
    if (orderBy === key) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    else {
      setOrderBy(key)
      setOrder('asc')
    }
  }

  const doExport = () => {
    const blob = new Blob([toCsv(columns, sorted)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exportName}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      {(searchable || toolbar || exportable) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, flexWrap: 'wrap' }}>
          {searchable && (
            <TextField
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 240, flex: '0 1 320px' }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            />
          )}
          <Box sx={{ flex: 1 }} />
          {exportable && (
            <Tooltip title="Export CSV">
              <span>
                <Button onClick={doExport} variant="outlined" color="inherit" startIcon={<FileDownloadOutlinedIcon />} disabled={!sorted.length}>
                  Export
                </Button>
              </span>
            </Tooltip>
          )}
          {toolbar}
        </Box>
      )}

      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader size={dense ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c.key} align={c.align} sx={{ width: c.width, whiteSpace: 'nowrap' }}>
                  {c.sortable !== false ? (
                    <TableSortLabel active={orderBy === c.key} direction={orderBy === c.key ? order : 'asc'} onClick={() => sort(c.key)}>
                      {c.header}
                    </TableSortLabel>
                  ) : (
                    c.header
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {columns.map((c) => (
                    <TableCell key={c.key}><Skeleton variant="text" width={c.skeletonWidth || '80%'} height={22} /></TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && (
              <AnimatePresence initial={false}>
                {paged.map((row, i) => (
                  <TableRow
                    key={rowKey(row)}
                    hover
                    component={motion.tr}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.025, 0.25) }}
                    sx={{ '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.05) } }}
                  >
                    {columns.map((c) => (
                      <TableCell key={c.key} align={c.align} sx={{ width: c.width }}>
                        {c.render ? c.render(row) : row[c.key] ?? '—'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </AnimatePresence>
            )}

            {!loading && sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ border: 0 }}>
                  <EmptyState
                    icon={empty.icon}
                    title={empty.title || (debounced ? 'No matches found' : 'No records yet')}
                    description={empty.description || (debounced ? 'Try a different search term.' : undefined)}
                    action={!debounced ? empty.action : undefined}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading && sorted.length > 0 && (
        <TablePagination
          component="div"
          count={sorted.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rpp}
          onRowsPerPageChange={(e) => { setRpp(parseInt(e.target.value, 10)); setPage(0) }}
          rowsPerPageOptions={rowsPerPageOptions}
        />
      )}
    </Card>
  )
}
