interface TaxonomyOption {
  id: string;
  name: string;
}

interface TaxonomyTranslation {
  language: string;
  name: string;
  slug: string;
}

interface TaxonomyItem {
  id: string;
  translations?: TaxonomyTranslation[];
}

interface TaxonomyFormData {
  pt: string;
  en: string;
  es: string;
}
