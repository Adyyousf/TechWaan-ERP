import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import StockModal from "@/components/modals/stock-modal";
import LowStockAlert from "@/components/ui/low-stock-alert";
import { 
  Package, 
  Search, 
  Edit, 
  Plus, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  RotateCcw
} from "lucide-react";
import type { ItemWithInventory, StockMovement } from "@shared/schema";

interface InventoryWithItem {
  id: string;
  itemId: string;
  quantity: number;
  lastUpdated: string;
  item: {
    id: string;
    code: string;
    name: string;
    category: string;
    price: string;
    lowStockThreshold: number;
  };
}

interface StockMovementWithItem extends StockMovement {
  item: {
    id: string;
    code: string;
    name: string;
  };
}

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemWithInventory | null>(null);
  const [modalType, setModalType] = useState<'add' | 'update'>('add');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inventory = [], isLoading: inventoryLoading } = useQuery<InventoryWithItem[]>({
    queryKey: ['/api/inventory'],
  });

  const { data: lowStockItems = [], isLoading: lowStockLoading } = useQuery<ItemWithInventory[]>({
    queryKey: ['/api/inventory/low-stock'],
  });

  const { data: stockMovements = [], isLoading: movementsLoading } = useQuery<StockMovementWithItem[]>({
    queryKey: ['/api/stock-movements'],
  });

  const updateInventoryMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      await apiRequest('PATCH', `/api/inventory/${itemId}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stock-movements'] });
      toast({
        title: "Success",
        description: "Inventory updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update inventory",
        variant: "destructive",
      });
    },
  });

  const filteredInventory = inventory.filter(inv =>
    inv.item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddStock = () => {
    setSelectedItem(null);
    setModalType('add');
    setIsStockModalOpen(true);
  };

  const handleUpdateStock = (inventoryItem: InventoryWithItem) => {
    const itemWithInventory: ItemWithInventory = {
      ...inventoryItem.item,
      inventory: {
        id: inventoryItem.id,
        itemId: inventoryItem.itemId,
        quantity: inventoryItem.quantity,
        lastUpdated: inventoryItem.lastUpdated,
      },
      currentStock: inventoryItem.quantity,
      isLowStock: inventoryItem.quantity <= inventoryItem.item.lowStockThreshold,
    };
    setSelectedItem(itemWithInventory);
    setModalType('update');
    setIsStockModalOpen(true);
  };

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) return { status: 'out', color: 'text-red-600', bg: 'bg-red-500/10', icon: XCircle };
    if (quantity <= threshold) return { status: 'low', color: 'text-yellow-600', bg: 'bg-yellow-500/10', icon: AlertTriangle };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-500/10', icon: CheckCircle };
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'sale':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'adjustment':
        return <RotateCcw className="w-4 h-4 text-blue-500" />;
      default:
        return <Package className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'bg-green-500/10';
      case 'sale':
        return 'bg-red-500/10';
      case 'adjustment':
        return 'bg-blue-500/10';
      default:
        return 'bg-muted/20';
    }
  };

  const calculateTotalValue = () => {
    return inventory.reduce((total, inv) => {
      return total + (inv.quantity * parseFloat(inv.item.price));
    }, 0);
  };

  if (inventoryLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-2"></div>
          <div className="h-4 bg-muted rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6">
                <div className="h-6 bg-muted rounded mb-4"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="inventory-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="page-title">Inventory Management</h2>
          <p className="text-muted-foreground">Track and manage your stock levels</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={() => handleUpdateStock(inventory[0])}
            className="flex items-center space-x-2"
            disabled={inventory.length === 0}
            data-testid="button-update-stock"
          >
            <Edit className="w-4 h-4" />
            <span>Update Stock</span>
          </Button>
          <Button
            onClick={handleAddStock}
            className="flex items-center space-x-2"
            data-testid="button-add-stock"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock</span>
          </Button>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {!lowStockLoading && lowStockItems.length > 0 && (
        <LowStockAlert items={lowStockItems} />
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-inventory"
            />
          </div>
        </CardContent>
      </Card>

      {/* Inventory Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="stock-summary">
          <CardHeader>
            <CardTitle>Stock Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-500/10 p-2 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <span>In Stock Items</span>
                </div>
                <span className="font-semibold" data-testid="in-stock-count">
                  {inventory.filter(inv => inv.quantity > inv.item.lowStockThreshold).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="bg-yellow-500/10 p-2 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <span>Low Stock Items</span>
                </div>
                <span className="font-semibold text-yellow-600" data-testid="low-stock-count">
                  {lowStockItems.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="bg-red-500/10 p-2 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <span>Out of Stock Items</span>
                </div>
                <span className="font-semibold text-red-600" data-testid="out-of-stock-count">
                  {inventory.filter(inv => inv.quantity === 0).length}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-medium">Total Inventory Value</span>
                <span className="font-bold text-lg" data-testid="total-inventory-value">
                  ₹{calculateTotalValue().toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="recent-movements">
          <CardHeader>
            <CardTitle>Recent Stock Movements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {movementsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg animate-pulse">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-muted rounded-lg"></div>
                        <div>
                          <div className="h-4 bg-muted rounded w-32 mb-1"></div>
                          <div className="h-3 bg-muted rounded w-24"></div>
                        </div>
                      </div>
                      <div className="h-3 bg-muted rounded w-12"></div>
                    </div>
                  ))}
                </div>
              ) : stockMovements.length > 0 ? (
                stockMovements.slice(0, 5).map((movement, index) => (
                  <div key={movement.id} className={`flex items-center justify-between p-3 rounded-lg ${getMovementColor(movement.type)}`} data-testid={`movement-${index}`}>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-background/50">
                        {getMovementIcon(movement.type)}
                      </div>
                      <div>
                        <p className="font-medium text-sm capitalize">
                          {movement.type === 'purchase' ? 'Stock Added' : 
                           movement.type === 'sale' ? 'Sale' : 'Stock Adjustment'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {movement.item.name} ({movement.type === 'sale' ? '-' : '+'}{movement.quantity})
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(movement.createdAt!).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                  <div className="text-center">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No stock movements yet</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card data-testid="inventory-table">
        <CardHeader>
          <CardTitle>Inventory Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredInventory.length === 0 ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No inventory found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try adjusting your search criteria" : "Start by adding some stock"}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium text-muted-foreground">Item</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Current Stock</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Value</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Last Updated</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredInventory.map((inv) => {
                    const stockStatus = getStockStatus(inv.quantity, inv.item.lowStockThreshold);
                    const StatusIcon = stockStatus.icon;
                    
                    return (
                      <tr key={inv.id} className="hover:bg-muted/20" data-testid={`inventory-row-${inv.item.code}`}>
                        <td className="p-4">
                          <div>
                            <p className="font-medium" data-testid={`item-name-${inv.item.code}`}>{inv.item.name}</p>
                            <p className="text-sm text-muted-foreground font-mono" data-testid={`item-code-${inv.item.code}`}>{inv.item.code}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary" data-testid={`item-category-${inv.item.code}`}>
                            {inv.item.category}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-lg" data-testid={`current-stock-${inv.item.code}`}>
                            {inv.quantity}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className={`flex items-center space-x-2 px-2 py-1 rounded-lg ${stockStatus.bg}`}>
                            <StatusIcon className={`w-4 h-4 ${stockStatus.color}`} />
                            <span className={`text-sm font-medium ${stockStatus.color}`} data-testid={`stock-status-${inv.item.code}`}>
                              {stockStatus.status === 'out' ? 'Out of Stock' :
                               stockStatus.status === 'low' ? 'Low Stock' : 'In Stock'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-medium" data-testid={`stock-value-${inv.item.code}`}>
                            ₹{(inv.quantity * parseFloat(inv.item.price)).toLocaleString()}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground" data-testid={`last-updated-${inv.item.code}`}>
                            {new Date(inv.lastUpdated).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateStock(inv)}
                            className="h-8 w-8 p-0"
                            title="Update Stock"
                            data-testid={`button-update-stock-${inv.item.code}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <StockModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        item={selectedItem}
        type={modalType}
      />
    </div>
  );
}
