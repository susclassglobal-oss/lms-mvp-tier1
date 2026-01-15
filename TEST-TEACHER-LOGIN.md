# Test Teacher Login - Step by Step

## Issue
Teacher dashboard shows blank page after login.

## Quick Test

### Step 1: Check if Backend is Running
Open a terminal and run:
```bash
cd "sus - Copy/backend"
node server.js
```

You should see:
```
Server running on port 5000
Connected to Neon PostgreSQL
```

### Step 2: Test Login API Directly
Open a new terminal and run:
```bash
curl -X POST http://localhost:5000/api/login -H "Content-Type: application/json" -d "{\"email\":\"teacher@example.com\",\"password\":\"password123\",\"role\":\"teacher\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "name": "Teacher Name",
    "email": "teacher@example.com",
    ...
  }
}
```

**If you get an error:**
- "Account not found" → Teacher doesn't exist in database
- "Incorrect Password" → Wrong password
- Connection refused → Backend not running

### Step 3: Check Browser Console
1. Open browser (Chrome/Edge)
2. Press F12
3. Go to Console tab
4. Clear console (trash icon)
5. Try logging in as teacher
6. Look for ANY red error messages

### Step 4: Check Network Tab
1. Press F12
2. Go to Network tab
3. Try logging in
4. Look for `/api/login` request
5. Click on it
6. Check Response tab

Should show `success: true`

### Step 5: Check Local Storage
After login, in Console tab run:
```javascript
localStorage.getItem('token')
localStorage.getItem('user_role')
localStorage.getItem('user_data')
```

All three should return values (not null).

### Step 6: Manually Navigate
After login, in Console run:
```javascript
window.location.href = '/teacher-dashboard'
```

Does the dashboard load?

## Common Fixes

### Fix 1: Clear Everything
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
location.href = '/';
```

Then login again.

### Fix 2: Check if Teacher Exists
Run in Neon SQL Editor:
```sql
SELECT * FROM teachers WHERE email = 'teacher@example.com';
```

If no results, teacher doesn't exist. Register them via admin panel.

### Fix 3: Re-register Teacher
1. Login as admin
2. Go to "Add Teacher"
3. Register teacher with:
   - Name: Test Teacher
   - Email: teacher@example.com
   - Password: password123
   - Staff ID: T001
   - Dept: CSE
4. Try logging in again

### Fix 4: Check React App
In terminal where frontend is running, look for errors:
```
✘ [ERROR] ...
```

If you see errors, the React app failed to compile.

### Fix 5: Restart Everything
```bash
# Stop backend (Ctrl+C)
# Stop frontend (Ctrl+C)

# Clear node_modules cache
cd "sus - Copy/client"
rm -rf node_modules/.vite

# Restart frontend
npm run dev

# In new terminal, restart backend
cd "sus - Copy/backend"
node server.js
```

## Debug Output

### What to Share:
1. Backend console output (any errors?)
2. Browser console output (any red errors?)
3. Network tab - /api/login response
4. Result of localStorage checks
5. Does admin login work? Does student login work?

## Emergency Fix

If nothing works, try this minimal test:

1. Create a simple test file: `sus - Copy/client/src/pages/TestPage.jsx`
```jsx
function TestPage() {
  return <div style={{padding: '50px'}}>
    <h1>Test Page Works!</h1>
    <p>If you see this, React is working.</p>
  </div>;
}

export default TestPage;
```

2. Add route in `App.jsx`:
```jsx
import TestPage from './pages/TestPage'

// Add this route
<Route path="/test" element={<TestPage />} />
```

3. Navigate to: `http://localhost:5173/test`

If this works, the issue is specific to TeacherDashboard component.
If this doesn't work, React itself has an issue.

## Most Likely Causes

1. **Backend not running** (90% of cases)
2. **Teacher not in database** (5%)
3. **Browser cache issue** (3%)
4. **Port conflict** (2%)

Try the fixes in order!
