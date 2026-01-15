# Local Deployment Guide - Sustainable Classroom LMS

## Quick Start (Recommended: Manual Setup)

For fastest local testing, run the application manually without Docker.

### Prerequisites
- Node.js v18+ installed
- PostgreSQL 15+ running locally
- Git installed

### Step 1: Setup Database

```bash
# Start PostgreSQL (if using local install)
# On Windows with WSL2: Ensure postgres service is running

# Create database
createdb sustainable_classroom

# Run schema setup
psql sustainable_classroom < backend/FRESH-COMPLETE-DATABASE.sql
psql sustainable_classroom < backend/add-module-progress-tracking.sql
psql sustainable_classroom < backend/add-coding-submissions.sql
```

### Step 2: Setup Backend

```bash
cd backend
npm install

# Create/update .env with:
PORT=5000
DATABASE_URL='postgresql://your_user:your_password@localhost:5432/sustainable_classroom'
ADMIN_EMAIL=susclass.global@gmail.com
ADMIN_PASSWORD=Sc2026**
CLOUDINARY_CLOUD_NAME=dsegymiip
CLOUDINARY_API_KEY=795884329264685
CLOUDINARY_API_SECRET=PuJymyfEO6ka6XLhpFuKBxbOyqM
JWT_SECRET=hellothisissusclassglobal@1234567890

# Start backend
npm run dev
# Runs on http://localhost:5000
```

### Step 3: Setup Frontend

```bash
cd client
npm install
npm run dev
# Runs on http://localhost:5173
```

### Step 4: Test Login

Access **http://localhost:5173** and test with:

**Admin Login:**
- Email: `susclass.global@gmail.com`
- Password: `Sc2026**`
- Role: admin

**Create test users via Admin Dashboard** to test student/teacher flows.

---

## Docker Deployment (Alternative)

### Prerequisites
- Docker Desktop installed and running
- 4GB+ RAM available

### Quick Docker Start

```powershell
cd E:\susclassroom\lms-mvp-tier1

# Build and start services (PostgreSQL + Backend)
docker-compose up -d

# Wait for containers to be healthy (2-3 minutes)
docker-compose ps

# Check backend logs
docker-compose logs -f backend
```

**Services:**
- Database: `postgresql://neondb_owner:postgres_password@localhost:5432/sustainable_classroom`
- Backend API: `http://localhost:5000`
- Frontend: `http://localhost:5173` (run separately with `cd client && npm run dev`)

### Docker Troubleshooting

**Problem**: Bcrypt build fails
```
Solution: Ensure Docker has internet access to download node modules
Run: docker-compose down && docker-compose up -d
```

**Problem**: Database migration fails
```
Solution: Volumes may be stale. Clean and rebuild:
docker-compose down -v
docker-compose up -d
```

**Problem**: Port 5000 or 5432 already in use
```
Solution: Change ports in docker-compose.yml:
postgres ports: ["5433:5432"]
backend ports: ["5001:5000"]
```

---

## API Testing

Once backend is running, test endpoints:

### Admin Login
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"susclass.global@gmail.com","password":"Sc2026**"}'

# Response: {"success":true,"token":"eyJhbGc..."}
```

### Student/Teacher Login
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password","role":"student"}'
```

### Protected Route (requires Bearer token from login)
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/student/profile
```

---

## Project Structure for Local Development

```
lms-mvp-tier1/
├── backend/
│   ├── server.js              ← Main Express app (1100+ lines)
│   ├── package.json
│   ├── .env                   ← Environment variables
│   ├── FRESH-COMPLETE-DATABASE.sql  ← Full schema
│   └── *.sql                  ← Migration scripts
│
├── client/
│   ├── src/
│   │   ├── App.jsx            ← Route protection logic
│   │   ├── pages/             ← Page components
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── Dockerfile
├── docker-compose.yml
└── .github/copilot-instructions.md
```

---

## Development Workflow

### Making Backend Changes
1. Edit `backend/server.js`
2. Save the file
3. Restart backend: `npm run dev` auto-reloads with `nodemon` OR press Ctrl+C and restart
4. Test via Postman or curl

### Making Frontend Changes
1. Edit `client/src/pages/*.jsx` or `client/src/App.jsx`
2. Vite hot-reloads automatically (refresh browser if not)
3. Test via http://localhost:5173

### Database Schema Changes
1. Create SQL migration script in `backend/`
2. Test locally: `psql sustainable_classroom < backend/your-migration.sql`
3. Commit migration file to git

---

## Debugging Tips

### Backend Logs
```bash
# With nodemon running, check console output for errors
# Toggle breakpoints in VSCode debugger:
# Debug → Start Debugging (requires launch.json)
```

### Frontend Logs
```bash
# Open DevTools: F12
# Check Console for React errors
# Network tab for API calls
```

### Database Connection Issues
```bash
# Test connection:
psql "postgresql://your_user:password@localhost:5432/sustainable_classroom"

# If fails, check:
1. PostgreSQL running: pg_isready
2. Correct credentials in .env
3. Database exists: createdb sustainable_classroom
```

### JWT Token Issues
Check browser localStorage:
- Key: `token`
- Key: `user_role`
- If missing, you're not logged in

---

## Branch: notifications

All local changes should be made on the **notifications** branch:

```bash
# Already on notifications branch (if created)
git branch

# If not, create it:
git checkout -b notifications
git push origin notifications

# After making changes:
git add .
git commit -m "feat: your feature description"
git push origin notifications
```

This way, main branch stays stable and changes are isolated for testing.

---

## Next Steps

1. ✅ Run local setup (manual or Docker)
2. ✅ Login as admin
3. ✅ Create a test teacher and student
4. ✅ Teacher: Create a module with steps
5. ✅ Student: Complete module and check progress
6. ✅ Verify test submission flow
7. ✅ Make feature changes on notifications branch
8. ✅ Test thoroughly before merging to main

Good luck! 🚀
