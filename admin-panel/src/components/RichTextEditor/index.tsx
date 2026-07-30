import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import JoditEditor from 'jodit-react';
import { UploadService } from '@/services/uploadService';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onGenerateTableOfContents?: () => void;
}

export default function RichTextEditor({ value, onChange, onGenerateTableOfContents }: RichTextEditorProps) {
  const { t } = useTranslation();
  const [editorTheme, setEditorTheme] = useState<'light' | 'dark'>('light');

  const editorRef = useRef(null);

  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setEditorTheme(isDark ? 'dark' : 'light');
    };
    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const config = useMemo(() => ({
    readonly: false,
    theme: editorTheme === 'dark' ? 'dark' : 'default',
    height: 500,
    toolbarAdaptive: true,
    disablePlugins: [],
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,

    buttons: [
      'paragraph', 'font', 'fontsize', '|',
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'brush', '|',
      'align', 'outdent', 'indent', '|',
      'ul', 'ol', '|',
      'generateToc', 'link', 'customImage', 'video', '|',
      'eraser', 'copyformat', 'selectall', '|',
      'undo', 'redo', '|',
      'fullsize', 'source'
    ],

    controls: {
      generateToc: {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="jodit-icon"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
        tooltip: t('forms.blog_posts.labels.generate_toc', { defaultValue: 'Generate Table of Contents' }),
        exec: () => {
          if (onGenerateTableOfContents) {
            onGenerateTableOfContents();
          }
        }
      },

      customImage: {
        icon: 'image',
        tooltip: t('forms.blog_posts.labels.tooltip', { defaultValue: 'Insert Image (Upload)' }),
        exec: async (editor: { selection: { insertImage: (url: string) => void } }) => {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();

          input.onchange = async () => {
            const file = input.files?.[0];
            if (file) {
              try {
                const url = await UploadService.uploadImage(file, 'blog-posts', `inline-${Date.now()}`);
                editor.selection.insertImage(url);
              } catch (error) {
                console.error(t('blog_posts.editor.errors.upload_log'), error);
                alert(t('blog_posts.editor.errors.upload_alert'));
              }
            }
          };
        }
      }
    }
  }), [editorTheme, t, onGenerateTableOfContents]);

  return (
    <div className="rich-text-wrapper relative flex flex-col gap-2">
      <div className="rich-text-container rounded-lg overflow-hidden border border-gray-300 dark:border-zinc-600 shadow-sm mt-1">
        <JoditEditor
          ref={editorRef}
          value={value}
          config={config}
          onBlur={newContent => onChange(newContent)}
          onChange={() => { }}
        />
      </div>
    </div>
  );
}
