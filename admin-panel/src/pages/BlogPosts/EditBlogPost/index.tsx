import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useBlogPosts } from '@/hooks/useBlogPosts';

import Heading from '@/components/Heading';
import SubTitle from '@/components/SubTitle';
import Background from '@/components/Background';
import BlogPostForm from '@/components/BlogPostForm';

import BackButton from '@/components/Buttons/BackButton';
import PageLoader from '@/components/PageLoader';

export default function EditBlogPost() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  const {
    loading,
    globalError,
    updateBlogPost,
    register,
    control,
    errors,
    isSubmitting,
    fields,
    appendTranslation,
    removeTranslation,
    imagePreview,
    handleFileChange,
    generateAIContent,
    isGenerating,
    isStylizing,
    stylizeAIContent,
    generateTableOfContents,
    handleSlugDebounce
  } = useBlogPosts({ editId: id });

  const render = () => {
    if (loading) return <PageLoader />;

    return (
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
        onSubmitAction={updateBlogPost(id as string)}
        generateAIContent={generateAIContent}
        isGenerating={isGenerating}
        isStylizing={isStylizing}
        stylizeAIContent={stylizeAIContent}
        generateTableOfContents={generateTableOfContents}
        handleSlugDebounce={handleSlugDebounce}
      />
    )
  }

  return (
    <div className="dark:bg-zinc-900 bg-gray-50 text-gray-800 dark:text-zinc-100 min-h-screen flex flex-col relative overflow-hidden">
      <Background />

      <main className="flex-1 px-8 py-8 w-full relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Heading level={1} title={t('pages.blog_posts.edit.title', { defaultValue: 'Update your blog post content and settings.' })} />
            <SubTitle content={t('pages.blog_posts.edit.description', { defaultValue: 'Update your blog post content and settings.' })} />
          </div>
          <BackButton to={{ pathname: '/blog-posts' }} label={t('pages.blog_posts.buttons.back_to_posts', { defaultValue: 'Back to Posts' })} />
        </div>

        {render()}
      </main>
    </div>
  )
}
