# 🔔 Email Notification System - Quick Start

## Overview

Automatic email notifications for students and teachers when important events occur (modules published, tests assigned, submissions, grades, etc.).

## 🚀 Quick Setup (3 Steps)

### Step 1: Setup Database

**Option A - Using Script (Recommended):**
```powershell
# Windows PowerShell
.\setup-notifications.ps1

# Linux/Mac
./setup-notifications.sh
```

**Option B - Manual:**
```bash
# Copy the DATABASE_URL from backend/.env
# Run in terminal:
psql "your-database-url" -f backend/notification-system.sql
```

**Option C - GUI Client:**
- Open `backend/notification-system.sql` in pgAdmin or DBeaver
- Connect to your database
- Execute the SQL script

### Step 2: Configure Email

1. **Get Gmail App Password:**
   - Visit: https://myaccount.google.com/apppasswords
   - Enable 2FA first if not already enabled
   - Create app password for "Mail"
   - Copy the 16-character password

2. **Update `backend/.env`:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=susclass.global@gmail.com
   SMTP_PASSWORD=your-16-char-app-password-here
   FRONTEND_URL=http://localhost:5173
   ```

### Step 3: Restart Server

```bash
cd backend
npm run dev
```

✅ **Done!** Notifications are now active.

---

## 🎯 What Gets Notified?

### Students Receive Emails When:
- ✅ New module is published to their section
- ✅ New test is assigned
- ✅ Test is graded (score posted)
- ✅ Account is created (welcome email)
- 📅 Test deadline approaching (needs scheduler)

### Teachers Receive Emails When:
- ✅ Student submits a test
- ✅ Account is created (welcome email)
- 📅 Low class performance (needs integration)
- 📅 Deadline reminders (needs scheduler)

---

## 🧪 Test It

### Test 1: Create Student
```bash
# Login as admin, create a new student
# Student should receive welcome email
```

### Test 2: Publish Module
```bash
# Login as teacher, create a new module
# All students in that section receive email
```

### Test 3: Create Test
```bash
# Login as teacher, create a new test
# All students in section receive email
```

### Test 4: Submit Test
```bash
# Login as student, submit a test
# Teacher receives submission notification
# Student receives grade notification
```

---

## 📁 Files Overview

```
lms-mvp-tier1/
├── backend/
│   ├── notification-system.sql          # Database schema
│   ├── notificationService.js           # Email service
│   ├── server.js                        # Updated with notifications
│   ├── .env                             # Add SMTP config here
│   └── .env.example                     # Template
├── setup-notifications.ps1              # Windows setup script
├── setup-notifications.sh               # Linux/Mac setup script
├── NOTIFICATION-SYSTEM-GUIDE.md         # Complete documentation
├── NOTIFICATION-IMPLEMENTATION-SUMMARY.md # Technical summary
└── NOTIFICATION-QUICK-START.md          # This file
```

---

## 🔌 API Endpoints

```http
# Get your notification preferences
GET /api/notifications/preferences
Authorization: Bearer <token>

# Update a preference (enable/disable)
PUT /api/notifications/preferences/MODULE_PUBLISHED
Authorization: Bearer <token>
Body: { "email_enabled": false }

# View notification history
GET /api/notifications/history
Authorization: Bearer <token>

# Test notification (dev only)
POST /api/notifications/test
Authorization: Bearer <token>
Body: { "eventCode": "ACCOUNT_CREATED", "data": {...} }
```

---

## 🔧 Manage Preferences

Users can enable/disable notifications via API:

```javascript
// Disable module notifications
PUT /api/notifications/preferences/MODULE_PUBLISHED
{
  "email_enabled": false,
  "sms_enabled": false
}

// Re-enable test notifications
PUT /api/notifications/preferences/TEST_ASSIGNED
{
  "email_enabled": true,
  "sms_enabled": false
}
```

Future: Add UI in Settings page for easy preference management.

---

## 📊 Check Status

### View Recent Notifications (SQL)
```sql
SELECT * FROM v_recent_notifications 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Failed Emails
```sql
SELECT * FROM notification_logs 
WHERE status = 'failed';
```

### View User Preferences
```sql
SELECT * FROM v_user_notification_settings 
WHERE user_id = 5;
```

---

## ❓ Troubleshooting

### Emails Not Sending?

1. **Check SMTP config in `.env`:**
   - Must be App Password, not regular Gmail password
   - Must enable 2FA on Gmail first

2. **Check server console:**
   ```
   ✓ Sent MODULE_PUBLISHED notifications to 5 students
   ✗ Email send failed: Invalid login
   ```

3. **Check notification logs:**
   ```sql
   SELECT * FROM notification_logs 
   WHERE status = 'failed' 
   ORDER BY created_at DESC;
   ```

### User Not Receiving Emails?

1. **Check spam folder**

2. **Check user preferences:**
   ```sql
   SELECT * FROM notification_preferences 
   WHERE user_id = YOUR_USER_ID;
   ```

3. **Re-enable notifications:**
   ```sql
   UPDATE notification_preferences 
   SET email_enabled = true 
   WHERE user_id = YOUR_USER_ID;
   ```

---

## 📚 Full Documentation

- **Complete Guide:** [NOTIFICATION-SYSTEM-GUIDE.md](NOTIFICATION-SYSTEM-GUIDE.md)
  - Full setup instructions
  - All 20 event types explained
  - Email template customization
  - Scheduled reminders
  - Advanced configuration

- **Implementation Summary:** [NOTIFICATION-IMPLEMENTATION-SUMMARY.md](NOTIFICATION-IMPLEMENTATION-SUMMARY.md)
  - Technical architecture
  - Database schema details
  - Code changes summary
  - Future enhancements

---

## ✅ Verification Checklist

- [ ] Database migration completed
- [ ] Gmail App Password generated
- [ ] `.env` file updated
- [ ] Server restarted
- [ ] Test student created → Received welcome email
- [ ] Test module published → Students received email
- [ ] Test created → Students received email
- [ ] Test submitted → Teacher received email
- [ ] Notification preferences viewable
- [ ] Notification history viewable

---

## 🎉 Success!

Once configured, your LMS will automatically:

- 📧 Send professional HTML emails
- 🎯 Respect user preferences
- 📝 Log all delivery attempts
- 🚫 Never crash if email fails
- 📊 Track delivery statistics
- 🔐 Keep users in control (opt-in/opt-out)

**Happy notifying! 🔔**

---

## Need Help?

1. Check [NOTIFICATION-SYSTEM-GUIDE.md](NOTIFICATION-SYSTEM-GUIDE.md) for detailed help
2. Review server console logs
3. Check database notification_logs table
4. Verify SMTP credentials

---

**Made with ❤️ for Sustainable Classroom**
