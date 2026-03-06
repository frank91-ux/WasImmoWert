import React, { useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, X } from 'lucide-react';

interface DataManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DataManagementDialog: React.FC<DataManagementDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [isDeletionStep, setIsDeletionStep] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success('Dein Daten-Export wird vorbereitet...');
      // In a real app, this would trigger a download or send a request email
    } catch (error) {
      toast.error('Fehler beim Exportieren der Daten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'LÖSCHEN') {
      toast.error('Bitte gib "LÖSCHEN" ein, um den Account zu löschen');
      return;
    }

    setIsLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success('Dein Account wird gelöscht...');
      // In a real app, this would call the backend to delete the user
      onOpenChange(false);
      setDeleteConfirmation('');
      setIsDeletionStep(false);
    } catch (error) {
      toast.error('Fehler beim Löschen des Accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsDeletionStep(false);
      setDeleteConfirmation('');
    }
    onOpenChange(newOpen);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => handleOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {isDeletionStep ? 'Account löschen' : 'Meine Daten verwalten'}
          </h2>
          <button
            onClick={() => handleOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {!isDeletionStep ? (
            <div className="space-y-4">
              {/* Export Data Button */}
              <button
                onClick={handleExportData}
                disabled={isLoading}
                className="w-full px-4 py-3 text-left rounded-lg border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">
                      Daten exportieren
                    </h3>
                    <p className="text-sm text-gray-600">
                      Lade eine Kopie deiner persönlichen Daten herunter (DSGVO-Artikel 15).
                    </p>
                  </div>
                  <div className="text-teal-600 text-sm font-medium flex-shrink-0">
                    →
                  </div>
                </div>
              </button>

              {/* Delete Account Button */}
              <button
                onClick={() => setIsDeletionStep(true)}
                disabled={isLoading}
                className="w-full px-4 py-3 text-left rounded-lg border-2 border-red-200 hover:border-red-400 hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-red-900 mb-1">
                      Account löschen
                    </h3>
                    <p className="text-sm text-red-700">
                      Lösche deinen Account und alle zugehörigen Daten (DSGVO-Artikel 17).
                    </p>
                  </div>
                  <div className="text-red-600 text-sm font-medium flex-shrink-0">
                    →
                  </div>
                </div>
              </button>
            </div>
          ) : (
            // Deletion Confirmation Step
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900 mb-1">
                    Warnung: Diese Aktion kann nicht rückgängig gemacht werden
                  </h4>
                  <p className="text-sm text-red-700">
                    Das Löschen deines Accounts wird alle deine Daten, Projekte und Einstellungen permanent entfernen.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Gib "LÖSCHEN" ein, um fortzufahren
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) =>
                    setDeleteConfirmation(e.target.value.toUpperCase())
                  }
                  placeholder="LÖSCHEN"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setIsDeletionStep(false);
                    setDeleteConfirmation('');
                  }}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={
                    deleteConfirmation !== 'LÖSCHEN' || isLoading
                  }
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Wird gelöscht...' : 'Account löschen'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Info */}
        {!isDeletionStep && (
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <p className="text-xs text-gray-600">
              Nach DSGVO hast du das Recht, deine Daten zu exportieren oder deinen Account zu löschen. Deine Anfrage wird verarbeitet, nachdem du sie bestätigt hast.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
