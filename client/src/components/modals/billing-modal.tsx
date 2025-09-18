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
import type { Customer, ItemWithInventory, InsertBill, InsertBillItem } from "@shared/schema";
import { z } from "zod";

const billItemSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  rate: z.coerce.number().min(0, "Rate must be positive"),
  amount: z.coerce.number().min(0, "Amount must be positive"),
});

const billFormSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  status: z.string().default("pending"),
  billItems: z.array(billItemSchema).min(1, "At least one item is required"),
  subtotal: z.coerce.number().min(0),
  gstAmount: z.coerce.number().min(0),
  total: z.coerce.number().min(0),
});

type BillFormData = z.infer<typeof billFormSchema>;

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BillingModal({ isOpen, onClose }: BillingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCalculating, setIsCalculating] = useState(false);

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  const { data: items = [] } = useQuery<ItemWithInventory[]>({
    queryKey: ['/api/items'],
  });

  const form = useForm<BillFormData>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      customerId: "",
      status: "pending",
      billItems: [{ itemId: "", quantity: 1, rate: 0, amount: 0 }],
      subtotal: 0,
      gstAmount: 0,
      total: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "billItems",
  });

  const createBillMutation = useMutation({
    mutationFn: async (data: { bill: InsertBill; billItems: InsertBillItem[] }) => {
      const response = await apiRequest('POST', '/api/bills', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stock-movements'] });
      toast({
        title: "Success",
        description: "Bill created successfully",
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
        description: "Failed to create bill",
        variant: "destructive",
      });
    },
  });

  const calculateTotals = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      const billItems = form.getValues("billItems");
      
      // Update individual item amounts and calculate subtotal
      let subtotal = 0;
      const updatedItems = billItems.map((item, index) => {
        const selectedItem = items.find(i => i.id === item.itemId);
        if (selectedItem && item.quantity > 0) {
          const rate = Number(selectedItem.price);
          const amount = item.quantity * rate;
          
          form.setValue(`billItems.${index}.rate`, rate);
          form.setValue(`billItems.${index}.amount`, amount);
          
          subtotal += amount;
          return { ...item, rate, amount };
        }
        return item;
      });

      // Calculate GST (assuming 18% for simplicity - in production this would be item-specific)
      const gstAmount = subtotal * 0.18;
      const total = subtotal + gstAmount;

      // Update form values
      form.setValue("subtotal", subtotal);
      form.setValue("gstAmount", gstAmount);
      form.setValue("total", total);
      
      setIsCalculating(false);
    }, 500);
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

  const onSubmit = (data: BillFormData) => {
    // Don't include billNumber and createdBy - these are added by the server
    const billData = {
      customerId: data.customerId,
      subtotal: data.subtotal.toString(),
      gstAmount: data.gstAmount.toString(),
      total: data.total.toString(),
      status: data.status,
      billDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    };

    // Don't include billId - this is added by the server
    const billItemsData = data.billItems.map(item => ({
      itemId: item.itemId,
      quantity: item.quantity,
      rate: item.rate.toString(),
      amount: item.amount.toString(),
    }));

    createBillMutation.mutate({ bill: billData, billItems: billItemsData });
  };

  const handleClose = () => {
    if (!createBillMutation.isPending && !isCalculating) {
      onClose();
      form.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto" data-testid="billing-modal">
        <DialogHeader>
          <DialogTitle data-testid="modal-title">Create New Bill</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Selection */}
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-customer">
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bill Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Bill Items</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addItem}
                  data-testid="button-add-item"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {fields.map((field, index) => (
                <Card key={field.id} data-testid={`bill-item-${index}`}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-12 gap-4 items-end">
                      <div className="col-span-5">
                        <FormField
                          control={form.control}
                          name={`billItems.${index}.itemId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Item *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid={`select-item-${index}`}>
                                    <SelectValue placeholder="Select item" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {items.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.name} (₹{item.price}) - Stock: {item.currentStock}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`billItems.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Qty *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(parseInt(e.target.value) || 1);
                                    calculateTotals();
                                  }}
                                  data-testid={`input-quantity-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`billItems.${index}.rate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rate</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  readOnly
                                  {...field}
                                  value={field.value.toFixed(2)}
                                  data-testid={`input-rate-${index}`}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`billItems.${index}.amount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  readOnly
                                  {...field}
                                  value={field.value.toFixed(2)}
                                  data-testid={`input-amount-${index}`}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                          disabled={fields.length === 1}
                          data-testid={`button-remove-item-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button 
                type="button" 
                variant="secondary" 
                onClick={calculateTotals}
                disabled={isCalculating}
                className="w-full"
                data-testid="button-calculate"
              >
                <Calculator className="w-4 h-4 mr-2" />
                {isCalculating ? "Calculating..." : "Calculate Totals"}
              </Button>
            </div>

            {/* Totals */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span data-testid="subtotal">₹{form.watch("subtotal").toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18%):</span>
                    <span data-testid="gst-amount">₹{form.watch("gstAmount").toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold text-lg">
                    <span>Total:</span>
                    <span data-testid="total">₹{form.watch("total").toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={createBillMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createBillMutation.isPending}
                data-testid="button-create-bill"
              >
                {createBillMutation.isPending ? "Creating..." : "Create Bill"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
