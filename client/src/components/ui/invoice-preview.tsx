import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Printer, Download, CheckCircle, Clock } from "lucide-react";
import type { BillWithDetails } from "@shared/schema";

interface InvoicePreviewProps {
  bill: BillWithDetails;
  onClose: () => void;
  onPrint: () => void;
  className?: string;
}

export default function InvoicePreview({ bill, onClose, onPrint, className }: InvoicePreviewProps) {
  const handleDownload = () => {
    // TODO: Implement PDF download functionality
    console.log("Download PDF for bill:", bill.billNumber);
  };

  const getStatusIcon = () => {
    switch (bill.status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (bill.status) {
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

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`} data-testid="invoice-preview">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center space-x-3">
          <span>Invoice Preview</span>
          <Badge className={`${getStatusColor()} flex items-center space-x-1`}>
            {getStatusIcon()}
            <span>{bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}</span>
          </Badge>
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrint}
            className="flex items-center space-x-2"
            data-testid="button-print-preview"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center space-x-2"
            data-testid="button-download-preview"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid="button-close-preview"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="bg-white border-2 border-dashed border-border rounded-lg p-8 text-foreground font-mono">
          {/* Invoice Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold mb-2" data-testid="company-name">YOUR COMPANY NAME</h2>
            <div className="text-sm space-y-1">
              <p>Address Line 1, Address Line 2</p>
              <p>City, State - PIN CODE</p>
              <p>GSTIN: 29ABCDE1234F1Z5 | Phone: +91 12345 67890</p>
            </div>
          </div>
          
          <div className="border-b-2 border-gray-400 mb-4 pb-2">
            <h3 className="text-lg font-bold text-center">TAX INVOICE</h3>
          </div>
          
          {/* Bill Details */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <p className="font-bold mb-2">Bill To:</p>
              <div className="space-y-1" data-testid="customer-details">
                <p className="font-semibold">{bill.customer.name}</p>
                {bill.customer.address && <p>{bill.customer.address}</p>}
                {bill.customer.city && bill.customer.state && (
                  <p>{bill.customer.city}, {bill.customer.state}</p>
                )}
                {bill.customer.pinCode && <p>PIN: {bill.customer.pinCode}</p>}
                {bill.customer.gstin && <p>GSTIN: {bill.customer.gstin}</p>}
                {bill.customer.phone && <p>Phone: {bill.customer.phone}</p>}
              </div>
            </div>
            <div className="text-right">
              <div className="space-y-1" data-testid="invoice-details">
                <p>Invoice No: <span className="font-semibold">{bill.billNumber}</span></p>
                <p>Date: <span className="font-semibold">{formatDate(bill.billDate!)}</span></p>
                {bill.dueDate && (
                  <p>Due Date: <span className="font-semibold">{formatDate(bill.dueDate)}</span></p>
                )}
              </div>
            </div>
          </div>
          
          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full border-collapse border-2 border-gray-400">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-3 text-left font-bold">Item</th>
                  <th className="border border-gray-400 p-3 text-right font-bold">Qty</th>
                  <th className="border border-gray-400 p-3 text-right font-bold">Rate</th>
                  <th className="border border-gray-400 p-3 text-right font-bold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bill.billItems.map((item, index) => (
                  <tr key={item.id} data-testid={`invoice-item-${index}`}>
                    <td className="border border-gray-400 p-3">
                      <div>
                        <p className="font-medium">{item.item.name}</p>
                        <p className="text-xs text-gray-600">Code: {item.item.code}</p>
                      </div>
                    </td>
                    <td className="border border-gray-400 p-3 text-right">
                      {item.quantity}
                    </td>
                    <td className="border border-gray-400 p-3 text-right">
                      ₹{parseFloat(item.rate).toFixed(2)}
                    </td>
                    <td className="border border-gray-400 p-3 text-right font-medium">
                      ₹{parseFloat(item.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Totals */}
          <div className="text-right mb-6" data-testid="invoice-totals">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{parseFloat(bill.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST (9%):</span>
                <span>₹{(parseFloat(bill.gstAmount) / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (9%):</span>
                <span>₹{(parseFloat(bill.gstAmount) / 2).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-400 pt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>₹{parseFloat(bill.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="text-center border-t border-gray-400 pt-4">
            <p className="text-sm">Thank you for your business!</p>
            <p className="text-xs text-gray-600 mt-2">
              This is a computer generated invoice and does not require a signature.
            </p>
          </div>
        </div>
        
        {/* Additional Information */}
        <div className="mt-4 text-sm text-muted-foreground">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="font-medium mb-1">Payment Status:</p>
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span className="capitalize">{bill.status}</span>
              </div>
            </div>
            <div>
              <p className="font-medium mb-1">Total Items:</p>
              <p>{bill.billItems.length} item{bill.billItems.length !== 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="font-medium mb-1">Created:</p>
              <p>{formatDate(bill.billDate!)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
