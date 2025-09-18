import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import CustomerModal from "@/components/modals/customer-modal";
import { Plus, Search, Edit, Eye, Mail, Phone, MapPin, Users } from "lucide-react";
import type { Customer } from "@shared/schema";

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({
        title: "Success",
        description: "Customer deleted successfully",
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
        description: "Failed to delete customer",
        variant: "destructive",
      });
    },
  });

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (customer.phone && customer.phone.includes(searchQuery))
  );

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-2"></div>
          <div className="h-4 bg-muted rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6">
                <div className="h-12 bg-muted rounded-full w-12 mb-4"></div>
                <div className="h-6 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="customers-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="page-title">Customer Management</h2>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <Button onClick={handleAddCustomer} className="flex items-center space-x-2" data-testid="button-add-customer">
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-customers"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Grid */}
      {filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No customers found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search criteria" : "Get started by adding your first customer"}
              </p>
              {!searchQuery && (
                <Button onClick={handleAddCustomer} data-testid="button-add-first-customer">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Customer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow" data-testid={`customer-card-${customer.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 text-primary w-12 h-12 rounded-full flex items-center justify-center font-semibold" data-testid={`customer-avatar-${customer.id}`}>
                      {getInitials(customer.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold" data-testid={`customer-name-${customer.id}`}>{customer.name}</h3>
                      {customer.gstin && (
                        <p className="text-sm text-muted-foreground font-mono" data-testid={`customer-gstin-${customer.id}`}>
                          GSTIN: {customer.gstin}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCustomer(customer)}
                      className="h-8 w-8 p-0"
                      title="Edit"
                      data-testid={`button-edit-customer-${customer.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="View"
                      data-testid={`button-view-customer-${customer.id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {customer.email && (
                    <div className="flex items-center space-x-2" data-testid={`customer-email-${customer.id}`}>
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center space-x-2" data-testid={`customer-phone-${customer.id}`}>
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {(customer.city || customer.state) && (
                    <div className="flex items-center space-x-2" data-testid={`customer-location-${customer.id}`}>
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">
                        {[customer.city, customer.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Orders:</span>
                    <span className="font-medium" data-testid={`customer-orders-${customer.id}`}>-</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Value:</span>
                    <span className="font-medium" data-testid={`customer-value-${customer.id}`}>₹0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={editingCustomer}
      />
    </div>
  );
}
