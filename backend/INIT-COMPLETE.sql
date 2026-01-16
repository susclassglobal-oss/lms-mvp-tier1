-- ============================================================
-- SUSTAINABLE CLASSROOM - COMPLETE DATABASE SETUP
-- ============================================================
-- Fresh installation script - Drops and recreates everything
-- Run this ONCE in Neon PostgreSQL SQL Editor
-- ============================================================

-- ============================================================
-- PART 1: CLEANUP - Drop all existing objects
-- ============================================================
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—';
    RAISE NOTICE 'â•‘          STARTING FRESH DATABASE SETUP                 â•‘';
    RAISE NOTICE 'â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';
    RAISE NOTICE '';
    RAISE NOTICE 'Step 1: Cleaning up existing objects...';
END $$;

-- Drop materialized views
DROP MATERIALIZED VIEW IF EXISTS mv_student_performance_analytics CASCADE;

-- Drop views
DROP VIEW IF EXISTS v_student_test_progress CASCADE;
DROP VIEW IF EXISTS v_test_statistics CASCADE;
DROP VIEW IF EXISTS v_teachers_with_stats CASCADE;
DROP VIEW IF EXISTS v_students_with_section CASCADE;
DROP VIEW IF EXISTS v_modules_detailed CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_student_detailed_progress(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_test_performance_summary(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS refresh_student_analytics() CASCADE;
DROP FUNCTION IF EXISTS calculate_test_score() CASCADE;
DROP FUNCTION IF EXISTS update_test_timestamp() CASCADE;
DROP FUNCTION IF EXISTS add_column_if_not_exists(TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_index_if_not_exists(TEXT, TEXT, TEXT) CASCADE;

-- Drop tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS test_submissions CASCADE;
DROP TABLE IF EXISTS mcq_tests CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;

DO $$ 
BEGIN
    RAISE NOTICE 'âœ“ Cleanup completed';
    RAISE NOTICE '';
END $$;

-- ============================================================
-- PART 2: CREATE CORE TABLES
-- ============================================================
DO $$ 
BEGIN
    RAISE NOTICE 'Step 2: Creating core tables...';
END $$;

-- Table 1: TEACHERS
CREATE TABLE teachers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    staff_id TEXT,
    dept TEXT,
    media JSONB DEFAULT '{}'::jsonb,
    allocated_sections JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_name_length CHECK (char_length(name) >= 2)
);

-- Table 2: STUDENTS
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    reg_no TEXT,
    class_dept TEXT,
    section TEXT,
    media JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_name_length CHECK (char_length(name) >= 2)
);

-- Table 3: MODULES
CREATE TABLE modules (
    id SERIAL PRIMARY KEY,
    section TEXT NOT NULL,
    topic_title TEXT NOT NULL,
    teacher_id INTEGER NOT NULL,
    teacher_name TEXT NOT NULL,
    step_count INTEGER DEFAULT 0,
    steps JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_modules_teacher FOREIGN KEY (teacher_id) 
        REFERENCES teachers(id) ON DELETE CASCADE,
    CONSTRAINT chk_step_count CHECK (step_count >= 0),
    CONSTRAINT chk_steps_array CHECK (jsonb_typeof(steps) = 'array')
);

DO $$ 
BEGIN
    RAISE NOTICE 'âœ“ Core tables created (teachers, students, modules)';
END $$;

-- ============================================================
-- PART 3: CREATE MCQ TEST SYSTEM TABLES
-- ============================================================
DO $$ 
BEGIN
    RAISE NOTICE 'Step 3: Creating MCQ test system tables...';
END $$;

-- Table 4: MCQ_TESTS (Teacher creates tests)
CREATE TABLE mcq_tests (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    teacher_name TEXT NOT NULL,
    section TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_questions INTEGER NOT NULL,
    start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deadline TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    CONSTRAINT fk_tests_teacher FOREIGN KEY (teacher_id) 
        REFERENCES teachers(id) ON DELETE CASCADE,
    CONSTRAINT chk_total_questions CHECK (total_questions > 0 AND total_questions <= 100),
    CONSTRAINT chk_deadline CHECK (deadline > start_date),
    CONSTRAINT chk_questions_array CHECK (jsonb_typeof(questions) = 'array'),
    CONSTRAINT chk_title_length CHECK (char_length(title) >= 3 AND char_length(title) <= 200)
);

-- Table 5: TEST_SUBMISSIONS (Student test results)
CREATE TABLE test_submissions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    student_name TEXT NOT NULL,
    student_reg_no TEXT,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    score INTEGER DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0.00,
    status TEXT DEFAULT 'completed',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_taken INTEGER,
    
    CONSTRAINT fk_submissions_test FOREIGN KEY (test_id) 
        REFERENCES mcq_tests(id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_student FOREIGN KEY (student_id) 
        REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT uq_test_student UNIQUE(test_id, student_id),
    CONSTRAINT chk_score CHECK (score >= 0),
    CONSTRAINT chk_percentage CHECK (percentage >= 0 AND percentage <= 100),
    CONSTRAINT chk_status CHECK (status IN ('completed', 'late', 'pending')),
    CONSTRAINT chk_answers_object CHECK (jsonb_typeof(answers) = 'object'),
    CONSTRAINT chk_time_taken CHECK (time_taken IS NULL OR time_taken >= 0)
);

DO $$ 
BEGIN
    RAISE NOTICE 'âœ“ MCQ test tables created (mcq_tests, test_submissions)';
END $$;

-- ============================================================
-- PART 4: CREATE INDEXES FOR PERFORMANCE
-- ============================================================
DO $$ 
BEGIN
    RAISE NOTICE 'Step 4: Creating performance indexes...';
END $$;

-- Teachers indexes
CREATE INDEX idx_teachers_email ON teachers(email);
CREATE INDEX idx_teachers_staff_id ON teachers(staff_id) WHERE staff_id IS NOT NULL;
CREATE INDEX idx_teachers_dept ON teachers(dept) WHERE dept IS NOT NULL;

-- Students indexes
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_reg_no ON students(reg_no) WHERE reg_no IS NOT NULL;
CREATE INDEX idx_students_section ON students(class_dept, section);
CREATE INDEX idx_students_class_dept ON students(class_dept) WHERE class_dept IS NOT NULL;

-- Modules indexes
CREATE INDEX idx_modules_section ON modules(section);
CREATE INDEX idx_modules_teacher ON modules(teacher_id);
CREATE INDEX idx_modules_created ON modules(created_at DESC);

-- MCQ Tests indexes
CREATE INDEX idx_tests_teacher ON mcq_tests(teacher_id);
CREATE INDEX idx_tests_section ON mcq_tests(section);
CREATE INDEX idx_tests_section_lower ON mcq_tests(LOWER(section));
CREATE INDEX idx_tests_deadline ON mcq_tests(deadline);
CREATE INDEX idx_tests_active ON mcq_tests(is_active) WHERE is_active = true;
CREATE INDEX idx_tests_created ON mcq_tests(created_at DESC);
CREATE INDEX idx_tests_composite ON mcq_tests(teacher_id, is_active, deadline);

-- Test Submissions indexes
CREATE INDEX idx_submissions_test ON test_submissions(test_id);
CREATE INDEX idx_submissions_student ON test_submissions(student_id);
CREATE INDEX idx_submissions_status ON test_submissions(status);
CREATE INDEX idx_submissions_date ON test_submissions(submitted_at DESC);
CREATE INDEX idx_submissions_score ON test_submissions(percentage DESC);
CREATE INDEX idx_submissions_composite ON test_submissions(test_id, student_id, status);

DO $$ 
BEGIN
    RAISE NOTICE 'âœ“ All indexes created (25+ indexes for optimal performance)';
END $$;

-- ============================================================
-- PART 5: CREATE VIEWS FOR DATA ACCESS
-- ============================================================
DO $$ 
BEGIN
    RAISE NOTICE 'Step 5: Creating views...';
END $$;

-- View 1: Teachers with statistics
CREATE VIEW v_teachers_with_stats AS
SELECT 
    t.id,
    t.name,
    t.email,
    t.staff_id,
    t.dept,
    t.allocated_sections,
    t.created_at,
    COUNT(DISTINCT m.id) as module_count,
    COUNT(DISTINCT mt.id) as test_count
FROM teachers t
LEFT JOIN modules m ON t.id = m.teacher_id
LEFT JOIN mcq_tests mt ON t.id = mt.teacher_id
GROUP BY t.id, t.name, t.email, t.staff_id, t.dept, t.allocated_sections, t.created_at;

-- View 2: Students with section info
CREATE VIEW v_students_with_section AS
SELECT 
    s.id,
    s.name,
    s.email,
    s.reg_no,
    s.class_dept,
    s.section,
    CONCAT(s.class_dept, ' ', s.section) as full_section,
    s.created_at
FROM students s;

-- View 3: Modules with details
CREATE VIEW v_modules_detailed AS
SELECT 
    m.id,
    m.section,
    m.topic_title,
    m.teacher_id,
    m.teacher_name,
    m.step_count,
    m.created_at,
    t.dept as teacher_dept,
    t.email as teacher_email
FROM modules m
LEFT JOIN teachers t ON m.teacher_id = t.id;

DO $$ 
BEGIN
    RAISE NOTICE 'âœ“ Basic views created';
END $$;

-- ============================================================
-- PART 6: CREATE ADVANCED MCQ VIEWS
-- ============================================================
DO $$ 
BEGIN
    RAISE NOTICE 'Step 6: Creating MCQ analytics views...';
END $$;

-- View 4: Student test progress (for teacher dashboard)
CREATE VIEW v_student_test_progress AS
WITH student_sections AS (
    SELECT 
        id, name, reg_no, class_dept, section,
        LOWER(TRIM(CONCAT(class_dept, ' ', section))) as normalized_section
    FROM students
),
test_assignments AS (
    SELECT 
        ss.id as student_id,
        t.id as test_id,
        t.deadline,
        t.is_active
    FROM student_sections ss
    INNER JOIN mcq_tests t ON LOWER(TRIM(t.section)) = ss.normalized_section
    WHERE t.is_active = true
),
submission_stats AS (
    SELECT 
        student_id,
        COUNT(*) as completed_count,
        AVG(percentage) as avg_percentage,
        MAX(submitted_at) as last_submission,
        MIN(percentage) as min_score,
        MAX(percentage) as max_score,
        COUNT(CASE WHEN percentage >= 60 THEN 1 END) as passed_count,
        COUNT(CASE WHEN percentage < 60 THEN 1 END) as failed_count
    FROM test_submissions
    GROUP BY student_id
)
SELECT 
    ss.id as student_id,
    ss.name as student_name,
    ss.reg_no,
    ss.class_dept,
    ss.section,
    CONCAT(ss.class_dept, ' ', ss.section) as full_section,
    COALESCE(COUNT(DISTINCT ta.test_id), 0) as total_tests_assigned,
    COALESCE(st.completed_count, 0) as tests_completed,
    COALESCE(COUNT(DISTINCT CASE 
        WHEN ta.deadline < CURRENT_TIMESTAMP AND sub.id IS NULL 
        THEN ta.test_id 
    END), 0) as tests_overdue,
    COALESCE(ROUND(st.avg_percentage, 2), 0.00) as average_score,
    st.min_score,
    st.max_score,
    COALESCE(st.passed_count, 0) as tests_passed,
    COALESCE(st.failed_count, 0) as tests_failed,
    st.last_submission as last_submission_date,
    CASE 
        WHEN COALESCE(COUNT(DISTINCT ta.test_id), 0) = 0 THEN 0
        ELSE ROUND((COALESCE(st.completed_count, 0)::DECIMAL / COUNT(DISTINCT ta.test_id)) * 100, 2)
    END as completion_percentage
FROM student_sections ss
LEFT JOIN test_assignments ta ON ss.id = ta.student_id
LEFT JOIN test_submissions sub ON ta.test_id = sub.test_id AND ss.id = sub.student_id
LEFT JOIN submission_stats st ON ss.id = st.student_id
GROUP BY ss.id, ss.name, ss.reg_no, ss.class_dept, ss.section, 
         st.completed_count, st.avg_percentage, st.last_submission,
         st.min_score, st.max_score, st.passed_count, st.failed_count;

DO $$ 
BEGIN
    RAISE NOTICE 'âœ“ Student progress view created';
END $$;

-- View 5: Test statistics (for teacher dashboard test list)
CREATE VIEW v_test_statistics AS
WITH submission_analytics AS (
    SELECT 
        test_id,
        COUNT(*) as total_subs,
        AVG(percentage) as avg_pct,
        MIN(percentage) as min_pct,
        MAX(percentage) as max_pct,
        STDDEV(percentage) as stddev_pct,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY percentage) as median_pct,
        COUNT(CASE WHEN percentage >= 90 THEN 1 END) as excellent_count,
        COUNT(CASE WHEN percentage >= 60 AND percentage < 90 THEN 1 END) as good_count,
        COUNT(CASE WHEN percentage >= 40 AND percentage < 60 THEN 1 END) as average_count,
        COUNT(CASE WHEN percentage < 40 THEN 1 END) as poor_count,
        AVG(time_taken) as avg_time_taken
    FROM test_submissions
    GROUP BY test_id
)
SELECT 
    t.id as test_id,
    t.title,
    t.section,
    t.teacher_id,
    t.teacher_name,
    t.total_questions,
    t.start_date,
    t.deadline,
    t.created_at,
    t.is_active,
    CASE 
        WHEN t.deadline < CURRENT_TIMESTAMP THEN 'expired'
        WHEN t.start_date > CURRENT_TIMESTAMP THEN 'upcoming'
        ELSE 'active'
    END as status,
    COALESCE(sa.total_subs, 0) as total_submissions,
    COALESCE(ROUND(sa.avg_pct::numeric, 2), 0.00) as average_score,
    COALESCE(ROUND(sa.median_pct::numeric, 2), 0.00) as median_score,
    COALESCE(ROUND(sa.min_pct::numeric, 2), 0.00) as min_score,
    COALESCE(ROUND(sa.max_pct::numeric, 2), 0.00) as max_score,
    COALESCE(ROUND(sa.stddev_pct::numeric, 2), 0.00) as score_stddev,
    COALESCE(sa.excellent_count, 0) as excellent_count,
    COALESCE(sa.good_count, 0) as good_count,
    COALESCE(sa.average_count, 0) as average_count,
    COALESCE(sa.poor_count, 0) as poor_count,
    COALESCE(sa.excellent_count + sa.good_count, 0) as passed_count,
    COALESCE(sa.average_count + sa.poor_count, 0) as failed_count,
    COALESCE(ROUND(sa.avg_time_taken / 60.0, 2), 0.00) as avg_time_minutes,
    EXTRACT(EPOCH FROM (t.deadline - CURRENT_TIMESTAMP)) / 3600 as hours_remaining
