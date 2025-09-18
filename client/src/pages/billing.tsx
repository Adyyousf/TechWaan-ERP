import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import BillingModal from "@/components/modals/billing-modal";
import InvoicePreview from "@/components/ui/invoice-preview";
import { Plus, Eye, Printer, Download, IndianRupee, FileText, Clock, CheckCircle } from "lucide-react";
import type { BillWithDetails } from "@shared/schema";

interface BillingStats {
  todaysSales: string;
  billsGenerated: number;
  totalGST: string;
  pendingBills: number;
}

export default function Billing() {
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [previewBill, setPreviewBill] = useState<BillWithDetails | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bills = [], isLoading: billsLoading } = useQuery<BillWithDetails[]>({
    queryKey: ['/api/bills'],
  });

  const { data: stats } = useQuery<BillingStats>({
    queryKey: ['/api/dashboard/stats'],
    select: (data: any) => ({
      todaysSales: data.todaysSales || "0",
      billsGenerated: data.billsGenerated || 0,
      totalGST: data.totalGST || "0",
      pendingBills: data.pendingBills || 0,
    }),
  });

  const updateBillStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest('PATCH', `/api/bills/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Success",
        description: "Bill status updated successfully",
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
        description: "Failed to update bill status",
        variant: "destructive",
      });
    },
  });

  const handleCreateBill = () => {
    setIsBillingModalOpen(true);
  };

  const handleViewBill = (bill: BillWithDetails) => {
    setPreviewBill(bill);
  };

  const handlePrintBill = (bill: BillWithDetails) => {
    // Open bill in new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${bill.billNumber}</title>
            <style>
              body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; }
              .invoice-header { text-align: center; margin-bottom: 20px; }
              .invoice-details { margin-bottom: 20px; }
              .invoice-table { width: 100%; border-collapse: collapse; }
              .invoice-table th, .invoice-table td { border: 1px solid #000; padding: 8px; text-align: left; }
              .invoice-table th { background-color: #f0f0f0; }
              .totals { text-align: right; margin-top: 20px; }
              @media print { 
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="invoice-header">
              <h2>YOUR COMPANY NAME</h2>
              <p>Address Line 1, Address Line 2<br>
                 City, State - PIN CODE<br>
                 GSTIN: 29ABCDE1234F1Z5 | Phone: +91 12345 67890</p>
              <h3>TAX INVOICE</h3>
            </div>
            
            <div class="invoice-details">
              <div style="display: flex; justify-content: space-between;">
                <div>
                  <strong>Bill To:</strong><br>
                  ${bill.customer.name}<br>
                  ${bill.customer.address || ''}<br>
                  ${bill.customer.gstin ? `GSTIN: ${bill.customer.gstin}` : ''}
                </div>
                <div style="text-align: right;">
                  Invoice No: ${bill.billNumber}<br>
                  Date: ${new Date(bill.billDate!).toLocaleDateString()}<br>
                  ${bill.dueDate ? `Due Date: ${new Date(bill.dueDate).toLocaleDateString()}` : ''}
                </div>
              </div>
            </div>
            
            <table class="invoice-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${bill.billItems.map(item => `
                  <tr>
                    <td>${item.item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₹${parseFloat(item.rate).toFixed(2)}</td>
                    <td>₹${parseFloat(item.amount).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="totals">
              <p>Subtotal: ₹${parseFloat(bill.subtotal).toFixed(2)}</p>
              <p>GST: ₹${parseFloat(bill.gstAmount).toFixed(2)}</p>
              <p><strong>Total: ₹${parseFloat(bill.total).toFixed(2)}</strong></p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p>Thank you for your business!</p>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 20px;">
              <button onclick="window.print()">Print Invoice</button>
              <button onclick="window.close()" style="margin-left: 10px;">Close</button>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownloadBill = (bill: BillWithDetails) => {
    toast({
      title: "Download",
      description: "PDF download functionality will be implemented soon",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (billsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-2"></div>
          <div className="h-4 bg-muted rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="billing-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="page-title">GST Billing</h2>
          <p className="text-muted-foreground">Generate GST compliant invoices</p>
        </div>
        <Button onClick={handleCreateBill} className="flex items-center space-x-2" data-testid="button-create-bill">
          <Plus className="w-4 h-4" />
          <span>Create New Bill</span>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="stat-todays-sales">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground text-sm">Today's Sales</p>
              <IndianRupee className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xl font-bold">₹{stats?.todaysSales || "0"}</p>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-bills-generated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground text-sm">Bills Generated</p>
              <FileText className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-xl font-bold">{stats?.billsGenerated || 0}</p>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-total-gst">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground text-sm">Total GST</p>
              <IndianRupee className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-xl font-bold">₹{stats?.totalGST || "0"}</p>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-pending-bills">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground text-sm">Pending Bills</p>
              <Clock className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-xl font-bold text-yellow-600">{stats?.pendingBills || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bills */}
      <Card data-testid="recent-bills">
        <CardHeader>
          <CardTitle>Recent Bills</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {bills.length === 0 ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No bills found</h3>
                <p className="text-muted-foreground mb-4">Start by creating your first bill</p>
                <Button onClick={handleCreateBill} data-testid="button-create-first-bill">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Bill
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium text-muted-foreground">Bill No.</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">GST</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-muted/20" data-testid={`bill-row-${bill.billNumber}`}>
                      <td className="p-4">
                        <span className="font-mono text-sm" data-testid={`bill-number-${bill.billNumber}`}>
                          {bill.billNumber}
                        </span>
                      </td>
                      <td className="p-4" data-testid={`bill-customer-${bill.billNumber}`}>
                        {bill.customer.name}
                      </td>
                      <td className="p-4" data-testid={`bill-date-${bill.billNumber}`}>
                        {new Date(bill.billDate!).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className="font-medium" data-testid={`bill-amount-${bill.billNumber}`}>
                          ₹{parseFloat(bill.total).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4" data-testid={`bill-gst-${bill.billNumber}`}>
                        ₹{parseFloat(bill.gstAmount).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <Badge 
                          className={`text-xs ${getStatusColor(bill.status)}`}
                          data-testid={`bill-status-${bill.billNumber}`}
                        >
                          {bill.status === 'paid' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {bill.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewBill(bill)}
                            className="h-8 w-8 p-0"
                            title="View"
                            data-testid={`button-view-bill-${bill.billNumber}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrintBill(bill)}
                            className="h-8 w-8 p-0"
                            title="Print"
                            data-testid={`button-print-bill-${bill.billNumber}`}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadBill(bill)}
                            className="h-8 w-8 p-0"
                            title="Download"
                            data-testid={`button-download-bill-${bill.billNumber}`}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Preview */}
      {previewBill && (
        <InvoicePreview 
          bill={previewBill} 
          onClose={() => setPreviewBill(null)}
          onPrint={() => handlePrintBill(previewBill)}
        />
      )}

      <BillingModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
      />
    </div>
  );
}
