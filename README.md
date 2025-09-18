# SimplERP - Business Management System

A modern, comprehensive ERP (Enterprise Resource Planning) system built with Django MVT backend and React frontend. This system provides essential business management functionality including inventory management, GST-compliant billing, customer/vendor management, and real-time analytics.

## 🚀 Features

### Core Functionality
- **Item Management**: Complete product catalog with categories, pricing, and GST rates
- **Inventory Tracking**: Real-time stock levels with low-stock alerts and movement history
- **Customer & Vendor Management**: Complete contact management with GST compliance
- **GST Billing**: Generate GST-compliant invoices with automatic tax calculations (CGST/SGST/IGST)
- **Purchase Management**: Track purchases and automatically update inventory
- **Analytics Dashboard**: Real-time business metrics and transaction analytics
- **User Authentication**: Secure authentication using Replit OIDC integration

### Technical Features
- **Hybrid Architecture**: Django MVT backend with React SPA frontend
- **Real-time Data**: Live inventory updates and transaction tracking
- **Database Persistence**: PostgreSQL database with proper data modeling
- **RESTful API**: Clean JSON API endpoints for frontend integration
- **Responsive Design**: Modern, mobile-friendly user interface
- **Security**: JWT-based authentication with role-based access control

## 🏗️ Architecture

### Technology Stack

#### Backend (Django MVT)
- **Framework**: Django 5.2.6 with Django REST Framework
- **Database**: PostgreSQL with Django ORM
- **Authentication**: Replit OIDC JWT verification
- **API**: RESTful JSON endpoints

#### Frontend (React SPA) 
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing

#### Database Schema
- **Users**: Authentication and role management
- **Items**: Product catalog with GST rates
- **Inventory**: Stock levels and movements
- **Customers/Vendors**: Contact management
- **Bills/Purchases**: Transaction records with GST compliance
- **Analytics**: Real-time business metrics

## 📋 Prerequisites

- **Python 3.11+** with pip
- **Node.js 18+** with npm
- **PostgreSQL 12+** database
- **Replit environment** (for OIDC authentication)

## 🔧 Installation & Setup

### 1. Clone and Setup Environment

```bash
# Clone the repository
git clone <repository-url>
cd simple-erp

# Install Python dependencies
pip install django djangorestframework psycopg2-binary python-decouple django-cors-headers PyJWT cryptography

# Install Node.js dependencies  
npm install
```

### 2. Database Configuration

The system is configured to use PostgreSQL. Set up your database environment variables:

```bash
# Environment variables (set in Replit Secrets or .env file)
PGDATABASE=your_database_name
PGUSER=your_database_user  
PGPASSWORD=your_database_password
PGHOST=your_database_host
PGPORT=5432
```

### 3. Django Backend Setup

```bash
# Navigate to Django project
cd /path/to/project

# Test Django database connection
python manage.py check --database default

# Start Django development server (on port 8000)
python manage.py runserver 0.0.0.0:8000
```

### 4. React Frontend Setup

```bash
# Start React development server (on port 5000)
npm run dev
```

### 5. Development Mode

For development, you can run both servers simultaneously:

- **Django API**: `http://localhost:8000/api/`
- **React Frontend**: `http://localhost:5000`

The React app is configured to proxy API requests to the Django backend.

## 🎮 Usage Demo

### Authentication Flow
1. **Login**: Click "Sign In" to authenticate via Replit OIDC
2. **Dashboard**: View business metrics and recent transactions
3. **Role-based Access**: Admin and sales team roles with appropriate permissions

### Inventory Management
1. **Add Items**: Navigate to Items → Add New Item
   - Set item code, name, category, price, GST rate
   - Configure low stock threshold
2. **Stock Updates**: Navigate to Inventory → Update Stock
   - Adjust quantities with reason tracking
   - View stock movement history
3. **Low Stock Alerts**: Automatic alerts when items fall below threshold

### Customer & Vendor Management
1. **Add Contacts**: Navigate to Customers/Vendors → Add New
   - Complete contact information with GST details
   - Address management for billing compliance
2. **Search & Filter**: Find contacts quickly with search functionality

### GST Billing Workflow
1. **Create Bill**: Navigate to GST Billing → Create New Bill
   - Select customer from dropdown
   - Add multiple items with quantities
   - Automatic GST calculation (CGST + SGST or IGST)
   - Generate bill number automatically
