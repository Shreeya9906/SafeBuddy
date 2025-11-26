// Voice Recognition and Text-to-Speech utilities

const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

export interface VoiceCommand {
  command: string;
  action: () => void;
  keywords: string[];
}

export class VoiceAssistant {
  private recognition: any;
  private isListening = false;
  private commands: Map<string, () => void> = new Map();
  private onTranscript?: (text: string) => void;

  constructor() {
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-IN';

      this.recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        this.onTranscript?.(transcript.toLowerCase());
        this.processCommand(transcript.toLowerCase());
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };
    }
  }

  startListening(onTranscript?: (text: string) => void) {
    if (!SpeechRecognition) {
      console.error('Speech Recognition not supported');
      return;
    }
    this.onTranscript = onTranscript;
    this.isListening = true;
    this.recognition.start();
  }

  stopListening() {
    this.isListening = false;
    this.recognition?.stop();
  }

  registerCommand(keywords: string[], action: () => void) {
    keywords.forEach(keyword => {
      this.commands.set(keyword.toLowerCase(), action);
    });
  }

  private processCommand(transcript: string) {
    const entries = Array.from(this.commands.entries());
    for (const [keyword, action] of entries) {
      if (transcript.includes(keyword)) {
        action();
        break;
      }
    }
  }

  isSupported(): boolean {
    return !!SpeechRecognition;
  }
}

export function speak(text: string, language: string = 'en-IN') {
  if (!window.speechSynthesis) {
    console.warn('Speech Synthesis not supported');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export const MULTILINGUAL_CONTENT = {
  en_IN: {
    greeting: 'Hello, I am SafeBuddy. How can I help you today?',
    commands: {
      sos: 'Activating emergency SOS. Emergency services have been notified.',
      call_guardian: 'Calling your guardian now.',
      weather: 'Fetching weather information.',
      health: 'Opening health monitoring.',
      first_aid: 'Let me guide you through first aid steps.',
      mybuddy: 'Starting mental health support conversation.',
    },
    firstAid: {
      choking: {
        title: 'Choking First Aid',
        steps: [
          'Encourage the person to cough forcefully',
          'If coughing doesnt work, perform the Heimlich maneuver',
          'Stand behind them and wrap your arms around their waist',
          'Make a fist and place it above the navel',
          'Thrust upward and inward quickly and firmly',
          'Repeat until the object is dislodged',
          'If unconscious, start CPR immediately',
        ],
      },
      bleeding: {
        title: 'Heavy Bleeding',
        steps: [
          'Call emergency services immediately',
          'Apply direct pressure with a clean cloth',
          'Keep pressure on the wound for 10-15 minutes',
          'If blood soaks through, do not remove the cloth, add another on top',
          'Elevate the injured area above heart level if possible',
          'Apply pressure to the artery if bleeding continues',
          'Apply a tourniquet above the wound if limb bleeding cannot be stopped',
          'Keep the victim calm and lying down',
        ],
      },
      heart_attack: {
        title: 'Heart Attack',
        steps: [
          'Call emergency services immediately',
          'Have the person sit down and rest',
          'Give aspirin if not allergic and conscious',
          'Loosen any tight clothing',
          'If person loses consciousness, start CPR',
          'Position the body on its back with head tilted',
          'Continue CPR until emergency services arrive',
        ],
      },
      burns: {
        title: 'Burns',
        steps: [
          'Stop the burning by removing source of heat',
          'Cool the burn with cool running water for 10-20 minutes',
          'Do not use ice directly on the burn',
          'Remove any jewelry or constrictive items',
          'Cover with a sterile, non-adhesive bandage',
          'Take over-the-counter pain reliever if available',
          'For severe burns, seek emergency medical care',
        ],
      },
    },
  },
  hi_IN: {
    greeting: 'नमस्ते, मैं SafeBuddy हूँ। मैं आपकी कैसे मदद कर सकता हूँ?',
    commands: {
      sos: 'आपातकालीन SOS सक्रिय किया जा रहा है। आपातकालीन सेवाओं को सूचित कर दिया गया है।',
      call_guardian: 'आपके अभिभावक को कॉल किया जा रहा है।',
      weather: 'मौसम की जानकारी प्राप्त की जा रही है।',
      health: 'स्वास्थ्य निगरानी खोली जा रही है।',
      first_aid: 'मुझे आपको प्राथमिक चिकित्सा के चरणों से गुजारने दें।',
      mybuddy: 'मानसिक स्वास्थ्य समर्थन शुरू किया जा रहा है।',
    },
    firstAid: {
      choking: {
        title: 'दम घुटना - प्राथमिक चिकित्सा',
        steps: [
          'व्यक्ति को जोर से खांसने के लिए कहें',
          'अगर खांसी काम न करे तो हीमलिक मैनूवर करें',
          'व्यक्ति के पीछे खड़े हो जाएं और कमर के चारों ओर बाहें लपेटें',
          'एक मुट्ठी बनाएं और नाभि से ऊपर रखें',
          'जल्दी से ऊपर और अंदर की ओर जोर से धक्का दें',
          'जब तक वस्तु निकल न जाए तब तक दोहराएं',
        ],
      },
    },
  },
  ta_IN: {
    greeting: 'வணக்கம், நான் SafeBuddy. நான் உங்களுக்கு எப்படி உதவ முடியும்?',
    commands: {
      sos: 'அவசர SOS இயக்கப்படுகிறது. அவசர சேவைகளுக்கு அறிவிக்கப்பட்டுள்ளது.',
      call_guardian: 'உங்கள் பாதுகாவலனுக்கு அழைப்பு செய்யப்படுகிறது.',
      weather: 'வானிலை தகவல் பெறப்படுகிறது.',
      health: 'சுகாதார கண்காணிப்பு திறக்கப்படுகிறது।',
      first_aid: 'முதல் உதவி படிகளை நான் உங்களுக்கு வழிநடத்த விடுங்கள்.',
      mybuddy: 'மानसிக சுகாதார ஆதரவு தொடங்கப்பட்டுள்ளது.',
    },
  },
};

export function getFirstAidSteps(condition: string, language: string = 'en_IN') {
  const content = MULTILINGUAL_CONTENT[language as keyof typeof MULTILINGUAL_CONTENT];
  if (!content) return null;
  const firstAid = (content as any).firstAid || {};
  return firstAid[condition] || null;
}
