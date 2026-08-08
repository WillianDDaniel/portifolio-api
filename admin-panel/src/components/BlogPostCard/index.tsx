import { useTranslation } from 'react-i18next';

import DeleteButton from '@/components/Buttons/DeleteButton';
import EditButton from '@/components/Buttons/EditButton';
import ViewButton from '@/components/Buttons/ViewButton';

import type { BlogPost } from '@/typings/BlogPosts';

interface BlogPostCardProps {
  post: BlogPost;
  onDelete: (id: string) => void;
}

export default function BlogPostCard({ post, onDelete }: BlogPostCardProps) {
  const { t, i18n } = useTranslation();

  const currentTranslation = post.translations?.find(
    (translation) => translation.language === i18n.language
  ) || post.translations?.[0];

  return (
    <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-lg shadow-sm flex flex-col overflow-hidden transition-shadow hover:shadow-md">

      <div className="h-40 bg-gray-100 dark:bg-zinc-700 relative border-b border-gray-100 dark:border-zinc-700">
        {post.coverImageUrl ? (
          <img
            src={post.coverImageUrl}
            alt={currentTranslation?.title || 'Cover image'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 dark:text-zinc-500 text-3xl">📰</span>
          </div>
        )}

        <div className="absolute top-3 right-3 flex gap-2">
          {post.status === 'published' ? (
            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-semibold px-2 py-1 rounded shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {t('forms.blog_posts.statuses.published', { defaultValue: 'Published' })}
            </span>
          ) : (
            <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-semibold px-2 py-1 rounded shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              {t('forms.blog_posts.statuses.draft', { defaultValue: 'Draft' })}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2" title={currentTranslation?.title}>
          {currentTranslation?.title || t('blog_posts.card.no_title', { defaultValue: 'Sem título' })}
        </h3>

        <p className="text-sm text-gray-500 dark:text-zinc-400 line-clamp-3 mb-4 flex-1">
          {currentTranslation?.excerpt || t('blog_posts.card.no_excerpt', { defaultValue: 'Sem resumo disponível.' })}
        </p>

        <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-zinc-700 mt-auto">
          <div className="flex gap-2">
            {post.translations?.map((tData) => (
              <span key={tData.language} className="text-xs uppercase font-medium text-gray-400 dark:text-zinc-500 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-600 px-1.5 py-0.5 rounded">
                {tData.language}
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <ViewButton
              to={{ pathname: `/blog-posts/view/${post.id}` }}
              title={t('pages.blog_posts.buttons.view_post', { defaultValue: 'View Post' })}
              customClass="bg-white p-2 flex items-center justify-center rounded-full text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
            />

            <EditButton
              to={{ pathname: `/blog-posts/edit/${post.id}` }}
              title={t('pages.blog_posts.buttons.edit_post', { defaultValue: 'Edit Post' })}
              customClass="bg-white p-2 flex items-center justify-center rounded-full text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
            />

            <DeleteButton
              onDelete={() => onDelete(post.id)}
              title={t('pages.blog_posts.buttons.delete_post', { defaultValue: 'Delete Post' })}
              customClass="cursor-pointer bg-white p-2 flex items-center justify-center rounded-full text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
