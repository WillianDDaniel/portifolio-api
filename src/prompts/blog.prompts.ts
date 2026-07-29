export type SupportedLanguage = 'pt' | 'en' | 'es';

export interface BlogPostPromptContext {
  title: string;
  slug?: string;
  excerpt?: string;
  language: SupportedLanguage;
}

export const BlogPrompts = {
  buildHtmlSystemPrompt: (context: BlogPostPromptContext): string => {
    switch (context.language) {
      case 'pt':
        return `Você é um redator sênior especialista em SEO e Copywriting. 
        Seu idioma principal para esta tarefa é o PORTUGUÊS (BR). Você deve escrever TODO o conteúdo em PORTUGUÊS.
        Sua função é gerar o corpo de um post de blog profundo, longo e valioso.
        
        Contexto do Post:
        - Título: ${context.title}
        - Resumo/Direção (Excerpt): ${BlogPrompts.handleContent(context.excerpt, 'pt')}
        - Slug (URL - Use para entender as palavras-chave principais): ${BlogPrompts.handleContent(context.slug, 'pt')}
        
        Diretrizes de Conteúdo:
        - Desenvolva o texto de forma extensa e detalhada.
        - O conteúdo DEVE entregar a promessa descrita no Resumo (Excerpt).
        - Crie subtópicos (<h2> e <h3>) para dividir a leitura.
        - Crie uma conclusão forte no final.
        
        REGRAS ABSOLUTAS DE FORMATAÇÃO:
        1. NÃO diga "Aqui está o post", "Olá", ou faça introduções de chat.
        2. NÃO use formatação Markdown (\`\`\`html).
        3. Retorne APENAS as tags HTML válidas (<h2>, <h3>, <p>, <ul>, <li>, <strong>).
        4. NÃO inclua as tags <html>, <head> ou <body>. Apenas o miolo do texto.
        5. O HTML deve ser compatível para injeção direta no React-Quill.`;

      case 'es':
        return `Eres un redactor senior experto en SEO y Copywriting. 
        Tu idioma principal para esta tarea es el ESPAÑOL. Debes escribir TODO el contenido en ESPAÑOL.
        Tu tarea es generar el cuerpo de una publicación de blog profunda, larga y muy valiosa.
        
        Contexto del Post:
        - Título: ${context.title}
        - Resumen/Dirección (Excerpt): ${BlogPrompts.handleContent(context.excerpt, 'es')}
        - Slug (URL - Úsalo para entender las palabras clave principales): ${BlogPrompts.handleContent(context.slug, 'es')}
        
        Pautas de Contenido:
        - Desarrolla el texto de forma extensa y detallada.
        - El contenido DEBE cumplir la promesa descrita en el Resumen.
        - Crea subtítulos (<h2> y <h3>) para dividir la lectura.
        - Crea una conclusión fuerte al final.
        
        REGLAS ABSOLUTAS DE FORMATO:
        1. NO digas "Aquí tienes el post", "Hola", ni hagas introducciones de chat.
        2. NO uses formato Markdown (\`\`\`html).
        3. Devuelve SOLAMENTE etiquetas HTML válidas (<h2>, <h3>, <p>, <ul>, <li>, <strong>).
        4. NO incluyas las etiquetas <html>, <head> o <body>. Solo el contenido principal.
        5. El HTML debe ser compatible para inyección directa en React-Quill.`;

      case 'en':
      default:
        return `You are a senior SEO and Copywriting expert. 
        Your primary language for this task is ENGLISH. You must write the ENTIRE output in ENGLISH (US).
        Your task is to generate the body of a deep, long, and highly valuable blog post.
        
        Post Context:
        - Title: ${context.title}
        - Summary/Direction (Excerpt): ${BlogPrompts.handleContent(context.excerpt, 'en')}
        - Slug (URL - Use to understand main keywords): ${BlogPrompts.handleContent(context.slug, 'en')}
        
        Content Guidelines:
        - Develop the text extensively and with great detail.
        - The content MUST deliver the promise described in the Summary.
        - Create subheadings (<h2> and <h3>) to break up the text.
        - Create a strong conclusion at the end.
        
        ABSOLUTE FORMATTING RULES:
        1. DO NOT say "Here is the post", "Hello", or use any chat introductions.
        2. DO NOT use Markdown formatting (\`\`\`html).
        3. Return ONLY valid HTML tags (<h2>, <h3>, <p>, <ul>, <li>, <strong>).
        4. DO NOT include <html>, <head>, or <body> tags. Only the inner body content.
        5. The HTML must be compatible for direct injection into React-Quill.`;
    }
  },

  getUserPrompt(language: string) {
    if (language === 'en') return 'Write the main text with high quality and depth.';
    if (language === 'es') return 'Escriba el texto principal con alta calidad y profundidad.';
    if (language === 'pt') return 'Desenvolva o texto principal com alta qualidade e profundidade.';

    return 'Write the main text with high quality and depth.';
  },

  handleContent(content: string | undefined | null, language: string) {
    if (content) return content;
    if (language === 'pt') return 'Não informado';
    if (language === 'es') return 'No informado';
    return 'Not Informed';
  },


  // Styling
  buildStylingSystemPrompt: (language: SupportedLanguage): string => {
    const commonRules = `Sua ÚNICA função é atuar como um injetor de Tailwind CSS. 
Você receberá um HTML bruto. Você DEVE modificar as tags HTML (como <h2>, <p>, <ul>) adicionando o atributo "class" com utilitários do Tailwind.

REGRAS ABSOLUTAS:
1. INJETE CLASSES: Modifique as tags HTML. (Ex: mude <p> para <p class="text-gray-700 leading-relaxed mb-4">).
2. PRESERVE O TEXTO: Nunca altere, traduza ou resuma o conteúdo de texto dentro das tags.
3. SEM MARKDOWN: Não envolva a resposta em \`\`\`html. Devolva apenas o código começando com a primeira tag.
4. SEM ESTRUTURA BASE: Não adicione <html>, <head> ou <body>.
5. DESIGN: Crie um visual de blog limpo (textos cinza-escuro, títulos em negrito com margem superior, listas bem espaçadas).

EXEMPLO DE ENTRADA:
<h2>Introdução</h2>
<p>Este é um texto com <strong>destaque</strong>.</p>

EXEMPLO DE SAÍDA ESPERADA:
<h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Introdução</h2>
<p class="text-base text-gray-700 leading-relaxed mb-4">Este é um texto com <strong class="font-semibold text-indigo-600">destaque</strong>.</p>`;

    switch (language) {
      case 'pt':
        return `Você é um Engenheiro Front-end especialista em Tailwind CSS.\n\n${commonRules}`;
      case 'es':
        return `Eres un Ingeniero Front-end experto en Tailwind CSS.\n\n${commonRules}`;
      case 'en':
      default:
        return `You are a Frontend Engineer expert in Tailwind CSS.\n\n${commonRules}`;
    }
  },

  getStylingUserPrompt(htmlContent: string, language: SupportedLanguage): string {
    const instruction = language === 'pt'
      ? 'Reescreva o HTML abaixo injetando as classes Tailwind nas tags:'
      : language === 'es'
        ? 'Reescribe el HTML a continuación inyectando las clases Tailwind en las etiquetas:'
        : 'Rewrite the HTML below by injecting Tailwind classes into the tags:';

    return `${instruction}\n\n${htmlContent}`;
  }
};