FROM mcq_tests t
LEFT JOIN submission_analytics sa ON t.id = sa.test_id
ORDER BY t.created_at DESC;

DO $$ 
BEGIN
    RAISE NOTICE 'âœ“ Test statistics view created';
END $$;

-- ============================================================
-- PART 7: CREATE FUNCTIONS
-- ============================================================
DO $$ 
BEGIN
    RAISE NOTICE 'Step 7: Creating functions...';
END $$;

-- Function 1: Get student detailed progress
CREATE FUNCTION get_student_detailed_progress(p_student_id INTEGER)
RETURNS TABLE(
    test_id INTEGER,
    test_title TEXT,
    test_description TEXT,
    test_section TEXT,
    total_questions INTEGER,
    test_start_date TIMESTAMP,
    test_deadline TIMESTAMP,
    test_created_at TIMESTAMP,
    submission_id INTEGER,
    score INTEGER,
    percentage DECIMAL(5,2),
    status TEXT,
    submitted_at TIMESTAMP,
    time_taken INTEGER,
    is_overdue BOOLEAN,
    is_completed BOOLEAN,
    days_until_deadline NUMERIC,
    performance_level TEXT
) 
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_student_section TEXT;
BEGIN
    SELECT LOWER(TRIM(CONCAT(class_dept, ' ', section))) 
    INTO v_student_section
    FROM students 
    WHERE id = p_student_id;
    
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.description,
        t.section,
        t.total_questions,
        t.start_date,
        t.deadline,
        t.created_at,
        sub.id,
        sub.score,
        sub.percentage,
        sub.status,
        sub.submitted_at,
        sub.time_taken,
        CASE 
            WHEN t.deadline < CURRENT_TIMESTAMP AND sub.id IS NULL THEN true
            ELSE false
        END,
        CASE 
            WHEN sub.id IS NOT NULL THEN true
            ELSE false
        END,
        ROUND(EXTRACT(EPOCH FROM (t.deadline - CURRENT_TIMESTAMP)) / 86400.0, 1),
        CASE 
            WHEN sub.percentage IS NULL THEN 'Not Attempted'
            WHEN sub.percentage >= 90 THEN 'Excellent'
            WHEN sub.percentage >= 75 THEN 'Very Good'
            WHEN sub.percentage >= 60 THEN 'Good'
            WHEN sub.percentage >= 40 THEN 'Average'
            ELSE 'Needs Improvement'
        END
    FROM mcq_tests t
    LEFT JOIN test_submissions sub ON t.id = sub.test_id AND sub.student_id = p_student_id
    WHERE LOWER(TRIM(t.section)) = v_student_section
    AND t.is_active = true
    ORDER BY 
        CASE WHEN sub.id IS NULL THEN 0 ELSE 1 END,
        t.deadline ASC;
