# Sustainable Classroom LMS - Technical Architecture

## System Overview

A production-grade Learning Management System (LMS) designed for educational institutions, featuring real-time notifications, secure authentication with MFA, and comprehensive course management.

---

## Technology Stack

### Backend
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Runtime | Node.js | 18.x LTS | Server-side JavaScript execution |
| Framework | Express.js | 4.x | REST API framework |
| Database | PostgreSQL | 15.x | Primary relational database |
| Cloud DB | Neon | - | Serverless PostgreSQL hosting |
| ORM/Driver | pg (node-postgres) | 8.x | PostgreSQL client |
| Authentication | JWT | jsonwebtoken 9.x | Stateless token authentication |
| Password Security | bcrypt | 5.x | Password hashing (10 salt rounds) |
| Email Service | Nodemailer | 6.x | SMTP email delivery |
| File Storage | Cloudinary | 1.x | Media asset management |
| File Upload | Multer | 1.x | Multipart form handling |

### Frontend
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Framework | React | 18.x | UI component library |
| Build Tool | Vite | 5.x | Fast development/build tooling |
| Routing | React Router | 6.x | Client-side navigation |
| Styling | Tailwind CSS | 3.x | Utility-first CSS framework |
| HTTP Client | Fetch API | Native | API communication |

### Security
| Component | Technology | Purpose |
|-----------|------------|---------|
| HTTP Headers | Helmet | Security headers (XSS, MIME sniffing, etc.) |
| Rate Limiting | express-rate-limit | Brute force protection |
| CORS | cors | Cross-origin resource sharing |
| Input Validation | express-validator | Request payload validation |

### DevOps & Infrastructure
| Component | Technology | Purpose |
|-----------|------------|---------|
| Containerization | Docker | Application packaging |
| CI/CD | GitHub Actions | Automated testing and deployment |
| Hosting | Render.com | Cloud platform deployment |
| Version Control | Git | Source code management |

### Testing
| Component | Technology | Purpose |
|-----------|------------|---------|
| Test Runner | Jest | JavaScript testing framework |
| API Testing | Supertest | HTTP assertion library |
| Mock Database | better-sqlite3 | In-memory SQLite for tests |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    React + Vite Frontend                     │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐│    │
│  │  │ Login    │ │Dashboard │ │ Courses  │ │ Teacher Portal   ││    │
│  │  │ (MFA)    │ │(Student) │ │ Player   │ │ Admin Dashboard  ││    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘│    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS / JWT Auth
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY LAYER                           │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Express.js Server                         │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │    │
│  │  │ Helmet       │ │ Rate Limiter │ │ CORS Middleware      │ │    │
│  │  │ (Security)   │ │ (Protection) │ │ (Cross-Origin)       │ │    │
│  │  └──────────────┘ └──────────────┘ └──────────────────────┘ │    │
│  │  ┌──────────────────────────────────────────────────────┐   │    │
│  │  │              JWT Authentication Middleware            │   │    │
│  │  └──────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SERVICE LAYER                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────────┐   │
│  │ Auth        │ │ Module      │ │ Test        │ │ Notification │   │
│  │ Service     │ │ Service     │ │ Service     │ │ Service      │   │
│  │ (OTP/JWT)   │ │ (CRUD)      │ │ (MCQ/Code)  │ │ (Email/InApp)│   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────────┘   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                    │
│  │ Student     │ │ Teacher     │ │ Admin       │                    │
│  │ Service     │ │ Service     │ │ Service     │                    │
│  └─────────────┘ └─────────────┘ └─────────────┘                    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐
│ PostgreSQL  │ │ Cloudinary  │ │ SMTP Server         │
│ (Neon)      │ │ (Media)     │ │ (Gmail/Custom)      │
│             │ │             │ │                     │
│ - Users     │ │ - Videos    │ │ - OTP Emails        │
│ - Modules   │ │ - Images    │ │ - Notifications     │
│ - Tests     │ │ - Documents │ │ - Alerts            │
│ - Scores    │ │             │ │                     │
└─────────────┘ └─────────────┘ └─────────────────────┘
```

---

## Database Schema

### Core Tables

```sql
students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  reg_no VARCHAR(50) UNIQUE,
  class_dept VARCHAR(100),
  section VARCHAR(50),
  otp_code VARCHAR(6),
  otp_expiry TIMESTAMP,
  media JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
)

teachers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  staff_id VARCHAR(50) UNIQUE,
  dept VARCHAR(100),
  allocated_sections JSONB DEFAULT '[]',
  otp_code VARCHAR(6),
  otp_expiry TIMESTAMP,
  media JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
)

modules (
  id SERIAL PRIMARY KEY,
  topic_title VARCHAR(255) NOT NULL,
  teacher_id INTEGER REFERENCES teachers(id),
  teacher_name VARCHAR(255),
  section VARCHAR(50),
  subject VARCHAR(100),
  step_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
)

module_steps (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES modules(id),
  step_number INTEGER NOT NULL,
  title VARCHAR(255),
  content_type VARCHAR(50),
  content TEXT,
  video_url TEXT
)

mcq_tests (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  teacher_id INTEGER REFERENCES teachers(id),
  teacher_name VARCHAR(255),
  section VARCHAR(50),
  questions JSONB NOT NULL,
  total_questions INTEGER,
  deadline TIMESTAMP,
  start_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
)

test_submissions (
  id SERIAL PRIMARY KEY,
  test_id INTEGER REFERENCES mcq_tests(id),
  student_id INTEGER REFERENCES students(id),
  student_name VARCHAR(255),
  student_reg_no VARCHAR(50),
  answers JSONB,
  score INTEGER,
  percentage DECIMAL(5,2),
  status VARCHAR(50),
  time_taken INTEGER,
  submitted_at TIMESTAMP DEFAULT NOW()
)

