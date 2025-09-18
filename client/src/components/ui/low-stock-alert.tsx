import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, ArrowRight } from "lucide-react";
import type { ItemWithInventory } from "@shared/schema";

interface LowStockAlertProps {
  items: ItemWithInventory[];
  className?: string;
}

export default function LowStockAlert({ items, className }: LowStockAlertProps) {
  if (items.length === 0) return null;

  const handleViewInventory = () => {
    window.location.href = "/inventory";
  };

  return (
    <Card className={`border-destructive/20 bg-destructive/10 ${className}`} data-testid="low-stock-alert">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-3 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          <span>Low Stock Alerts</span>
          <Badge variant="destructive" className="text-xs" data-testid="low-stock-count">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {items.slice(0, 6).map((item) => (
            <div 
              key={item.id} 
              className="bg-card border border-border rounded-lg p-3 hover:shadow-sm transition-shadow"
              data-testid={`low-stock-item-${item.code}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" data-testid={`item-name-${item.code}`}>
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono" data-testid={`item-code-${item.code}`}>
                    {item.code}
                  </p>
                </div>
                <Package className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
              </div>
              
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {item.category}
                </Badge>
                <div className="text-right">
                  <p className="text-destructive font-semibold text-sm" data-testid={`stock-level-${item.code}`}>
                    {item.currentStock} left
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Min: {item.lowStockThreshold}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length > 6 && (
          <div className="text-center text-sm text-muted-foreground mb-3">
            and {items.length - 6} more items with low stock
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <p className="text-sm text-muted-foreground">
            These items need immediate attention to avoid stockouts
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleViewInventory}
            className="flex items-center space-x-2"
            data-testid="button-view-inventory"
          >
            <span>View Inventory</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
