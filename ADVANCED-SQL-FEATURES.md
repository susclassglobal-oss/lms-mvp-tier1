# 🚀 Advanced SQL Script Features

## What Makes This Script "CREATE OR REPLACE" Based?

### 1. **Helper Functions (Reusable)**
```sql
CREATE OR REPLACE FUNCTION add_column_if_not_exists(...)
CREATE OR REPLACE FUNCTION create_index_if_not_exists(...)
```
- These functions can be run multiple times
- They check if columns/indexes exist before creating
- Provide clear feedback messages

### 2. **Idempotent Operations**
- Safe to run the script multiple times
- Won't fail if tables/columns already exist
- Won't duplicate data or indexes

### 3. **Smart Table Creation**
```sql
IF NOT EXISTS (SELECT 1 FROM information_schema.tables...)
```
- Checks if table exists before creating
- Adds missing columns to existing tables
- Preserves existing data

### 4. **Utility Views (CREATE OR REPLACE)**
```sql
CREATE OR REPLACE VIEW v_teachers_with_stats AS...
CREATE OR REPLACE VIEW v_students_with_section AS...
CREATE OR REPLACE VIEW v_modules_detailed AS...
```
- Views are automatically updated if they exist
- Provide convenient data access patterns

### 5. **Comprehensive Verification**
- Counts records in each table
- Counts columns in each table
- Verifies indexes and constraints
- Beautiful formatted output

---

## 📊 Bonus Features Included

### Utility Views You Can Use:

#### 1. Teachers with Statistics
```sql
SELECT * FROM v_teachers_with_stats;
```
Shows teachers with their module count.

#### 2. Students with Full Section
```sql
SELECT * FROM v_students_with_section;
```
Shows students with combined "ECE A" format section.

#### 3. Modules with Teacher Details
```sql
SELECT * FROM v_modules_detailed;
```
Shows modules with teacher department and email.

---

## 🎯 What Happens When You Run It?

### First Time:
```
✓ Created teachers table
✓ Added column teachers.staff_id (TEXT)
✓ Added column teachers.dept (TEXT)
✓ Added column teachers.media (JSONB)
✓ Created modules table with foreign key constraint
✓ Created index idx_teachers_email
✓ Created view: v_teachers_with_stats
✓ TEACHERS table exists (9 columns, 0 records)
✓ STUDENTS table exists (9 columns, 0 records)
✓ MODULES table exists (8 columns, 0 records)
```

### Second Time (Already Setup):
```
→ Teachers table already exists
→ Column teachers.staff_id already exists, skipping
→ Column teachers.dept already exists, skipping
→ Modules table already exists
→ Index idx_teachers_email already exists, skipping
✓ Created view: v_teachers_with_stats (updated)
✓ TEACHERS table exists (9 columns, 2 records)
✓ STUDENTS table exists (9 columns, 5 records)
✓ MODULES table exists (8 columns, 3 records)
```

---

## 🔍 Useful Queries After Setup

### Check all tables:
```sql
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Check all indexes:
```sql
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Check all views:
```sql
SELECT table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Check foreign keys:
```sql
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

---

## 🧹 Cleanup (Optional)

If you want to remove the helper functions after setup:
```sql
DROP FUNCTION IF EXISTS add_column_if_not_exists(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_index_if_not_exists(TEXT, TEXT, TEXT);
```

Or keep them for future use!

---

## ✅ Advantages of This Approach

1. **Safe**: Won't break existing data
2. **Repeatable**: Can run multiple times
3. **Clear**: Shows exactly what it's doing
4. **Professional**: Uses PostgreSQL best practices
5. **Maintainable**: Easy to add new columns/indexes later
6. **Documented**: Self-documenting with NOTICE messages
