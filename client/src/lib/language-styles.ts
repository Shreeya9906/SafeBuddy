export interface LanguageStyle {
  fontFamily: string;
  backgroundColor: string;
  defaultBgColor: string;
}

export const LANGUAGE_STYLES: Record<string, LanguageStyle> = {
  en_IN: {
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    backgroundColor: 'bg-white',
    defaultBgColor: 'white',
  },
  hi_IN: {
    fontFamily: 'Mangal, "Noto Sans Devanagari", Arial, sans-serif',
    backgroundColor: 'bg-amber-50',
    defaultBgColor: '#fffbf0',
  },
  ta_IN: {
    fontFamily: 'TAMu_Kadam, "Noto Sans Tamil", Arial, sans-serif',
    backgroundColor: 'bg-blue-50',
    defaultBgColor: '#f0f9ff',
  },
  te_IN: {
    fontFamily: '"Noto Sans Telugu", Arial, sans-serif',
    backgroundColor: 'bg-green-50',
    defaultBgColor: '#f0fdf4',
  },
  ml_IN: {
    fontFamily: '"Noto Sans Malayalam", Arial, sans-serif',
    backgroundColor: 'bg-purple-50',
    defaultBgColor: '#faf5ff',
  },
  kn_IN: {
    fontFamily: '"Noto Sans Kannada", Arial, sans-serif',
    backgroundColor: 'bg-pink-50',
    defaultBgColor: '#fdf2f8',
  },
  mr_IN: {
    fontFamily: '"Noto Sans Devanagari", Arial, sans-serif',
    backgroundColor: 'bg-orange-50',
    defaultBgColor: '#fff7ed',
  },
  gu_IN: {
    fontFamily: '"Noto Sans Gujarati", Arial, sans-serif',
    backgroundColor: 'bg-red-50',
    defaultBgColor: '#fef2f2',
  },
  pa_IN: {
    fontFamily: '"Noto Sans Gurmukhi", Arial, sans-serif',
    backgroundColor: 'bg-yellow-50',
    defaultBgColor: '#fefce8',
  },
  bn_IN: {
    fontFamily: '"Noto Sans Bengali", Arial, sans-serif',
    backgroundColor: 'bg-cyan-50',
    defaultBgColor: '#f0fdfa',
  },
  or_IN: {
    fontFamily: '"Noto Sans Odia", Arial, sans-serif',
    backgroundColor: 'bg-indigo-50',
    defaultBgColor: '#f0f4ff',
  },
  as_IN: {
    fontFamily: '"Noto Sans Bengali", Arial, sans-serif',
    backgroundColor: 'bg-lime-50',
    defaultBgColor: '#f7fee7',
  },
  ur_IN: {
    fontFamily: '"Noto Sans Arabic", Arial, sans-serif',
    backgroundColor: 'bg-rose-50',
    defaultBgColor: '#ffe4e6',
  },
};

export function getLanguageStyle(languageCode: string): LanguageStyle {
  return LANGUAGE_STYLES[languageCode] || LANGUAGE_STYLES.en_IN;
}

export function applyLanguageStyles(languageCode: string, backgroundColor?: string) {
  const style = getLanguageStyle(languageCode);
  const root = document.documentElement;
  
  // Apply font family
  root.style.fontFamily = style.fontFamily;
  document.body.style.fontFamily = style.fontFamily;
  
  // Apply background color
  const bgColor = backgroundColor || style.defaultBgColor;
  document.body.style.backgroundColor = bgColor;
  
  // Apply to all text elements for better coverage
  const styleElement = document.getElementById('language-style') || document.createElement('style');
  styleElement.id = 'language-style';
  styleElement.textContent = `
    * {
      font-family: ${style.fontFamily};
    }
    html, body {
      background-color: ${bgColor};
    }
  `;
  if (!document.head.contains(styleElement)) {
    document.head.appendChild(styleElement);
  }
}
