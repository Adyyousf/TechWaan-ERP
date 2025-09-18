# Overview

SimplERP is a comprehensive business management system built as a full-stack web application. It provides GST-compliant billing, inventory management, customer and vendor management, and business analytics. The application is designed for small to medium businesses that need integrated solutions for managing their operations, sales, and compliance requirements.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation schemas
- **Build Tool**: Vite for fast development and optimized builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety across the stack
- **API Pattern**: RESTful API design with structured route organization
- **Authentication**: OpenID Connect integration with Replit Auth
- **Session Management**: Express sessions with PostgreSQL storage
- **Middleware**: Custom logging, error handling, and authentication middleware

## Database Design
- **Database**: PostgreSQL with connection pooling via Neon serverless
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Data Validation**: Drizzle-Zod integration for schema-to-validation mapping

## Core Data Models
- **Users**: Authentication and role-based access (admin/sales)
- **Items**: Product catalog with inventory tracking and GST rates
- **Customers/Vendors**: Contact management with GST compliance fields
- **Inventory**: Stock levels with movement tracking and low stock alerts
- **Billing**: GST-compliant invoice generation with line items
- **Stock Movements**: Audit trail for inventory adjustments

## Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect
- **Session Storage**: PostgreSQL-backed session store
- **Role-Based Access**: Admin and sales user roles
- **Route Protection**: Middleware-based authentication checks

## Development Patterns
- **Monorepo Structure**: Shared schema and types between client/server
- **Type Safety**: End-to-end TypeScript with shared interfaces
- **Error Handling**: Consistent error responses with user feedback
- **Code Organization**: Feature-based folder structure with reusable components

# External Dependencies

## Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database with connection pooling
- **Connect PG Simple**: PostgreSQL session store for Express sessions

## Authentication
- **Replit Auth**: OpenID Connect authentication provider
- **OpenID Client**: Authentication middleware and token handling

## Frontend Libraries
- **Radix UI**: Accessible component primitives for UI elements
- **Lucide React**: Icon library for consistent iconography
- **Date-fns**: Date manipulation and formatting utilities
- **Class Variance Authority**: Utility for managing component variants

## Development Tools
- **TSX**: TypeScript execution for development server
- **ESBuild**: Fast bundling for production builds
- **Replit Plugins**: Development tooling and error overlay integration

## Business Logic Dependencies
- **React Hook Form**: Form state management and validation
- **Zod**: Schema validation and type inference
- **TanStack Query**: Server state synchronization and caching