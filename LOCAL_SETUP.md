# SimplERP - Local Setup Guide

## 📦 Quick Start

### 1. Extract the Archive
```bash
tar -xzf SimplERP-codebase.tar.gz
cd SimplERP-codebase
```

### 2. Install Dependencies
```bash
# Install Node.js dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```bash
# Database Configuration (required)
DATABASE_URL=postgresql://username:password@localhost:5432/simpl_erp
PGHOST=localhost
PGPORT=5432
PGDATABASE=simpl_erp
PGUSER=your_username
PGPASSWORD=your_password

# Session Secret (required)
SESSION_SECRET=your-super-secret-session-key-here

# Replit OIDC (for authentication - optional for local testing)
REPLIT_OIDC_ISSUER=https://replit.com
```

### 4. Database Setup
Make sure you have PostgreSQL installed and running:

```bash
# Create database
createdb simpl_erp

# Push database schema
npm run db:push
```

### 5. Start the Application
```bash
# Development mode (starts both backend and frontend)
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:5000/api

## 🔧 Local Development Features

- **Hot Reload**: Both frontend and backend auto-reload on changes
- **Database**: Uses your local PostgreSQL instance
- **Authentication**: Simplified for local development (or configure OIDC)

## 🛠️ Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux

# Test connection
psql -h localhost -p 5432 -U your_username -d simpl_erp
```

### Authentication Issues
For local testing, you may want to modify the authentication to bypass OIDC:
- Edit `server/replitAuth.ts` for simpler local auth
- Or set up a local OIDC provider

### Port Conflicts
If port 5000 is in use:
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in package.json
```

## 📁 Project Structure
```
SimplERP-codebase/
├── client/           # React frontend
├── server/           # Node.js backend  
├── shared/           # Shared types/schemas
├── package.json      # Dependencies & scripts
├── README.md         # Full documentation
└── LOCAL_SETUP.md    # This file
```

## 🚀 Production Deployment

For production deployment:
1. Set `NODE_ENV=production`
2. Use proper PostgreSQL instance
3. Configure real OIDC provider
4. Set secure session secrets
5. Enable HTTPS

## 📧 Support

Check the main README.md for:
- Complete feature documentation
- API endpoints
- Customization guide
- Troubleshooting tips

Happy coding! 🎉