2. **Bill Management**: View, print, and track bill status
3. **Inventory Integration**: Stock automatically reduced on bill generation

### Purchase Management
1. **Record Purchases**: Navigate to Purchases → Add Purchase
   - Select vendor and items
   - Quantities automatically added to inventory
   - Track purchase history and costs

### Analytics & Reporting
1. **Dashboard Metrics**: 
   - Total items, customers, monthly sales
   - Low stock alerts, pending bills
   - Today's sales and GST collection
2. **Transaction History**: View recent sales and purchase transactions
3. **Top Selling Items**: Track best-performing products

## 🔌 API Endpoints

### Django Backend Endpoints (Port 8000)

#### Inventory Management
```
GET    /api/items/              # List all items with inventory
GET    /api/customers/          # List all customers  
GET    /api/vendors/            # List all vendors
GET    /api/inventory/          # Current inventory levels
GET    /api/inventory/low-stock/ # Low stock items
GET    /api/stock-movements/    # Stock movement history
```

#### Billing & Purchases
```
GET    /api/bills/              # List all bills
POST   /api/bills/              # Create new bill
GET    /api/purchases/          # List all purchases
```

#### Analytics
```
GET    /api/dashboard/stats/    # Dashboard statistics
```

### Authentication
All API endpoints require JWT authentication via `Authorization: Bearer <token>` header.

## 🚀 Deployment

### Replit Deployment
1. **Set Environment Variables**: Configure database and authentication secrets
2. **Start Services**: Both Django and React servers can run simultaneously
3. **Database**: Use Replit's PostgreSQL database integration
4. **Domain**: Access via your Replit app URL

### Production Considerations
- Configure `DEBUG=False` in Django settings
- Set proper `ALLOWED_HOSTS` for your domain
- Use environment variables for all secrets
- Enable HTTPS for production deployment
- Set up proper CORS origins for React frontend

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication with Replit OIDC
- **Role-based Access**: Admin and sales team permissions
- **CORS Protection**: Properly configured cross-origin requests
- **Input Validation**: Server-side validation for all API inputs
- **SQL Injection Protection**: Django ORM prevents SQL injection attacks

## 📊 Data Models

### Core Entities
- **Users**: Authentication, roles, profile information
- **Items**: Product catalog with pricing and GST configuration
- **Inventory**: Stock quantities and movement tracking
- **Customers/Vendors**: Contact management with GST compliance
- **Bills**: Sales transactions with line items and GST calculations
- **Purchases**: Purchase transactions with automatic inventory updates

### Key Relationships
- Items ↔ Inventory (one-to-one)
- Bills ↔ Bill Items (one-to-many)
- Stock Movements → Items (many-to-one)
- Users → Bills/Purchases (created_by relationship)

## 🛠️ Development

### Backend Development (Django)
```bash
# Create new Django app
python manage.py startapp new_app

# Add to INSTALLED_APPS in settings.py
# Create models in models.py
# Create views in views.py  
# Configure URLs in urls.py
```

### Frontend Development (React)
```bash
# Add new page component
# Register in App.tsx routing
# Use TanStack Query for API calls
# Style with Tailwind CSS and shadcn/ui
```

### Database Schema Changes
The Django models use `managed = False` to map to existing PostgreSQL tables created by the Node.js version. To modify the schema:

1. Update the table structure in PostgreSQL
2. Update corresponding Django model
3. Test API endpoints

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check environment variables
   - Test connection with Django's `python manage.py check --database default`

2. **Authentication Issues**
   - Verify Replit OIDC configuration
   - Check JWT token in browser developer tools
   - Confirm REPLIT_OIDC_ISSUER setting

3. **CORS Errors**
   - Verify CORS_ALLOWED_ORIGINS in Django settings
   - Check frontend API base URL configuration

4. **API Endpoint Errors**
   - Check Django URL configuration
   - Verify model field mappings to database columns
   - Review API view implementations

### Development Tips
- Use Django admin at `/admin/` for data management
- Check Django logs for backend errors
- Use browser developer tools for frontend debugging
- Test API endpoints directly with curl or Postman

## 📈 Performance Optimization