END;
$$;

DO $$ 
BEGIN
    RAISE NOTICE 'âœ“ Function get_student_detailed_progress created';
END $$;

-- Function 2: Get test performance summary
CREATE FUNCTION get_test_performance_summary(p_test_id INTEGER)
RETURNS TABLE(
    test_title TEXT,
    total_students_assigned INTEGER,
    total_submissions INTEGER,
    completion_rate DECIMAL(5,2),
    average_score DECIMAL(5,2),
    median_score DECIMAL(5,2),
    highest_score DECIMAL(5,2),
    lowest_score DECIMAL(5,2),
    passed_count INTEGER,
    failed_count INTEGER,
    pass_rate DECIMAL(5,2),
    excellent_performers INTEGER,
    needs_attention INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH test_info AS (
        SELECT section FROM mcq_tests WHERE id = p_test_id
    ),
    eligible_students AS (
        SELECT COUNT(*) as total
        FROM students s, test_info ti
        WHERE LOWER(TRIM(CONCAT(s.class_dept, ' ', s.section))) = LOWER(TRIM(ti.section))
    ),
    submission_stats AS (
        SELECT 
            COUNT(*) as subs,
            AVG(percentage) as avg_pct,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY percentage) as med_pct,
            MAX(percentage) as max_pct,
            MIN(percentage) as min_pct,
            COUNT(CASE WHEN percentage >= 60 THEN 1 END) as passed,
            COUNT(CASE WHEN percentage < 60 THEN 1 END) as failed,
            COUNT(CASE WHEN percentage >= 90 THEN 1 END) as excellent,
            COUNT(CASE WHEN percentage < 40 THEN 1 END) as poor
        FROM test_submissions
        WHERE test_id = p_test_id
    )
    SELECT 
        t.title,
        es.total::INTEGER,
        COALESCE(ss.subs, 0)::INTEGER,
        CASE WHEN es.total > 0 
            THEN ROUND((COALESCE(ss.subs, 0)::DECIMAL / es.total) * 100, 2)
            ELSE 0.00 
        END,
        COALESCE(ROUND(ss.avg_pct, 2), 0.00),
        COALESCE(ROUND(ss.med_pct, 2), 0.00),
        COALESCE(ROUND(ss.max_pct, 2), 0.00),
        COALESCE(ROUND(ss.min_pct, 2), 0.00),
        COALESCE(ss.passed, 0)::INTEGER,
        COALESCE(ss.failed, 0)::INTEGER,
        CASE WHEN COALESCE(ss.subs, 0) > 0
            THEN ROUND((COALESCE(ss.passed, 0)::DECIMAL / ss.subs) * 100, 2)
            ELSE 0.00
        END,
        COALESCE(ss.excellent, 0)::INTEGER,
        COALESCE(ss.poor, 0)::INTEGER
    FROM mcq_tests t, eligible_students es
    LEFT JOIN submission_stats ss ON true
    WHERE t.id = p_test_id;
END;
$$;

DO $$ 
BEGIN
    RAISE NOTICE 'âœ“ Function get_test_performance_summary created';
END $$;

-- ============================================================
-- PART 8: CREATE TRIGGERS
-- ============================================================
DO $$ 
BEGIN
    RAISE NOTICE 'Step 8: Creating triggers...';
END $$;

-- Trigger function: Auto-update timestamps
CREATE FUNCTION update_test_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.created_at = COALESCE(NEW.created_at, CURRENT_TIMESTAMP);
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_test_timestamp
    BEFORE INSERT ON mcq_tests
    FOR EACH ROW
    EXECUTE FUNCTION update_test_timestamp();

DO $$ 
BEGIN
    RAISE NOTICE 'âœ“ Triggers created';
END $$;

-- ============================================================
-- PART 9: CREATE MATERIALIZED VIEW
-- ============================================================
DO $$ 
BEGIN
    RAISE NOTICE 'Step 9: Creating materialized views...';
END $$;

CREATE MATERIALIZED VIEW mv_student_performance_analytics AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    s.reg_no,
    s.class_dept,
    s.section,
    COUNT(DISTINCT sub.test_id) as total_tests_taken,
    COALESCE(AVG(sub.percentage), 0) as overall_average,
    COALESCE(MAX(sub.percentage), 0) as best_score,
    COALESCE(MIN(sub.percentage), 0) as worst_score,
    COALESCE(STDDEV(sub.percentage), 0) as score_consistency,
    COUNT(CASE WHEN sub.percentage >= 90 THEN 1 END) as excellent_count,
    COUNT(CASE WHEN sub.percentage >= 60 AND sub.percentage < 90 THEN 1 END) as good_count,
    COUNT(CASE WHEN sub.percentage < 60 THEN 1 END) as poor_count,
    CASE 
        WHEN AVG(sub.percentage) >= 85 THEN 'Top Performer'
        WHEN AVG(sub.percentage) >= 70 THEN 'Good Performer'
        WHEN AVG(sub.percentage) >= 50 THEN 'Average Performer'
        WHEN AVG(sub.percentage) IS NULL THEN 'No Data'
        ELSE 'Needs Support'
    END as performance_category,
    MAX(sub.submitted_at) as last_activity
FROM students s
LEFT JOIN test_submissions sub ON s.id = sub.student_id
GROUP BY s.id, s.name, s.reg_no, s.class_dept, s.section;

CREATE INDEX idx_mv_student_perf_category ON mv_student_performance_analytics(performance_category);
CREATE INDEX idx_mv_student_perf_avg ON mv_student_performance_analytics(overall_average DESC);
CREATE INDEX idx_mv_student_perf_section ON mv_student_performance_analytics(class_dept, section);

-- Function to refresh materialized view
CREATE FUNCTION refresh_student_analytics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_student_performance_analytics;
    RAISE NOTICE 'Student performance analytics refreshed';
EXCEPTION
    WHEN OTHERS THEN
        REFRESH MATERIALIZED VIEW mv_student_performance_analytics;
        RAISE NOTICE 'Student performance analytics refreshed (non-concurrent)';
END;
$$;

DO $$ 
BEGIN
    RAISE NOTICE 'âœ“ Materialized view created';
