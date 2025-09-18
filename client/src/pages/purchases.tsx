import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Package, Truck, Calendar } from "lucide-react";
import { format } from "date-fns";
import PurchaseModal from "@/components/modals/purchase-modal";

interface Purchase {
  id: string;
  vendorId: string;
  vendor_name: string;
  vendor_email: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items?: any[];
}

export default function Purchases() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: purchases = [], isLoading } = useQuery<Purchase[]>({
    queryKey: ['/api/purchases'],
  });

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">
              Purchase Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Track and manage your vendor purchases
            </p>
          </div>
          <Button 
            onClick={openModal}
            className="bg-primary hover:bg-primary/90"
            data-testid="button-add-purchase"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Purchase
          </Button>
        </div>

        {purchases.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No purchases yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your vendor purchases by creating your first purchase order.
              </p>
              <Button onClick={openModal} data-testid="button-create-first-purchase">
                <Plus className="h-4 w-4 mr-2" />
                Create First Purchase
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {purchases.map((purchase) => (
              <Card key={purchase.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg" data-testid={`purchase-title-${purchase.id}`}>
                      {purchase.vendor_name}
                    </CardTitle>
                    <Badge 
                      variant={purchase.status === 'completed' ? 'default' : 'secondary'}
                      data-testid={`purchase-status-${purchase.id}`}
                    >
                      {purchase.status}
                    </Badge>
                  </div>
                  <CardDescription data-testid={`purchase-email-${purchase.id}`}>
                    {purchase.vendor_email}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center">
                        <Package className="h-4 w-4 mr-1" />
                        Total Amount
                      </span>
                      <span className="font-semibold" data-testid={`purchase-amount-${purchase.id}`}>
                        ₹{purchase.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Purchase Date
                      </span>
                      <span className="text-sm" data-testid={`purchase-date-${purchase.id}`}>
                        {format(new Date(purchase.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center">
                        <Truck className="h-4 w-4 mr-1" />
                        Vendor ID
                      </span>
                      <span className="text-sm font-mono text-xs bg-muted px-2 py-1 rounded">
                        {purchase.vendorId.slice(0, 8)}...
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t">
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <PurchaseModal
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      </div>
    </div>
  );
}