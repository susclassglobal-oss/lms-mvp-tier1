# 🔔 EMAIL NOTIFICATION SYSTEM - COMPLETE GUIDE

## Overview

The Sustainable Classroom LMS now includes a comprehensive email notification system that automatically notifies students and teachers about important events such as:

- **For Students:**
  - New modules published
  - New tests assigned
  - Test deadlines approaching (24h and 1h reminders)
  - Grades posted
  - Low performance alerts
  - Account creation welcome emails

- **For Teachers:**
  - Student test submissions
  - All students completed module
  - Low class performance alerts
  - No submissions before deadline
  - Coding submissions
  - Account creation welcome emails

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Available Notification Events](#available-notification-events)
5. [API Endpoints](#api-endpoints)
6. [Email Templates](#email-templates)
7. [Testing Notifications](#testing-notifications)
8. [Scheduled Reminders (Optional)](#scheduled-reminders-optional)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Install Dependencies (Already Done)

```bash
cd backend
npm install
# nodemailer is already in package.json
```

### 2. Setup Database Schema

Run the notification system database schema:

```bash
# Connect to your PostgreSQL database and run:
psql $DATABASE_URL -f backend/notification-system.sql
```

Or manually execute the SQL file in your database client.

### 3. Configure Email Service

Add these environment variables to `backend/.env`:

```env
# SMTP Configuration for Email Notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password

# Frontend URL for email links
FRONTEND_URL=http://localhost:5173
```

### 4. Start the Server

```bash
cd backend
npm run dev
```

✅ **Notifications are now active!** The system will automatically send emails when events occur.

---

## Environment Configuration

### Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to Google Account > Security > 2-Step Verification
   - Scroll to "App passwords"
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password
   - Use this as `SMTP_PASSWORD`

### Other Email Providers

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

#### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-access-key
SMTP_PASSWORD=your-ses-secret-key
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your-mailgun-password
```

---

## Database Setup

### Tables Created

The notification system creates 4 main tables:

1. **`notification_events`** - Catalog of all event types
2. **`notification_preferences`** - User subscription settings
3. **`notification_logs`** - History of all sent notifications
4. **`notification_queue`** - Queue for batch processing (future use)

### Views Created

1. **`v_user_notification_settings`** - User preferences with event details
2. **`v_recent_notifications`** - Notification history with user names
3. **`v_notification_stats`** - Delivery statistics

### Automatic Features

- **Auto-create preferences:** When a new student/teacher is created, default notification preferences are automatically generated
- **Triggers:** Database triggers automatically create preferences for new users

---

## Available Notification Events

### Student Notifications

| Event Code | Event Name | Description | Default Enabled |
|-----------|-----------|-------------|-----------------|
| `MODULE_PUBLISHED` | New Module Available | New learning module published to section | ✅ Yes |
| `MODULE_UPDATED` | Module Content Updated | Module content has been modified | ✅ Yes |
| `TEST_ASSIGNED` | New Test Assigned | New test assigned to section | ✅ Yes |
| `TEST_DEADLINE_24H` | Test Deadline in 24 Hours | Reminder 24 hours before deadline | ✅ Yes |
| `TEST_DEADLINE_1H` | Test Deadline in 1 Hour | Final reminder 1 hour before deadline | ✅ Yes |
| `GRADE_POSTED` | Test Grade Posted | Test has been graded | ✅ Yes |
| `LOW_PERFORMANCE_ALERT` | Performance Alert | Score below 50% on test | ✅ Yes |
| `CODING_FEEDBACK` | Coding Submission Feedback | Teacher provided feedback | ✅ Yes |

### Teacher Notifications

| Event Code | Event Name | Description | Default Enabled |
|-----------|-----------|-------------|-----------------|
| `TEST_SUBMITTED` | Student Submitted Test | Student completed a test | ✅ Yes |
| `MODULE_COMPLETION` | Student Completed Module | Individual student finished module | ❌ No |
| `ALL_STUDENTS_COMPLETED` | All Students Completed Module | All students finished module | ✅ Yes |
| `DEADLINE_REVIEW_REMINDER` | Test Review Reminder | Reminder to review submissions | ✅ Yes |
| `LOW_CLASS_PERFORMANCE` | Low Class Performance Alert | Average class score below 60% | ✅ Yes |
| `NO_SUBMISSIONS_ALERT` | No Test Submissions | No submissions 24h before deadline | ✅ Yes |
| `CODING_SUBMISSION` | New Coding Submission | Student submitted coding problem | ✅ Yes |

### System Notifications (Both)

| Event Code | Event Name | Description | Default Enabled |
|-----------|-----------|-------------|-----------------|
| `ACCOUNT_CREATED` | Account Created Successfully | Welcome email for new accounts | ✅ Yes |
| `SYSTEM_ANNOUNCEMENT` | System Announcement | Important system-wide messages | ✅ Yes |
| `SECTION_CHANGE` | Section Assignment Changed | Student moved to different section | ✅ Yes |
| `PASSWORD_RESET` | Password Reset Request | Password reset confirmation | ✅ Yes |

---

## API Endpoints

### Get User Notification Preferences

```http
GET /api/notifications/preferences
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 5,
    "user_type": "student",
    "user_name": "John Doe",
    "user_email": "john@example.com",
    "event_code": "MODULE_PUBLISHED",
    "event_name": "New Module Available",
    "category": "module",
    "email_enabled": true,
    "sms_enabled": false,
    "updated_at": "2026-01-15T10:30:00Z"
  }
]
```

### Update Notification Preference

```http
PUT /api/notifications/preferences/MODULE_PUBLISHED
Authorization: Bearer <token>
Content-Type: application/json

{
  "email_enabled": false,
  "sms_enabled": false
}
```

### Get Notification History

```http
GET /api/notifications/history?limit=20&offset=0
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 123,
    "event_code": "TEST_ASSIGNED",
    "event_name": "New Test Assigned",
    "category": "test",
    "recipient_name": "John Doe",
    "recipient_email": "john@example.com",
    "channel": "email",
    "status": "sent",
    "subject": "📝 New Test Assigned: Midterm Exam",
    "sent_at": "2026-01-15T10:00:00Z",
    "created_at": "2026-01-15T09:59:55Z",
    "metadata": {
      "test_id": 42,
      "teacher_id": 8
    }
  }
]
```

### Get Notification Statistics (Admin/Teacher)

```http
GET /api/notifications/stats
Authorization: Bearer <token>
```

### Test Notification (Development)

```http
POST /api/notifications/test
Authorization: Bearer <token>
Content-Type: application/json

{
  "eventCode": "MODULE_PUBLISHED",
  "data": {
    "student_name": "Test User",
    "section": "CS-A",
    "topic_title": "Introduction to Python",
    "subject": "Programming",
    "teacher_name": "Dr. Smith",
    "step_count": 5
  }
}
```

---

## Email Templates

All email templates are defined in `backend/notificationService.js` in the `emailTemplates` object.

### Template Structure

Each template returns:
```javascript
{
  subject: "Email subject line",
  html: "HTML email body"
}
```

### Customizing Templates

To customize email templates, edit `backend/notificationService.js`:

```javascript
const emailTemplates = {
  MODULE_PUBLISHED: (data) => ({
    subject: `📚 New Module: ${data.topic_title}`,
    html: `
      <!-- Your custom HTML here -->
      <h2>Hello ${data.student_name}</h2>
      <p>New module: ${data.topic_title}</p>
    `
  })
};
```

### Template Data Variables

Each event type receives specific data:

**MODULE_PUBLISHED:**
- `student_name`, `section`, `topic_title`, `subject`, `teacher_name`, `step_count`

**TEST_ASSIGNED:**
- `student_name`, `section`, `test_title`, `description`, `total_questions`, `start_date`, `deadline`

**GRADE_POSTED:**
- `student_name`, `test_title`, `score`, `total_questions`, `percentage`, `status`

**TEST_SUBMITTED:**
- `teacher_name`, `student_name`, `student_reg_no`, `test_title`, `score`, `total_questions`, `percentage`, `status`, `submitted_at`, `test_id`

---

## Testing Notifications

### 1. Test via API Endpoint

```bash
# Get your auth token first by logging in
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password","role":"student"}'

# Use token to test notification
curl -X POST http://localhost:5000/api/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventCode": "MODULE_PUBLISHED",
    "data": {
      "student_name": "Test User",
      "section": "CS-A",
      "topic_title": "Test Module",
      "subject": "Testing",
      "teacher_name": "Test Teacher",
      "step_count": 3
    }
  }'
