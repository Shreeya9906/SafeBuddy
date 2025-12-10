/**
 * Smart autocorrect for emergency texts
 * Fixes common typos and grammar mistakes during emergencies
 */

interface DictionaryEntry {
  correct: string;
  alternatives: string[];
}

const EMERGENCY_DICTIONARY: Record<string, DictionaryEntry> = {
  "hep": { correct: "help", alternatives: ["hep", "hlp", "help"] },
  "plese": { correct: "please", alternatives: ["plese", "pls", "plz"] },
  "asap": { correct: "emergency", alternatives: ["asap", "urgent", "emergency"] },
  "hurry": { correct: "hurry", alternatives: ["hurry", "hurrey", "hury"] },
  "bleding": { correct: "bleeding", alternatives: ["bleding", "bleeding", "bleding"] },
  "breth": { correct: "breath", alternatives: ["breth", "breathe", "breath"] },
  "choking": { correct: "choking", alternatives: ["choking", "chocking", "choking"] },
  "burning": { correct: "burning", alternatives: ["burning", "burninng", "burning"] },
  "painn": { correct: "pain", alternatives: ["painn", "pain", "pan"] },
  "fevr": { correct: "fever", alternatives: ["fevr", "fever", "fvr"] },
  "sick": { correct: "sick", alternatives: ["sick", "sik", "sik"] },
  "poison": { correct: "poison", alternatives: ["poison", "posion", "poisen"] },
  "drowning": { correct: "drowning", alternatives: ["drowning", "drowing", "drowning"] },
  "unconcious": { correct: "unconscious", alternatives: ["unconcious", "unconscious", "uncouncious"] },
  "seizing": { correct: "seizure", alternatives: ["seizing", "seizure", "seizure"] },
  "atack": { correct: "attack", alternatives: ["atack", "attack", "attck"] },
  "lost": { correct: "lost", alternatives: ["lost", "lst", "lose"] },
  "trapped": { correct: "trapped", alternatives: ["trapped", "traped", "trapped"] },
  "crushed": { correct: "crushed", alternatives: ["crushed", "crused", "crushed"] },
  "electrocuted": { correct: "electrocuted", alternatives: ["electrocuted", "electruted", "electrocuted"] },
};

const COMMON_TYPOS: Record<string, string> = {
  "teh": "the",
  "adn": "and",
  "recieve": "receive",
  "occured": "occurred",
  "seperate": "separate",
  "thier": "their",
  "wrld": "world",
  "ur": "your",
  "u": "you",
  "im": "I'm",
  "dont": "don't",
  "wont": "won't",
  "shes": "she's",
  "hes": "he's",
  "theres": "there's",
  // Only correct obvious typos, not contractions
  // "cant" is removed - "can't" is a valid contraction
};

/**
 * Calculate Levenshtein distance between two strings
 * Used to find closest match for typos
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Find closest match in dictionary for a word
 */
function findClosestMatch(word: string, candidates: string[]): string | null {
  if (candidates.length === 0) return null;

  const distances = candidates.map(candidate => ({
    candidate,
    distance: levenshteinDistance(word.toLowerCase(), candidate.toLowerCase()),
  }));

  distances.sort((a, b) => a.distance - b.distance);

  // Return match only if distance is small (< 3 characters difference)
  if (distances[0].distance <= 2) {
    return distances[0].candidate;
  }

  return null;
}

/**
 * Autocorrect a single word
 * Only corrects obvious typos (1-2 character differences)
 */
function autocorrectWord(word: string): string {
  const lowerWord = word.toLowerCase();

  // Check exact matches in common typos (only exact matches, no fuzzy)
  if (COMMON_TYPOS[lowerWord]) {
    return COMMON_TYPOS[lowerWord];
  }

  // Check emergency dictionary (exact match only for safety)
  if (EMERGENCY_DICTIONARY[lowerWord]) {
    return EMERGENCY_DICTIONARY[lowerWord].correct;
  }

  // DISABLED: Fuzzy matching causes false corrections in normal conversation
  // Only use exact matches to avoid changing correctly spelled words
  // The emergency keywords detection at message level is sufficient
  // to identify emergency situations without word-level fuzzy matching

  return word;
}

/**
 * Autocorrect an entire message
 * Preserves capitalization where appropriate
 */
export function autocorrectMessage(message: string): string {
  if (!message || message.length === 0) return message;

  const words = message.split(/\s+/);
  const corrected = words.map(word => {
    // Extract actual word and punctuation
    const match = word.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9]+)([^a-zA-Z0-9]*)$/);

    if (!match) return word;

    const [, prefix, actualWord, suffix] = match;
    const correctedWord = autocorrectWord(actualWord);

    // Preserve capitalization if original was capitalized
    if (actualWord.length > 0 && actualWord[0] === actualWord[0].toUpperCase()) {
      return (
        prefix +
        correctedWord.charAt(0).toUpperCase() +
        correctedWord.slice(1) +
        suffix
      );
    }

    return prefix + correctedWord + suffix;
  });

  return corrected.join(" ");
}

/**
 * Check if a message contains emergency keywords
 */
export function detectEmergency(message: string): boolean {
  const emergencyKeywords = [
    "help", "emergency", "urgent", "pain", "bleeding", "accident",
    "choking", "drowning", "fire", "attack", "poisoning", "unconscious",
    "seizure", "shock", "burn", "crushing", "trapped", "lost",
    "danger", "scared", "hurt", "injured", "assault",
  ];

  const lowerMessage = message.toLowerCase();
  return emergencyKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Process user input - autocorrect and return processed message
 */
export function processUserInput(message: string): {
  original: string;
  corrected: string;
  hasChanges: boolean;
  isEmergency: boolean;
} {
  const corrected = autocorrectMessage(message);
  const isEmergency = detectEmergency(corrected);

  return {
    original: message,
    corrected,
    hasChanges: corrected !== message,
    isEmergency,
  };
}
