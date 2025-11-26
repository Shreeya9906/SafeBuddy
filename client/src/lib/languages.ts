export interface Language {
  code: string;
  name: string;
  nativeName: string;
  speechCode: string;
}

export const INDIAN_LANGUAGES: Language[] = [
  { code: 'en_IN', name: 'English', nativeName: 'English', speechCode: 'en-IN' },
  { code: 'hi_IN', name: 'Hindi', nativeName: 'हिन्दी', speechCode: 'hi-IN' },
  { code: 'ta_IN', name: 'Tamil', nativeName: 'தமிழ்', speechCode: 'ta-IN' },
  { code: 'te_IN', name: 'Telugu', nativeName: 'తెలుగు', speechCode: 'te-IN' },
  { code: 'ml_IN', name: 'Malayalam', nativeName: 'മലയാളം', speechCode: 'ml-IN' },
  { code: 'kn_IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', speechCode: 'kn-IN' },
  { code: 'mr_IN', name: 'Marathi', nativeName: 'मराठी', speechCode: 'mr-IN' },
  { code: 'gu_IN', name: 'Gujarati', nativeName: 'ગુજરાતી', speechCode: 'gu-IN' },
  { code: 'pa_IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', speechCode: 'pa-IN' },
  { code: 'bn_IN', name: 'Bengali', nativeName: 'বাংলা', speechCode: 'bn-IN' },
  { code: 'or_IN', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', speechCode: 'or-IN' },
  { code: 'as_IN', name: 'Assamese', nativeName: 'অসমীয়া', speechCode: 'as-IN' },
  { code: 'ur_IN', name: 'Urdu', nativeName: 'اردو', speechCode: 'ur-IN' },
];

export function getLanguageByCode(code: string): Language | undefined {
  return INDIAN_LANGUAGES.find(lang => lang.code === code);
}

export function getSpeechCode(languageCode: string): string {
  const lang = getLanguageByCode(languageCode);
  return lang?.speechCode || 'en-IN';
}
