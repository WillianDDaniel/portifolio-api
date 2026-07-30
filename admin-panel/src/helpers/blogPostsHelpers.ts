export const injectTableOfContents = (html: string, tocLabel: string = 'Neste artigo:'): string => {
  if (!html || !html.includes('<h2')) {
    throw new Error('INSUFFICIENT_HEADINGS');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const headings = doc.querySelectorAll('h2, h3');

  if (headings.length < 3) {
    throw new Error('INSUFFICIENT_HEADINGS');
  }

  let tocHtml = `<div class="toc-container bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-6 mb-8 my-4">\n`;
  tocHtml += `  <h4 class="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-4">${tocLabel}</h4>\n`;
  tocHtml += `  <ul class="space-y-2 text-sm">\n`;

  headings.forEach((heading, index) => {
    const text = heading.textContent || `topico-${index}`;

    const slug = text.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const uniqueId = `${slug}-${index}`;
    heading.setAttribute('id', uniqueId);

    const isH3 = heading.tagName.toLowerCase() === 'h3';
    const liClasses = isH3
      ? 'ml-4 text-gray-600 dark:text-zinc-400'
      : 'font-medium text-gray-800 dark:text-zinc-200';

    tocHtml += `    <li class="${liClasses}">\n`;
    tocHtml += `      <a href="#${uniqueId}" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">${text}</a>\n`;
    tocHtml += `    </li>\n`;
  });

  tocHtml += `  </ul>\n</div>\n\n`;

  doc.body.insertAdjacentHTML('afterbegin', tocHtml);

  return doc.body.innerHTML;
};