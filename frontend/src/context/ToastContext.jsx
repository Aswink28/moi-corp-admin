import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { Box, Alert, AlertTitle } from '@mui/material'
import { AnimatePresence, motion } from 'framer-motion'

const ToastContext = createContext({ notify: () => {} })

let idSeq = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
    clearTimeout(timers.current[id])
    delete timers.current[id]
  }, [])

  const notify = useCallback(
    (message, severity = 'success', opts = {}) => {
      const id = ++idSeq
      const toast = { id, message, severity, title: opts.title, duration: opts.duration ?? 3800 }
      setToasts((list) => [...list, toast])
      if (toast.duration > 0) timers.current[id] = setTimeout(() => dismiss(id), toast.duration)
      return id
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ notify, dismiss }}>
      {children}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: (t) => t.zIndex.snackbar + 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
          maxWidth: 380,
        }}
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            >
              <Alert
                severity={t.severity}
                variant="filled"
                onClose={() => dismiss(t.id)}
                sx={{ borderRadius: 2.5, boxShadow: '0 12px 32px rgba(2,6,23,0.28)', alignItems: 'center' }}
              >
                {t.title && <AlertTitle sx={{ fontWeight: 700 }}>{t.title}</AlertTitle>}
                {t.message}
              </Alert>
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
