import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        className: 'bg-card text-card-foreground border shadow-lg',
        duration: 3000,
      }}
      richColors
      closeButton
    />
  )
}
