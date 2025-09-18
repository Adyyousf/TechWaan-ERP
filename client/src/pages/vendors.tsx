import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import VendorModal from "@/components/modals/vendor-modal";
import { Plus, Search, Edit, Eye, Trash2, Mail, Phone, Truck } from "lucide-react";
import type { Vendor } from "@shared/schema";

export default function Vendors() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ['/api/vendors'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/vendors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
      toast({
        title: "Success",
        description: "Vendor deleted successfully",
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
        description: "Failed to delete vendor",
        variant: "destructive",
      });
    },
  });

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (vendor.email && vendor.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (vendor.phone && vendor.phone.includes(searchQuery)) ||
    (vendor.category && vendor.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddVendor = () => {
    setEditingVendor(null);
    setIsModalOpen(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setIsModalOpen(true);
  };

  const handleDeleteVendor = (id: string) => {
    if (confirm("Are you sure you want to delete this vendor?")) {
      deleteMutation.mutate(id);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getCategoryColor = (category: string | null) => {
    if (!category) return "bg-gray-100 text-gray-800";
    const colors = {
      electronics: "bg-blue-100 text-blue-800",
      textiles: "bg-green-100 text-green-800",
      furniture: "bg-purple-100 text-purple-800",
      automotive: "bg-red-100 text-red-800",
      food: "bg-yellow-100 text-yellow-800",
    };
    return colors[category.toLowerCase() as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-2"></div>
          <div className="h-4 bg-muted rounded w-48 mb-6"></div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-4 border-b border-border last:border-b-0">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-48 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-32"></div>
                  </div>
                  <div className="h-6 bg-muted rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="vendors-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="page-title">Vendor Management</h2>
          <p className="text-muted-foreground">Manage your supplier network</p>
        </div>
        <Button onClick={handleAddVendor} className="flex items-center space-x-2" data-testid="button-add-vendor">
          <Plus className="w-4 h-4" />
          <span>Add Vendor</span>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-vendors"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      {filteredVendors.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <Truck className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search criteria" : "Get started by adding your first vendor"}
              </p>
              {!searchQuery && (
                <Button onClick={handleAddVendor} data-testid="button-add-first-vendor">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Vendor
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium text-muted-foreground">Vendor</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Contact</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">GSTIN</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Total Purchases</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-muted/20" data-testid={`vendor-row-${vendor.id}`}>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-purple-500/10 text-purple-500 w-10 h-10 rounded-full flex items-center justify-center font-semibold" data-testid={`vendor-avatar-${vendor.id}`}>
                            {getInitials(vendor.name)}
                          </div>
                          <div>
                            <p className="font-medium" data-testid={`vendor-name-${vendor.id}`}>{vendor.name}</p>
                            {vendor.city && vendor.state && (
                              <p className="text-sm text-muted-foreground" data-testid={`vendor-location-${vendor.id}`}>
                                {vendor.city}, {vendor.state}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {vendor.email && (
                            <div className="flex items-center space-x-1 mb-1" data-testid={`vendor-email-${vendor.id}`}>
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <span className="truncate max-w-[150px]">{vendor.email}</span>
                            </div>
                          )}
                          {vendor.phone && (
                            <div className="flex items-center space-x-1" data-testid={`vendor-phone-${vendor.id}`}>
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              <span>{vendor.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {vendor.gstin && (
                          <span className="font-mono text-sm" data-testid={`vendor-gstin-${vendor.id}`}>{vendor.gstin}</span>
                        )}
                      </td>
                      <td className="p-4">
                        {vendor.category && (
                          <Badge className={`text-xs ${getCategoryColor(vendor.category)}`} data-testid={`vendor-category-${vendor.id}`}>
                            {vendor.category}
                          </Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-medium" data-testid={`vendor-purchases-${vendor.id}`}>₹0</span>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditVendor(vendor)}
                            className="h-8 w-8 p-0"
                            title="Edit"
                            data-testid={`button-edit-vendor-${vendor.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="View"
                            data-testid={`button-view-vendor-${vendor.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteVendor(vendor.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Delete"
                            data-testid={`button-delete-vendor-${vendor.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <VendorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vendor={editingVendor}
      />
    </div>
  );
}
