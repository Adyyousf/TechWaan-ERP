import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertStockMovementSchema, type InsertStockMovement, type ItemWithInventory } from "@shared/schema";
import { z } from "zod";

const stockFormSchema = insertStockMovementSchema.extend({
  quantity: z.string().min(1, "Quantity is required"),
});

type StockFormData = z.infer<typeof stockFormSchema>;

interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: ItemWithInventory | null;
  type: 'add' | 'update';
}

export default function StockModal({ isOpen, onClose, item, type }: StockModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery<ItemWithInventory[]>({
    queryKey: ['/api/items'],
    enabled: type === 'add',
  });

  const form = useForm<StockFormData>({
    resolver: zodResolver(stockFormSchema),
    defaultValues: {
      itemId: "",
      type: "adjustment",
      quantity: "",
      reason: "",
    },
  });

  const stockMovementMutation = useMutation({
    mutationFn: async (data: InsertStockMovement) => {
      const response = await apiRequest('POST', '/api/stock-movements', data);
      return response.json();
    },
    onSuccess: async () => {
      // Invalidate queries with a small delay to ensure database consistency
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/low-stock'] });
      
      // Add a small delay and force refetch for items to ensure consistency
      await new Promise(resolve => setTimeout(resolve, 100));
      await queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      await queryClient.refetchQueries({ queryKey: ['/api/items'] });
      
      toast({
        title: "Success",
        description: "Stock updated successfully",
      });
      onClose();
      form.reset();
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
        description: "Failed to update stock",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (item && type === 'update') {
      form.reset({
        itemId: item.id,
        type: "adjustment",
        quantity: item.currentStock.toString(),
        reason: "",
      });
    } else {
      form.reset({
        itemId: "",
        type: "adjustment",
        quantity: "",
        reason: "",
      });
    }
  }, [item, type, form]);

  const onSubmit = (data: StockFormData) => {
    const stockMovement: InsertStockMovement = {
      itemId: data.itemId,
      type: data.type,
      quantity: parseInt(data.quantity),
      reason: data.reason || undefined,
    };

    stockMovementMutation.mutate(stockMovement);
  };

  const handleClose = () => {
    if (!stockMovementMutation.isPending) {
      onClose();
      form.reset();
    }
  };

  const selectedItemId = form.watch("itemId");
  const selectedItem = items.find(i => i.id === selectedItemId) || item;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]" data-testid="stock-modal">
        <DialogHeader>
          <DialogTitle data-testid="modal-title">
            {type === 'add' ? "Add Stock Movement" : "Update Stock"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {type === 'add' && (
              <FormField
                control={form.control}
                name="itemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-item">
                          <SelectValue placeholder="Select an item" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {items.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.code}) - Current: {item.currentStock}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedItem && (
              <div className="p-3 bg-muted/20 rounded-lg" data-testid="item-info">
                <p className="font-medium text-sm">{selectedItem.name}</p>
                <p className="text-xs text-muted-foreground">
                  Code: {selectedItem.code} | Current Stock: {selectedItem.currentStock}
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Movement Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-movement-type">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="purchase">Purchase (Add Stock)</SelectItem>
                      <SelectItem value="sale">Sale (Remove Stock)</SelectItem>
                      <SelectItem value="adjustment">Adjustment (Set Stock)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {form.watch("type") === "adjustment" ? "New Stock Quantity *" : "Quantity *"}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      placeholder="Enter quantity" 
                      {...field} 
                      data-testid="input-quantity"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Optional reason for stock movement" 
                      {...field}
                      value={field.value || ""}
                      rows={3}
                      data-testid="textarea-reason"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={stockMovementMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={stockMovementMutation.isPending}
                data-testid="button-save"
              >
                {stockMovementMutation.isPending ? "Processing..." : "Update Stock"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
