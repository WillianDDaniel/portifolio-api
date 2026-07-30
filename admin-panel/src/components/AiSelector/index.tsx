import { useState, useRef, useEffect } from 'react'
import { getProviderLogo } from '@/helpers/aiProviderHelpers'

import type { AIProvider } from '@/typings/AiProvider'

interface AiSelectorProps {
  providers: AIProvider[]
  selectedProvider: AIProvider
  onProviderChange: (provider: AIProvider) => void
  disabled?: boolean
}

export default function AiSelector({
  providers, selectedProvider,
  onProviderChange, disabled = false,
}: AiSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const hasMultipleProviders = providers.length > 1
  const isInteractionDisabled = disabled || !hasMultipleProviders

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (provider: AIProvider) => {
    onProviderChange(provider)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isInteractionDisabled}
        className="
          flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full
          bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700
          transition-colors duration-200 shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-800
          disabled:opacity-75 disabled:cursor-default disabled:hover:bg-white dark:disabled:hover:bg-zinc-900
        "
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <img
          src={getProviderLogo(selectedProvider.provider)}
          alt={selectedProvider.name}
          className="w-4 h-4 rounded-full object-cover shadow-sm"
        />
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
          {selectedProvider.name}
        </span>

        {hasMultipleProviders && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="
          absolute top-full mt-2 left-0 w-44 bg-white dark:bg-zinc-900 rounded-xl 
          shadow-lg border border-gray-200 dark:border-zinc-700 z-50 py-1.5 
          animate-in fade-in zoom-in-95
        ">
          <div className="flex flex-col">
            {providers.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p)}
                className={`
                  flex items-center gap-2.5 w-full px-3 py-1.5 text-left transition-colors
                  hover:bg-indigo-50 dark:hover:bg-indigo-900/30
                  ${selectedProvider.id === p.id ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}
                `}
              >
                <img
                  src={getProviderLogo(p.provider)}
                  alt={p.name}
                  className="w-5 h-5 rounded-full object-cover shadow-sm"
                />
                <span className="text-zinc-800 dark:text-zinc-200 font-medium text-xs flex-1 truncate">
                  {p.name}
                </span>
                {selectedProvider.id === p.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
