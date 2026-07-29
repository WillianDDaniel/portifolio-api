import { useTranslation } from 'react-i18next';

import { useBlogPosts } from '@/hooks/useBlogPosts';

import Heading from '@/components/Heading';
import SubTitle from '@/components/SubTitle';
import Background from '@/components/Background';
import BlogPostForm from '@/components/BlogPostForm';

import BackButton from '@/components/Buttons/BackButton';

export default function CreateBlogPost() {
  const { t } = useTranslation();

  const {
    imagePreview, handleFileChange,
    isSubmitting, globalError,
    createBlogPost, generateAIContent, isGenerating,
    register, control, errors, fields, appendTranslation, removeTranslation,
    handleSlugDebounce, isStylizing, stylizeAIContent, generateTableOfContents
  } = useBlogPosts();

  return (
    <div className="dark:bg-zinc-900 bg-gray-50 text-gray-800 dark:text-zinc-100 min-h-screen flex flex-col relative overflow-hidden">

      <Background />

      <main className="flex-1 px-8 py-8 w-full relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Heading level={1} title={t('pages.blog_posts.create.title', { defaultValue: 'Create new post' })} />
            <SubTitle content={t('pages.blog_posts.create.description', { defaultValue: 'Create a new blog post to be published on the website.' })} />
          </div>
          <BackButton to={{ pathname: '/blog-posts' }} label={t('pages.blog_posts.buttons.back_to_posts', { defaultValue: 'Back to Posts' })} />
        </div>

        <BlogPostForm
          register={register}
          control={control}
          errors={errors}
          fields={fields}
          appendTranslation={appendTranslation}
          removeTranslation={removeTranslation}
          imagePreview={imagePreview}
          isSubmitting={isSubmitting}
          globalError={globalError}
          handleFileChange={handleFileChange}
          onSubmitAction={createBlogPost}
          generateAIContent={generateAIContent}
          isGenerating={isGenerating}
          isStylizing={isStylizing}
          stylizeAIContent={stylizeAIContent}
          generateTableOfContents={generateTableOfContents}
          handleSlugDebounce={handleSlugDebounce}
        />
      </main>
    </div>
  );
}
