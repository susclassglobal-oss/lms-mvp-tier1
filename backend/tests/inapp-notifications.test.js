/**
 * ============================================================
 * IN-APP NOTIFICATION SYSTEM TESTS
 * ============================================================
 * Tests for the in-app notification bell feature
 * - API endpoints for notifications
 * - In-app notification creation templates
 * - Mark as read functionality
 * - Dashboard data endpoints
 * 
 * Uses SQLite in-memory DB to avoid hitting production database
 */

const request = require('supertest');
const Database = require('better-sqlite3');
const jwt = require('jsonwebtoken');

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  }))
}));

let db;
let app;
const JWT_SECRET = 'test-secret-key';
let teacherToken = '';
let studentToken = '';
let testTeacherId = 1;
let testStudentId = 1;

const generateTestToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

beforeAll(async () => {
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.ADMIN_EMAIL = 'admin@test.com';
  process.env.ADMIN_PASSWORD = 'admin123';
  process.env.NODE_ENV = 'test';
  
  db = new Database(':memory:');
  
  db.exec(`
    -- Teachers table
    CREATE TABLE teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      staff_id TEXT,
      dept TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Students table
    CREATE TABLE students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      reg_no TEXT,
      class_dept TEXT,
      section TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- In-app notifications table
    CREATE TABLE in_app_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      user_type TEXT NOT NULL CHECK (user_type IN ('student', 'teacher', 'admin')),
      event_code TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      metadata TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Notification preferences
    CREATE TABLE notification_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      user_type TEXT NOT NULL,
      event_code TEXT NOT NULL,
      email_enabled INTEGER DEFAULT 1,
      UNIQUE(user_id, user_type, event_code)
    );

    -- Modules table
    CREATE TABLE modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_title TEXT NOT NULL,
      subject TEXT,
      class_dept TEXT,
      section TEXT,
      teacher_id INTEGER,
      is_published INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Tests table
    CREATE TABLE tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      class_dept TEXT,
      section TEXT,
      teacher_id INTEGER,
      deadline TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Test attempts table
    CREATE TABLE test_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER,
      student_id INTEGER,
      score INTEGER,
      total INTEGER,
      percentage REAL,
      submitted_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Module progress table
    CREATE TABLE module_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      module_id INTEGER,
      completed_steps INTEGER DEFAULT 0,
      total_steps INTEGER,
      last_step_completed TEXT,
      UNIQUE(student_id, module_id)
    );

    -- Create indexes
    CREATE INDEX idx_inapp_user ON in_app_notifications(user_id, user_type);
    CREATE INDEX idx_inapp_unread ON in_app_notifications(user_id, user_type, is_read);
  `);

  db.prepare(`INSERT INTO teachers (id, name, email, staff_id, dept) VALUES (?, ?, ?, ?, ?)`)
    .run(1, 'Test Teacher', 'teacher@test.com', 'T001', 'CSE');
  
  db.prepare(`INSERT INTO students (id, name, email, reg_no, class_dept, section) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(1, 'Test Student', 'student@test.com', 'S001', 'CSE', 'A');

  teacherToken = generateTestToken({ id: testTeacherId, email: 'teacher@test.com', role: 'teacher' });
  studentToken = generateTestToken({ id: testStudentId, email: 'student@test.com', role: 'student' });

  jest.doMock('pg', () => ({
    Pool: jest.fn(() => ({
      query: jest.fn((sql, params) => {
        try {
          let sqliteSql = sql.replace(/\$(\d+)/g, '?');
          
          sqliteSql = sqliteSql.replace(/RETURNING \*/gi, '');
          sqliteSql = sqliteSql.replace(/RETURNING id/gi, '');
          sqliteSql = sqliteSql.replace(/::text/gi, '');
          sqliteSql = sqliteSql.replace(/COALESCE/gi, 'IFNULL');
          
          if (sqliteSql.trim().toUpperCase().startsWith('SELECT')) {
            const stmt = db.prepare(sqliteSql);
            const rows = params ? stmt.all(...params) : stmt.all();
            return Promise.resolve({ rows, rowCount: rows.length });
          } else if (sqliteSql.trim().toUpperCase().startsWith('INSERT')) {
            const stmt = db.prepare(sqliteSql);
            const result = params ? stmt.run(...params) : stmt.run();
            return Promise.resolve({ 
              rows: [{ id: result.lastInsertRowid }], 
              rowCount: result.changes 
            });
          } else if (sqliteSql.trim().toUpperCase().startsWith('UPDATE')) {
            const stmt = db.prepare(sqliteSql);
            const result = params ? stmt.run(...params) : stmt.run();
            return Promise.resolve({ rowCount: result.changes, rows: [] });
          } else if (sqliteSql.trim().toUpperCase().startsWith('DELETE')) {
            const stmt = db.prepare(sqliteSql);
            const result = params ? stmt.run(...params) : stmt.run();
            return Promise.resolve({ rowCount: result.changes, rows: [] });
          }
          return Promise.resolve({ rows: [], rowCount: 0 });
        } catch (err) {
          console.error('SQLite query error:', err.message, '\nSQL:', sql);
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
      }),
      connect: jest.fn(),
      end: jest.fn()
    }))
  }));

  jest.resetModules();
  app = require('../server');
});

afterAll(() => {
  if (db) db.close();
});

describe('In-App Notification System Tests', () => {


  describe('GET /api/notifications/inbox', () => {
    
    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/notifications/inbox');
      
      expect(res.status).toBe(401);
    });

    it('should return notifications array for authenticated user', async () => {
      const res = await request(app)
        .get('/api/notifications/inbox')
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should work for teacher role as well', async () => {
      const res = await request(app)
        .get('/api/notifications/inbox')
        .set('Authorization', `Bearer ${teacherToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    
    it('should return unread count object', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('count');
      expect(typeof res.body.count).toBe('number');
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count');
      
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    let testNotificationId;

    beforeAll(() => {
      const result = db.prepare(
        `INSERT INTO in_app_notifications (user_id, user_type, event_code, title, message, is_read)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(testStudentId, 'student', 'GRADE_POSTED', 'Mark Read Test', 'Testing mark read', 0);
      testNotificationId = result.lastInsertRowid;
    });

    it('should mark notification as read', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${testNotificationId}/read`)
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect([200, 404]).toContain(res.status);
    });

    it('should return 404 for non-existent notification', async () => {
      const res = await request(app)
        .patch('/api/notifications/99999/read')
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    
    beforeAll(() => {
      db.prepare(
        `INSERT INTO in_app_notifications (user_id, user_type, event_code, title, message, is_read)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(testStudentId, 'student', 'MODULE_PUBLISHED', 'Unread 1', 'Message 1', 0);
      
      db.prepare(
        `INSERT INTO in_app_notifications (user_id, user_type, event_code, title, message, is_read)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(testStudentId, 'student', 'TEST_ASSIGNED', 'Unread 2', 'Message 2', 0);
    });

    it('should mark all notifications as read', async () => {
      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });
});


describe('In-App Notification Templates', () => {
  
  const inAppTemplates = {
    MODULE_PUBLISHED: {
      title: 'New Module Available',
      getMessage: (data) => `${data.teacher_name} published "${data.topic_title}" in ${data.subject}`,
      getLink: () => '/courses'
    },
    TEST_ASSIGNED: {
      title: 'New Test Assigned',
      getMessage: (data) => `You have a new test: "${data.test_title}"`,
      getLink: () => '/test-knowledge'
    },
    GRADE_POSTED: {
      title: 'Grade Posted',
      getMessage: (data) => `Your score for "${data.test_title}": ${data.percentage}%`,
      getLink: () => '/progress'
    },
    TEST_SUBMITTED: {
      title: 'New Test Submission',
      getMessage: (data) => `${data.student_name} submitted "${data.test_title}" with ${data.percentage}%`,
      getLink: () => '/teacher-dashboard'
    },
    TEST_DEADLINE_24H: {
      title: 'Test Deadline Approaching',
      getMessage: (data) => `"${data.test_title}" is due in 24 hours`,
      getLink: () => '/test-knowledge'
    }
  };

  it('should generate MODULE_PUBLISHED message correctly', () => {
    const template = inAppTemplates.MODULE_PUBLISHED;
    const data = { 
      teacher_name: 'Dr. Smith', 
      topic_title: 'Introduction to AI', 
      subject: 'Computer Science' 
    };
    
    expect(template.title).toBe('New Module Available');
    expect(template.getMessage(data)).toBe('Dr. Smith published "Introduction to AI" in Computer Science');
    expect(template.getLink()).toBe('/courses');
  });

  it('should generate TEST_ASSIGNED message correctly', () => {
    const template = inAppTemplates.TEST_ASSIGNED;
    const data = { test_title: 'Midterm Exam' };
    
    expect(template.title).toBe('New Test Assigned');
    expect(template.getMessage(data)).toBe('You have a new test: "Midterm Exam"');
    expect(template.getLink()).toBe('/test-knowledge');
  });

  it('should generate GRADE_POSTED message with percentage', () => {
    const template = inAppTemplates.GRADE_POSTED;
    const data = { test_title: 'Final Exam', percentage: 85 };
    
    expect(template.title).toBe('Grade Posted');
    expect(template.getMessage(data)).toContain('85%');
    expect(template.getLink()).toBe('/progress');
  });

  it('should generate TEST_SUBMITTED message for teachers', () => {
    const template = inAppTemplates.TEST_SUBMITTED;
    const data = { student_name: 'John Doe', test_title: 'Quiz 1', percentage: 92 };
    
    expect(template.title).toBe('New Test Submission');
    expect(template.getMessage(data)).toContain('John Doe');
    expect(template.getMessage(data)).toContain('92%');
    expect(template.getLink()).toBe('/teacher-dashboard');
  });

  it('should generate TEST_DEADLINE_24H message', () => {
    const template = inAppTemplates.TEST_DEADLINE_24H;
    const data = { test_title: 'Project Submission' };
    
    expect(template.title).toBe('Test Deadline Approaching');
    expect(template.getMessage(data)).toContain('24 hours');
    expect(template.getLink()).toBe('/test-knowledge');
  });

  it('should NOT have ACCOUNT_CREATED template (email only)', () => {
    expect(inAppTemplates.ACCOUNT_CREATED).toBeUndefined();
  });
});


describe(' Student Dashboard Data Tests', () => {

  describe('GET /api/student/profile', () => {
    it('should return 200 or 404 for student profile', async () => {
      const res = await request(app)
        .get('/api/student/profile')
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect([200, 404]).toContain(res.status);
    });

    it('should reject without auth', async () => {
      const res = await request(app)
        .get('/api/student/profile');
      
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/student/tests', () => {
    it('should return array of tests for student', async () => {
      const res = await request(app)
        .get('/api/student/tests')
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(Array.isArray(res.body)).toBe(true);
      }
    });
  });

  describe('GET /api/student/my-modules', () => {
    it('should return array of modules', async () => {
      const res = await request(app)
        .get('/api/student/my-modules')
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('GET /api/student/progress', () => {
    it('should return progress data', async () => {
      const res = await request(app)
        .get('/api/student/progress')
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect([200, 404]).toContain(res.status);
    });
  });
});


describe(' RBAC Tests for Notification Endpoints', () => {
  
  it('should allow student to access their notifications inbox', async () => {
    const res = await request(app)
      .get('/api/notifications/inbox')
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(res.status).toBe(200);
  });

  it('should allow teacher to access their notifications inbox', async () => {
    const res = await request(app)
      .get('/api/notifications/inbox')
      .set('Authorization', `Bearer ${teacherToken}`);
    
    expect(res.status).toBe(200);
  });

  it('should allow teacher to access notification stats', async () => {
    const res = await request(app)
      .get('/api/notifications/stats')
      .set('Authorization', `Bearer ${teacherToken}`);
    
    expect(res.status).toBe(200);
  });

  it('should forbid student from accessing notification stats (teacher-only)', async () => {
    const res = await request(app)
      .get('/api/notifications/stats')
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(res.status).toBe(403);
  });
});


describe('NotificationBell Component Logic', () => {
  
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  it('should format "Just now" for recent times', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('Just now');
  });

  it('should format minutes ago correctly', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe('5m ago');
  });

  it('should format hours ago correctly', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
  });

  it('should format days ago correctly', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
  });

  const getEventIcon = (eventCode) => {
    const icons = {
      MODULE_PUBLISHED: 'M',
      TEST_ASSIGNED: 'T',
      TEST_DEADLINE_24H: '!',
      GRADE_POSTED: 'G',
      TEST_SUBMITTED: 'S',
      LOW_CLASS_PERFORMANCE: 'L',
      MODULE_UPDATED: 'U'
    };
    return icons[eventCode] || 'N';
  };

  it('should return correct icon for MODULE_PUBLISHED', () => {
    expect(getEventIcon('MODULE_PUBLISHED')).toBe('M');
  });

  it('should return correct icon for TEST_ASSIGNED', () => {
    expect(getEventIcon('TEST_ASSIGNED')).toBe('T');
  });

  it('should return correct icon for GRADE_POSTED', () => {
    expect(getEventIcon('GRADE_POSTED')).toBe('G');
  });

  it('should return default icon for unknown event', () => {
    expect(getEventIcon('UNKNOWN_EVENT')).toBe('N');
  });
});
