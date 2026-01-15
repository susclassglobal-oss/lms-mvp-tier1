# Teacher Login Troubleshooting

## Problem
Teacher enters correct password but dashboard doesn't display.

---

## 🔍 Diagnostic Steps

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors

**Common Errors:**
```
Failed to fetch teacher profile, status: 401
→ Token is invalid or expired

Failed to fetch teacher profile, status: 404
→ Teacher not found in database

Failed to connect to server
→ Backend is not running
```

### Step 2: Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Try logging in
4. Look for `/api/login` request

**Check Response:**
- Status: Should be 200
- Response body: Should have `success: true` and `token`

### Step 3: Check Local Storage
1. Open DevTools (F12)
2. Go to Application tab → Local Storage
3. Check if these exist:
   - `token` - JWT token
   - `user_role` - Should be "teacher"
   - `user_data` - Teacher info JSON

**If missing:** Login didn't save properly

### Step 4: Check Backend Console
Look for:
```
Login Error: ...
→ Database connection issue

Teacher profile loaded: { id: 1, name: "...", ... }
→ Profile loaded successfully
```

---

## ✅ Solutions

### Solution 1: Teacher Not in Database
**Symptom:** "Account not found in teacher records"

**Fix:**
1. Login as admin
2. Go to "Add Teacher" tab
3. Register the teacher
4. Try logging in again

### Solution 2: Wrong Password
**Symptom:** "Incorrect Password"

**Fix:**
1. Login as admin
2. Go to "Manage Teachers"
3. Click "Edit" on the teacher
4. Update password (will need to re-hash)
5. Or delete and re-register teacher

### Solution 3: No Allocated Sections
**Symptom:** Dashboard loads but shows empty

**Fix:**
1. Login as admin
2. Go to "Allocations" tab (old system) or use new allocation
3. Allocate sections to teacher
4. Refresh teacher dashboard

### Solution 4: Backend Not Running
**Symptom:** "Failed to connect to server"

**Fix:**
```bash
cd "sus - Copy/backend"
node server.js
```

Should see:
```
Server running on port 5000
Connected to Neon PostgreSQL
```

### Solution 5: Token Expired
**Symptom:** Dashboard loads then redirects to login

**Fix:**
1. Clear browser cache
2. Clear local storage
3. Login again

**Or in Console:**
```javascript
localStorage.clear();
location.reload();
```

### Solution 6: Database Connection Issue
**Symptom:** Backend shows database errors

**Fix:**
1. Check `.env` file has correct `DATABASE_URL`
2. Test connection in Neon dashboard
3. Restart backend server

---

## 🧪 Manual Testing

### Test 1: Verify Teacher Exists
Run in Neon SQL Editor:
```sql
SELECT id, name, email, staff_id, dept, allocated_sections 
FROM teachers 
WHERE email = 'teacher@example.com';
```

Should return 1 row with teacher data.

### Test 2: Verify Password Hash
```sql
SELECT id, name, email, 
       LEFT(password, 10) as password_preview 
FROM teachers 
WHERE email = 'teacher@example.com';
```

Password should start with `$2b$` (bcrypt hash).

### Test 3: Test Login API
Using Postman or curl:
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123",
    "role": "teacher"
  }'
```

Should return:
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "teacher@example.com",
    ...
  }
}
```

### Test 4: Test Profile API
```bash
curl http://localhost:5000/api/teacher/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Should return teacher profile.

---

## 🔧 Quick Fixes

### Fix 1: Clear Everything and Start Fresh
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Fix 2: Re-register Teacher
1. Login as admin
2. Delete teacher (if exists)
3. Re-register with new password
4. Try logging in

### Fix 3: Check Backend Logs
```bash
# In backend terminal
# Look for these messages:
Login Error: ...
Teacher profile loaded: ...
Failed to fetch: ...
```

### Fix 4: Restart Everything
```bash
# Stop backend (Ctrl+C)
# Stop frontend (Ctrl+C)

# Restart backend
cd backend
node server.js

# Restart frontend (in new terminal)
cd client
npm run dev
```

---

## 📊 Expected Flow

### Successful Login:
```
1. Teacher enters email/password
2. Frontend sends POST /api/login
3. Backend checks database
4. Backend verifies password (bcrypt)
5. Backend generates JWT token
6. Frontend receives token
7. Frontend saves to localStorage
8. Frontend navigates to /teacher-dashboard
9. TeacherDashboard fetches profile
10. Dashboard displays
```

### Where It Can Fail:
- **Step 3:** Teacher not in database
- **Step 4:** Wrong password
- **Step 5:** JWT secret mismatch
- **Step 7:** localStorage blocked
- **Step 9:** Token invalid/expired
- **Step 10:** No allocated sections

---

## 🎯 Checklist

Before reporting issue, verify:
- [ ] Backend is running (port 5000)
- [ ] Frontend is running (port 5173)
- [ ] Teacher exists in database
- [ ] Password is correct
- [ ] Browser console shows no errors
- [ ] Network tab shows 200 response
- [ ] Token is saved in localStorage
- [ ] Teacher has allocated sections (optional)

---

## 🆘 Still Not Working?

### Check These Files:
1. `backend/.env` - DATABASE_URL correct?
2. `backend/server.js` - Line 74-108 (login endpoint)
3. `client/src/pages/Login.jsx` - Line 14-50 (login logic)
4. `client/src/App.jsx` - Line 45-54 (teacher route)

### Get Detailed Error:
1. Open browser console
2. Look for red error messages
3. Check Network tab for failed requests
4. Check backend terminal for errors
5. Share the exact error message

### Common Error Messages:

**"Failed to load profile"**
→ Backend can't fetch teacher data
→ Check if teacher exists in database

**"Establishing Secure Connection..." (stuck)**
→ fetchTeacherProfile is failing
→ Check backend console for errors

**Redirects to login immediately**
→ Token is invalid
→ Clear localStorage and try again

**Blank white screen**
→ JavaScript error
→ Check browser console

---

## ✅ Success Indicators

When working correctly:
- Login shows "Authenticating..."
- Redirects to /teacher-dashboard
- Shows "Establishing Secure Connection..."
- Dashboard loads with sidebar
- Shows teacher name and sections
- Can switch between tabs

**Everything should load in 1-2 seconds!**
