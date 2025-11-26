import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { VoiceAssistant, speak, MULTILINGUAL_CONTENT } from "@/lib/voice";
import { useToast } from "@/hooks/use-toast";

interface VoiceAssistantProps {
  onCommand: (command: string) => void;
  language?: string;
}

export function VoiceAssistantComponent({ onCommand, language = "en_IN" }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [assistant, setAssistant] = useState<VoiceAssistant | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const voiceAssistant = new VoiceAssistant();
    
    // Register commands
    voiceAssistant.registerCommand(["call guardian", "call my guardian"], () => {
      onCommand("call_guardian");
      speak(MULTILINGUAL_CONTENT[language as keyof typeof MULTILINGUAL_CONTENT]?.commands?.call_guardian || "Calling your guardian", language);
    });

    voiceAssistant.registerCommand(["sos", "emergency", "help", "call police"], () => {
      onCommand("sos");
      speak(MULTILINGUAL_CONTENT[language as keyof typeof MULTILINGUAL_CONTENT]?.commands?.sos || "Activating emergency SOS", language);
    });

    voiceAssistant.registerCommand(["weather", "weather check"], () => {
      onCommand("weather");
      speak(MULTILINGUAL_CONTENT[language as keyof typeof MULTILINGUAL_CONTENT]?.commands?.weather || "Fetching weather", language);
    });

    voiceAssistant.registerCommand(["health", "health check"], () => {
      onCommand("health");
      speak(MULTILINGUAL_CONTENT[language as keyof typeof MULTILINGUAL_CONTENT]?.commands?.health || "Opening health monitoring", language);
    });

    voiceAssistant.registerCommand(["first aid", "medical help", "emergency medical"], () => {
      onCommand("first_aid");
      speak("What type of first aid do you need?", language);
    });

    voiceAssistant.registerCommand(["mybuddy", "talk to mybuddy", "emotional support"], () => {
      onCommand("mybuddy");
      speak(MULTILINGUAL_CONTENT[language as keyof typeof MULTILINGUAL_CONTENT]?.commands?.mybuddy || "Starting mental health support", language);
    });

    voiceAssistant.registerCommand(["flashlight", "torch"], () => {
      onCommand("flashlight");
      speak("Turning on flashlight", language);
    });

    setAssistant(voiceAssistant);
  }, [language, onCommand]);

  const toggleListening = () => {
    if (!assistant) {
      toast({
        title: "Error",
        description: "Voice recognition not supported on your device",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      assistant.stopListening();
      setIsListening(false);
    } else {
      assistant.startListening((text) => {
        setTranscript(text);
      });
      setIsListening(true);
    }
  };

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Voice Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={toggleListening}
          className={`w-full h-12 text-base font-semibold ${isListening ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"}`}
          data-testid="button-voice-toggle"
        >
          {isListening ? (
            <>
              <MicOff className="mr-2 w-5 h-5" />
              Stop Listening
            </>
          ) : (
            <>
              <Mic className="mr-2 w-5 h-5" />
              Start Listening
            </>
          )}
        </Button>

        {transcript && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <p className="text-sm text-muted-foreground">You said:</p>
            <p className="font-medium">{transcript}</p>
          </div>
        )}

        <Button
          onClick={() => speak("Try saying: Call my guardian, Emergency SOS, Check weather, or Talk to MyBuddy", language)}
          variant="outline"
          className="w-full"
          data-testid="button-voice-commands"
        >
          <Volume2 className="mr-2 w-4 h-4" />
          Hear Commands
        </Button>
      </CardContent>
    </Card>
  );
}
