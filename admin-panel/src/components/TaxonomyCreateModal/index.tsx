import { useTranslation } from 'react-i18next';

interface TaxonomyCreateModalProps {
  closeCreateModal: () => void;
  handleConfirmCreation: () => void;
  isSaving: boolean;
  isFormEmpty: boolean;
  formData: { pt: string; en: string; es: string };
  setFormData: React.Dispatch<React.SetStateAction<{ pt: string; en: string; es: string }>>;
  modalState: {
    isOpen: boolean;
    type: 'category' | 'tag';
  };
}

export default function TaxonomyCreateModal({
  closeCreateModal, handleConfirmCreation, isSaving, isFormEmpty, formData, setFormData, modalState
}: TaxonomyCreateModalProps) {

  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeCreateModal();
      }}
    >
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-xl relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden border border-gray-100 dark:border-zinc-700">
        <button
          type="button"
          onClick={closeCreateModal}
          className="absolute top-4 right-4 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-zinc-50 mb-6 pr-8">
            {modalState.type === 'category'
              ? t('taxonomies.modal.title_category', { defaultValue: 'Create New Category' })
              : t('taxonomies.modal.title_tag', { defaultValue: 'Create New Tag' })}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                🇺🇸 {t('global.languages.en', { defaultValue: 'English' })}
              </label>
              <input
                type="text"
                value={formData.en}
                onChange={(e) => setFormData(prev => ({ ...prev, en: e.target.value }))}
                className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-zinc-100"
                placeholder={t('taxonomies.placeholders.en_example', { defaultValue: 'e.g. Technology' })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                🇧🇷 {t('global.languages.pt', { defaultValue: 'Português' })}
              </label>
              <input
                type="text"
                value={formData.pt}
                onChange={(e) => setFormData(prev => ({ ...prev, pt: e.target.value }))}
                className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-zinc-100"
                placeholder={t('taxonomies.placeholders.pt_example', { defaultValue: 'ex. Tecnologia' })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                🇪🇸 {t('global.languages.es', { defaultValue: 'Español' })}
              </label>
              <input
                type="text"
                value={formData.es}
                onChange={(e) => setFormData(prev => ({ ...prev, es: e.target.value }))}
                className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-zinc-100"
                placeholder={t('taxonomies.placeholders.es_example', { defaultValue: 'ej. Tecnología' })}
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={closeCreateModal}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              {t('global.components.ai_generator.close', { defaultValue: 'Close' })}
            </button>
            <button
              type="button"
              onClick={handleConfirmCreation}
              disabled={isSaving || isFormEmpty}
              className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {t('global.components.ai_generator.save', { defaultValue: 'Save' })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
