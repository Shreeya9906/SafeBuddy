import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
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
} from "lucide-react";

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
      <SidebarContent>
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
