import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, X } from "lucide-react";

interface FakeCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FakeCallModal({ isOpen, onClose }: FakeCallModalProps) {
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setTimeElapsed(0);
      return;
    }

    // Auto-dismiss after 30 seconds
    const timeout = setTimeout(() => {
      onClose();
    }, 30000);

    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // Trigger vibration on open
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md rounded-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="flex flex-col items-center justify-center space-y-8 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Incoming Call</h2>
            <p className="text-lg text-muted-foreground">Mom</p>
            <p className="text-sm text-muted-foreground mt-2">{String(Math.floor(timeElapsed / 60)).padStart(2, '0')}:{String(timeElapsed % 60).padStart(2, '0')}</p>
          </div>

          <div className="flex gap-4">
            <Button
              size="lg"
              variant="destructive"
              onClick={onClose}
              className="w-16 h-16 rounded-full"
              data-testid="button-reject-call"
            >
              <X className="w-6 h-6" />
            </Button>
            <Button
              size="lg"
              className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700"
              onClick={onClose}
              data-testid="button-accept-call"
            >
              <Phone className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