- **Database Indexing**: Optimized queries with proper indexes
- **API Caching**: Cache frequently accessed data
- **Frontend Optimization**: React Query for intelligent caching
- **Bundle Optimization**: Vite for fast builds and hot reloading

## 🔄 Migration from Node.js

This Django backend is designed to be a drop-in replacement for the existing Node.js backend:

1. **API Compatibility**: Same endpoint URLs and response formats
2. **Database Compatibility**: Uses existing PostgreSQL schema
3. **Authentication**: Same Replit OIDC integration
4. **Feature Parity**: All core functionality maintained

### Migration Steps
1. Deploy Django backend on separate port
2. Update frontend API base URL
3. Test functionality parity
4. Switch traffic from Node.js to Django
5. Decommission Node.js backend

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🎨 Customizable Features

SimplERP is designed to be easily customizable for your business needs. Here are the key areas you can modify to match your brand and requirements:

### 🏷️ Application Branding

#### Change Application Name
1. **Frontend Title**: Edit `client/index.html`
   ```html
   <title>Your Company ERP</title>
   ```

2. **Application Header**: Edit `client/src/components/layout/header.tsx`
   ```tsx
   <h1 className="text-xl font-bold">Your Company Name</h1>
   ```

3. **Sidebar Logo**: Edit `client/src/components/layout/sidebar.tsx`
   ```tsx
   <div className="flex items-center space-x-2 p-4">
     <Building2 className="h-8 w-8 text-primary" />
     <span className="text-xl font-bold">YourERP</span>
   </div>
   ```

#### Add Your Company Logo
1. **Add Logo File**: Place your logo in `client/public/logo.png`
2. **Update Sidebar**: Edit `client/src/components/layout/sidebar.tsx`
   ```tsx
   <div className="flex items-center space-x-2 p-4">
     <img src="/logo.png" alt="Company Logo" className="h-8 w-8" />
     <span className="text-xl font-bold">Your Company</span>
   </div>
   ```

3. **Update Header**: Edit `client/src/components/layout/header.tsx`
   ```tsx
   <img src="/logo.png" alt="Logo" className="h-6 w-6 mr-2" />
   ```

### 🎨 Color Scheme & Theme

#### Primary Colors
Edit `client/src/index.css` to change the color scheme:
```css
:root {
  --primary: 210 40% 50%;        /* Your primary brand color */
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;      /* Your secondary color */
  --accent: 210 40% 90%;         /* Your accent color */
}
```

#### Dark Theme Colors
```css
.dark {
  --primary: 210 40% 60%;        /* Dark mode primary */
  --secondary: 217.2 32.6% 17.5%; /* Dark mode secondary */
}
```

### 🏢 Business Information

#### Company Details
Edit `shared/schema.ts` to customize business information:
```typescript
// Add your company defaults
export const COMPANY_INFO = {
  name: "Your Company Ltd",
  address: "Your Business Address",
  gstNumber: "Your GST Number",
  phone: "Your Phone Number",
  email: "your-email@company.com"
};
```

#### GST Configuration
Edit GST rates in `client/src/components/modals/billing-modal.tsx`:
```typescript
// Customize GST rates for your region
const GST_RATES = {
  CGST: 0.09,  // 9% CGST
  SGST: 0.09,  // 9% SGST  
  IGST: 0.18   // 18% IGST
};
```

### 📊 Dashboard Customization

#### Dashboard Metrics
Edit `client/src/pages/dashboard.tsx` to show your preferred metrics:
```tsx
// Add custom business metrics
const CustomMetric = () => (
  <Card>
    <CardHeader>
      <CardTitle>Your Custom Metric</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{customValue}</div>
    </CardContent>
  </Card>
);
```

#### Analytics Charts
Modify `client/src/pages/analytics.tsx` to add custom charts:
```tsx
// Add your specific business charts
import { LineChart, BarChart } from "recharts";
```

### 🔧 Business Logic Customization

#### Item Categories
Edit item categories in `client/src/pages/items.tsx`:
```typescript
const ITEM_CATEGORIES = [
  "Electronics", 
  "Clothing",
  "Food & Beverages",
  "Your Custom Categories"
];
```