```

### 2. Trigger Real Events

**Test Module Notification:**
1. Log in as teacher
2. Create a new module
3. Check student email

**Test Test Assignment:**
1. Log in as teacher
2. Create a new test
3. Check student email

**Test Submission Notification:**
1. Log in as student
2. Submit a test
3. Check teacher email

### 3. Check Database Logs

```sql
-- View recent notifications
SELECT * FROM v_recent_notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- Check delivery status
SELECT 
  event_code,
  status,
  COUNT(*) as count
FROM notification_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY event_code, status;

-- Failed notifications
SELECT * FROM notification_logs 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

---

## Scheduled Reminders (Optional)

For deadline reminders (24h and 1h before test deadline), you'll need to implement a cron job or scheduler.

### Using Node-Cron (Recommended)

1. **Install node-cron:**
```bash
cd backend
npm install node-cron
```

2. **Create scheduler file** `backend/scheduler.js`:

```javascript
const cron = require('node-cron');
const { Pool } = require('pg');
const notificationService = require('./notificationService');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

notificationService.initializeNotificationService(pool);

// Run every hour to check for upcoming deadlines
cron.schedule('0 * * * *', async () => {
  console.log('Checking for upcoming test deadlines...');
  
  // 24h reminder
  const tests24h = await pool.query(`
    SELECT * FROM mcq_tests 
    WHERE deadline BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours'
      AND is_active = true
  `);
  
  for (const test of tests24h.rows) {
    const students = await pool.query(`
      SELECT s.id, s.name, s.email 
      FROM students s
      WHERE LOWER(s.section) = LOWER($1)
        AND NOT EXISTS (
          SELECT 1 FROM test_submissions ts 
          WHERE ts.test_id = $2 AND ts.student_id = s.id
        )
    `, [test.section, test.id]);
    
    for (const student of students.rows) {
      await notificationService.sendEmail(
        'TEST_DEADLINE_24H',
        {
          id: student.id,
          type: 'student',
          email: student.email,
          name: student.name
        },
        {
          student_name: student.name,
          test_title: test.title,
          deadline: test.deadline,
          submitted: false
        },
        { test_id: test.id }
      );
    }
  }
  
  console.log('Deadline check complete');
});

console.log('📅 Scheduler started');
```

