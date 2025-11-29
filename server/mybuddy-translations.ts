// MyBuddy translations for different languages
export function getMyBuddyTranslation(key: string, language: string): string {
  const translations: Record<string, Record<string, string>> = {
    en_IN: {
      "greeting": "Hello! I'm MyBuddy, your safety companion. How can I help you today?",
      "support_calm": "Take a deep breath. You're safe. I'm here with you.",
      "medical_emergency": "This sounds serious. Please call 112 (Emergency) immediately. I can provide first aid guidance while you wait.",
      "emotional_support": "I understand you're stressed. Let's work through this together. Would you like breathing exercises?",
      "help_available": "Help is on the way. Your guardians have been notified of your location.",
    },
    hi_IN: {
      "greeting": "नमस्ते! मैं MyBuddy हूँ, आपका सुरक्षा साथी। मैं आपकी कैसे मदद कर सकता हूँ?",
      "support_calm": "गहरी सांस लें। आप सुरक्षित हैं। मैं आपके साथ हूँ।",
      "medical_emergency": "यह गंभीर लगता है। कृपया तुरंत 112 (आपातकालीन) पर कॉल करें। मैं आपके इंतज़ार के दौरान प्राथमिक चिकित्सा निर्देश दे सकता हूँ।",
      "emotional_support": "मैं समझता हूँ कि आप तनावग्रस्त हैं। आइए इसे एक साथ हल करें। क्या आप सांस लेने के व्यायाम करना चाहेंगे?",
      "help_available": "मदद आ रही है। आपके अभिभावकों को आपके स्थान की सूचना दी गई है।",
    },
    ta_IN: {
      "greeting": "வணக்கம்! நான் MyBuddy, உங்கள் பாதுகாப்பு உதவியாளர். இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?",
      "support_calm": "ஆழ்ந்த சுவாசம் எடுங்கள். நீங்கள் பாதுகாப்பாக இருக்கிறீர்கள். நான் உங்களுடன் இருக்கிறேன்.",
      "medical_emergency": "இது கடுமையாக தெரிகிறது. தயவுசெய்து உடனடியாக 112 (அவசரம்) எண்ணிற்கு அழையுங்கள்.",
      "emotional_support": "நீங்கள் அழுத்தத்தில் இருக்கிறீர்கள் என்பதை நான் புரிந்துகொள்கிறேன். இதை ஒன்றாக தீர்க்கலாம்.",
      "help_available": "உதவி வருகிறது. உங்கள் பாதுகாவலர்களுக்கு உங்கள் இருப்பிடம் அறிவிக்கப்பட்டுள்ளது.",
    }
  };

  const langTranslations = translations[language] || translations.en_IN;
  return langTranslations[key] || key;
}

export function translateMedicalAdvice(advice: string, language: string): string {
  if (language === "en_IN") return advice;
  
  // For other languages, keep English for now as medical terminology is complex
  // In production, use a translation service
  return advice;
}