#### Bill Number Format
Customize bill numbering in `server/storage.ts`:
```typescript
async getNextBillNumber(): Promise<string> {
  // Customize bill number format: ABC-2024-001
  return `${YOUR_PREFIX}-${year}-${String(nextNumber).padStart(3, '0')}`;
}
```

#### Purchase Number Format
```typescript
async getNextPurchaseNumber(): Promise<string> {
  // Customize purchase number format: PO-2024-001
  return `PO-${year}-${String(nextNumber).padStart(3, '0')}`;
}
```

### 🏪 Module Customization

#### Add Custom Fields
1. **Customer Fields**: Edit `shared/schema.ts`
   ```typescript
   export const customers = pgTable('customers', {
     // Add custom fields
     businessType: varchar('business_type', { length: 100 }),
     creditLimit: decimal('credit_limit', { precision: 10, scale: 2 }),
   });
   ```

2. **Item Fields**: Add product-specific fields
   ```typescript
   export const items = pgTable('items', {
     // Add custom item fields
     brand: varchar('brand', { length: 100 }),
     warranty: varchar('warranty', { length: 50 }),
     supplier: varchar('supplier', { length: 255 }),
   });
   ```

#### Hide/Show Modules
Edit `client/src/components/layout/sidebar.tsx` to customize navigation:
```tsx
const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Items', href: '/items', icon: Package },
  // Hide modules by commenting out
  // { name: 'Analytics', href: '/analytics', icon: TrendingUp },
  // Add custom modules
  { name: 'Custom Module', href: '/custom', icon: Settings },
];
```

### 📧 Email & Notifications

#### Email Templates
Create custom email templates in `server/` directory:
```typescript
// server/emailTemplates.ts
export const billEmailTemplate = (bill: Bill) => ({
  subject: `Invoice ${bill.billNumber} from Your Company`,
  html: `Your custom email template HTML`
});
```

#### Notification Preferences
Edit notification settings in `client/src/hooks/useToast.ts`:
```typescript
// Customize notification duration and style
toast({
  title: "Your Custom Success Message",
  description: "Your custom description",
  duration: 5000, // 5 seconds
});
```

### 🗄️ Database Customization

#### Add Custom Tables
1. **Define Schema**: Edit `shared/schema.ts`
   ```typescript
   export const yourCustomTable = pgTable('your_table', {
     id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
     name: varchar('name', { length: 255 }).notNull(),
     // Add your fields
   });
   ```

2. **Add API Routes**: Edit `server/routes.ts`
   ```typescript
   app.get('/api/your-endpoint', async (req, res) => {
     // Your custom API logic
   });
   ```

### 🔐 Authentication Customization

#### Custom User Roles
Edit `shared/schema.ts` to add more user roles:
```typescript
export const USER_ROLES = [
  'admin',
  'sales',
  'manager',          // Add custom roles
  'accountant',
  'warehouse_staff'
] as const;
```

#### Role-Based Access
Add role checks in components:
```tsx
const { user } = useAuth();
const canViewFinancials = user?.role === 'admin' || user?.role === 'accountant';

{canViewFinancials && (
  <FinancialReports />
)}
```

### 💾 Backup & Data Migration

#### Export Configuration
```typescript
// Add to server/routes.ts
app.get('/api/export/config', async (req, res) => {
  const config = {
    companyInfo: COMPANY_INFO,
    gstRates: GST_RATES,
    categories: ITEM_CATEGORIES
  };
  res.json(config);
});
```

### 📱 Mobile Customization

The app is responsive by default, but you can customize mobile layouts:
```tsx
// Add mobile-specific styling
<div className="md:hidden">
  {/* Mobile-only content */}
</div>
<div className="hidden md:block">
  {/* Desktop-only content */}
</div>
```

### 🔧 Development Tips

1. **Test Changes**: Always test in development before deploying
2. **Database Backup**: Backup your database before schema changes
3. **Environment Variables**: Use environment variables for sensitive customizations
4. **Version Control**: Track your customizations with git
5. **Documentation**: Document your customizations for team members

### 📞 Support

After customization, ensure your changes don't break:
- Authentication flow
- Database relationships
- API endpoints
- Core business logic

This modular architecture makes SimplERP highly customizable while maintaining system stability and data integrity.

---

**SimplERP** - Streamlining business operations with modern technology. Built with ❤️ for efficient business management.