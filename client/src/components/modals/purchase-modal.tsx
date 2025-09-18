import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Trash2, Calculator } from "lucide-react";
import type { Vendor, ItemWithInventory } from "@shared/schema";
import { z } from "zod";

const purchaseItemSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  rate: z.coerce.number().min(0, "Rate must be positive"),
  amount: z.coerce.number().min(0, "Amount must be positive"),
});

const purchaseFormSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  status: z.string().default("pending"),
  purchaseItems: z.array(purchaseItemSchema).min(1, "At least one item is required"),
  subtotal: z.coerce.number().min(0),
  gstAmount: z.coerce.number().min(0),
  total: z.coerce.number().min(0),
});

type PurchaseFormData = z.infer<typeof purchaseFormSchema>;

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PurchaseModal({ isOpen, onClose }: PurchaseModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCalculating, setIsCalculating] = useState(false);

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ['/api/vendors'],
  });

  const { data: items = [] } = useQuery<ItemWithInventory[]>({
    queryKey: ['/api/items'],
  });

  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      vendorId: "",
      status: "pending",
      purchaseItems: [{ itemId: "", quantity: 1, rate: 0, amount: 0 }],
      subtotal: 0,
      gstAmount: 0,
      total: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "purchaseItems",
  });

  const createPurchaseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/purchases', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/purchases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stock-movements'] });
      toast({
        title: "Success",
        description: "Purchase created successfully",
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
        description: "Failed to create purchase",
        variant: "destructive",
      });
    },
  });

  const calculateTotals = () => {
    setIsCalculating(true);
    const purchaseItems = form.getValues("purchaseItems");
    const selectedVendor = vendors.find(v => v.id === form.getValues("vendorId"));
    
    let subtotal = 0;
    purchaseItems.forEach((item, index) => {
      const selectedItem = items.find(i => i.id === item.itemId);
      if (selectedItem && item.quantity && item.rate) {
        const amount = item.quantity * item.rate;
        form.setValue(`purchaseItems.${index}.amount`, amount);
        subtotal += amount;
      }
    });

    // Calculate GST (simplified - using 18% for demonstration)
    const gstRate = 0.18;
    const gstAmount = subtotal * gstRate;
    const total = subtotal + gstAmount;

    form.setValue("subtotal", subtotal);
    form.setValue("gstAmount", gstAmount);
    form.setValue("total", total);
    
    setIsCalculating(false);
  };

  const addItem = () => {
    append({ itemId: "", quantity: 1, rate: 0, amount: 0 });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      calculateTotals();
    }
  };

  const onSubmit = (data: PurchaseFormData) => {
    const purchaseData = {
      vendorId: data.vendorId,
      status: data.status,
      subtotal: data.subtotal,
      gstAmount: data.gstAmount,
      totalAmount: data.total,
      items: data.purchaseItems.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      })),
    };

    createPurchaseMutation.mutate(purchaseData);
  };

  const handleClose = () => {
    if (!createPurchaseMutation.isPending) {
      onClose();
      form.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="purchase-modal">
        <DialogHeader>
          <DialogTitle data-testid="modal-title">Create New Purchase</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vendorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-vendor">
                          <SelectValue placeholder="Select a vendor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name} - {vendor.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Purchase Items</h3>
                <Button type="button" onClick={addItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {fields.map((field, index) => (
                <Card key={field.id}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-5 gap-4">
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`purchaseItems.${index}.itemId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Item *</FormLabel>
                              <Select 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  const selectedItem = items.find(i => i.id === value);
                                  if (selectedItem) {
                                    form.setValue(`purchaseItems.${index}.rate`, Number(selectedItem.price));
                                    calculateTotals();
                                  }
                                }} 
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select item" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {items.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.name} ({item.code})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`purchaseItems.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  calculateTotals();
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`purchaseItems.${index}.rate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rate *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                min="0" 
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  calculateTotals();
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-end space-x-2">
                        <FormField
                          control={form.control}
                          name={`purchaseItems.${index}.amount`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Amount</FormLabel>
                              <FormControl>
                                <Input {...field} readOnly className="bg-muted" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center">
              <Button 
                type="button" 
                onClick={calculateTotals} 
                disabled={isCalculating}
                variant="outline"
              >
                <Calculator className="h-4 w-4 mr-2" />
                {isCalculating ? "Calculating..." : "Calculate Totals"}
              </Button>
            </div>

            <Card className="bg-muted/10">
              <CardContent className="pt-6">
                <div className="space-y-2 text-right">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{form.watch("subtotal").toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18%):</span>
                    <span>₹{form.watch("gstAmount").toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>₹{form.watch("total").toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={createPurchaseMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createPurchaseMutation.isPending}
                data-testid="button-create-purchase"
              >
                {createPurchaseMutation.isPending ? "Creating..." : "Create Purchase"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}