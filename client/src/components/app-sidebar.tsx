import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { guardianAPI } from "@/lib/api";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Shield,
  LayoutDashboard,
  Map,
  MessageCircle,
  Cloud,
  AlertTriangle,
  Activity,
  FileText,
  Heart,
  Settings,
  LogOut,
  Users,
  Zap,
  Phone,
  MessageCircle as WhatsApp,
} from "lucide-react";
import { openPhoneCall, openWhatsAppCall } from "@/lib/whatsapp";
import type { Guardian } from "@shared/schema";

const adultMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Map, label: "Live Map", path: "/map" },
  { icon: MessageCircle, label: "MyBuddy", path: "/mybuddy" },
  { icon: Cloud, label: "Weather Alerts", path: "/weather" },
  { icon: AlertTriangle, label: "Disaster Alerts", path: "/disasters" },
  { icon: Activity, label: "Health Monitor", path: "/health" },
  { icon: Users, label: "Family Monitoring", path: "/monitoring" },
  { icon: Zap, label: "Fall Detection", path: "/fall-detection" },
  { icon: FileText, label: "Police Complaint", path: "/complaint" },
  { icon: Heart, label: "Women Safety", path: "/women-safety" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const childMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Cloud, label: "Weather", path: "/weather" },
  { icon: AlertTriangle, label: "Disasters", path: "/disasters" },
  { icon: MessageCircle, label: "MyBuddy", path: "/mybuddy" },
  { icon: Map, label: "Location", path: "/map" },
  { icon: Heart, label: "Contacts", path: "/settings" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const elderMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Map, label: "Live Map", path: "/map" },
  { icon: MessageCircle, label: "MyBuddy", path: "/mybuddy" },
  { icon: Cloud, label: "Weather", path: "/weather" },
  { icon: AlertTriangle, label: "Disasters", path: "/disasters" },
  { icon: Zap, label: "Fall Detection", path: "/fall-detection" },
  { icon: Activity, label: "Health Monitor", path: "/health" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function AppSidebar() {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [guardians, setGuardians] = useState<Guardian[]>([]);

  useEffect(() => {
    loadGuardians();
  }, []);

  const loadGuardians = async () => {
    try {
      const data = await guardianAPI.getAll();
      setGuardians(data);
    } catch (error) {
      console.error("Error loading guardians:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getMenuItems = () => {
    if (user?.profileMode === "child") return childMenuItems;
    if (user?.profileMode === "elder") return elderMenuItems;
    return adultMenuItems;
  };

  const menuItems = getMenuItems();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-lg">SafeBuddy</h2>
            <p className="text-xs text-muted-foreground">{user?.profileMode === "child" ? "Child" : user?.profileMode === "elder" ? "Elder" : "Adult"}</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex flex-col">
        <div className="flex-1">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  onClick={() => navigate(item.path)}
                  isActive={location === item.path}
                  data-testid={`sidebar-${item.label.toLowerCase().replace(" ", "-")}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>

        {/* Emergency Contacts Section */}
        {guardians.length > 0 && (
          <div className="border-t border-sidebar-border p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground px-2 uppercase">Emergency Contacts</p>
            <div className="space-y-1">
              {guardians.slice(0, 3).map((guardian) => (
                <div key={guardian.id} className="p-2 bg-sidebar-accent rounded-lg space-y-1">
                  <p className="text-xs font-medium truncate">{guardian.name}</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openPhoneCall(guardian.phone)}
                      className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 rounded"
                      title="Call"
                      data-testid={`sidebar-call-${guardian.id}`}
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call</span>
                    </button>
                    <button
                      onClick={() => openWhatsAppCall(guardian.phone)}
                      className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 rounded"
                      title="WhatsApp"
                      data-testid={`sidebar-whatsapp-${guardian.id}`}
                    >
                      <WhatsApp className="w-3 h-3" />
                      <span>Chat</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="mb-3 px-2">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{user?.profileMode} Account</p>
        </div>
        <SidebarMenuButton
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
