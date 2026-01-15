# Complete Database Setup Instructions

## 🎯 Quick Start

### Step 1: Open Neon PostgreSQL Console
1. Go to https://console.neon.tech
2. Select your project
3. Click "SQL Editor" in left sidebar

### Step 2: Run the Setup Script
1. Open file: `backend/FRESH-COMPLETE-DATABASE.sql`
2. Copy ALL contents (Ctrl+A, Ctrl+C)
3. Paste into Neon SQL Editor
4. Click "Run" button
5. Wait for completion (should see success messages)

### Step 3: Verify Setup
Run this query to verify:
```sql
SELECT 
    (SELECT COUNT(*) FROM teachers) as teachers,
    (SELECT COUNT(*) FROM students) as students,
    (SELECT COUNT(*) FROM modules) as modules,
    (SELECT COUNT(*) FROM mcq_tests) as tests,
    (SELECT COUNT(*) FROM test_submissions) as submissions;
```

---

## 📋 What Gets Created

### Tables (5)
1. **teachers** - Teacher accounts with sections
2. **students** - Student accounts with class/section
3. **modules** - Learning modules by teachers
4. **mcq_tests** - MCQ tests created by teachers
5. **test_submissions** - Student test results

### Views (5)
1. **v_teachers_with_stats** - Teachers with module/test counts
2. **v_students_with_section** - Students with full section info
3. **v_modules_detailed** - Modules with teacher details
4. **v_student_test_progress** - Student progress analytics
5. **v_test_statistics** - Test statistics for teachers

### Functions (3)
1. **get_student_detailed_progress(student_id)** - Detailed test history
2. **get_test_performance_summary(test_id)** - Test analytics
3. **refresh_student_analytics()** - Refresh materialized view

### Materialized View (1)
1. **mv_student_performance_analytics** - Performance categories

### Indexes (25+)
- Optimized for email lookups, section queries, test filtering
- Composite indexes for complex queries
- Partial indexes for active records

---

## 🔒 Security Features

### Constraints
- Email format validation
- Name length checks
- Score range validation (0-100)
- Deadline must be after start date
- JSONB type validation
- Foreign key cascades

### Data Integrity
- Unique constraints on email, test submissions
- NOT NULL on critical fields
- CHECK constraints on numeric ranges
- Referential integrity with CASCADE deletes

---

## 📊 Score Calculation

**Formula:** `(correct_answers / total_questions) × 100`

**Example:**
- Test has 15 questions
- Student gets 12 correct
- Score = (12 / 15) × 100 = **80.00%**

**Implementation:**
- Backend calculates score (server.js lines 595-615)
- Compares student answers with teacher's correct answers
- Stores in test_submissions table
- No hardcoding - all dynamic from database

---

## 🧪 Testing the Setup

### Test 1: Create Teacher
```sql
INSERT INTO teachers (name, email, password, dept, allocated_sections)
VALUES ('John Doe', 'john@example.com', 'hashed_password', 'CSE', '["CSE A", "CSE B"]'::jsonb);
```

### Test 2: Create Student
```sql
INSERT INTO students (name, email, password, reg_no, class_dept, section)
VALUES ('Alice Smith', 'alice@example.com', 'hashed_password', 'CS001', 'CSE', 'A');
```

### Test 3: Create Test
```sql
INSERT INTO mcq_tests (teacher_id, teacher_name, section, title, questions, total_questions, deadline)
VALUES (
    1, 
    'John Doe', 
    'CSE A', 
    'Sample Test',
    '[{"question":"What is 2+2?","option_a":"3","option_b":"4","option_c":"5","option_d":"6","correct":"B"}]'::jsonb,
    1,
    CURRENT_TIMESTAMP + INTERVAL '7 days'
);
```

### Test 4: Submit Test
```sql
INSERT INTO test_submissions (test_id, student_id, student_name, answers, score, percentage)
VALUES (1, 1, 'Alice Smith', '{"0":"B"}'::jsonb, 1, 100.00);
```

### Test 5: View Results
```sql
SELECT * FROM v_test_statistics WHERE test_id = 1;
SELECT * FROM v_student_test_progress WHERE student_id = 1;
```

---

## 🔧 Maintenance Queries

### Refresh Analytics
```sql
SELECT refresh_student_analytics();
```

### View All Tests
```sql
SELECT test_id, title, section, total_submissions, average_score, passed_count
FROM v_test_statistics
ORDER BY created_at DESC;
```

### View Student Progress
```sql
SELECT * FROM get_student_detailed_progress(1);
```

### View Test Performance
```sql
SELECT * FROM get_test_performance_summary(1);
```

### Check Database Health
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## ⚠️ Important Notes

1. **Run Once**: This script drops and recreates everything
2. **Backup First**: If you have existing data, backup before running
3. **Connection String**: Update .env file with correct DATABASE_URL
4. **Restart Backend**: After running SQL, restart Node.js server
5. **No Hardcoding**: All data is dynamic from database

---

## 🆘 Troubleshooting

### Error: "relation already exists"
- The script handles this automatically
- If error persists, manually drop tables first

### Error: "permission denied"
- Check your Neon user has CREATE permissions
- Contact Neon support if needed

### Error: "syntax error"
- Ensure you copied the ENTIRE script
- Check for any copy/paste issues

### Tests not showing on dashboard
```sql
-- Check if tests exist
SELECT * FROM mcq_tests;

-- Check if view works
SELECT * FROM v_test_statistics;

-- Check section names match
SELECT DISTINCT section FROM mcq_tests;
SELECT DISTINCT CONCAT(class_dept, ' ', section) FROM students;
```

---

## ✅ Success Checklist

- [ ] Script ran without errors
- [ ] All tables created (5 tables)
- [ ] All views created (5 views)
- [ ] All functions created (3 functions)
- [ ] Indexes created (25+ indexes)
- [ ] Backend server restarted
- [ ] Can login as teacher
- [ ] Can create MCQ test
- [ ] Can login as student
- [ ] Can take test
- [ ] Score calculates correctly
- [ ] Teacher sees test list
- [ ] Student sees progress

---

## 📞 Support

If you encounter issues:
1. Check backend console for errors
2. Check browser console (F12)
3. Verify database connection in .env
4. Run verification queries above
5. Check Neon dashboard for connection status

**Database is now ready to use!** 🎉
