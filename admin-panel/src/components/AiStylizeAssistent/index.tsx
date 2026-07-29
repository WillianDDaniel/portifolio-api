import { useState, useEffect, useMemo } from 'react'
import { useSettingsContext } from '@/contexts/SettingsContext'

import AiSelector from '@/components/AiSelector'

import type { AIProvider } from '@/typings/AiProvider';

interface AiStylizeAssistentProps {
  isStylizing: boolean;
  onStylizeAI: (index: number, providerId: string) => void;
  index: number;
  disabled?: boolean;
}

export default function AiStylizeAssistent({
  isStylizing,
  onStylizeAI,
  index,
  disabled
}: AiStylizeAssistentProps) {
  const { globalSettings } = useSettingsContext()

  const providers: AIProvider[] = useMemo(
    () => globalSettings?.aiKeys || [],
    [globalSettings?.aiKeys]
  )

  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null)

  useEffect(() => {
    if (providers.length > 0 && !selectedProvider) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedProvider(providers[0])
    }
  }, [providers, selectedProvider])

  if (providers.length === 0 || !selectedProvider) {
    return null
  }

  return (
    <div className="flex items-center gap-3">
      {/* Seletor de IA independente para a estilização */}
      <AiSelector
        providers={providers}
        selectedProvider={selectedProvider}
        onProviderChange={setSelectedProvider}
        disabled={isStylizing || disabled}
      />

      <button
        type="button"
        onClick={() => selectedProvider.id && onStylizeAI(index, selectedProvider.id)}
        disabled={isStylizing || disabled}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${isStylizing
          ? 'bg-purple-100 text-purple-700 border-purple-200 cursor-not-allowed dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
          : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50 dark:bg-zinc-800 dark:text-purple-400 dark:border-zinc-700 dark:hover:border-purple-500'
          }`}
      >
        {isStylizing ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Estilizando...
          </>
        ) : (
          <>
            <span>🪄</span>
            Injetar Tailwind
          </>
        )}
      </button>
    </div>
  )
}