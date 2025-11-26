import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { mybuddyAPI } from "@/lib/api";
import { speechService } from "@/lib/speech";
import { getSpeechCode } from "@/lib/languages";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Mic, MicOff, Send, Volume2, VolumeX, Loader2 } from "lucide-react";
import myBuddyAvatar from "@assets/generated_images/friendly_robot_helper_avatar_for_mybuddy_ai_assistant.png";
import type { MyBuddyLog } from "@shared/schema";

interface Message extends Omit<MyBuddyLog, 'userId'> {
  suggestions?: string[];
}

export default function MyBuddyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const speechCode = getSpeechCode(user?.language || "en_IN");
  const isVoiceSupported = speechService.isSupported();

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const logs = await mybuddyAPI.getLogs(20);
      setMessages(logs.reverse());
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessage: Partial<Message> = {
      message: messageText,
      response: "",
      messageType: "text",
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage as Message]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await mybuddyAPI.chat(messageText);
      
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = response;
        return newMessages;
      });

      if (user?.ttsEnabled && isVoiceSupported.synthesis) {
        await speakResponse(response.response);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const speakResponse = async (text: string) => {
    try {
      setIsSpeaking(true);
      await speechService.speak(text, speechCode);
    } catch (error) {
      console.error("TTS error:", error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const startListening = async () => {
    if (!isVoiceSupported.recognition) {
      toast({
        title: "Voice Recognition Not Supported",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsListening(true);
      const transcript = await speechService.startListening(speechCode);
      setInputMessage(transcript);
      await sendMessage(transcript);
    } catch (error: any) {
      toast({
        title: "Voice Recognition Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsListening(false);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    await sendMessage(suggestion);
  };

  const getSentimentColor = (sentiment?: string | null) => {
    switch (sentiment) {
      case "urgent":
        return "bg-destructive text-destructive-foreground";
      case "concerned":
        return "bg-warning text-warning-foreground";
      case "supportive":
        return "bg-safe text-safe-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-card border-b">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-4">
            <img src={myBuddyAvatar} alt="MyBuddy" className="w-16 h-16 rounded-full" />
            <div>
              <h2 className="text-2xl font-bold">MyBuddy Assistant</h2>
              <p className="text-sm text-muted-foreground">
                Your personal safety and emotional support companion
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto max-w-4xl h-full flex flex-col py-4">
          <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <Card className="border-2 border-dashed">
                  <CardHeader>
                    <CardTitle>Welcome to MyBuddy!</CardTitle>
                    <CardDescription>
                      I'm here to help keep you safe and provide emotional support.
                      You can talk to me about anything - if you're feeling unsafe,
                      unwell, or just need someone to talk to.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {[
                        "How are you?",
                        "I need help",
                        "I'm not feeling well",
                        "Tell me safety tips",
                      ].map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="outline"
                          onClick={() => handleSuggestionClick(suggestion)}
                          data-testid={`suggestion-${suggestion.toLowerCase().replace(/\s/g, "-")}`}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg max-w-[80%]">
                        <p>{msg.message}</p>
                      </div>
                    </div>
                    {msg.response && (
                      <div className="flex gap-3">
                        <img src={myBuddyAvatar} alt="MyBuddy" className="w-8 h-8 rounded-full flex-shrink-0" />
                        <div className="space-y-2 flex-1">
                          <div className="bg-muted px-4 py-2 rounded-lg">
                            <p>{msg.response}</p>
                          </div>
                          {msg.sentiment && (
                            <Badge className={getSentimentColor(msg.sentiment)}>
                              {msg.sentiment}
                            </Badge>
                          )}
                          {msg.suggestions && msg.suggestions.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {msg.suggestions.map((suggestion, i) => (
                                <Button
                                  key={i}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSuggestionClick(suggestion)}
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex gap-3">
                  <img src={myBuddyAvatar} alt="MyBuddy" className="w-8 h-8 rounded-full" />
                  <div className="bg-muted px-4 py-2 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="mt-4 flex gap-2">
            <Input
              placeholder="Type your message or use voice..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(inputMessage)}
              disabled={isLoading || isListening}
              data-testid="input-message"
            />
            {isVoiceSupported.recognition && (
              <Button
                variant="outline"
                size="icon"
                onClick={startListening}
                disabled={isLoading || isListening}
                data-testid="button-voice"
              >
                {isListening ? (
                  <MicOff className="w-4 h-4 animate-pulse text-destructive" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
            )}
            {isVoiceSupported.synthesis && isSpeaking && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => speechService.stopSpeaking()}
                data-testid="button-stop-speaking"
              >
                <VolumeX className="w-4 h-4" />
              </Button>
            )}
            <Button
              onClick={() => sendMessage(inputMessage)}
              disabled={!inputMessage.trim() || isLoading || isListening}
              data-testid="button-send"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
