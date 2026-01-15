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
    RAISE NOTICE '✓ In-app notifications table created successfully!';
END $$;
