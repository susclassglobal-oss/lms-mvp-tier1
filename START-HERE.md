# 🚀 START HERE - Quick Setup

> **Get the app running in 5 minutes!**

---

## ✅ What You Need

**REQUIRED:**
- Node.js v18+ ([Download](https://nodejs.org/))
- PostgreSQL v15+ ([Download](https://www.postgresql.org/download/))
- Git ([Download](https://git-scm.com/downloads))

**NOT NEEDED:**
- ❌ MongoDB (we use PostgreSQL)
- ❌ Docker (optional)
- ❌ Cloudinary (optional)
- ❌ Email setup (optional)

---

## 🎯 5-Minute Setup

### 1. Get the code
```bash
git clone <repository-url>
cd sustainable-classroom
```

### 2. Setup database
```bash
createdb sustainable_classroom
psql sustainable_classroom < backend/INIT-COMPLETE.sql
```

### 3. Configure backend
```bash
cd backend
npm install
cp .env.example .env
```

**Edit `backend/.env`** - Change these 4 lines:
```env
DATABASE_URL='postgresql://YOUR_USER:YOUR_PASS@localhost:5432/sustainable_classroom'
JWT_SECRET=any_random_string_here
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=password123
```

### 4. Install frontend
```bash
cd ../client
npm install
```

### 5. Start everything
**Terminal 1:**
```bash
cd backend
npm run dev
```

**Terminal 2:**
```bash
cd client
npm run dev
```

---

## 🎉 Done!

Open: **http://localhost:5173**

Login:
- Email: `susclass.global@gmail.com`
- Password: `Sc2026**`

---

## 🆘 Problems?

**"createdb: command not found"**
→ PostgreSQL not installed or not in PATH

**"npm: command not found"**
→ Node.js not installed

**"Port 5000 in use"**
→ Change `PORT=5001` in backend/.env

**"Database connection failed"**
→ Check DATABASE_URL in backend/.env

---

## 📚 Need More Help?

Read: **[STUDENT-SETUP-GUIDE.md](STUDENT-SETUP-GUIDE.md)**

---

**That's it! You're ready to go! 🚀**
