import { useState, useEffect } from "react";
import { complaintAPI } from "@/lib/api";
import { getCurrentLocation } from "@/lib/geolocation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, MapPin, Calendar, Plus, Loader2 } from "lucide-react";
import type { PoliceComplaint } from "@shared/schema";

export default function ComplaintPage() {
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<PoliceComplaint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    complaintText: "",
    incidentDate: "",
    incidentLocation: "",
    category: "",
    witnesses: "",
  });

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const data = await complaintAPI.getAll();
      setComplaints(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!newComplaint.complaintText) {
      toast({
        title: "Error",
        description: "Please describe the incident",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let latitude, longitude;
      try {
        const location = await getCurrentLocation();
        latitude = location.latitude;
        longitude = location.longitude;
      } catch (e) {
        console.error("Could not get location:", e);
      }

      await complaintAPI.create({
        complaintText: newComplaint.complaintText,
        incidentDate: newComplaint.incidentDate ? new Date(newComplaint.incidentDate) : undefined,
        incidentLocation: newComplaint.incidentLocation,
        category: newComplaint.category,
        witnesses: newComplaint.witnesses,
        latitude,
        longitude,
        status: "draft",
      });

      await loadComplaints();
      setNewComplaint({
        complaintText: "",
        incidentDate: "",
        incidentLocation: "",
        category: "",
        witnesses: "",
      });

      toast({
        title: "Complaint Saved",
        description: "Your complaint has been saved as a draft.",
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

  const handleSubmitToPolice = async (complaintId: string) => {
    setIsLoading(true);
    try {
      const result = await complaintAPI.submitToPolice(complaintId);
      
      // Open WhatsApp with pre-filled message
      if (result.whatsappLink) {
        window.open(result.whatsappLink, "_blank");
      }

      await loadComplaints();
      
      toast({
        title: "✅ Complaint Ready",
        description: `WhatsApp opened with your complaint. Send it to your local police number.\nReference ID: ${result.referenceId}`,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-muted";
      case "filed":
        return "bg-blue-500";
      case "under_review":
        return "bg-yellow-500";
      case "resolved":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="w-8 h-8" />
          Police Complaint System
        </h2>
        <p className="text-muted-foreground">File and track police complaints</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            New Complaint
          </CardTitle>
          <CardDescription>Describe the incident in detail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="complaintText">Incident Description *</Label>
            <Textarea
              id="complaintText"
              placeholder="Describe what happened in detail..."
              value={newComplaint.complaintText}
              onChange={(e) => setNewComplaint({ ...newComplaint, complaintText: e.target.value })}
              rows={6}
              data-testid="textarea-complaint"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="incidentDate">Incident Date & Time</Label>
              <Input
                id="incidentDate"
                type="datetime-local"
                value={newComplaint.incidentDate}
                onChange={(e) => setNewComplaint({ ...newComplaint, incidentDate: e.target.value })}
                data-testid="input-incident-date"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="incidentLocation">Incident Location</Label>
              <Input
                id="incidentLocation"
                placeholder="Street, area, landmark..."
                value={newComplaint.incidentLocation}
                onChange={(e) => setNewComplaint({ ...newComplaint, incidentLocation: e.target.value })}
                data-testid="input-incident-location"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., Theft, Assault, Harassment"
                value={newComplaint.category}
                onChange={(e) => setNewComplaint({ ...newComplaint, category: e.target.value })}
                data-testid="input-category"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="witnesses">Witnesses</Label>
              <Input
                id="witnesses"
                placeholder="Names and contact info if any"
                value={newComplaint.witnesses}
                onChange={(e) => setNewComplaint({ ...newComplaint, witnesses: e.target.value })}
                data-testid="input-witnesses"
              />
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={isLoading} className="w-full" size="lg" data-testid="button-submit-complaint">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FileText className="mr-2 w-4 h-4" />
                Save Complaint
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Complaints</CardTitle>
          <CardDescription>Track your filed complaints</CardDescription>
        </CardHeader>
        <CardContent>
          {complaints.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No complaints filed yet.
            </p>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <Card key={complaint.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getStatusColor(complaint.status || "draft")}>
                            {(complaint.status || "draft").replace("_", " ").toUpperCase()}
                          </Badge>
                          {complaint.category && (
                            <Badge variant="outline">{complaint.category}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {complaint.complaintText}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                      {complaint.incidentDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(complaint.incidentDate).toLocaleDateString()}
                        </span>
                      )}
                      {complaint.incidentLocation && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {complaint.incidentLocation}
                        </span>
                      )}
                      <span className="ml-auto">
                        Filed: {new Date(complaint.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {complaint.status === "draft" && (
                      <Button
                        onClick={() => handleSubmitToPolice(complaint.id)}
                        disabled={isLoading}
                        className="w-full mt-3 bg-green-600 hover:bg-green-700"
                        size="sm"
                        data-testid="button-submit-to-police"
                      >
                        📱 Submit to Police via WhatsApp
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