END $$;

-- ============================================================
-- PART 10: GRANT PERMISSIONS (if using specific roles)
-- ============================================================
DO $$ 
BEGIN
    RAISE NOTICE 'Step 10: Setting permissions...';
    
    -- Grant permissions to public (adjust if you have specific roles)
    -- Uncomment and modify if needed:
    -- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
    -- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
    -- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_app_user;
    
    RAISE NOTICE 'âœ“ Permissions configured (using default public access)';
END $$;

-- ============================================================
-- PART 11: VERIFICATION & SUMMARY
-- ============================================================
DO $$
DECLARE
    teacher_count INTEGER;
    student_count INTEGER;
    module_count INTEGER;
    test_count INTEGER;
    submission_count INTEGER;
    table_count INTEGER;
    view_count INTEGER;
    function_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Count records
    SELECT COUNT(*) INTO teacher_count FROM teachers;
    SELECT COUNT(*) INTO student_count FROM students;
    SELECT COUNT(*) INTO module_count FROM modules;
    SELECT COUNT(*) INTO test_count FROM mcq_tests;
    SELECT COUNT(*) INTO submission_count FROM test_submissions;
    
    -- Count database objects
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    SELECT COUNT(*) INTO view_count 
    FROM pg_views 
    WHERE schemaname = 'public';
    
    SELECT COUNT(*) INTO function_count 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.prokind = 'f';
    
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE schemaname = 'public';
    
    -- Display summary
    RAISE NOTICE '';
    RAISE NOTICE 'â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—';
    RAISE NOTICE 'â•‘                                                              â•‘';
    RAISE NOTICE 'â•‘     âœ“ DATABASE SETUP COMPLETED SUCCESSFULLY                  â•‘';
    RAISE NOTICE 'â•‘                                                              â•‘';
    RAISE NOTICE 'â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';
    RAISE NOTICE '';
    RAISE NOTICE 'ðŸ“Š DATABASE STATISTICS:';
    RAISE NOTICE '  â”œâ”€ Teachers: %', teacher_count;
    RAISE NOTICE '  â”œâ”€ Students: %', student_count;
    RAISE NOTICE '  â”œâ”€ Modules: %', module_count;
    RAISE NOTICE '  â”œâ”€ MCQ Tests: %', test_count;
    RAISE NOTICE '  â””â”€ Test Submissions: %', submission_count;
    RAISE NOTICE '';
    RAISE NOTICE 'ðŸ—„ï¸  DATABASE OBJECTS:';
    RAISE NOTICE '  â”œâ”€ Tables: % (teachers, students, modules, mcq_tests, test_submissions)', table_count;
    RAISE NOTICE '  â”œâ”€ Views: % (regular + materialized)', view_count;
    RAISE NOTICE '  â”œâ”€ Functions: %', function_count;
    RAISE NOTICE '  â”œâ”€ Triggers: 1 (auto-timestamp)';
    RAISE NOTICE '  â””â”€ Indexes: % (optimized for performance)', index_count;
    RAISE NOTICE '';
    RAISE NOTICE 'âœ… FEATURES ENABLED:';
    RAISE NOTICE '  â”œâ”€ Teacher & Student authentication';
    RAISE NOTICE '  â”œâ”€ Module management system';
    RAISE NOTICE '  â”œâ”€ MCQ test creation & management';
    RAISE NOTICE '  â”œâ”€ Student test submissions';
    RAISE NOTICE '  â”œâ”€ Automatic score calculation (backend)';
    RAISE NOTICE '  â”œâ”€ Progress tracking & analytics';
    RAISE NOTICE '  â”œâ”€ Performance categorization';
    RAISE NOTICE '  â””â”€ Advanced statistics & reporting';
    RAISE NOTICE '';
    RAISE NOTICE 'ðŸš€ NEXT STEPS:';
    RAISE NOTICE '  1. Restart your backend server';
    RAISE NOTICE '  2. Create admin/teacher accounts';
    RAISE NOTICE '  3. Add students to sections';
    RAISE NOTICE '  4. Create MCQ tests';
    RAISE NOTICE '  5. Students take tests';
    RAISE NOTICE '  6. View results & analytics';
    RAISE NOTICE '';
    RAISE NOTICE 'ðŸ’¡ USEFUL QUERIES:';
    RAISE NOTICE '  â€¢ SELECT * FROM v_test_statistics;';
    RAISE NOTICE '  â€¢ SELECT * FROM v_student_test_progress;';
    RAISE NOTICE '  â€¢ SELECT * FROM get_student_detailed_progress(1);';
    RAISE NOTICE '  â€¢ SELECT * FROM get_test_performance_summary(1);';
    RAISE NOTICE '  â€¢ SELECT * FROM mv_student_performance_analytics;';
    RAISE NOTICE '';
    RAISE NOTICE 'â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—';
    RAISE NOTICE 'â•‘              READY TO USE - HAPPY CODING!                    â•‘';
    RAISE NOTICE 'â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';
    RAISE NOTICE '';
END $$;


-- ============================================================
-- PART 12: TEACHER-STUDENT ALLOCATION (Many-to-Many)
-- ============================================================
DO $$ 
BEGIN
    RAISE NOTICE 'Step 12: Creating teacher-student allocation table...';
END $$;

-- Table 6: TEACHER_STUDENT_ALLOCATIONS (Many-to-Many relationship)
CREATE TABLE teacher_student_allocations (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    subject TEXT,
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_allocation_teacher FOREIGN KEY (teacher_id) 
        REFERENCES teachers(id) ON DELETE CASCADE,
    CONSTRAINT fk_allocation_student FOREIGN KEY (student_id) 
        REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT uq_teacher_student UNIQUE(teacher_id, student_id, subject)
);

-- Indexes for allocation table
CREATE INDEX idx_allocations_teacher ON teacher_student_allocations(teacher_id);
CREATE INDEX idx_allocations_student ON teacher_student_allocations(student_id);
CREATE INDEX idx_allocations_subject ON teacher_student_allocations(subject);

-- View: Teachers with their students
CREATE OR REPLACE VIEW v_teacher_students AS
SELECT 
    t.id as teacher_id,
    t.name as teacher_name,
    t.dept as teacher_dept,
    s.id as student_id,
    s.name as student_name,
    s.email as student_email,
    s.reg_no,
    s.class_dept,
    s.section,
    a.subject,
    a.allocated_at
FROM teachers t
INNER JOIN teacher_student_allocations a ON t.id = a.teacher_id
INNER JOIN students s ON a.student_id = s.id;

-- View: Students with their teachers
CREATE VIEW v_student_teachers AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    s.reg_no,
    s.class_dept,
    s.section,
    t.id as teacher_id,
    t.name as teacher_name,
    t.dept as teacher_dept,
    a.subject,
    a.allocated_at
FROM students s
INNER JOIN teacher_student_allocations a ON s.id = a.student_id
INNER JOIN teachers t ON a.teacher_id = t.id;

DO $$ 
BEGIN
    RAISE NOTICE 'âœ“ Teacher-student allocation system created';
    RAISE NOTICE 'âœ“ Many-to-many relationship enabled';
END $$;


-- ============================================================
-- MODULE PROGRESS TRACKING SYSTEM
-- Run this in your Neon PostgreSQL console
-- ============================================================

