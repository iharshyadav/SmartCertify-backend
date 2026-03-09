# 🎓 SmartCertify Backend

<div align="center">

![SmartCertify](https://img.shields.io/badge/SmartCertify-Backend-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)

**AI-Powered Certificate Management System Backend API**

</div>

---

## 🌟 What is SmartCertify Backend?

Welcome to the heart of SmartCertify! Our backend is more than just an API – it's a comprehensive system that powers the next generation of certificate management. Built with modern technologies and security-first principles, it handles everything from user authentication to AI-powered certificate processing.

### 🎯 Why SmartCertify Backend Matters

- **🛡️ Enterprise Security**: Advanced JWT authentication with refresh tokens, account lockout protection, and bcrypt encryption
- **🤖 AI Integration**: OpenAI GPT integration for intelligent certificate data extraction and processing  
- **📊 Smart Database**: Prisma ORM with PostgreSQL for reliable data management
- **🔗 API Excellence**: RESTful APIs built with Express.js and TypeScript for type safety
- **📁 File Handling**: Multer integration for secure certificate file uploads
- **🌐 OAuth Ready**: Google OAuth integration for seamless user onboarding

---

## 🚀 Quick Start Guide

### Prerequisites

Before diving in, make sure you have:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **PostgreSQL** database - [Download here](https://www.postgresql.org/download/)
- **pnpm** package manager - `npm install -g pnpm`

### 🔧 Installation & Setup

1. **Clone and Navigate**
   ```bash
   git clone https://github.com/iharshyadav/SmartCertify-backend
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the backend root:
   ```env
   # Database Configuration
   DATABASE_URL="postgresql://username:password@localhost:5432/smartcertify"

   # JWT Secrets (Generate strong secrets!)
   JWT_SECRET="your-super-secret-jwt-key-here"
   REFRESH_TOKEN_SECRET="your-super-secret-refresh-token-key-here"

   # Google OAuth (Optional but recommended)
   GOOGLE_CLIENT_ID="your-google-oauth-client-id"
   GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

   # OpenAI Integration
   OPENAI_API_KEY="your-openai-api-key"

   # Server Configuration
   PORT=8000
   NODE_ENV=development
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma db push

   # (Optional) Seed with sample data
   npx prisma db seed
   ```

5. **Start Development Server**
   ```bash
   pnpm run dev
   ```

   🎉 **Success!** Your backend is now running at `http://localhost:8000`

---

## 🏗️ Project Architecture

```
backend/
├── app/                          # Main application code
│   ├── controllers/              # Request handlers
│   │   ├── auth-controller.ts    # Authentication logic
│   │   ├── user-controller.ts    # User management
│   │   ├── uploadFile.ts         # File upload handling
│   │   └── openai.ts            # AI processing
│   ├── routes/                   # API routes
│   │   └── user-route.ts        # User & auth routes
│   ├── middlewares/              # Custom middleware
│   │   └── multer.ts            # File upload middleware
│   └── databases/                # Database configuration
│       └── prismadb.ts          # Prisma client setup
├── prisma/                       # Database schema & migrations
│   └── schema.prisma            # Database schema
├── dist/                         # Compiled JavaScript
├── .env                         # Environment variables
├── package.json                 # Dependencies & scripts
└── tsconfig.json               # TypeScript configuration
```

---

## 🔐 Authentication System

Our authentication system is built with security as the top priority:

### Features
- **🔑 JWT Tokens**: Secure access tokens with refresh token rotation
- **🛡️ Account Security**: Automatic account lockout after 5 failed attempts
- **🔐 Password Security**: bcrypt hashing with salt rounds
- **🌐 OAuth Integration**: Google Sign-In support
- **⏰ Session Management**: Configurable token expiration

### User Types
- **👩‍🎓 Students**: Access certificates, verify credentials
- **🏛️ Institutions**: Issue certificates, manage users, bulk operations

### API Endpoints

#### Authentication Routes
```
POST /api/signup          # Create new account
POST /api/signin          # User login
POST /api/googlesignin    # Google OAuth login
```

#### User Management Routes
```
GET  /api/getprofile      # Get user profile (Protected)
PUT  /api/updateprofile   # Update user profile (Protected)
```

#### File & AI Routes
```
POST /api/uploadfile      # Upload certificate files (Protected)
POST /api/openai          # AI certificate processing (Protected)
```

---

## 📊 Database Schema

Our database is designed for scalability and performance:

### User Model
```typescript
model User {
  id                    String    @id @default(cuid())
  email                String    @unique
  username             String    @unique
  password             String
  fullName             String?
  securityId           String
  admin                Boolean   @default(false)
  avatar               String?
  usertype             UserType? @default(STUDENT)
  institutionname      String?
  refreshToken         String?
  failedLoginAttempts  Int       @default(0)
  accountLocked        Boolean   @default(false)
  lockExpiresAt        DateTime?
  lastLogin            DateTime?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  certificates         Certificate[]
}
```

### Certificate Model
```typescript
model Certificate {
  id          String   @id @default(cuid())
  title       String
  description String?
  fileUrl     String
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## 🤖 AI Integration

SmartCertify leverages OpenAI's powerful APIs for intelligent certificate processing:

### Capabilities
- **📄 OCR Processing**: Extract text from certificate images
- **🔍 Data Extraction**: Identify key information (names, dates, institutions)
- **✅ Validation**: Verify certificate authenticity and format
- **🏷️ Classification**: Categorize certificates by type and institution

### Usage Example
```typescript
// AI processing endpoint
POST /api/openai
Content-Type: application/json

{
  "prompt": "Extract certificate details from this text...",
  "certificateData": "..."
}
```

---

## 🔒 Security Features

### Data Protection
- **🔐 Password Hashing**: bcrypt with configurable salt rounds
- **🛡️ JWT Security**: Signed tokens with expiration
- **🚫 Rate Limiting**: Protection against brute force attacks
- **📝 Input Validation**: Comprehensive request validation
- **🔒 CORS Protection**: Configurable cross-origin policies

### Account Security
- **🔢 Failed Login Protection**: Automatic account lockout
- **⏰ Session Expiry**: Configurable token lifetimes  
- **🔄 Token Refresh**: Secure token rotation
- **🎯 Role-Based Access**: Different permissions for users and institutions

---

## 🛠️ Development Guide

### Available Scripts

```bash
# Development
pnpm dev              # Start development server with hot reload
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema changes to database
pnpm db:migrate       # Run database migrations
pnpm db:seed          # Seed database with sample data
pnpm db:reset         # Reset database (⚠️ Destructive)

# Code Quality
pnpm lint             # Run ESLint
pnpm type-check       # TypeScript type checking
pnpm test             # Run tests (if configured)
```

### Adding New Features

1. **Create Controller**
   ```typescript
   // app/controllers/new-controller.ts
   export class NewController {
     async newMethod(req: Request, res: Response) {
       // Implementation
     }
   }
   ```

2. **Add Routes**
   ```typescript
   // app/routes/new-route.ts
   router.post('/new-endpoint', newController.newMethod)
   ```

3. **Update Database Schema**
   ```prisma
   // prisma/schema.prisma
   model NewModel {
     id String @id @default(cuid())
     // fields...
   }
   ```

---

## 🚀 Deployment

### Production Checklist

- [ ] Set strong JWT secrets
- [ ] Configure production database
- [ ] Set up SSL certificates
- [ ] Configure CORS for your domain
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies
- [ ] Set up CI/CD pipeline

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL="postgresql://..."
JWT_SECRET="production-secret-key"
REFRESH_TOKEN_SECRET="production-refresh-secret"
PORT=8000
```

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8001
CMD ["npm", "start"]
```

---

## 🤝 Contributing

We love contributions! Here's how you can help make SmartCertify better:

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests and ensure code quality
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure backward compatibility

---

## 📚 API Documentation

### Response Format
All API responses follow this consistent format:

```typescript
// Success Response
{
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}

// Error Response
{
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## 🔧 Troubleshooting

### Common Issues

**Database Connection Issues**
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Verify connection string
npx prisma db pull
```

**JWT Token Issues**
```bash
# Verify JWT secrets are set
echo $JWT_SECRET

# Check token expiration in code
```

**Port Already in Use**
```bash
# Kill process on port 8001
npx kill-port 8001

# Or change port in .env
PORT=8001
```

---

## 📈 Performance Tips

### Database Optimization
- Use database indexes for frequently queried fields
- Implement pagination for large datasets
- Use connection pooling
- Regular database maintenance

### API Performance
- Implement caching strategies
- Use compression middleware
- Optimize payload sizes
- Monitor API response times

---

<div align="center">

**Built by Harsh ❤️**

[![Made with Node.js](https://img.shields.io/badge/Made%20with-Node.js-green?style=flat-square)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/Written%20in-TypeScript-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Database-Prisma-blueviolet?style=flat-square)](https://www.prisma.io/)

</div>
