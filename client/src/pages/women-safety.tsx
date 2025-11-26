import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FakeCallModal } from "@/components/fake-call-modal";
import { getCurrentLocation } from "@/lib/geolocation";
import { useToast } from "@/hooks/use-toast";
import { Shield, Phone, Share2, MapPin, AlertTriangle } from "lucide-react";

const helplines = [
  { name: "Women Helpline", number: "1091", description: "24x7 Women's Safety Helpline" },
  { name: "Police Emergency", number: "100", description: "Emergency Police Response" },
  { name: "Ambulance", number: "108", description: "Emergency Medical Services" },
  { name: "National Emergency", number: "112", description: "Unified Emergency Number" },
  { name: "Child Helpline", number: "1098", description: "Child Protection Services" },
];

export default function WomenSafetyPage() {
  const { toast } = useToast();
  const [isFakeCallActive, setIsFakeCallActive] = useState(false);

  const handleShareLocation = async () => {
    try {
      const location = await getCurrentLocation();
      const shareText = `I need help! My location: https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      
      if (navigator.share) {
        await navigator.share({
          title: "Emergency Location",
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Location Copied",
          description: "Location link copied to clipboard. Share it with your contacts.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFakeCall = () => {
    setIsFakeCallActive(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-pink-600">
          <Shield className="w-8 h-8" />
          Women Safety Hub
        </h2>
        <p className="text-muted-foreground">Quick access to safety tools and helplines</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 border-pink-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Quick Share Location
            </CardTitle>
            <CardDescription>
              Instantly share your live location with emergency contacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleShareLocation} className="w-full" size="lg" data-testid="button-share-location">
              <MapPin className="mr-2 w-4 h-4" />
              Share My Location
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-pink-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Fake Call
            </CardTitle>
            <CardDescription>
              Trigger a fake incoming call to escape uncomfortable situations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleFakeCall} className="w-full" variant="outline" size="lg" data-testid="button-fake-call">
              <Phone className="mr-2 w-4 h-4" />
              Receive Fake Call
            </Button>
          </CardContent>
        </Card>
      </div>

      <FakeCallModal isOpen={isFakeCallActive} onClose={() => setIsFakeCallActive(false)} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Emergency Helplines
          </CardTitle>
          <CardDescription>Important numbers for immediate assistance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {helplines.map((helpline) => (
              <Card key={helpline.number} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{helpline.name}</p>
                      <p className="text-sm text-muted-foreground">{helpline.description}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => window.open(`tel:${helpline.number}`, '_self')}
                      data-testid={`button-call-${helpline.number}`}
                    >
                      <Phone className="mr-2 w-3 h-3" />
                      {helpline.number}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-pink-50 dark:bg-pink-950/20">
        <CardHeader>
          <CardTitle>Safety Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>• Always inform someone you trust about your whereabouts</li>
            <li>• Keep your phone charged and accessible</li>
            <li>• Trust your instincts - if something feels wrong, take action</li>
            <li>• Save emergency contacts on speed dial</li>
            <li>• Use SafeBuddy's SOS feature when in danger</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
