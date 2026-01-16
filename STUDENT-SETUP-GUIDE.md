# 🎓 Student Setup Guide - Sustainable Classroom

> **Simple step-by-step guide to get the app running on your computer**

---

## ⚡ Quick Setup (5 Steps)

### Step 1: Install Required Software

Download and install these (if you don't have them):

1. **Node.js** (v18 or higher) - https://nodejs.org/
2. **PostgreSQL** (v15 or higher) - https://www.postgresql.org/download/
3. **Git** - https://git-scm.com/downloads

**Check if installed:**
```bash
node --version
psql --version
git --version
```

---

### Step 2: Get the Code

```bash
# Clone the repository
git clone https://github.com/yourusername/sustainable-classroom.git

# Go into the folder
cd sustainable-classroom
```

---

### Step 3: Setup Database

```bash
# Create database
createdb sustainable_classroom

# Run setup script (just one file!)
psql sustainable_classroom < backend/INIT-COMPLETE.sql
```

**If you get errors**, make sure PostgreSQL is running:
- Windows: Check Services for "PostgreSQL"
- Mac: `brew services start postgresql`
- Linux: `sudo systemctl start postgresql`

---

### Step 4: Configure Backend

```bash
# Go to backend folder
cd backend

# Install packages
npm install

# Create .env file
# Windows:
copy .env.example .env

# Mac/Linux:
cp .env.example .env
```

**Edit the `.env` file** (use Notepad, VS Code, or any text editor):

**REQUIRED - Change these:**
```env
DATABASE_URL='postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/sustainable_classroom'
JWT_SECRET=any_random_long_string_here_12345
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=YourPassword123
```

**OPTIONAL - Can leave empty for now:**
```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SMTP_USER=
SMTP_PASSWORD=
```

---

### Step 5: Start the App

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
✅ You should see: "Server running on port 5000"

**Terminal 2 - Frontend (open a new terminal):**
```bash
cd client
npm install
npm run dev
```
✅ You should see: "Local: http://localhost:5173"

---

## 🎉 Done! Open the App

1. Open your browser
2. Go to: **http://localhost:5173**
3. Login with:
   - Email: `susclass.global@gmail.com`
   - Password: `Sc2026**`

---

## 🐛 Common Problems

### Problem: "createdb: command not found"
**Solution:** PostgreSQL is not in your PATH. 
- Windows: Add `C:\Program Files\PostgreSQL\15\bin` to PATH
- Mac: `brew install postgresql`
- Linux: `sudo apt install postgresql`

### Problem: "npm: command not found"
**Solution:** Node.js is not installed or not in PATH.
- Reinstall Node.js from https://nodejs.org/

### Problem: "Port 5000 already in use"
**Solution:** Another app is using port 5000.
- Change `PORT=5001` in backend/.env
- Or kill the process using port 5000

### Problem: "Database connection failed"
**Solution:** Check your DATABASE_URL in backend/.env
- Make sure PostgreSQL is running
- Check username and password are correct
- Database name should be `sustainable_classroom`

### Problem: "Cannot find module 'pg'"
**Solution:** Dependencies not installed.
```bash
cd backend
rm -rf node_modules
npm install
```

### Problem: Frontend shows blank page
**Solution:** 
- Check browser console (F12) for errors
- Make sure backend is running on port 5000
- Clear browser cache and reload

---

## 📝 What You DON'T Need

❌ **MongoDB** - We use PostgreSQL only
❌ **Docker** - Optional, you can run manually
❌ **Cloudinary** - Optional, for file uploads
❌ **Email Setup** - Optional, for notifications

The app will work with just Node.js + PostgreSQL!

---

## 🆘 Still Having Issues?

1. Check if PostgreSQL is running: `pg_isready`
2. Check if backend is running: Open http://localhost:5000 in browser
3. Check backend logs in Terminal 1 for errors
4. Check frontend logs in Terminal 2 for errors
5. Ask for help with the specific error message

---

## 📚 Next Steps

Once the app is running:

1. **As Admin:**
   - Register a teacher account
   - Register a student account

2. **As Teacher:**
   - Create a learning module
   - Create an MCQ test
   - View student progress

3. **As Student:**
   - View available modules
   - Complete a module
   - Take a test
   - Check your progress

---

**Good luck! 🚀**
