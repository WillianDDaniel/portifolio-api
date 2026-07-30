import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useSettingsContext } from '@/contexts/SettingsContext';
import AiSelector from '@/components/AiSelector';
import type { AIProvider } from '@/typings/AiProvider';

interface AiEditorHeaderProps {
  index: number;
  aiPrompt: string;
  setAiPrompt: (prompt: string) => void;
  isGenerating: boolean;
  onGenerateAI: (prompt: string, index: number, providerId: string) => void;
  isStylizing: boolean;
  onStylizeAI: (index: number, providerId: string) => void;
}

export default function AiEditorHeader({
  index,
  aiPrompt,
  setAiPrompt,
  isGenerating,
  onGenerateAI,
  isStylizing,
  onStylizeAI,
}: AiEditorHeaderProps) {

  const { t } = useTranslation();
  const { globalSettings } = useSettingsContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isPromptOpen, setIsPromptOpen] = useState(false);

  const providers: AIProvider[] = useMemo(
    () => globalSettings?.aiKeys || [],
    [globalSettings?.aiKeys]
  );

  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);

  useEffect(() => {
    if (providers.length > 0 && !selectedProvider) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedProvider(providers[0]);
    }
  }, [providers, selectedProvider]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAiPrompt(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  if (providers.length === 0 || !selectedProvider) {
    return null;
  }

  return (
    <div className="bg-[#f9f9f9] dark:bg-zinc-800/90 border border-gray-300 dark:border-zinc-600 rounded-lg p-3 mb-3 transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">

          <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <img src="/ai-assistant.png" alt="AI Assistant" className="w-7 h-7 object-contain opacity-80" />
            {t('global.components.ai_generator.label', { defaultValue: 'AI Assistant' })}
          </label>

          <AiSelector
            providers={providers}
            selectedProvider={selectedProvider}
            onProviderChange={setSelectedProvider}
            disabled={isGenerating || isStylizing}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPromptOpen(!isPromptOpen)}
            disabled={isGenerating || isStylizing}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${isPromptOpen
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400'
              : 'bg-white text-zinc-700 border-gray-200 hover:bg-gray-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span>✍️</span>
            {isPromptOpen ? t('global.components.ai_generator.close', { defaultValue: 'Close' }) : t('global.components.ai_generator.write', { defaultValue: 'Write' })}
          </button>

          <button
            type="button"
            onClick={() => selectedProvider.id && onStylizeAI(index, selectedProvider.id)}
            disabled={isStylizing || isGenerating}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${isStylizing
              ? 'bg-purple-100 text-purple-700 border-purple-200 cursor-not-allowed dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
              : 'bg-white text-purple-600 border-purple-100 hover:bg-purple-50 hover:border-purple-200 dark:bg-zinc-800 dark:text-purple-400 dark:border-zinc-700 dark:hover:border-purple-500'
              }`}
          >
            {isStylizing ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t('global.components.ai_generator.stylizing', { defaultValue: 'Stylizing...' })}
              </>
            ) : (
              <>
                <span>🪄</span>
                {t('global.components.ai_generator.stylize', { defaultValue: 'Stylize' })}
              </>
            )}
          </button>
        </div>
      </div>

      {isPromptOpen && (
        <div className="relative mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <textarea
            ref={textareaRef}
            rows={2}
            value={aiPrompt}
            onChange={handleTextareaChange}
            placeholder={t('global.components.ai_generator.placeholder', { defaultValue: 'Write something...' })}
            className="
              w-full pl-4 pr-12 py-3 text-sm bg-white dark:bg-zinc-950 
              border border-gray-200 dark:border-zinc-700 rounded-xl resize-none 
              outline-none text-zinc-900 dark:text-zinc-100 transition-shadow shadow-inner
              min-h-17.5 max-h-40 overflow-y-auto focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30
              [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-600
            "
            disabled={isGenerating || isStylizing}
          />
          <button
            type="button"
            onClick={() => {
              if (selectedProvider.id) {
                onGenerateAI(aiPrompt, index, selectedProvider.id);
                setIsPromptOpen(false);
              }
            }}
            disabled={isGenerating || !aiPrompt.trim()}
            className="
              absolute right-3 bottom-3 w-8 h-8 flex items-center justify-center cursor-pointer
              rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md hover:shadow-lg
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 disabled:shadow-none
            "
            title={t('global.components.ai_generator.button', { defaultValue: 'Generate' })}
          >
            {isGenerating ? (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