-- 1. Create module_progress table to track student completion
-- ============================================================
CREATE TABLE IF NOT EXISTS module_progress (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_module_progress_student ON module_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_module ON module_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_completed ON module_progress(is_completed);

SELECT 'âœ“ Created module_progress table' as status;

-- 2. Create view for student module progress
-- ============================================================
CREATE OR REPLACE VIEW v_student_module_progress AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    s.reg_no,
    s.class_dept,
    s.section,
    COUNT(DISTINCT m.id) as total_modules,
    COUNT(DISTINCT CASE WHEN mp.is_completed = TRUE THEN m.id END) as completed_modules,
    COUNT(DISTINCT CASE WHEN mp.is_completed = FALSE OR mp.id IS NULL THEN m.id END) as pending_modules,
    CASE 
        WHEN COUNT(DISTINCT m.id) > 0 
        THEN ROUND((COUNT(DISTINCT CASE WHEN mp.is_completed = TRUE THEN m.id END)::NUMERIC / COUNT(DISTINCT m.id)::NUMERIC) * 100, 2)
        ELSE 0 
    END as completion_percentage
FROM students s
LEFT JOIN modules m ON LOWER(m.section) = LOWER(s.class_dept || ' ' || s.section)
LEFT JOIN module_progress mp ON m.id = mp.module_id AND mp.student_id = s.id
GROUP BY s.id, s.name, s.reg_no, s.class_dept, s.section;

SELECT 'âœ“ Created v_student_module_progress view' as status;

-- 3. Create view for module statistics
-- ============================================================
CREATE OR REPLACE VIEW v_module_statistics AS
SELECT 
    m.id as module_id,
    m.topic_title,
    m.section,
    m.teacher_name,
    m.step_count,
    m.created_at,
    COUNT(DISTINCT s.id) as total_students,
    COUNT(DISTINCT CASE WHEN mp.is_completed = TRUE THEN s.id END) as completed_count,
    COUNT(DISTINCT CASE WHEN mp.is_completed = FALSE THEN s.id END) as in_progress_count,
    COUNT(DISTINCT CASE WHEN mp.id IS NULL THEN s.id END) as not_started_count,
    CASE 
        WHEN COUNT(DISTINCT s.id) > 0 
        THEN ROUND((COUNT(DISTINCT CASE WHEN mp.is_completed = TRUE THEN s.id END)::NUMERIC / COUNT(DISTINCT s.id)::NUMERIC) * 100, 2)
        ELSE 0 
    END as completion_rate
FROM modules m
LEFT JOIN students s ON LOWER(m.section) = LOWER(s.class_dept || ' ' || s.section)
LEFT JOIN module_progress mp ON m.id = mp.module_id AND mp.student_id = s.id
GROUP BY m.id, m.topic_title, m.section, m.teacher_name, m.step_count, m.created_at;

SELECT 'âœ“ Created v_module_statistics view' as status;

-- 4. Create function to mark module as complete
-- ============================================================
CREATE OR REPLACE FUNCTION mark_module_complete(p_student_id INTEGER, p_module_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO module_progress (student_id, module_id, is_completed, completed_at, last_accessed)
    VALUES (p_student_id, p_module_id, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (student_id, module_id) 
    DO UPDATE SET 
        is_completed = TRUE,
        completed_at = CURRENT_TIMESTAMP,
        last_accessed = CURRENT_TIMESTAMP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

SELECT 'âœ“ Created mark_module_complete function' as status;

-- 5. Create function to track module access
-- ============================================================
CREATE OR REPLACE FUNCTION track_module_access(p_student_id INTEGER, p_module_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO module_progress (student_id, module_id, is_completed, last_accessed)
    VALUES (p_student_id, p_module_id, FALSE, CURRENT_TIMESTAMP)
    ON CONFLICT (student_id, module_id) 
    DO UPDATE SET last_accessed = CURRENT_TIMESTAMP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

SELECT 'âœ“ Created track_module_access function' as status;

-- 6. Verification
-- ============================================================
SELECT 
    'Module progress tracking setup complete!' as message,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'module_progress') as tables_created,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_name IN ('v_student_module_progress', 'v_module_statistics')) as views_created,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name IN ('mark_module_complete', 'track_module_access')) as functions_created;


-- =====================================================
-- CODING SUBMISSIONS SYSTEM - COMPLETE SETUP
-- =====================================================

-- 1. CREATE TABLE FOR STUDENT CODE SUBMISSIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS student_submissions (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL,
  student_email VARCHAR(255),
  module_id INT NOT NULL,
  submitted_code TEXT NOT NULL,
  language VARCHAR(50) NOT NULL,
  test_cases_passed INT DEFAULT 0,
  total_test_cases INT DEFAULT 0,
  score DECIMAL(5, 2) DEFAULT 0.00,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  execution_time_ms INT,
  memory_used_kb INT,
  status VARCHAR(20) DEFAULT 'completed',
  CONSTRAINT fk_submission_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_submission_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  CONSTRAINT chk_score_range CHECK (score >= 0 AND score <= 100),
  CONSTRAINT chk_test_cases CHECK (test_cases_passed <= total_test_cases)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_student ON student_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_module ON student_submissions(module_id);
CREATE INDEX IF NOT EXISTS idx_submissions_score ON student_submissions(score DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_date ON student_submissions(submitted_at DESC);


-- 2. VIEW: STUDENT CODING PROGRESS SUMMARY
-- =====================================================
CREATE OR REPLACE VIEW v_student_coding_progress AS
SELECT 
  s.id AS student_id,
  s.name AS student_name,
  s.email AS student_email,
  s.reg_no,
  s.class_dept,
  s.section,
  COUNT(DISTINCT sub.module_id) AS modules_attempted,
  COUNT(sub.id) AS total_submissions,
  ROUND(AVG(sub.score)::numeric, 2) AS average_score,
  MAX(sub.score) AS highest_score,
  MIN(sub.score) AS lowest_score,
  COUNT(CASE WHEN sub.score >= 80 THEN 1 END) AS excellent_submissions,
  COUNT(CASE WHEN sub.score >= 60 AND sub.score < 80 THEN 1 END) AS good_submissions,
  COUNT(CASE WHEN sub.score < 60 THEN 1 END) AS needs_improvement,
  MAX(sub.submitted_at) AS last_submission_date
FROM students s
LEFT JOIN student_submissions sub ON s.id = sub.student_id
GROUP BY s.id, s.name, s.email, s.reg_no, s.class_dept, s.section;


-- 3. VIEW: MODULE CODING STATISTICS
-- =====================================================
CREATE OR REPLACE VIEW v_module_coding_stats AS
SELECT 
  m.id AS module_id,
  m.topic_title,
  
  m.section,
  m.teacher_name,
  COUNT(DISTINCT sub.student_id) AS students_attempted,
  COUNT(sub.id) AS total_submissions,
  ROUND(AVG(sub.score)::numeric, 2) AS average_score,
  MAX(sub.score) AS highest_score,
  MIN(sub.score) AS lowest_score,
  ROUND(AVG(sub.test_cases_passed::DECIMAL / NULLIF(sub.total_test_cases, 0) * 100), 2) AS avg_pass_rate,
  COUNT(CASE WHEN sub.score = 100 THEN 1 END) AS perfect_scores,
  MAX(sub.submitted_at) AS last_submission_date
FROM modules m
LEFT JOIN student_submissions sub ON m.id = sub.module_id
GROUP BY m.id, m.topic_title,  m.section, m.teacher_name;


-- 4. VIEW: DETAILED SUBMISSION HISTORY
-- =====================================================
CREATE OR REPLACE VIEW v_submission_details AS
SELECT 
  sub.id AS submission_id,
  sub.student_id,
  s.name AS student_name,
  s.email AS student_email,
  s.reg_no,
  s.class_dept,
  s.section,
  sub.module_id,
  m.topic_title AS module_title,
  
  m.teacher_name,
  sub.language,
  sub.test_cases_passed,
  sub.total_test_cases,
  sub.score,
  sub.submitted_at,
  sub.status,
  CASE 
    WHEN sub.score >= 90 THEN 'Excellent'
    WHEN sub.score >= 80 THEN 'Very Good'
    WHEN sub.score >= 70 THEN 'Good'
    WHEN sub.score >= 60 THEN 'Satisfactory'
    ELSE 'Needs Improvement'
  END AS grade_category,
  RANK() OVER (PARTITION BY sub.module_id ORDER BY sub.score DESC) AS rank_in_module,
  ROW_NUMBER() OVER (PARTITION BY sub.student_id, sub.module_id ORDER BY sub.submitted_at DESC) AS attempt_number
FROM student_submissions sub
JOIN students s ON sub.student_id = s.id
JOIN modules m ON sub.module_id = m.id;


-- 5. VIEW: TEACHER'S CODING DASHBOARD
-- =====================================================
CREATE OR REPLACE VIEW v_teacher_coding_dashboard AS
SELECT 
  t.id AS teacher_id,
  t.name AS teacher_name,
  t.dept,
  m.id AS module_id,
  m.topic_title,
  
  m.section,
  COUNT(DISTINCT sub.student_id) AS students_submitted,
  COUNT(sub.id) AS total_submissions,
  ROUND(AVG(sub.score), 2) AS class_average,
  MAX(sub.score) AS top_score,
  COUNT(CASE WHEN sub.score >= 80 THEN 1 END) AS high_performers,
  COUNT(CASE WHEN sub.score < 60 THEN 1 END) AS struggling_students,
  MAX(sub.submitted_at) AS latest_submission
FROM teachers t
JOIN modules m ON m.teacher_id = t.id
LEFT JOIN student_submissions sub ON m.id = sub.module_id
GROUP BY t.id, t.name, t.dept, m.id, m.topic_title,  m.section;


-- 6. VIEW: LANGUAGE POPULARITY STATISTICS
-- =====================================================
CREATE OR REPLACE VIEW v_language_statistics AS
SELECT 
  language,
  COUNT(*) AS total_submissions,
  COUNT(DISTINCT student_id) AS unique_students,
  ROUND(AVG(score), 2) AS average_score,
  COUNT(CASE WHEN score >= 80 THEN 1 END) AS high_score_count,
  ROUND(AVG(test_cases_passed::DECIMAL / NULLIF(total_test_cases, 0) * 100), 2) AS avg_pass_rate
FROM student_submissions
GROUP BY language
ORDER BY total_submissions DESC;


-- 7. FUNCTION: GET STUDENT'S BEST SUBMISSION FOR MODULE
-- =====================================================
CREATE OR REPLACE FUNCTION get_best_submission(
  p_student_id INT,
  p_module_id INT
)
RETURNS TABLE (
  submission_id INT,
  score DECIMAL(5,2),
  language VARCHAR(50),
  test_cases_passed INT,
  total_test_cases INT,
  submitted_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    student_submissions.score,
    student_submissions.language,
    student_submissions.test_cases_passed,
    student_submissions.total_test_cases,
    student_submissions.submitted_at
  FROM student_submissions
  WHERE student_id = p_student_id 
    AND module_id = p_module_id
  ORDER BY student_submissions.score DESC, submitted_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;


-- 8. FUNCTION: GET TOP PERFORMERS FOR MODULE
-- =====================================================
CREATE OR REPLACE FUNCTION get_top_performers(
  p_module_id INT,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  student_id INT,
  student_name VARCHAR(255),
  reg_no VARCHAR(50),
  best_score DECIMAL(5,2),
  total_attempts BIGINT,
  last_submission TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.reg_no,
    MAX(sub.score) AS best_score,
    COUNT(sub.id) AS total_attempts,
    MAX(sub.submitted_at) AS last_submission
  FROM students s
  JOIN student_submissions sub ON s.id = sub.student_id
  WHERE sub.module_id = p_module_id
  GROUP BY s.id, s.name, s.reg_no
  ORDER BY best_score DESC, last_submission DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;


-- 9. FUNCTION: GET STUDENT'S SUBMISSION HISTORY
-- =====================================================
CREATE OR REPLACE FUNCTION get_student_submission_history(
  p_student_id INT,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  submission_id INT,
  module_id INT,
  module_title VARCHAR(255),
  subject VARCHAR(100),
  language VARCHAR(50),
  score DECIMAL(5,2),
  test_cases_passed INT,
  total_test_cases INT,
  submitted_at TIMESTAMP,
  grade_category VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sub.id,
    sub.module_id,
    m.topic_title,
    
    sub.language,
    sub.score,
    sub.test_cases_passed,
    sub.total_test_cases,
    sub.submitted_at,
    CASE 
      WHEN sub.score >= 90 THEN 'Excellent'
      WHEN sub.score >= 80 THEN 'Very Good'
      WHEN sub.score >= 70 THEN 'Good'
      WHEN sub.score >= 60 THEN 'Satisfactory'
      ELSE 'Needs Improvement'
    END AS grade_category
  FROM student_submissions sub
  JOIN modules m ON sub.module_id = m.id
  WHERE sub.student_id = p_student_id
  ORDER BY sub.submitted_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;


-- 10. FUNCTION: CALCULATE MODULE DIFFICULTY SCORE
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_module_difficulty(p_module_id INT)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  difficulty_score DECIMAL(5,2);
BEGIN
  SELECT 
    CASE 
      WHEN AVG(score) >= 80 THEN 1.0  -- Easy
      WHEN AVG(score) >= 60 THEN 2.0  -- Medium
      WHEN AVG(score) >= 40 THEN 3.0  -- Hard
      ELSE 4.0                         -- Very Hard
    END INTO difficulty_score
  FROM student_submissions
  WHERE module_id = p_module_id
    AND submitted_at >= NOW() - INTERVAL '30 days';
  
  RETURN COALESCE(difficulty_score, 2.0);
END;
$$ LANGUAGE plpgsql;


-- 11. TRIGGER: UPDATE SUBMISSION TIMESTAMP
-- =====================================================
CREATE OR REPLACE FUNCTION update_submission_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.submitted_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_submission_timestamp ON student_submissions;
CREATE TRIGGER trg_update_submission_timestamp
  BEFORE UPDATE ON student_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_submission_timestamp();


-- 12. FUNCTION: GET LEADERBOARD
-- =====================================================
CREATE OR REPLACE FUNCTION get_coding_leaderboard(
  p_section VARCHAR(50) DEFAULT NULL,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  rank BIGINT,
  student_id INT,
  student_name VARCHAR(255),
  reg_no VARCHAR(50),
  section VARCHAR(50),
  total_submissions BIGINT,
  average_score DECIMAL(5,2),
  perfect_scores BIGINT,
  modules_completed BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY AVG(sub.score) DESC, COUNT(sub.id) DESC) AS rank,
    s.id,
    s.name,
    s.reg_no,
    CONCAT(s.class_dept, ' ', s.section) AS section,
    COUNT(sub.id) AS total_submissions,
    ROUND(AVG(sub.score)::numeric, 2) AS average_score,
    COUNT(CASE WHEN sub.score = 100 THEN 1 END) AS perfect_scores,
    COUNT(DISTINCT sub.module_id) AS modules_completed
  FROM students s
  JOIN student_submissions sub ON s.id = sub.student_id
  WHERE (p_section IS NULL OR CONCAT(s.class_dept, ' ', s.section) = p_section)
  GROUP BY s.id, s.name, s.reg_no, s.class_dept, s.section
  HAVING COUNT(sub.id) > 0
  ORDER BY average_score DESC, total_submissions DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- SAMPLE QUERIES FOR TESTING
-- =====================================================

-- Get student's coding progress
-- SELECT * FROM v_student_coding_progress WHERE student_id = 1;

-- Get module statistics
-- SELECT * FROM v_module_coding_stats WHERE module_id = 1;

-- Get detailed submission history
-- SELECT * FROM v_submission_details WHERE student_id = 1 ORDER BY submitted_at DESC;

-- Get teacher's dashboard
-- SELECT * FROM v_teacher_coding_dashboard WHERE teacher_id = 1;

-- Get language statistics
-- SELECT * FROM v_language_statistics;

-- Get student's best submission for a module
-- SELECT * FROM get_best_submission(1, 1);

-- Get top performers for a module
-- SELECT * FROM get_top_performers(1, 10);

-- Get student's submission history
-- SELECT * FROM get_student_submission_history(1, 20);

-- Calculate module difficulty
-- SELECT calculate_module_difficulty(1);

-- Get coding leaderboard
-- SELECT * FROM get_coding_leaderboard(NULL, 20);

-- Get section-specific leaderboard
-- SELECT * FROM get_coding_leaderboard('ECE A', 10);


-- ============================================================
-- IN-APP NOTIFICATIONS SYSTEM
-- ============================================================
-- Purpose: Store notifications that appear in the website bell icon
-- Separate from email logs - these are UI-visible notifications

-- ============================================================
-- TABLE: IN_APP_NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS in_app_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_type TEXT NOT NULL, -- 'student', 'teacher'
    event_code TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT, -- Optional link to relevant page
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_user_type_inapp CHECK (user_type IN ('student', 'teacher', 'admin'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inapp_user ON in_app_notifications(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_inapp_unread ON in_app_notifications(user_id, user_type, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_inapp_created ON in_app_notifications(created_at DESC);

-- ============================================================
-- VIEW: Unread notification count per user
-- ============================================================
CREATE OR REPLACE VIEW v_unread_notification_count AS
SELECT 
    user_id,
    user_type,
    COUNT(*) as unread_count
FROM in_app_notifications
WHERE is_read = false
GROUP BY user_id, user_type;

-- ============================================================
-- Success message
-- ============================================================
DO $$
BEGIN
    RAISE NOTICE 'âœ“ In-app notifications table created successfully!';
END $$;


-- ============================================================
-- NOTIFICATION SYSTEM DATABASE SCHEMA
-- ============================================================
-- Purpose: Email and SMS notification system for LMS events
-- Features:
--   - User notification preferences (subscribe/unsubscribe by event type)
--   - Notification history/logs with delivery status
--   - Support for email and SMS channels
--   - Event-driven notifications for modules, tests, submissions, etc.
-- ============================================================

DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Creating Notification System Tables...';
    RAISE NOTICE '========================================';
END $$;

-- ============================================================
-- TABLE 1: NOTIFICATION_EVENTS (Event Types Catalog)
-- ============================================================
-- Defines all notification event types in the system
CREATE TABLE IF NOT EXISTS notification_events (
    id SERIAL PRIMARY KEY,
    event_code TEXT UNIQUE NOT NULL,
    event_name TEXT NOT NULL,
    description TEXT,
    default_enabled BOOLEAN DEFAULT true,
    recipient_role TEXT NOT NULL, -- 'student', 'teacher', 'both'
    category TEXT NOT NULL, -- 'module', 'test', 'submission', 'deadline', 'grade', 'system'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_event_code CHECK (event_code ~* '^[A-Z0-9_]+$'),
    CONSTRAINT chk_recipient_role CHECK (recipient_role IN ('student', 'teacher', 'both', 'admin')),
    CONSTRAINT chk_category CHECK (category IN ('module', 'test', 'submission', 'deadline', 'grade', 'system', 'announcement'))
);

-- ============================================================
-- TABLE 2: NOTIFICATION_PREFERENCES (User Subscriptions)
-- ============================================================
-- User preferences for each notification event type
CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_type TEXT NOT NULL, -- 'student', 'teacher', 'admin'
    event_code TEXT NOT NULL,
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_user_event UNIQUE(user_id, user_type, event_code),
    CONSTRAINT chk_user_type CHECK (user_type IN ('student', 'teacher', 'admin'))
);

-- ============================================================
-- TABLE 3: NOTIFICATION_LOGS (Delivery History)
-- ============================================================
-- Record of all notifications sent
CREATE TABLE IF NOT EXISTS notification_logs (
    id SERIAL PRIMARY KEY,
    event_code TEXT NOT NULL,
    recipient_id INTEGER NOT NULL,
    recipient_type TEXT NOT NULL, -- 'student', 'teacher', 'admin'
    recipient_email TEXT NOT NULL,
    recipient_phone TEXT,
    channel TEXT NOT NULL, -- 'email', 'sms', 'both'
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'bounced'
    subject TEXT,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb, -- Store test_id, module_id, etc.
    error_message TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_channel CHECK (channel IN ('email', 'sms', 'both')),
    CONSTRAINT chk_status CHECK (status IN ('pending', 'sent', 'failed', 'bounced', 'queued')),
    CONSTRAINT chk_recipient_type CHECK (recipient_type IN ('student', 'teacher', 'admin'))
);

-- ============================================================
-- TABLE 4: NOTIFICATION_QUEUE (Async Processing)
-- ============================================================
-- Queue for batch notification processing
CREATE TABLE IF NOT EXISTS notification_queue (
    id SERIAL PRIMARY KEY,
    event_code TEXT NOT NULL,
    recipients JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {id, type, email, phone}
    subject TEXT,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    priority INTEGER DEFAULT 5, -- 1=highest, 10=lowest
    status TEXT DEFAULT 'queued',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_priority CHECK (priority BETWEEN 1 AND 10),
    CONSTRAINT chk_status_queue CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    CONSTRAINT chk_retry CHECK (retry_count >= 0 AND retry_count <= max_retries)
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Notification Preferences indexes
CREATE INDEX IF NOT EXISTS idx_notif_pref_user ON notification_preferences(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_notif_pref_event ON notification_preferences(event_code);

-- Notification Logs indexes
CREATE INDEX IF NOT EXISTS idx_notif_logs_recipient ON notification_logs(recipient_id, recipient_type);
CREATE INDEX IF NOT EXISTS idx_notif_logs_event ON notification_logs(event_code);
CREATE INDEX IF NOT EXISTS idx_notif_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notif_logs_created ON notification_logs(created_at DESC);

-- Notification Queue indexes
CREATE INDEX IF NOT EXISTS idx_notif_queue_status ON notification_queue(status) WHERE status IN ('queued', 'processing');
CREATE INDEX IF NOT EXISTS idx_notif_queue_priority ON notification_queue(priority, scheduled_at);

-- ============================================================
-- SEED NOTIFICATION EVENTS
-- ============================================================

INSERT INTO notification_events (event_code, event_name, description, recipient_role, category, default_enabled) VALUES

-- STUDENT NOTIFICATIONS
('MODULE_PUBLISHED', 'New Module Available', 'Notifies students when a new learning module is published to their section', 'student', 'module', true),
('MODULE_UPDATED', 'Module Content Updated', 'Notifies students when a module they are studying is updated', 'student', 'module', true),
('TEST_ASSIGNED', 'New Test Assigned', 'Notifies students when a new test is assigned to their section', 'student', 'test', true),
('TEST_DEADLINE_24H', 'Test Deadline in 24 Hours', 'Reminds students that a test deadline is approaching within 24 hours', 'student', 'deadline', true),
('TEST_DEADLINE_1H', 'Test Deadline in 1 Hour', 'Final reminder that test deadline is within 1 hour', 'student', 'deadline', true),
('GRADE_POSTED', 'Test Grade Posted', 'Notifies students when their test has been graded', 'student', 'grade', true),
('LOW_PERFORMANCE_ALERT', 'Performance Alert', 'Notifies students when their test score is below 50%', 'student', 'grade', true),
('CODING_FEEDBACK', 'Coding Submission Feedback', 'Notifies students when teacher provides feedback on coding submission', 'student', 'submission', true),

-- TEACHER NOTIFICATIONS
('TEST_SUBMITTED', 'Student Submitted Test', 'Notifies teachers when a student submits a test', 'teacher', 'submission', true),
('MODULE_COMPLETION', 'Student Completed Module', 'Notifies teachers when a student completes a module', 'teacher', 'module', false),
('ALL_STUDENTS_COMPLETED', 'All Students Completed Module', 'Notifies teachers when all students in section complete a module', 'teacher', 'module', true),
('DEADLINE_REVIEW_REMINDER', 'Test Review Reminder', 'Reminds teachers to review test submissions before deadline', 'teacher', 'deadline', true),
('LOW_CLASS_PERFORMANCE', 'Low Class Performance Alert', 'Alerts teachers when average class score on test is below 60%', 'teacher', 'grade', true),
('NO_SUBMISSIONS_ALERT', 'No Test Submissions', 'Alerts teachers when no students have submitted a test 24h before deadline', 'teacher', 'test', true),
('CODING_SUBMISSION', 'New Coding Submission', 'Notifies teachers when a student submits a coding problem', 'teacher', 'submission', true),

-- SYSTEM NOTIFICATIONS (BOTH)
('SYSTEM_ANNOUNCEMENT', 'System Announcement', 'Important system-wide announcements', 'both', 'system', true),
('SECTION_CHANGE', 'Section Assignment Changed', 'Notifies when student is moved to different section', 'both', 'system', true),
('ACCOUNT_CREATED', 'Account Created Successfully', 'Welcome email when new account is created', 'both', 'system', true),
('PASSWORD_RESET', 'Password Reset Request', 'Password reset confirmation', 'both', 'system', true)

ON CONFLICT (event_code) DO NOTHING;

DO $$ 
BEGIN
    RAISE NOTICE 'âœ“ Seeded % notification event types', (SELECT COUNT(*) FROM notification_events);
END $$;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to automatically create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Determine user role based on table
    IF TG_TABLE_NAME = 'students' THEN
        user_role := 'student';
    ELSIF TG_TABLE_NAME = 'teachers' THEN
        user_role := 'teacher';
    ELSE
        user_role := 'admin';
    END IF;
    
    -- Insert default preferences for all applicable events
    INSERT INTO notification_preferences (user_id, user_type, event_code, email_enabled, sms_enabled)
    SELECT 
        NEW.id,
        user_role,
        ne.event_code,
        ne.default_enabled,
        false -- SMS disabled by default
    FROM notification_events ne
    WHERE ne.recipient_role IN (user_role, 'both')
    ON CONFLICT (user_id, user_type, event_code) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers to student and teacher tables
DROP TRIGGER IF EXISTS trg_student_notif_prefs ON students;
CREATE TRIGGER trg_student_notif_prefs
    AFTER INSERT ON students
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

DROP TRIGGER IF EXISTS trg_teacher_notif_prefs ON teachers;
CREATE TRIGGER trg_teacher_notif_prefs
    AFTER INSERT ON teachers
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

DO $$ 
BEGIN
    RAISE NOTICE 'âœ“ Created triggers for auto-generating notification preferences';
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notif_pref_updated ON notification_preferences;
CREATE TRIGGER trg_notif_pref_updated
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_timestamp();

-- ============================================================
-- VIEWS FOR EASY QUERYING
-- ============================================================

-- View: User Notification Settings
CREATE OR REPLACE VIEW v_user_notification_settings AS
SELECT 
    np.id,
    np.user_id,
    np.user_type,
    CASE 
        WHEN np.user_type = 'student' THEN s.name
        WHEN np.user_type = 'teacher' THEN t.name
        ELSE 'Admin'
    END as user_name,
    CASE 
        WHEN np.user_type = 'student' THEN s.email
        WHEN np.user_type = 'teacher' THEN t.email
        ELSE NULL
    END as user_email,
    ne.event_code,
    ne.event_name,
    ne.category,
    np.email_enabled,
    np.sms_enabled,
    np.updated_at
FROM notification_preferences np
JOIN notification_events ne ON np.event_code = ne.event_code
LEFT JOIN students s ON np.user_id = s.id AND np.user_type = 'student'
LEFT JOIN teachers t ON np.user_id = t.id AND np.user_type = 'teacher'
ORDER BY np.user_type, np.user_id, ne.category;

-- View: Recent Notifications
CREATE OR REPLACE VIEW v_recent_notifications AS
SELECT 
    nl.id,
    nl.event_code,
    ne.event_name,
    ne.category,
    nl.recipient_id,
    nl.recipient_type,
    nl.recipient_email,
    nl.channel,
    nl.status,
    nl.subject,
    nl.message,
    nl.metadata,
    nl.sent_at,
    nl.created_at,
    CASE 
        WHEN nl.recipient_type = 'student' THEN s.name
        WHEN nl.recipient_type = 'teacher' THEN t.name
        ELSE 'Admin'
    END as recipient_name
FROM notification_logs nl
JOIN notification_events ne ON nl.event_code = ne.event_code
LEFT JOIN students s ON nl.recipient_id = s.id AND nl.recipient_type = 'student'
LEFT JOIN teachers t ON nl.recipient_id = t.id AND nl.recipient_type = 'teacher'
ORDER BY nl.created_at DESC;

-- View: Notification Statistics
CREATE OR REPLACE VIEW v_notification_stats AS
SELECT 
    event_code,
    channel,
    status,
    COUNT(*) as count,
    DATE(created_at) as date
FROM notification_logs
GROUP BY event_code, channel, status, DATE(created_at)
ORDER BY date DESC, event_code;

DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'âœ… NOTIFICATION SYSTEM SETUP COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables Created:';
    RAISE NOTICE '  â€¢ notification_events (% event types)', (SELECT COUNT(*) FROM notification_events);
    RAISE NOTICE '  â€¢ notification_preferences';
    RAISE NOTICE '  â€¢ notification_logs';
    RAISE NOTICE '  â€¢ notification_queue';
    RAISE NOTICE '';
    RAISE NOTICE 'Views Created:';
    RAISE NOTICE '  â€¢ v_user_notification_settings';
    RAISE NOTICE '  â€¢ v_recent_notifications';
    RAISE NOTICE '  â€¢ v_notification_stats';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for email/SMS notifications!';
    RAISE NOTICE '========================================';
END $$;


-- ============================================================
-- ADD ALLOCATION TABLE TO EXISTING DATABASE
-- ============================================================
-- Run this if you don't want to recreate the entire database
-- This adds the many-to-many allocation system
-- ============================================================

-- Create allocation table
CREATE TABLE IF NOT EXISTS teacher_student_allocations (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    subject TEXT,
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_allocation_teacher FOREIGN KEY (teacher_id) 
        REFERENCES teachers(id) ON DELETE CASCADE,
    CONSTRAINT fk_allocation_student FOREIGN KEY (student_id) 
        REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT uq_teacher_student UNIQUE(teacher_id, student_id, subject)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_allocations_teacher ON teacher_student_allocations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_allocations_student ON teacher_student_allocations(student_id);
CREATE INDEX IF NOT EXISTS idx_allocations_subject ON teacher_student_allocations(subject);

-- Create view: Teachers with their students
CREATE OR REPLACE VIEW v_teacher_students AS
SELECT 
    t.id as teacher_id,
    t.name as teacher_name,
    t.dept as teacher_dept,
    s.id as student_id,
    s.name as student_name,
    s.reg_no,
    s.class_dept,
    s.section,
    a.subject,
    a.allocated_at
FROM teachers t
INNER JOIN teacher_student_allocations a ON t.id = a.teacher_id
INNER JOIN students s ON a.student_id = s.id;

-- Create view: Students with their teachers
CREATE OR REPLACE VIEW v_student_teachers AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    s.reg_no,
    s.class_dept,
    s.section,
    t.id as teacher_id,
    t.name as teacher_name,
    t.dept as teacher_dept,
    a.subject,
    a.allocated_at
FROM students s
INNER JOIN teacher_student_allocations a ON s.id = a.student_id
INNER JOIN teachers t ON a.teacher_id = t.id;

-- Verify
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'âœ“ teacher_student_allocations table created';
    RAISE NOTICE 'âœ“ Indexes created';
    RAISE NOTICE 'âœ“ Views created (v_teacher_students, v_student_teachers)';
    RAISE NOTICE '';
    RAISE NOTICE 'Allocation system is ready!';
    RAISE NOTICE 'You can now allocate teachers to students in admin dashboard.';
    RAISE NOTICE '';
END $$;

-- Add OTP columns
ALTER TABLE students ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6);
ALTER TABLE students ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_students_otp ON students(otp_code) WHERE otp_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_teachers_otp ON teachers(otp_code) WHERE otp_code IS NOT NULL;
