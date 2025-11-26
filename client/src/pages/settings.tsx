import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { userAPI, guardianAPI } from "@/lib/api";
import { INDIAN_LANGUAGES } from "@/lib/languages";
import { applyLanguageStyles, LANGUAGE_STYLES } from "@/lib/language-styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Settings, User, Bell, Palette, Volume2, Users, Plus, Trash2, Loader2, MessageCircle, Phone, Type, Palette as PaletteIcon, PhoneCall, Video } from "lucide-react";
import { openWhatsAppCall, openPhoneCall, openWhatsAppVoiceCall, openWhatsAppVideoCall } from "@/lib/whatsapp";
import type { Guardian } from "@shared/schema";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [isAddGuardianOpen, setIsAddGuardianOpen] = useState(false);
  const [newGuardian, setNewGuardian] = useState({
    name: "",
    phone: "",
    email: "",
    relationship: "",
  });

  const [settings, setSettings] = useState({
    language: user?.language || "en_IN",
    theme: user?.theme || "light",
    fontSize: user?.fontSize || "medium",
    backgroundColor: user?.backgroundColor || "bg-white",
    voiceEnabled: user?.voiceEnabled ?? true,
    ttsEnabled: user?.ttsEnabled ?? true,
    mybuddyEnabled: user?.mybuddyEnabled ?? true,
    mybuddyFrequency: user?.mybuddyFrequency || 120,
  });

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [settings.theme]);

  useEffect(() => {
    applyLanguageStyles(settings.language, settings.backgroundColor);
  }, [settings.language, settings.backgroundColor]);

  useEffect(() => {
    const root = document.documentElement;
    let fontSize = "16px";
    if (settings.fontSize === "small") fontSize = "12px";
    else if (settings.fontSize === "medium") fontSize = "16px";
    else if (settings.fontSize === "large") fontSize = "18px";
    else if (settings.fontSize === "xlarge") fontSize = "20px";
    
    root.style.fontSize = fontSize;
  }, [settings.fontSize]);

  useEffect(() => {
    loadGuardians();
  }, []);

  const loadGuardians = async () => {
    try {
      const data = await guardianAPI.getAll();
      setGuardians(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      await userAPI.updateProfile(settings);
      applyLanguageStyles(settings.language, settings.backgroundColor);
      await refreshUser();
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated.",
      });
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

  const handleLanguageChange = (newLanguage: string) => {
    setSettings({ ...settings, language: newLanguage });
    applyLanguageStyles(newLanguage, settings.backgroundColor);
  };

  const handleBackgroundColorChange = (newColor: string) => {
    setSettings({ ...settings, backgroundColor: newColor });
    applyLanguageStyles(settings.language, newColor);
  };

  const handleAddGuardian = async () => {
    if (!newGuardian.name || !newGuardian.phone) {
      toast({
        title: "Error",
        description: "Name and phone number are required",
        variant: "destructive",
      });
      return;
    }

    try {
      await guardianAPI.create(newGuardian);
      await loadGuardians();
      setIsAddGuardianOpen(false);
      setNewGuardian({ name: "", phone: "", email: "", relationship: "" });
      toast({
        title: "Guardian Added",
        description: `${newGuardian.name} has been added to your emergency contacts.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteGuardian = async (id: string, name: string) => {
    try {
      await guardianAPI.delete(id);
      await loadGuardians();
      toast({
        title: "Guardian Removed",
        description: `${name} has been removed from your emergency contacts.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="w-8 h-8" />
          Settings
        </h2>
        <p className="text-muted-foreground">Manage your SafeBuddy preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="language">Language</Label>
            <Select
              value={settings.language}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger id="language" data-testid="select-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INDIAN_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">✨ Font & background change instantly</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="fontSize">Font Size</Label>
            <Select
              value={settings.fontSize}
              onValueChange={(value) => setSettings({ ...settings, fontSize: value })}
            >
              <SelectTrigger id="fontSize" data-testid="select-font-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
                <SelectItem value="xlarge">Extra Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Voice & Audio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Voice Commands</Label>
              <p className="text-sm text-muted-foreground">Enable voice recognition</p>
            </div>
            <Switch
              checked={settings.voiceEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, voiceEnabled: checked })}
              data-testid="switch-voice-enabled"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Text-to-Speech</Label>
              <p className="text-sm text-muted-foreground">Enable voice responses</p>
            </div>
            <Switch
              checked={settings.ttsEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, ttsEnabled: checked })}
              data-testid="switch-tts-enabled"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>MyBuddy Assistant</Label>
              <p className="text-sm text-muted-foreground">Enable AI safety assistant</p>
            </div>
            <Switch
              checked={settings.mybuddyEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, mybuddyEnabled: checked })}
              data-testid="switch-mybuddy-enabled"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Theme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSettings({ ...settings, theme: "light" })}
              className={`p-4 rounded-lg border-2 transition-all ${
                settings.theme === "light"
                  ? "border-primary bg-white"
                  : "border-gray-300"
              }`}
              data-testid="button-theme-light"
            >
              <div className="text-2xl mb-2">☀️</div>
              <p className="font-medium">Light Mode</p>
            </button>
            <button
              onClick={() => setSettings({ ...settings, theme: "dark" })}
              className={`p-4 rounded-lg border-2 transition-all ${
                settings.theme === "dark"
                  ? "border-primary bg-gray-900"
                  : "border-gray-300"
              }`}
              data-testid="button-theme-dark"
            >
              <div className="text-2xl mb-2">🌙</div>
              <p className="font-medium text-white">Dark Mode</p>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Font Size
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={settings.fontSize}
            onValueChange={(value) => setSettings({ ...settings, fontSize: value })}
          >
            <SelectTrigger data-testid="select-font-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small (12px)</SelectItem>
              <SelectItem value="medium">Medium (16px)</SelectItem>
              <SelectItem value="large">Large (18px)</SelectItem>
              <SelectItem value="xlarge">Extra Large (20px)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PaletteIcon className="w-5 h-5" />
            Background Color
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {[
              { name: "White", value: "white" },
              { name: "Light Blue", value: "#f0f9ff" },
              { name: "Light Green", value: "#f0fdf4" },
              { name: "Light Yellow", value: "#fefce8" },
              { name: "Light Pink", value: "#fdf2f8" },
              { name: "Light Purple", value: "#faf5ff" },
              { name: "Dark", value: "#111827" },
              { name: "Dark Blue", value: "#001f3f" },
            ].map((color) => (
              <button
                key={color.value}
                onClick={() => handleBackgroundColorChange(color.value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  settings.backgroundColor === color.value
                    ? "border-primary scale-105"
                    : "border-gray-300"
                }`}
                style={{ backgroundColor: color.value }}
                data-testid={`button-color-${color.value}`}
                title={color.name}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Emergency Guardians
              </CardTitle>
              <CardDescription>People who will be notified during emergencies</CardDescription>
            </div>
            <Dialog open={isAddGuardianOpen} onOpenChange={setIsAddGuardianOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-guardian">
                  <Plus className="mr-2 w-4 h-4" />
                  Add Guardian
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Emergency Guardian</DialogTitle>
                  <DialogDescription>
                    Add someone who will be notified when you activate SOS.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="guardianName">Name *</Label>
                    <Input
                      id="guardianName"
                      placeholder="Full name"
                      value={newGuardian.name}
                      onChange={(e) => setNewGuardian({ ...newGuardian, name: e.target.value })}
                      data-testid="input-guardian-name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="guardianPhone">Phone *</Label>
                    <Input
                      id="guardianPhone"
                      placeholder="+91 1234567890"
                      value={newGuardian.phone}
                      onChange={(e) => setNewGuardian({ ...newGuardian, phone: e.target.value })}
                      data-testid="input-guardian-phone"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="guardianEmail">Email (optional)</Label>
                    <Input
                      id="guardianEmail"
                      type="email"
                      placeholder="email@example.com"
                      value={newGuardian.email}
                      onChange={(e) => setNewGuardian({ ...newGuardian, email: e.target.value })}
                      data-testid="input-guardian-email"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="guardianRelationship">Relationship</Label>
                    <Input
                      id="guardianRelationship"
                      placeholder="e.g., Parent, Spouse, Friend"
                      value={newGuardian.relationship}
                      onChange={(e) => setNewGuardian({ ...newGuardian, relationship: e.target.value })}
                      data-testid="input-guardian-relationship"
                    />
                  </div>
                  <Button onClick={handleAddGuardian} className="w-full" data-testid="button-save-guardian">
                    Add Guardian
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {guardians.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No guardians added yet. Add your first emergency contact above.
            </p>
          ) : (
            <div className="space-y-3">
              {guardians.map((guardian) => (
                <div
                  key={guardian.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`guardian-${guardian.id}`}
                >
                  <div>
                    <p className="font-medium">{guardian.name}</p>
                    <p className="text-sm text-muted-foreground">{guardian.phone}</p>
                    {guardian.relationship && (
                      <p className="text-xs text-muted-foreground">{guardian.relationship}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openPhoneCall(guardian.phone)}
                    data-testid={`button-call-${guardian.id}`}
                    title="Phone Call"
                  >
                    <Phone className="w-4 h-4 text-blue-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openWhatsAppVoiceCall(guardian.phone)}
                    data-testid={`button-whatsapp-call-${guardian.id}`}
                    title="WhatsApp Voice Call"
                  >
                    <PhoneCall className="w-4 h-4 text-green-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openWhatsAppVideoCall(guardian.phone)}
                    data-testid={`button-whatsapp-video-${guardian.id}`}
                    title="WhatsApp Video Call"
                  >
                    <Video className="w-4 h-4 text-purple-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openWhatsAppCall(guardian.phone)}
                    data-testid={`button-whatsapp-message-${guardian.id}`}
                    title="WhatsApp Message"
                  >
                    <MessageCircle className="w-4 h-4 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteGuardian(guardian.id, guardian.name)}
                    data-testid={`button-delete-guardian-${guardian.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          disabled={isLoading}
          size="lg"
          data-testid="button-save-settings"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </div>
    </div>
  );
}