in_app_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  user_type VARCHAR(50) NOT NULL,
  event_code VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
)

notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  user_type VARCHAR(50) NOT NULL,
  event_code VARCHAR(100) NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  UNIQUE(user_id, user_type, event_code)
)
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Rate Limit | Description |
|--------|----------|------------|-------------|
| POST | `/api/admin/login` | 10/15min | Admin authentication |
| POST | `/api/login` | 10/15min | Student/Teacher login (triggers OTP) |
| POST | `/api/verify-otp` | 5/5min | OTP verification |

### Student Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/student/profile` | JWT | Get student profile |
| GET | `/api/student/tests` | JWT | List available tests |
| GET | `/api/student/my-modules` | JWT | List enrolled modules |
| GET | `/api/student/progress` | JWT | Get progress statistics |
| POST | `/api/student/test/submit` | JWT | Submit test answers |
| POST | `/api/student/submit-code` | JWT | Submit coding solution |
| POST | `/api/student/change-password` | JWT | Change own password |

### Teacher Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/teacher/dashboard` | JWT | Dashboard statistics |
| GET | `/api/teacher/students` | JWT | List allocated students |
| POST | `/api/teacher/upload-module` | JWT | Create learning module |
| POST | `/api/teacher/test/create` | JWT | Create MCQ test |
| GET | `/api/teacher/test/:id/submissions` | JWT | View test submissions |
| POST | `/api/teacher/change-password` | JWT | Change own password |

### Admin Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/admin/register-teacher` | JWT+Admin | Register new teacher |
| POST | `/api/admin/register-student` | JWT+Admin | Register new student |
| POST | `/api/admin/bulk-register` | JWT+Admin | CSV bulk registration |
| POST | `/api/admin/reset-student-password` | JWT+Admin | Reset student password |
| POST | `/api/admin/reset-teacher-password` | JWT+Admin | Reset teacher password |
| GET | `/api/admin/teachers` | JWT+Admin | List all teachers |
| GET | `/api/admin/students` | JWT+Admin | List all students |

### Notification Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications/inbox` | JWT | Get user notifications |
| GET | `/api/notifications/unread-count` | JWT | Get unread count |
| PATCH | `/api/notifications/:id/read` | JWT | Mark as read |
| PATCH | `/api/notifications/read-all` | JWT | Mark all as read |
| GET | `/api/notifications/preferences` | JWT | Get preferences |
| PUT | `/api/notifications/preferences/:code` | JWT | Update preference |
| GET | `/api/notifications/stats` | JWT+Teacher | Notification statistics |

---

## Security Implementation

### Authentication Flow
```
1. User submits email/password
2. Server validates credentials (bcrypt compare)
3. Server generates 6-digit OTP
4. OTP sent via email (5-minute expiry)
5. User submits OTP
6. Server validates OTP and issues JWT (24h expiry)
7. JWT used for subsequent requests
```

### Rate Limiting Configuration
| Limiter | Window | Max Requests | Applied To |
|---------|--------|--------------|------------|
| Global | 15 min | 500 | All /api/* routes |
| Auth | 15 min | 10 | Login endpoints |
| OTP | 5 min | 5 | OTP verification |
| Upload | 1 hour | 50 | File uploads |

### Security Headers (Helmet)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (HSTS)
- Content-Security-Policy

---

## Notification System

### Event Types
| Event Code | Trigger | Recipients |
|------------|---------|------------|
| ACCOUNT_CREATED | Registration | New user |
| MODULE_PUBLISHED | Module upload | Section students |
| TEST_ASSIGNED | Test creation | Section students |
| TEST_DEADLINE_24H | Cron job | Incomplete students |
| TEST_SUBMITTED | Test submission | Teacher |
| GRADE_POSTED | Test submission | Student |
| LOW_CLASS_PERFORMANCE | Avg < 60% | Teacher |

### Delivery Channels
1. **Email** - SMTP via Nodemailer
2. **In-App** - PostgreSQL-backed notification inbox

---

## Deployment Configuration

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Authentication
JWT_SECRET=your-secret-key
ADMIN_EMAIL=admin@domain.com
ADMIN_PASSWORD=secure-password

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# Frontend
FRONTEND_URL=https://your-domain.com

# Environment
NODE_ENV=production
```

### Docker Configuration
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

---

## Performance Considerations

### Database
- Connection pooling via pg Pool (max 20 connections)
- Indexed columns: email, reg_no, section, user_id
- JSONB for flexible schema (media, questions, answers)

### Caching Strategy
- JWT tokens (24h validity reduces auth overhead)
- Static assets via Cloudinary CDN
- Client-side state management with React

### Scalability
- Stateless API design (horizontal scaling ready)
- Database connection pooling
- Rate limiting prevents resource exhaustion

---

## Testing Strategy

### Unit Tests
- API endpoint validation
- Authentication flow
- Authorization guards

### Integration Tests
- Database operations (SQLite mock)
- Notification triggers
- File upload handling

### Test Coverage
- 68+ automated tests
- 95%+ critical path coverage
- CI/CD integration via GitHub Actions

---

## Monitoring & Logging

### Error Handling
- Global Express error middleware
- Unhandled rejection capture
- Uncaught exception handling

### Logging
- Console logging (development)
- Error stack traces (non-production)
- Request/response timing

---

## Version Information

| Component | Version |
|-----------|---------|
| API Version | 1.0.0 |
| Node.js | 18.x |
| PostgreSQL | 15.x |
| React | 18.x |

---

*Last Updated: January 2026*
