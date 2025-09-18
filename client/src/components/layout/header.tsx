import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import type { User, ItemWithInventory } from "@shared/schema";

export default function Header() {
  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });

  const { data: lowStockItems = [] } = useQuery<ItemWithInventory[]>({
    queryKey: ['/api/inventory/low-stock'],
  });

  const getPageTitle = () => {
    const path = window.location.pathname;
    switch (path) {
      case '/':
        return { title: 'Dashboard', subtitle: 'Overview of your business metrics' };
      case '/items':
        return { title: 'Items Management', subtitle: 'Manage your product catalog' };
      case '/customers':
        return { title: 'Customer Management', subtitle: 'Manage your customer database' };
      case '/vendors':
        return { title: 'Vendor Management', subtitle: 'Manage your supplier network' };
      case '/inventory':
        return { title: 'Inventory Management', subtitle: 'Track and manage your stock levels' };
      case '/billing':
        return { title: 'GST Billing', subtitle: 'Generate GST compliant invoices' };
      case '/analytics':
        return { title: 'Analytics & Reports', subtitle: 'Business insights and performance metrics' };
      default:
        return { title: 'SimplERP', subtitle: 'Business Management System' };
    }
  };

  const { title, subtitle } = getPageTitle();

  return (
    <header className="bg-card border-b border-border px-6 py-4" data-testid="header">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="page-title">{title}</h1>
          <p className="text-muted-foreground" data-testid="page-subtitle">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Low Stock Alert */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm"
              className="p-2 hover:bg-accent rounded-lg transition-colors relative"
              title="Low Stock Notifications"
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5" />
              {lowStockItems.length > 0 && (
                <Badge 
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  data-testid="notification-badge"
                >
                  {lowStockItems.length}
                </Badge>
              )}
            </Button>
          </div>
          
          {/* User Info */}
          <div className="text-right">
            <p className="text-sm font-medium" data-testid="user-name">
              {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'User'}
            </p>
            <p className="text-xs text-muted-foreground" data-testid="user-role">
              {user?.role === 'admin' ? 'Administrator' : 'Sales Team'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
