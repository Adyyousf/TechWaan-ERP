import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatsCard from "@/components/ui/stats-card";
import { 
  TrendingUp, 
  ShoppingCart, 
  Calculator, 
  Percent,
  BarChart3,
  PieChart,
  Download,
  Award,
  CreditCard,
  DollarSign
} from "lucide-react";

interface AnalyticsData {
  revenue: string;
  orders: number;
  avgOrderValue: string;
  profitMargin: string;
}

interface DashboardStats {
  totalItems: number;
  totalCustomers: number;
  monthlySales: string;
  lowStockItems: number;
  todaysSales: string;
  billsGenerated: number;
  totalGST: string;
  pendingBills: number;
}

interface TopSellingItem {
  item: {
    id: string;
    name: string;
    category: string;
    code: string;
  };
  totalSold: number;
  totalRevenue: string;
}

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("last-30-days");

  const { data: dashboardStats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: topSellingItems = [] } = useQuery<TopSellingItem[]>({
    queryKey: ['/api/dashboard/top-selling-items'],
  });

  // Mock analytics data - in production this would come from API
  const analyticsData: AnalyticsData = {
    revenue: dashboardStats?.monthlySales || "0",
    orders: 1234,
    avgOrderValue: "1009",
    profitMargin: "23.4",
  };

  const paymentMethods = [
    { name: "Cash", percentage: 45, color: "bg-primary" },
    { name: "UPI", percentage: 35, color: "bg-green-500" },
    { name: "Card", percentage: 20, color: "bg-blue-500" },
  ];

  const handleExportData = () => {
    // Create CSV data
    const csvData = [
      ['Metric', 'Value'],
      ['Revenue', `₹${analyticsData.revenue}`],
      ['Orders', analyticsData.orders.toString()],
      ['Average Order Value', `₹${analyticsData.avgOrderValue}`],
      ['Profit Margin', `${analyticsData.profitMargin}%`],
      [''],
      ['Top Selling Items', ''],
      ['Item Name', 'Quantity Sold', 'Revenue'],
      ...topSellingItems.map(item => [
        item.item.name,
        item.totalSold.toString(),
        `₹${item.totalRevenue}`
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6" data-testid="analytics-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="page-title">Analytics & Reports</h2>
          <p className="text-muted-foreground">Business insights and performance metrics</p>
        </div>
        <div className="flex space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-7-days">Last 7 days</SelectItem>
              <SelectItem value="last-30-days">Last 30 days</SelectItem>
              <SelectItem value="last-3-months">Last 3 months</SelectItem>
              <SelectItem value="last-year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="secondary"
            onClick={handleExportData}
            className="flex items-center space-x-2"
            data-testid="button-export"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Revenue"
          value={`₹${analyticsData.revenue}`}
          icon={TrendingUp}
          trend="+15.3% vs last month"
          trendDirection="up"
          bgColor="bg-green-500/10"
          iconColor="text-green-500"
          data-testid="stats-revenue"
        />
        
        <StatsCard
          title="Orders"
          value={analyticsData.orders.toString()}
          icon={ShoppingCart}
          trend="+8.7% vs last month"
          trendDirection="up"
          bgColor="bg-blue-500/10"
          iconColor="text-blue-500"
          data-testid="stats-orders"
        />
        
        <StatsCard
          title="Avg Order Value"
          value={`₹${analyticsData.avgOrderValue}`}
          icon={Calculator}
          trend="+6.1% vs last month"
          trendDirection="up"
          bgColor="bg-purple-500/10"
          iconColor="text-purple-500"
          data-testid="stats-avg-order"
        />
        
        <StatsCard
          title="Profit Margin"
          value={`${analyticsData.profitMargin}%`}
          icon={Percent}
          trend="+1.2% vs last month"
          trendDirection="up"
          bgColor="bg-orange-500/10"
          iconColor="text-orange-500"
          data-testid="stats-profit-margin"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="sales-trend-chart">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Sales Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-muted/20 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-2">Sales Trend Chart</p>
                <p className="text-sm text-muted-foreground">Chart implementation using Chart.js coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="top-selling-items">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5" />
              <span>Top Selling Items</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSellingItems.length > 0 ? (
                topSellingItems.slice(0, 5).map((item, index) => (
                  <div key={item.item.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg" data-testid={`top-item-${index}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
                        index === 0 ? 'bg-primary/10 text-primary' :
                        index === 1 ? 'bg-secondary/50 text-secondary-foreground' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm" data-testid={`top-item-name-${index}`}>{item.item.name}</p>
                        <p className="text-xs text-muted-foreground" data-testid={`top-item-category-${index}`}>{item.item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm" data-testid={`top-item-sold-${index}`}>{item.totalSold} sold</p>
                      <p className="text-xs text-muted-foreground" data-testid={`top-item-revenue-${index}`}>₹{item.totalRevenue}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                  <div className="text-center">
                    <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No sales data available</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card data-testid="inventory-turnover">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5" />
              <span>Inventory Turnover</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 bg-muted/20 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PieChart className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground text-sm">Inventory Chart</p>
                <p className="text-xs text-muted-foreground">Pie chart coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="customer-distribution">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5" />
              <span>Customer Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 bg-muted/20 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PieChart className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground text-sm">Customer Chart</p>
                <p className="text-xs text-muted-foreground">Donut chart coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="payment-methods">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Payment Methods</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentMethods.map((method, index) => (
                <div key={method.name} className="space-y-2" data-testid={`payment-method-${index}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" data-testid={`payment-name-${index}`}>{method.name}</span>
                    <span className="font-medium" data-testid={`payment-percentage-${index}`}>{method.percentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`${method.color} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${method.percentage}%` }}
                      data-testid={`payment-bar-${index}`}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Total Processed</span>
                </span>
                <span className="font-bold" data-testid="total-processed">₹{analyticsData.revenue}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
