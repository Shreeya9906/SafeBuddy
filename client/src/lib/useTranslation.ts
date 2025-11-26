import { useAuth } from "./auth-context";
import { getTranslation, formatTranslation } from "./translations";

export function useTranslation() {
  const { user } = useAuth();
  const language = user?.language || "en_IN";

  const t = (key: string, values?: Record<string, string>): string => {
    if (values) {
      return formatTranslation(key, language, values);
    }
    return getTranslation(key, language);
  };

  return { t, language };
}