3. **Update package.json:**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "scheduler": "node scheduler.js"
  }
}
```

4. **Run scheduler:**
```bash
npm run scheduler
```

---

## Troubleshooting

### Emails Not Sending

1. **Check SMTP configuration:**
```javascript
// Add to server.js temporarily to test
const nodemailer = require('nodemailer');
const testConnection = async () => {
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
  
  try {
    await transporter.verify();
    console.log('✓ SMTP connection successful');
  } catch (error) {
    console.error('✗ SMTP connection failed:', error);
  }
};
testConnection();
```

2. **Check database logs:**
```sql
SELECT * FROM notification_logs 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

3. **Check user preferences:**
```sql
SELECT * FROM notification_preferences 
WHERE user_id = YOUR_USER_ID 
  AND user_type = 'student';
```

### Gmail "Less Secure Apps" Error

- Enable 2FA on Gmail
- Generate App Password (not your regular password)
- Use App Password in `SMTP_PASSWORD`

### Notifications Disabled

Check if user has disabled notifications:

```sql
UPDATE notification_preferences 
SET email_enabled = true 
WHERE user_id = YOUR_USER_ID 
  AND event_code = 'MODULE_PUBLISHED';
```

### Server Logs

Check server console for notification logs:
```
✓ Sent MODULE_PUBLISHED notifications to 25 students
✓ Email sent to john@example.com (MODULE_PUBLISHED): <message-id>
✗ Email send failed for jane@example.com (TEST_ASSIGNED): connection timeout
```

---

## Summary

### ✅ What's Implemented

- ✅ Database schema with 20 event types
- ✅ Email service with nodemailer
- ✅ 8 HTML email templates
- ✅ Automatic notifications for:
  - Module publishing
  - Test assignment
  - Test submission
  - Grade posting
  - Account creation
- ✅ User preference management API
- ✅ Notification history API
- ✅ Batch email sending
- ✅ Non-blocking notification (won't crash main app)
- ✅ Delivery status tracking

### 🔜 Future Enhancements

- SMS notifications (Twilio integration)
- Push notifications (FCM)
- Email templates for deadline reminders
- Scheduled reminder cron jobs
- Notification digest (daily summary)
- In-app notifications
- Notification analytics dashboard

---

## Quick Reference

### Start Server with Notifications
```bash
cd backend
npm run dev
```

### Run Database Setup
```bash
psql $DATABASE_URL -f backend/notification-system.sql
```

### Test Email Sending
```bash
curl -X POST http://localhost:5000/api/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventCode":"ACCOUNT_CREATED","data":{"name":"Test","email":"test@test.com","role":"student"}}'
```

### Check Recent Notifications
```sql
SELECT * FROM v_recent_notifications LIMIT 10;
```

---

## Need Help?

- Check server logs for error messages
- Verify SMTP credentials in `.env`
- Test SMTP connection manually
- Check database notification_logs table for failed deliveries
- Ensure notification preferences are enabled for users

**Happy notifying! 🔔📧**
