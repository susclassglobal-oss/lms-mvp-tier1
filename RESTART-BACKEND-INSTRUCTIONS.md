# How to Restart Backend Server

## The Issue
Changes to backend code require restarting the server to take effect.

## Steps to Restart

### Option 1: If using `npm run dev` (with nodemon)
Nodemon should auto-restart, but if not:
1. Go to the terminal running the backend
2. Press `Ctrl + C` to stop
3. Run: `npm run dev`

### Option 2: If using `node server.js`
1. Go to the terminal running the backend
2. Press `Ctrl + C` to stop
3. Run: `node server.js`

### Option 3: Quick Restart (Windows)
```powershell
# In PowerShell, navigate to backend folder
cd "sus - Copy/backend"

# Stop any running node processes (if needed)
taskkill /F /IM node.exe

# Start the server
npm run dev
```

## After Restarting

1. Wait for message: `🚀 SERVER ACTIVE ON PORT 5000`
2. Try registering the student again
3. Check the terminal for detailed logs:
   ```
   === STUDENT REGISTRATION ATTEMPT ===
   Name: Kaaru
   Email: nyashree.g@gmail.com
   Reg No: 006
   Class/Dept: IT
   Section: A
   ✓ Validation passed, hashing password...
   ✓ Password hashed, inserting into database...
   ✓ Student registered successfully!
   ```

## What to Look For

### Success:
```
✓ Validation passed
✓ Password hashed
✓ Student registered successfully!
```

### Errors:
```
❌ Missing required fields
❌ Invalid email format
❌ Registration Error: [error details]
```

## If Still Not Working

Check the terminal output and look for:
1. Database connection errors
2. Validation errors
3. Constraint violations
4. Any red error messages

Then share the exact error message from the terminal.
