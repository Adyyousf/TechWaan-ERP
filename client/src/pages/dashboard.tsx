import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatsCard from "@/components/ui/stats-card";
import { 
  Package, 
  Users, 
  IndianRupee, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RotateCcw
} from "lucide-react";

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

interface Transaction {
  type: 'sale' | 'purchase';
  amount: string;
  description: string;
  createdAt: string;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/dashboard/recent-transactions'],
  });

  if (statsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-8 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="dashboard-content">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Items"
          value={stats?.totalItems.toString() || "0"}
          icon={Package}
          trend="+12% from last month"
          trendDirection="up"
          bgColor="bg-primary/10"
          iconColor="text-primary"
          data-testid="stats-total-items"
        />
        
        <StatsCard
          title="Active Customers"
          value={stats?.totalCustomers.toString() || "0"}
          icon={Users}
          trend="+5% from last month"
          trendDirection="up"
          bgColor="bg-blue-500/10"
          iconColor="text-blue-500"
          data-testid="stats-active-customers"
        />
        
        <StatsCard
          title="Monthly Sales"
          value={`₹${stats?.monthlySales || "0"}`}
          icon={IndianRupee}
          trend="+18% from last month"
          trendDirection="up"
          bgColor="bg-green-500/10"
          iconColor="text-green-500"
          data-testid="stats-monthly-sales"
        />
        
        <StatsCard
          title="Low Stock Items"
          value={stats?.lowStockItems.toString() || "0"}
          icon={AlertTriangle}
          trend="Requires attention"
          trendDirection="neutral"
          bgColor="bg-destructive/10"
          iconColor="text-destructive"
          data-testid="stats-low-stock"
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="sales-trend-chart">
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Chart implementation coming soon</p>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="recent-transactions">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactionsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg animate-pulse">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-muted rounded-lg"></div>
                        <div>
                          <div className="h-4 bg-muted rounded w-32 mb-1"></div>
                          <div className="h-3 bg-muted rounded w-16"></div>
                        </div>
                      </div>
                      <div className="h-4 bg-muted rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : recentTransactions && recentTransactions.length > 0 ? (
                recentTransactions.slice(0, 5).map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg" data-testid={`transaction-${index}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${transaction.type === 'sale' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {transaction.type === 'sale' ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className={`font-medium ${transaction.type === 'sale' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'sale' ? '+' : '-'}₹{transaction.amount}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                  <div className="text-center">
                    <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No recent transactions</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
