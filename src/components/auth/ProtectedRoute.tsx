import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { LoginDialog } from './LoginDialog'

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const [showLogin, setShowLogin] = useState(true)

  if (!isAuthenticated) {
    return (
      <LoginDialog
        open={showLogin}
        onOpenChange={(open) => {
          setShowLogin(open)
          // If they close without logging in, reopen
          if (!open && !useAuthStore.getState().isAuthenticated()) {
            setTimeout(() => setShowLogin(true), 100)
          }
        }}
      />
    )
  }

  return <Outlet />
}
