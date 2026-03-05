import { useState } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

interface EigennutzungSetupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { ersparteMiete: number; nettoJahresgehalt: number; monatlicheAusgaben: number }) => void
  onCancel: () => void
  initialErsparteMiete?: number
  initialGehalt?: number
  initialAusgaben?: number
}

export function EigennutzungSetupDialog({ open, onOpenChange, onSubmit, onCancel, initialErsparteMiete, initialGehalt, initialAusgaben }: EigennutzungSetupDialogProps) {
  const [ersparteMiete, setErsparteMiete] = useState(initialErsparteMiete || 800)
  const [nettoJahresgehalt, setNettoJahresgehalt] = useState(initialGehalt || 48000)
  const [monatlicheAusgaben, setMonatlicheAusgaben] = useState(initialAusgaben || 1500)

  const handleSubmit = () => {
    onSubmit({ ersparteMiete, nettoJahresgehalt, monatlicheAusgaben })
  }

  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleCancel() }} size="lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Home className="h-5 w-5 text-primary" />
          Eigennutzung einrichten
        </DialogTitle>
      </DialogHeader>
      <DialogContent onClose={handleCancel}>
        <p className="text-sm text-muted-foreground mb-4">
          Für die Berechnung der Eigennutzungs-Kennzahlen und des Leistbarkeits-Checks
          benötigen wir einige Angaben.
        </p>
        <div className="space-y-4">
          <CurrencyInput
            label="Ersparte Miete (vergleichbare Marktmiete)"
            value={ersparteMiete}
            onChange={setErsparteMiete}
            suffix="€/Mon"
            min={0}
            step={50}
          />
          <CurrencyInput
            label="Netto-Jahresgehalt"
            value={nettoJahresgehalt}
            onChange={setNettoJahresgehalt}
            min={0}
            step={1000}
          />
          <CurrencyInput
            label="Monatliche Ausgaben (ohne Wohnen)"
            value={monatlicheAusgaben}
            onChange={setMonatlicheAusgaben}
            suffix="€/Mon"
            min={0}
            step={100}
          />
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={handleCancel}>Abbrechen</Button>
        <Button onClick={handleSubmit}>Übernehmen</Button>
      </DialogFooter>
    </Dialog>
  )
}
