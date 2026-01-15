# Quick Reference Card - Sustainable Classroom Setup

## 🎯 Your Current Status
- **Location**: `E:\susclassroom\lms-mvp-tier1`
- **Branch**: `notifications` (isolated feature branch)
- **Status**: ✅ Ready for local testing and development
- **Main Branch**: Protected - use `notifications` for all changes

## 🚀 Start Demo in 2 Steps

### Terminal 1: Start Backend
```bash
cd E:\susclassroom\lms-mvp-tier1\backend
npm install
npm run dev
```
✅ Backend runs on `http://localhost:5000`

### Terminal 2: Start Frontend
```bash
cd E:\susclassroom\lms-mvp-tier1\client
npm install
npm run dev
```
✅ Frontend runs on `http://localhost:5173`

## 🔐 Test Login
```
Email:    susclass.global@gmail.com
Password: Sc2026**
```

## 📚 Key Documentation

| Document | Purpose |
|----------|---------|
| [.github/copilot-instructions.md](.github/copilot-instructions.md) | AI agent guidance |
| [LOCAL_DEPLOYMENT.md](LOCAL_DEPLOYMENT.md) | Full setup guide |
| [FINAL_SUMMARY.md](FINAL_SUMMARY.md) | Architecture & overview |
| [SETUP_COMPLETE.md](SETUP_COMPLETE.md) | Completion checklist |

## 🐳 Docker Alternative (Optional)
```bash
docker-compose up -d
# Wait 2-3 minutes, then use http://localhost:5000
```

## 🔄 Git Workflow
```bash
# You're already on notifications branch
git status

# Make changes, then:
git add .
git commit -m "feat: your feature"
git push origin notifications
```

## 📁 Core Files to Edit
- **API changes**: `backend/server.js`
- **UI changes**: `client/src/pages/*.jsx`
- **Routes**: `client/src/App.jsx`
- **Database**: `backend/*.sql`

## 🎯 All Tasks Complete
✅ Copilot instructions file created  
✅ Dockerfile & docker-compose configured  
✅ notifications branch created & pushed  
✅ Local deployment guide written  
✅ Setup documentation complete  
✅ Ready for development  

## 📞 Common Commands

```bash
# Backend
npm run dev          # Start with hot reload
npm start           # Start production

# Frontend  
npm run dev         # Start dev server
npm run build       # Build for production

# Database (local PostgreSQL)
psql sustainable_classroom < backend/FRESH-COMPLETE-DATABASE.sql
psql sustainable_classroom < backend/add-module-progress-tracking.sql

# Docker
docker-compose up -d        # Start services
docker-compose logs -f      # View logs
docker-compose down         # Stop services
```

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 5000 in use | Change in backend/.env `PORT=5001` |
| Port 5173 in use | Vite uses next available port |
| Database not found | Run `createdb sustainable_classroom` |
| npm install fails | Delete `node_modules`, run again |
| Git merge conflicts | Ask for help before merging to main |

---

**Everything is ready! Start with Terminal 1 & 2 commands above.** 🚀
