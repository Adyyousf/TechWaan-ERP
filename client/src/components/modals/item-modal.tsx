import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertItemSchema, type InsertItem, type ItemWithInventory } from "@shared/schema";
import { z } from "zod";

const itemFormSchema = insertItemSchema.extend({
  price: z.string().min(1, "Price is required"),
  gstRate: z.string().min(1, "GST rate is required"),
  lowStockThreshold: z.string().min(1, "Low stock threshold is required"),
});

type ItemFormData = z.infer<typeof itemFormSchema>;

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: ItemWithInventory | null;
}

const categories = [
  "Electronics",
  "Clothing",
  "Home & Garden",
  "Sports & Outdoors",
  "Health & Beauty",
  "Automotive",
  "Books & Media",
  "Toys & Games",
  "Food & Beverages",
  "Office Supplies",
];

const units = [
  "pcs", "kg", "ltr", "mtr", "box", "pack", "dozen", "gram", "ml", "ft"
];

export default function ItemModal({ isOpen, onClose, item }: ItemModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      category: "",
      price: "",
      gstRate: "18.00",
      unit: "pcs",
      lowStockThreshold: "10",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertItem) => {
      const response = await apiRequest('POST', '/api/items', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      toast({
        title: "Success",
        description: "Item created successfully",
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
        description: "Failed to create item",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertItem>) => {
      if (!item) throw new Error("No item to update");
      const response = await apiRequest('PATCH', `/api/items/${item.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      toast({
        title: "Success",
        description: "Item updated successfully",
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
        description: "Failed to update item",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        code: item.code,
        name: item.name,
        description: item.description || "",
        category: item.category,
        price: item.price.toString(),
        gstRate: item.gstRate.toString(),
        unit: item.unit,
        lowStockThreshold: item.lowStockThreshold.toString(),
      });
    } else {
      form.reset({
        code: "",
        name: "",
        description: "",
        category: "",
        price: "",
        gstRate: "18.00",
        unit: "pcs",
        lowStockThreshold: "10",
      });
    }
  }, [item, form]);

  const onSubmit = (data: ItemFormData) => {
    const itemData: InsertItem = {
      ...data,
      price: parseFloat(data.price),
      gstRate: parseFloat(data.gstRate),
      lowStockThreshold: parseInt(data.lowStockThreshold),
    };

    if (item) {
      updateMutation.mutate(itemData);
    } else {
      createMutation.mutate(itemData);
    }
  };

  const handleClose = () => {
    if (!createMutation.isPending && !updateMutation.isPending) {
      onClose();
      form.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" data-testid="item-modal">
        <DialogHeader>
          <DialogTitle data-testid="modal-title">
            {item ? "Edit Item" : "Add New Item"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="ITM001" {...field} data-testid="input-item-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter item name" {...field} data-testid="input-item-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter item description" 
                      {...field}
                      value={field.value || ""}
                      rows={3}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (₹) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                        data-testid="input-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gstRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Rate (%) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="18.00" 
                        {...field} 
                        data-testid="input-gst-rate"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-unit">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
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
              name="lowStockThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Low Stock Threshold *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      placeholder="10" 
                      {...field} 
                      data-testid="input-low-stock-threshold"
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
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save"
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : (item ? "Update Item" : "Create Item")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
