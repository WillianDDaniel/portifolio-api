import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

interface TaxonomyOption {
  id: string;
  name: string;
}

interface TaxonomySelectorProps {
  label: string;
  placeholder: string;
  options: TaxonomyOption[];
  value: string[];
  onChange: (value: string[]) => void;
  onCreateOption: (name: string) => void;
  error?: string;
  isCreating?: boolean;
}

export default function TaxonomySelector({
  label, placeholder, options, value, onChange,
  onCreateOption, error, isCreating = false
}: TaxonomySelectorProps) {

  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOptions = value
    .map(id => options.find(opt => opt.id === id))
    .filter((opt): opt is TaxonomyOption => opt !== undefined);

  const unselectedOptions = options.filter(opt => !value.includes(opt.id));

  const recentOptions = options.slice(0, 5);

  const filteredOptions = unselectedOptions.filter(opt =>
    opt.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const exactMatch = options.find(opt => opt.name.toLowerCase() === inputValue.toLowerCase());
  const showCreate = inputValue.trim().length > 1 && !exactMatch;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    if (!value.includes(id)) {
      onChange([...value, id]);
    }
    setInputValue('');
    setIsOpen(false);
  };

  const handleRemove = (idToRemove: string) => {
    onChange(value.filter(id => id !== idToRemove));
  };

  const handleCreate = () => {
    if (!inputValue.trim() || isCreating) return;
    onCreateOption(inputValue.trim());
    setInputValue('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0 && inputValue.trim()) {
        handleSelect(filteredOptions[0].id);
      } else if (showCreate) {
        handleCreate();
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      handleRemove(value[value.length - 1]);
    }
  };

  return (
    <div className="relative flex flex-col" ref={wrapperRef}>
      <label className="mb-2 text-sm font-semibold text-gray-900 dark:text-zinc-100">
        {label}
      </label>

      {recentOptions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-xs text-gray-500 dark:text-zinc-400 mr-1 font-medium">
            {t('forms.taxonomies.labels.recent', { defaultValue: 'Recent:' })}
          </span>
          {recentOptions.map(opt => {
            const isSelected = value.includes(opt.id);

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => isSelected ? handleRemove(opt.id) : handleSelect(opt.id)}
                className={`px-2.5 py-1 text-[11px] uppercase tracking-wide font-semibold rounded-full border transition-all flex items-center gap-1
                  ${isSelected
                    ? 'bg-transparent text-gray-400 dark:text-zinc-500 border-gray-300 dark:border-zinc-600 border-dashed hover:border-red-300 hover:text-red-400'
                    : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 border-gray-200 dark:border-zinc-700'
                  }`}
              >
                <span>{isSelected ? '✓' : '+'}</span> {opt.name}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-3 bg-gray-50/50 dark:bg-zinc-900/30 p-2.5 rounded-lg border border-gray-100 dark:border-zinc-800/50 min-h-11.5 items-center">
        {selectedOptions.length > 0 ? (
          selectedOptions.map(opt => (
            <span
              key={opt.id}
              className="flex items-center gap-1.5 px-2.5 py-1 text-sm bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-md border border-indigo-100 dark:border-indigo-800/50 shadow-sm transition-all"
            >
              {opt.name}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(opt.id);
                }}
                className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 focus:outline-none"
              >
                ✕
              </button>
            </span>
          ))
        ) : (
          <span className="text-sm text-gray-400 dark:text-zinc-500 italic select-none px-1">
            {t('forms.taxonomies.labels.none_selected', { defaultValue: 'No options selected' })}
          </span>
        )}
      </div>

      <div
        className={`flex items-center bg-white dark:bg-zinc-900 border rounded-lg transition-colors focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 dark:focus-within:ring-indigo-600 ${error ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'
          }`}
        onClick={() => setIsOpen(true)}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="flex-1 w-full bg-transparent text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 border-none focus:ring-0 px-3 py-2.5 outline-none rounded-lg"
          disabled={isCreating}
        />
      </div>

      {error && <span className="mt-1.5 text-sm text-red-500 font-medium">{error}</span>}

      {isOpen && (inputValue.trim() || filteredOptions.length > 0) && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-lg shadow-lg">
          <ul className="py-1">
            {filteredOptions.map(opt => (
              <li
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
              >
                {opt.name}
              </li>
            ))}

            {showCreate && (
              <li
                onClick={handleCreate}
                className="px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors flex items-center gap-2"
              >
                {isCreating ? (
                  <span className="animate-pulse">{t('global.loading', { defaultValue: 'Creating...' })}</span>
                ) : (
                  <>➕ {t('forms.taxonomies.labels.create', { defaultValue: 'Create' })} "{inputValue}"</>
                )}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
