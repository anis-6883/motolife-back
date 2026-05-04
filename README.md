# Moto Life API - Backend Service

A robust and scalable REST API built with NestJS for the Moto Life motorcycle e-commerce platform. This backend service powers the marketplace connecting riders with trusted vendors across Bangladesh.

![Moto Life](https://motolife-root.vercel.app/images/auth/logo.png)

## 🏍️ Overview

Moto Life API is a comprehensive backend service that handles all business logic, data management, and third-party integrations for the motorcycle e-commerce platform. Built with NestJS, it follows best practices for enterprise-grade applications with a focus on modularity, scalability, and maintainability.

## ✨ Features

### Core Functionality

- **Authentication & Authorization**: JWT-based authentication with role-based access control (RBAC)
- **User Management**: Customer and seller account management
- **Product Management**: CRUD operations for products, categories, and inventory
- **Order Processing**: Complete order lifecycle management
- **Payment Integration**: Secure payment processing with multiple payment gateways
- **Cart & Wishlist**: Session-based and persistent cart/wishlist management
- **Search & Filtering**: Advanced product search with filters and sorting
- **Review & Ratings**: Product review and rating system
- **File Upload**: Image upload and management for products
- **Email Notifications**: Automated email notifications for orders, registrations, etc.
- **Order Tracking**: Real-time order status tracking
- **Flash Sales**: Time-limited promotional deals with inventory management
- **Combo Offers**: Bundle product management
- **Seller Dashboard**: Analytics and order management for vendors
- **Admin Panel**: Platform administration and monitoring

### Technical Features

- RESTful API architecture
- OpenAPI/Swagger documentation
- Input validation and sanitization
- Error handling and logging
- Database migrations and seeding
- Rate limiting and security middleware
- CORS configuration
- File upload with validation
- Caching with Redis
- Queue management for async tasks
- API versioning

## 🛠️ Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) v10.x
- **Language**: TypeScript
- **Database**: PostgreSQL (or MongoDB)
- **ORM**: TypeORM (or Prisma/Mongoose)
- **Authentication**: Passport.js + JWT
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Caching**: Redis
- **Queue**: Bull (Redis-based)
- **File Storage**: AWS S3 / Cloudinary
- **Email**: Nodemailer / SendGrid
- **Payment**: SSLCommerz / bKash / Nagad
- **Testing**: Jest
- **Logging**: Winston / Pino

## 📋 Prerequisites

- Node.js >= 18.x
- npm or yarn or pnpm
- PostgreSQL >= 14.x (or MongoDB >= 6.x)
- Redis >= 6.x (optional, for caching)
- Docker (optional, for containerization)

## 🚀 Getting Started

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd motolife-api
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Configure your `.env` file:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=motolife_db

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=30d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_LOCATION=./uploads
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@motolife.com

# Payment Gateway
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWORD=
SSLCOMMERZ_IS_LIVE=false

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10
```

5. Run database migrations:

```bash
npm run migration:run
# or
npm run db:push  # for Prisma
```

6. Seed the database (optional):

```bash
npm run seed
```

7. Start the development server:

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000/api/v1`

API documentation (Swagger) will be available at `http://localhost:3000/api/docs`

## 📁 Project Structure

```
motolife-api/
├── src/
│   ├── modules/
│   │   ├── auth/              # Authentication & authorization
│   │   ├── users/             # User management
│   │   ├── products/          # Product management
│   │   ├── categories/        # Product categories
│   │   ├── orders/            # Order processing
│   │   ├── cart/              # Shopping cart
│   │   ├── wishlist/          # Wishlist management
│   │   ├── reviews/           # Product reviews
│   │   ├── payments/          # Payment processing
│   │   ├── sellers/           # Seller management
│   │   ├── flash-sales/       # Flash sale management
│   │   ├── combos/            # Combo offer management
│   │   ├── notifications/     # Email & push notifications
│   │   ├── analytics/         # Analytics & reporting
│   │   └── admin/             # Admin functionalities
│   ├── common/
│   │   ├── decorators/        # Custom decorators
│   │   ├── filters/           # Exception filters
│   │   ├── guards/            # Authentication guards
│   │   ├── interceptors/      # Request/response interceptors
│   │   ├── pipes/             # Validation pipes
│   │   └── middleware/        # Custom middleware
│   ├── config/                # Configuration files
│   ├── database/
│   │   ├── migrations/        # Database migrations
│   │   ├── seeds/             # Database seeders
│   │   └── entities/          # TypeORM entities
│   ├── utils/                 # Utility functions
│   ├── constants/             # Application constants
│   ├── types/                 # TypeScript types/interfaces
│   ├── app.module.ts          # Root module
│   └── main.ts                # Application entry point
├── test/                      # E2E tests
├── .env.example               # Environment variables template
├── .eslintrc.js               # ESLint configuration
├── .prettierrc                # Prettier configuration
├── nest-cli.json              # NestJS CLI configuration
├── tsconfig.json              # TypeScript configuration
├── package.json
└── README.md
```

## 🔑 API Endpoints

### Authentication

```
POST   /api/v1/auth/register          # Register new user
POST   /api/v1/auth/login             # User login
POST   /api/v1/auth/refresh           # Refresh access token
POST   /api/v1/auth/logout            # User logout
POST   /api/v1/auth/forgot-password   # Request password reset
POST   /api/v1/auth/reset-password    # Reset password
GET    /api/v1/auth/verify-email      # Verify email address
```

### Users

```
GET    /api/v1/users/me               # Get current user profile
PATCH  /api/v1/users/me               # Update current user profile
DELETE /api/v1/users/me               # Delete current user account
GET    /api/v1/users/:id              # Get user by ID (Admin)
GET    /api/v1/users                  # Get all users (Admin)
```

### Products

```
GET    /api/v1/products               # Get all products (with filters)
GET    /api/v1/products/:id           # Get product by ID
POST   /api/v1/products               # Create product (Seller)
PATCH  /api/v1/products/:id           # Update product (Seller)
DELETE /api/v1/products/:id           # Delete product (Seller/Admin)
GET    /api/v1/products/search        # Search products
GET    /api/v1/products/featured      # Get featured products
GET    /api/v1/products/flash-sale    # Get flash sale products
```

### Categories

```
GET    /api/v1/categories             # Get all categories
GET    /api/v1/categories/:id         # Get category by ID
POST   /api/v1/categories             # Create category (Admin)
PATCH  /api/v1/categories/:id         # Update category (Admin)
DELETE /api/v1/categories/:id         # Delete category (Admin)
```

### Orders

```
GET    /api/v1/orders                 # Get user orders
GET    /api/v1/orders/:id             # Get order by ID
POST   /api/v1/orders                 # Create order
PATCH  /api/v1/orders/:id/status      # Update order status (Seller)
DELETE /api/v1/orders/:id             # Cancel order
GET    /api/v1/orders/track/:trackingId  # Track order
```

### Cart

```
GET    /api/v1/cart                   # Get user cart
POST   /api/v1/cart/items             # Add item to cart
PATCH  /api/v1/cart/items/:id         # Update cart item
DELETE /api/v1/cart/items/:id         # Remove item from cart
DELETE /api/v1/cart                   # Clear cart
```

### Wishlist

```
GET    /api/v1/wishlist               # Get user wishlist
POST   /api/v1/wishlist               # Add item to wishlist
DELETE /api/v1/wishlist/:productId    # Remove item from wishlist
```

### Reviews

```
GET    /api/v1/reviews/product/:id    # Get product reviews
POST   /api/v1/reviews                # Create review
PATCH  /api/v1/reviews/:id            # Update review
DELETE /api/v1/reviews/:id            # Delete review
```

### Payments

```
POST   /api/v1/payments/initiate      # Initiate payment
POST   /api/v1/payments/callback      # Payment gateway callback
GET    /api/v1/payments/:orderId      # Get payment status
```

### Sellers

```
POST   /api/v1/sellers/register       # Register as seller
GET    /api/v1/sellers/dashboard      # Get seller dashboard
GET    /api/v1/sellers/orders         # Get seller orders
GET    /api/v1/sellers/analytics      # Get seller analytics
```

## 📦 Available Scripts

```bash
# Development
npm run start              # Start application
npm run start:dev          # Start in watch mode
npm run start:debug        # Start in debug mode

# Building
npm run build              # Build application
npm run start:prod         # Start production build

# Testing
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run end-to-end tests

# Linting & Formatting
npm run lint               # Run ESLint
npm run format             # Format code with Prettier

# Database
npm run migration:generate # Generate migration
npm run migration:run      # Run migrations
npm run migration:revert   # Revert migration
npm run seed               # Seed database
```

## 🔒 Security

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token generation and validation
- **Rate Limiting**: Prevent brute force attacks
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers
- **Input Validation**: Request validation with class-validator
- **SQL Injection Prevention**: ORM parameterized queries
- **XSS Protection**: Input sanitization

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🐳 Docker

### Build and run with Docker:

```bash
# Build image
docker build -t motolife-api .

# Run container
docker run -p 3000:3000 motolife-api

# Using docker-compose
docker-compose up
```

### docker-compose.yml example:

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: motolife_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

volumes:
  postgres_data:
```

## 🚀 Deployment

### Deploy to Production

1. Build the application:

```bash
npm run build
```

2. Set production environment variables

3. Run migrations:

```bash
npm run migration:run
```

4. Start the application:

```bash
npm run start:prod
```

### Deploy with PM2:

```bash
pm2 start ecosystem.config.js
```

### Deploy to Cloud:

- **Heroku**: Use the included `Procfile`
- **AWS**: Use Elastic Beanstalk or ECS
- **DigitalOcean**: Use App Platform
- **Railway**: Connect GitHub repository

## 📚 API Documentation

Interactive API documentation is available via Swagger UI:

- **Development**: http://localhost:3000/api/docs
- **Production**: https://api.motolife.com/api/docs

## 🔄 Database Schema

### Main Entities

- **Users**: Customer and seller accounts
- **Products**: Product catalog
- **Categories**: Product categorization
- **Orders**: Order management
- **OrderItems**: Line items in orders
- **Cart**: Shopping cart
- **CartItems**: Cart line items
- **Wishlist**: User wishlist
- **Reviews**: Product reviews and ratings
- **Payments**: Payment transactions
- **FlashSales**: Time-limited deals
- **Combos**: Bundle offers
- **Notifications**: Email and push notifications

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Run linting before committing

## 📞 Support & Contact

For support and inquiries:

- **Address**: Bangshal, Dhaka, Bangladesh
- **Phone**: 01322140062
- **Email**: contact.motolife@gmail.com

## 📄 License

This project is proprietary software. All rights reserved.

## 🙏 Acknowledgments

- NestJS team for the excellent framework
- TypeORM/Prisma for database management
- All open-source contributors

---

**API Documentation**: https://api.motolife.com/api/docs

Copyright ©2025-present MotoLife. All rights reserved.
