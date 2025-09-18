import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Package, 
  Users, 
  Truck, 
  Warehouse, 
  FileText, 
  PieChart,
  LogOut
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Items", href: "/items", icon: Package },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Vendors", href: "/vendors", icon: Truck },
  { name: "Inventory", href: "/inventory", icon: Warehouse },
  { name: "GST Billing", href: "/billing", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: PieChart },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();

  const handleNavigation = (href: string) => {
    setLocation(href);
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border custom-scrollbar overflow-y-auto" data-testid="sidebar">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="bg-primary text-primary-foreground w-10 h-10 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg" data-testid="app-name">SimplERP</h2>
            <p className="text-xs text-muted-foreground">Business Management</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Button
              key={item.name}
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-start space-x-3 ${
                isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
              }`}
              onClick={() => handleNavigation(item.href)}
              data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Button>
          );
        })}
      </nav>
      
      <div className="absolute bottom-4 left-4 right-4">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start space-x-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
          data-testid="button-logout"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
}
