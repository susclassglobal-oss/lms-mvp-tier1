require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const notificationService = require('./notificationService');

const app = express();
app.use(express.json());
app.use(cors());

// --- CONFIGURATION ---
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your_new_secure_secret_key';

// --- DATABASE CONNECTION (NEON) ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Initialize notification service
notificationService.initializeNotificationService(pool);

// --- CLOUDINARY CONFIGURATION ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Determine if it's a video or image
    const isVideo = file.mimetype.startsWith('video/');
    
    return {
      folder: isVideo ? 'classroom_v2/videos' : 'classroom_v2/images',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: isVideo 
        ? ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv']
        : ['jpg', 'png', 'jpeg', 'gif', 'webp']
    };
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// --- MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: "Access Denied: No Token" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid or Expired Token" });
    req.user = decoded; 
    next();
  });
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Only" });
  next();
};

const teacherOnly = (req, res, next) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ error: "Forbidden: Teacher Only" });
  next();
};

const studentOnly = (req, res, next) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: "Forbidden: Student Only" });
  next();
};

// Combined role check middleware
const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Forbidden: ${roles.join(' or ')} Only` });
  }
  next();
};

// --- ROUTES: AUTHENTICATION ---


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'susclass.global@gmail.com', // Your actual Gmail
        pass: 'gbrv skhz axve aegs' // Your Google App Password (no spaces)
    }
});

// 1. Admin Login (Env based)
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, message: "Invalid Admin Credentials" });
  }
});

// 2. Universal Login (Student/Teacher)
app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    const activeRole = role.toLowerCase();
    const table = activeRole === 'student' ? 'students' : 'teachers';

    try {
        const result = await pool.query(`SELECT * FROM ${table} WHERE LOWER(email) = LOWER($1)`, [email]);
        
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const isMatch = await bcrypt.compare(password, user.password);
            
            if (isMatch) {
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const otpExpiry = new Date(Date.now() + 5 * 60000); // 5 mins

                await pool.query(
                    `UPDATE ${table} SET otp_code = $1, otp_expiry = $2 WHERE id = $3`,
                    [otp, otpExpiry, user.id]
                );

                // --- TWEAKED: Sending real email instead of console.log ---
                const mailOptions = {
                    from: 'susclass.global@gmail.com',
                    to: email, // Sends to the email the user just typed in the login form
                    subject: 'Your Portal Access Code',
                    html: `
                        <div style="font-family: sans-serif; text-align: center; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <h2 style="color: #333;">Security Verification</h2>
                            <p style="color: #666;">Use the code below to complete your login:</p>
                            <h1 style="color: #10b981; font-size: 40px; letter-spacing: 5px;">${otp}</h1>
                            <p style="color: #999; font-size: 12px;">This code expires in 5 minutes.</p>
                        </div>
                    `
                };

                await transporter.sendMail(mailOptions);
                
                // Return same response to keep your frontend working perfectly
                res.json({ success: true, mfaRequired: true, email: user.email });
            } else {
                res.status(401).json({ success: false, message: "Incorrect Password" });
            }
        } else {
            res.status(404).json({ success: false, message: "Account not found" });
        }
    } catch (err) {
        console.error("Mail/Login Error:", err);
        res.status(500).json({ error: "Database or Mailer error" });
    }
});
// 3. Verify OTP - Step 2: The Final Authentication
// 3. Verify OTP - Step 2: The Final Authentication
// This must be a separate block from the login block!
app.post('/api/verify-otp', async (req, res) => {
    const { email, otp, role } = req.body;
    const table = role.toLowerCase() === 'student' ? 'students' : 'teachers';

    try {
        // Look for a user where email and otp match, and time has not run out
        const result = await pool.query(
            `SELECT * FROM ${table} WHERE LOWER(email) = LOWER($1) AND otp_code = $2 AND otp_expiry > NOW()`,
            [email, otp]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];

            // SECURITY: Clear OTP immediately so it can't be used again
            await pool.query(
                `UPDATE ${table} SET otp_code = NULL, otp_expiry = NULL WHERE id = $1`, 
                [user.id]
            );

            // Correct code! Now generate the JWT Token for the frontend
            const token = jwt.sign(
                { id: user.id, email: user.email, role: role.toLowerCase() }, 
                JWT_SECRET, 
                { expiresIn: '24h' }
            );

            delete user.password; // Don't send the password hash back to the browser
            res.json({ 
                success: true, 
                token, 
                user: { ...user, role: role.toLowerCase() } 
            });
        } else {
            // Either the code is wrong, or it expired (5 min limit)
            res.status(401).json({ success: false, message: "Invalid or Expired OTP" });
        }
    } catch (err) {
        console.error("OTP Verification Error:", err);
        res.status(500).json({ error: "Database error during verification" });
    }
});

// --- ROUTES: ADMIN MANAGEMENT ---

// 3. Register Teacher
app.post('/api/admin/register-teacher', authenticateToken, adminOnly, async (req, res) => {
  const { name, email, password, staff_id, dept, media } = req.body;
  try {
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    // Note: We pass objects directly; pg driver handles JSON conversion for JSONB columns
    const query = `INSERT INTO teachers (name, email, password, staff_id, dept, media, allocated_sections) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`;
    const values = [name, email, hashed, staff_id, dept, media || {}, []];
    
    const result = await pool.query(query, values);
    const teacherId = result.rows[0].id;
    
    // NOTIFICATION: Welcome email
    try {
      const teacher = {
        id: teacherId,
        type: 'teacher',
        email: email,
        name: name
      };
      
      await notificationService.sendEmail(
        'ACCOUNT_CREATED',
        teacher,
        {
          name: name,
          email: email,
          role: 'teacher',
          staff_id: staff_id
        },
        { teacher_id: teacherId }
      );
      console.log(`[OK] Sent ACCOUNT_CREATED notification to teacher ${name}`);
    } catch (notifErr) {
      console.error('Welcome notification error (non-blocking):', notifErr);
    }
    
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "DB Error: " + err.message });
  }
});

// 4. Register Student
app.post('/api/admin/register-student', authenticateToken, adminOnly, async (req, res) => {
  const { name, email, password, reg_no, class_dept, section, media } = req.body;
  
  console.log("=== STUDENT REGISTRATION ATTEMPT ===");
  console.log("Name:", name);
  console.log("Email:", email);
  console.log("Reg No:", reg_no);
  console.log("Class/Dept:", class_dept);
  console.log("Section:", section);
  console.log("Media:", media);
  
  try {
    // Validate required fields
    if (!name || !email || !password) {
      console.log("❌ Missing required fields");
      return res.status(400).json({ error: "Name, email, and password are required" });
    }
    
    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      console.log("[ERR] Invalid email format:", email);
      return res.status(400).json({ error: "Invalid email format. Please use a complete email address (e.g., user@example.com)" });
    }
    
    console.log("[OK] Validation passed, hashing password...");
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    
    console.log("[OK] Password hashed, inserting into database...");
    const query = `INSERT INTO students (name, email, password, reg_no, class_dept, section, media) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`;
    const values = [name, email, hashed, reg_no, class_dept, section, media || {}];
    
    const result = await pool.query(query, values);
    const studentId = result.rows[0].id;
    console.log("[OK] Student registered successfully!");
    
    // NOTIFICATION: Welcome email
    try {
      const student = {
        id: studentId,
        type: 'student',
        email: email,
        name: name
      };
      
      await notificationService.sendEmail(
        'ACCOUNT_CREATED',
        student,
        {
          name: name,
          email: email,
          role: 'student',
          reg_no: reg_no,
          section: section
        },
        { student_id: studentId }
      );
      console.log(`[OK] Sent ACCOUNT_CREATED notification to student ${name}`);
    } catch (notifErr) {
      console.error('Welcome notification error (non-blocking):', notifErr);
    }
    
    res.status(201).json({ success: true });
  } catch (err) {
    console.error("[ERR] Registration Error:", err.message);
    console.error("Error Code:", err.code);
    console.error("Error Detail:", err.detail);
    
    // Check for duplicate email
    if (err.code === '23505') {
      return res.status(400).json({ error: "Email already exists. Please use a different email address." });
    }
    // Check for email format constraint
    if (err.message.includes('chk_email_format')) {
      return res.status(400).json({ error: "Invalid email format. Please enter a complete email address." });
    }
    res.status(500).json({ error: "Database Error: " + err.message });
  }
});

// 5. Teacher List (For Allocation)
app.get('/api/teachers', authenticateToken, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, staff_id, dept, allocated_sections FROM teachers ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Update Allocation (Old - keeping for backward compatibility)
app.put('/api/teachers/:id/allocate', authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { sections } = req.body; // Expects an array: ["CSE A", "ECE B"]
  try {
    await pool.query('UPDATE teachers SET allocated_sections = $1 WHERE id = $2', [JSON.stringify(sections), id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7a. Admin: Update Teacher
app.put('/api/admin/teacher/:id', authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { name, email, staff_id, dept } = req.body;
  try {
    await pool.query(
      'UPDATE teachers SET name = $1, email = $2, staff_id = $3, dept = $4 WHERE id = $5',
      [name, email, staff_id, dept, id]
    );
    res.json({ success: true, message: "Teacher updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7b. Admin: Delete Teacher
app.delete('/api/admin/teacher/:id', authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM teachers WHERE id = $1', [id]);
    res.json({ success: true, message: "Teacher deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7c. Admin: Update Student
app.put('/api/admin/student/:id', authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { name, email, reg_no, class_dept, section } = req.body;
  try {
    await pool.query(
      'UPDATE students SET name = $1, email = $2, reg_no = $3, class_dept = $4, section = $5 WHERE id = $6',
      [name, email, reg_no, class_dept, section, id]
    );
    res.json({ success: true, message: "Student updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7d. Admin: Delete Student
app.delete('/api/admin/student/:id', authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM students WHERE id = $1', [id]);
    res.json({ success: true, message: "Student deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7e. Admin: Get All Students
app.get('/api/admin/students', authenticateToken, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, reg_no, class_dept, section, created_at FROM students ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7f. Admin: Get All Teachers
app.get('/api/admin/teachers', authenticateToken, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, staff_id, dept, allocated_sections, created_at FROM teachers ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7g. Admin: Allocate Teacher to Students (Many-to-Many)
app.post('/api/admin/allocate', authenticateToken, adminOnly, async (req, res) => {
  const { teacher_id, student_ids, subject } = req.body;
  try {
    // Delete existing allocations for this teacher and subject
    await pool.query(
      'DELETE FROM teacher_student_allocations WHERE teacher_id = $1 AND subject = $2',
      [teacher_id, subject]
    );
    
    // Insert new allocations
    for (const student_id of student_ids) {
      await pool.query(
        'INSERT INTO teacher_student_allocations (teacher_id, student_id, subject) VALUES ($1, $2, $3) ON CONFLICT (teacher_id, student_id, subject) DO NOTHING',
        [teacher_id, student_id, subject]
      );
    }
    
    res.json({ success: true, message: "Allocation updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7h. Admin: Get Teacher's Students
app.get('/api/admin/teacher/:id/students', authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM v_teacher_students WHERE teacher_id = $1 ORDER BY student_name',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7i. Admin: Get Student's Teachers
app.get('/api/admin/student/:id/teachers', authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM v_student_teachers WHERE student_id = $1 ORDER BY teacher_name',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 8. Fetch Teacher Profile (for Dashboard)
app.get('/api/teacher/me', authenticateToken, teacherOnly, async (req, res) => {
  try {
    // req.user.id comes from the decoded JWT token
    const result = await pool.query(
      'SELECT id, name, email, staff_id, dept, media, allocated_sections FROM teachers WHERE id = $1', 
      [req.user.id]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ error: "Teacher not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8b. Teacher: Get My Allocated Students
app.get('/api/teacher/my-students', authenticateToken, teacherOnly, async (req, res) => {
  try {
    const teacher_id = req.user.id;
    
    const result = await pool.query(
      'SELECT * FROM v_teacher_students WHERE teacher_id = $1 ORDER BY student_name',
      [teacher_id]
    );
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Fetch Students for a specific section
app.get('/api/teacher/students/:section', authenticateToken, teacherOnly, async (req, res) => {
  const fullSectionString = req.params.section; // e.g., "ECE A" or "ece a"

  try {
    // 1. Split "ECE A" into ["ECE", "A"]
    const parts = fullSectionString.trim().split(/\s+/); 
    const deptPart = parts[0];    // "ECE"
    const sectionPart = parts[1]; // "A"

    // 2. Query using LOWER() on both the column and the parameter
    const result = await pool.query(
      `SELECT id, name, reg_no, class_dept, section, media 
       FROM students 
       WHERE LOWER(class_dept) = LOWER($1) 
       AND LOWER(section) = LOWER($2) 
       ORDER BY name ASC`,
      [deptPart, sectionPart]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch Students Error:", err.message);
    res.status(500).json({ error: "Failed to load roster" });
  }
});

// --- ROUTES: MEDIA ---

// 7. Media Upload (Images and Videos)
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  try {
    console.log("Upload request received");
    console.log("File:", req.file);
    
    if (!req.file) {
      console.error("No file in request");
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    console.log("File uploaded successfully:", req.file.path);
    
    res.json({ 
      url: req.file.path, 
      public_id: req.file.filename,
      type: req.file.mimetype,
      resource_type: req.file.mimetype.startsWith('video/') ? 'video' : 'image'
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed: " + err.message });
  }
});

// FETCH INDIVIDUAL STUDENT PROFILE
// FETCH STUDENT PROFILE WITH PHOTO
app.get('/api/student/profile', authenticateToken, studentOnly, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, reg_no, class_dept, section, media FROM students WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Student not found" });

    const student = result.rows[0];
    
    // Get module progress
    const progressResult = await pool.query(
      'SELECT * FROM v_student_module_progress WHERE student_id = $1',
      [req.user.id]
    );
    
    const moduleProgress = progressResult.rows[0] || {
      total_modules: 0,
      completed_modules: 0,
      completion_percentage: 0
    };
    
    // Extract the image URL if it exists, otherwise provide a null
    const profilePic = student.media && student.media.url ? student.media.url : null;

    res.json({
      ...student,
      profilePic,
      progress: {
        modulesFinished: moduleProgress.completed_modules,
        totalModules: moduleProgress.total_modules,
        wellbeingScore: Math.round(moduleProgress.completion_percentage)
      }
    });
  } catch (err) {
    console.error("Student Profile Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// --- PASSWORD CHANGE ROUTES ---

// Student: Change own password
app.post('/api/student/change-password', authenticateToken, studentOnly, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const studentId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    // Get current password hash
    const result = await pool.query('SELECT password FROM students WHERE id = $1', [studentId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!isValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query('UPDATE students SET password = $1 WHERE id = $2', [hashedPassword, studentId]);

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("Password Change Error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// Teacher: Change own password
app.post('/api/teacher/change-password', authenticateToken, teacherOnly, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const teacherId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    // Get current password hash
    const result = await pool.query('SELECT password FROM teachers WHERE id = $1', [teacherId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!isValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query('UPDATE teachers SET password = $1 WHERE id = $2', [hashedPassword, teacherId]);

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("Password Change Error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// Admin: Reset student password
app.post('/api/admin/reset-student-password', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { studentId, newPassword } = req.body;

    if (!studentId || !newPassword) {
      return res.status(400).json({ error: "Student ID and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    // Check if student exists
    const checkResult = await pool.query('SELECT id, name, email FROM students WHERE id = $1', [studentId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const student = checkResult.rows[0];

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query('UPDATE students SET password = $1 WHERE id = $2', [hashedPassword, studentId]);

    res.json({ 
      success: true, 
      message: `Password reset successfully for ${student.name}`,
      studentName: student.name,
      studentEmail: student.email
    });
  } catch (err) {
    console.error("Admin Password Reset Error:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// Admin: Reset teacher password
app.post('/api/admin/reset-teacher-password', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { teacherId, newPassword } = req.body;

    if (!teacherId || !newPassword) {
      return res.status(400).json({ error: "Teacher ID and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    // Check if teacher exists
    const checkResult = await pool.query('SELECT id, name, email FROM teachers WHERE id = $1', [teacherId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    const teacher = checkResult.rows[0];

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query('UPDATE teachers SET password = $1 WHERE id = $2', [hashedPassword, teacherId]);

    res.json({ 
      success: true, 
      message: `Password reset successfully for ${teacher.name}`,
      teacherName: teacher.name,
      teacherEmail: teacher.email
    });
  } catch (err) {
    console.error("Admin Password Reset Error:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// --- ROUTES: MODULE MANAGEMENT ---

// 10. Teacher: Upload/Publish New Module
app.post('/api/teacher/upload-module', authenticateToken, teacherOnly, async (req, res) => {
  try {
    const { section, subject, topic, steps } = req.body;
    const teacherId = req.user.id;

    if (!subject) {
      return res.status(400).json({ error: "Subject is required" });
    }

    // Get teacher name for display
    const teacherResult = await pool.query('SELECT name FROM teachers WHERE id = $1', [teacherId]);
    const teacherName = teacherResult.rows[0]?.name || 'Unknown';

    // Insert module with steps as JSONB
    const query = `
      INSERT INTO modules (section, subject, topic_title, teacher_id, teacher_name, step_count, steps) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING id
    `;
    const values = [section, subject, topic, teacherId, teacherName, steps.length, JSON.stringify(steps)];
    
    const result = await pool.query(query, values);
    const moduleId = result.rows[0].id;
    
    // NOTIFICATION: Send to all students in section
    try {
      const students = await notificationService.getStudentsInSection(section, 'MODULE_PUBLISHED');
      
      if (students.length > 0) {
        const notificationData = (student) => ({
          student_name: student.name,
          section: section,
          topic_title: topic,
          subject: subject,
          teacher_name: teacherName,
          step_count: steps.length
        });
        
        // Send emails
        await notificationService.sendBatchEmails(
          'MODULE_PUBLISHED',
          students,
          notificationData,
          { module_id: moduleId, teacher_id: teacherId }
        );
        
        // Create in-app notifications
        await notificationService.createBatchInAppNotifications(
          'MODULE_PUBLISHED',
          students,
          notificationData
        );
        
        console.log(`[OK] Sent MODULE_PUBLISHED notifications to ${students.length} students`);
      }
    } catch (notifErr) {
      console.error('Notification error (non-blocking):', notifErr);
    }
    
    res.status(201).json({ success: true, moduleId });
  } catch (err) {
    console.error("Module Upload Error:", err);
    res.status(500).json({ error: "Failed to publish module: " + err.message });
  }
});

// 11. Teacher: Fetch Modules for a Section
app.get('/api/teacher/modules/:section', authenticateToken, teacherOnly, async (req, res) => {
  try {
    const section = req.params.section;
    
    const result = await pool.query(
      `SELECT id, topic_title, teacher_name, step_count, created_at 
       FROM modules 
       WHERE LOWER(section) = LOWER($1) 
       ORDER BY created_at DESC`,
      [section]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch Modules Error:", err);
    res.status(500).json({ error: "Failed to load modules" });
  }
});

// 11b. Teacher: Get Single Module (for editing)
app.get('/api/teacher/module/:moduleId', authenticateToken, teacherOnly, async (req, res) => {
  try {
    const moduleId = req.params.moduleId;
    const teacherId = req.user.id;
    
    const result = await pool.query(
      'SELECT * FROM modules WHERE id = $1 AND teacher_id = $2',
      [moduleId, teacherId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Module not found" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fetch Module Error:", err);
    res.status(500).json({ error: "Failed to load module" });
  }
});

// 11c. Teacher: Update/Edit Module
app.put('/api/teacher/module/:moduleId', authenticateToken, teacherOnly, async (req, res) => {
  try {
    const moduleId = req.params.moduleId;
    const { topic, subject, steps } = req.body;
    const teacherId = req.user.id;
    
    // Verify teacher owns this module
    const checkOwner = await pool.query(
      'SELECT id FROM modules WHERE id = $1 AND teacher_id = $2',
      [moduleId, teacherId]
    );
    
    if (checkOwner.rows.length === 0) {
      return res.status(403).json({ error: "Not authorized to edit this module" });
    }
    
    // Update module
    const query = `
      UPDATE modules 
      SET topic_title = $1, subject = $2, steps = $3, step_count = $4
      WHERE id = $5
      RETURNING id
    `;
    
    await pool.query(query, [topic, subject, JSON.stringify(steps), steps.length, moduleId]);
    res.json({ success: true, message: "Module updated successfully" });
  } catch (err) {
    console.error("Module Update Error:", err);
    res.status(500).json({ error: "Failed to update module: " + err.message });
  }
});

// 11c. Teacher: Delete Module
app.delete('/api/teacher/module/:moduleId', authenticateToken, teacherOnly, async (req, res) => {
  try {
    const moduleId = req.params.moduleId;
    const teacherId = req.user.id;
    
    // Verify teacher owns this module
    const checkOwner = await pool.query(
      'SELECT id FROM modules WHERE id = $1 AND teacher_id = $2',
      [moduleId, teacherId]
    );
    
    if (checkOwner.rows.length === 0) {
      return res.status(403).json({ error: "Not authorized to delete this module" });
    }
    
    // Delete module
    await pool.query('DELETE FROM modules WHERE id = $1', [moduleId]);
    res.json({ success: true, message: "Module deleted successfully" });
  } catch (err) {
    console.error("Module Delete Error:", err);
    res.status(500).json({ error: "Failed to delete module: " + err.message });
  }
});

// 12. Student: Fetch My Modules (Based on Student's Section)
app.get('/api/student/my-modules', authenticateToken, studentOnly, async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Get student's section
    const studentResult = await pool.query(
      'SELECT class_dept, section FROM students WHERE id = $1',
      [studentId]
    );
    
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    
    const { class_dept, section } = studentResult.rows[0];
    const fullSection = `${class_dept} ${section}`; // e.g., "ECE A"
    
    // Fetch modules for this section
    const modulesResult = await pool.query(
      `SELECT id, topic_title, teacher_name, step_count, created_at 
       FROM modules 
       WHERE LOWER(section) = LOWER($1) 
       ORDER BY created_at DESC`,
      [fullSection]
    );
    
    res.json(modulesResult.rows);
  } catch (err) {
    console.error("Student Modules Error:", err);
    res.status(500).json({ error: "Failed to load your modules" });
  }
});

// 13. Student: Fetch Specific Module Content (All Steps)
app.get('/api/student/module/:moduleId', authenticateToken, studentOnly, async (req, res) => {
  try {
    const moduleId = req.params.moduleId;
    const studentId = req.user.id;
    
    const result = await pool.query(
      'SELECT steps FROM modules WHERE id = $1',
      [moduleId]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ error: "Module not found" });
    
    // Log module access for teacher analytics
    await pool.query('SELECT track_module_access($1, $2)', [studentId, moduleId]);
    
    const steps = result.rows[0].steps;
    
    // Format steps for the frontend
    const formattedSteps = steps.map((step, index) => ({
      id: index + 1,
      step_type: step.type, // 'video', 'content', 'mcq', or 'coding'
      // This is what the frontend is looking for:
      mcq_data: step.data, 
      content_text: step.data.description || step.data.question || ''
    }));
    
    res.json(formattedSteps);
  } catch (err) {
    res.status(500).json({ error: "Failed to load module content" });
  }
});

// 13b. Student: Mark Module as Complete
app.post('/api/student/module/:moduleId/complete', authenticateToken, studentOnly, async (req, res) => {
  try {
    const moduleId = req.params.moduleId;
    const studentId = req.user.id;
    
    await pool.query('SELECT mark_module_complete($1, $2)', [studentId, moduleId]);
    
    res.json({ success: true, message: "Module marked as complete" });
  } catch (err) {
    console.error("Mark Complete Error:", err);
    res.status(500).json({ error: "Failed to mark module complete" });
  }
});

// 13c. Student: Get My Module Progress
app.get('/api/student/module-progress', authenticateToken, studentOnly, async (req, res) => {
  try {
    const studentId = req.user.id;
    
    const result = await pool.query(
      'SELECT * FROM v_student_module_progress WHERE student_id = $1',
      [studentId]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        total_modules: 0,
        completed_modules: 0,
        pending_modules: 0,
        completion_percentage: 0
      });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Module Progress Error:", err);
    res.status(500).json({ error: "Failed to load module progress" });
  }
});

// 13d. Teacher: Get Module Statistics
app.get('/api/teacher/module/:moduleId/statistics', authenticateToken, teacherOnly, async (req, res) => {
  try {
    const moduleId = req.params.moduleId;
    
    const result = await pool.query(
      'SELECT * FROM v_module_statistics WHERE module_id = $1',
      [moduleId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Module not found" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Module Statistics Error:", err);
    res.status(500).json({ error: "Failed to load module statistics" });
  }
});

app.post('/api/student/submit-code', authenticateToken, studentOnly, async (req, res) => {
    try {
        const { moduleId, code, language, testCases } = req.body;
        const studentId = req.user.id;
        const studentEmail = req.user.email;

        if (!testCases || testCases.length === 0) {
            return res.status(400).json({ error: "No test cases provided." });
        }

        let passedCount = 0;

        // --- EVALUATION LOOP ---
        for (const tc of testCases) {
            const response = await fetch("https://emkc.org/api/v2/piston/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    language: language,
                    version: "*",
                    files: [{ content: code }],
                    stdin: tc.input,
                }),
            });

            const result = await response.json();
            const actualOutput = (result.run.stdout || "").trim();
            
            // Compare output with expected result
            if (actualOutput === tc.expected.trim()) {
                passedCount++;
            }
        }

        // --- CALCULATION ---
        const totalCases = testCases.length;
        const finalScore = ((passedCount / totalCases) * 100).toFixed(2);

        // --- DATABASE STORAGE ---
        const query = `
            INSERT INTO student_submissions 
            (student_id, student_email, module_id, submitted_code, language, test_cases_passed, total_test_cases, score) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING score, test_cases_passed, total_test_cases;
        `;
        
        const values = [studentId, studentEmail, moduleId, code, language, passedCount, totalCases, finalScore];
        const dbResult = await pool.query(query, values);

        // --- RESPONSE FOR POPUP ---
        res.json({ 
            success: true, 
            score: dbResult.rows[0].score, 
            passed: dbResult.rows[0].test_cases_passed, 
            total: dbResult.rows[0].total_test_cases 
        });

    } catch (err) {
        console.error("SERVER ERROR:", err.message);
        res.status(500).json({ error: "Internal Server Error: " + err.message });
    }
});

// 13e. Teacher: Get Student's Module Progress
app.get('/api/teacher/student/:studentId/module-progress', authenticateToken, teacherOnly, async (req, res) => {
  try {
    const studentId = req.params.studentId;
    
    const result = await pool.query(
      'SELECT * FROM v_student_module_progress WHERE student_id = $1',
      [studentId]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        total_modules: 0,
        completed_modules: 0,
        pending_modules: 0,
        completion_percentage: 0
      });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Student Module Progress Error:", err);
    res.status(500).json({ error: "Failed to load student module progress" });
  }
});

// --- ROUTES: MCQ TEST SYSTEM ---

// 14. Teacher: Create MCQ Test
app.post('/api/teacher/test/create', authenticateToken, teacherOnly, async (req, res) => {
  try {
    const { section, title, description, questions, start_date, deadline } = req.body;
    const teacher_id = req.user.id;
    
    // Get teacher name
    const teacherResult = await pool.query('SELECT name FROM teachers WHERE id = $1', [teacher_id]);
    const teacher_name = teacherResult.rows[0]?.name || 'Unknown';
    
    const query = `
      INSERT INTO mcq_tests (teacher_id, teacher_name, section, title, description, questions, total_questions, start_date, deadline)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      teacher_id, teacher_name, section, title, description,
      JSON.stringify(questions), questions.length, start_date, deadline
    ]);
    
    const test = result.rows[0];
    
    // NOTIFICATION: Send to all students in section
    try {
      const students = await notificationService.getStudentsInSection(section, 'TEST_ASSIGNED');
      
      if (students.length > 0) {
        const notificationData = (student) => ({
          student_name: student.name,
          section: section,
          test_title: title,
          description: description,
          total_questions: questions.length,
          start_date: start_date,
          deadline: deadline
        });
        
        // Send emails
        await notificationService.sendBatchEmails(
          'TEST_ASSIGNED',
          students,
          notificationData,
          { test_id: test.id, teacher_id: teacher_id }
        );
        
        // Create in-app notifications
        await notificationService.createBatchInAppNotifications(
          'TEST_ASSIGNED',
          students,
          notificationData
        );
        
        console.log(`[OK] Sent TEST_ASSIGNED notifications to ${students.length} students`);
      }
    } catch (notifErr) {
      console.error('Notification error (non-blocking):', notifErr);
    }
    
    res.status(201).json({ success: true, test });
  } catch (err) {
    console.error("Test Creation Error:", err);
    res.status(500).json({ error: "Failed to create test: " + err.message });
  }
});

// 15. Teacher: Get All Tests for Section
app.get('/api/teacher/tests/:section', authenticateToken, teacherOnly, async (req, res) => {
  try {
    const section = req.params.section;
    
    const result = await pool.query(
      `SELECT * FROM v_test_statistics 
       WHERE LOWER(section) = LOWER($1) 
       ORDER BY deadline DESC`,
      [section]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch Tests Error:", err);
    res.status(500).json({ error: "Failed to load tests" });
  }
});

// 16. Teacher: Get Test Submissions (who submitted)
app.get('/api/teacher/test/:testId/submissions', authenticateToken, teacherOnly, async (req, res) => {
  try {
    const test_id = req.params.testId;
    
    const result = await pool.query(
      `SELECT 
        id, student_name, student_reg_no, score, percentage, status, submitted_at, time_taken
       FROM test_submissions
       WHERE test_id = $1
       ORDER BY submitted_at DESC`,
      [test_id]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch Submissions Error:", err);
    res.status(500).json({ error: "Failed to load submissions" });
  }
});

// 17. Teacher: Get Student's Detailed Progress
app.get('/api/teacher/student/:studentId/progress', authenticateToken, teacherOnly, async (req, res) => {
  try {
    const student_id = req.params.studentId;
    
    // Get student basic info
    const studentResult = await pool.query(
      'SELECT * FROM v_student_test_progress WHERE student_id = $1',
      [student_id]
    );
    
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    
    // Get detailed test history
    const testsResult = await pool.query(
      'SELECT * FROM get_student_detailed_progress($1)',
      [student_id]
    );
    
    res.json({
      student: studentResult.rows[0],
      tests: testsResult.rows
    });
  } catch (err) {
    console.error("Student Progress Error:", err);
    res.status(500).json({ error: "Failed to load student progress" });
  }
});

// 18. Student: Get My Tests (Pending & Completed)
app.get('/api/student/tests', authenticateToken, studentOnly, async (req, res) => {
  try {
    const student_id = req.user.id;
    
    // Get student's section
    const studentResult = await pool.query(
      'SELECT class_dept, section FROM students WHERE id = $1',
      [student_id]
    );
    
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    
    const { class_dept, section } = studentResult.rows[0];
    const full_section = `${class_dept} ${section}`;
    
    // Get all tests with submission status
    const result = await pool.query(
      `SELECT 
        t.id,
        t.title,
        t.description,
        t.total_questions,
        t.deadline,
        t.teacher_name,
        sub.id as submission_id,
        sub.score,
        sub.percentage,
        sub.status,
        sub.submitted_at,
        CASE 
          WHEN sub.id IS NULL THEN 'pending'
          ELSE 'completed'
        END as completion_status,
        CASE 
          WHEN t.deadline < CURRENT_TIMESTAMP AND sub.id IS NULL THEN true
          ELSE false
        END as is_overdue
       FROM mcq_tests t
       LEFT JOIN test_submissions sub ON t.id = sub.test_id AND sub.student_id = $1
       WHERE LOWER(t.section) = LOWER($2) AND t.is_active = true
       ORDER BY t.deadline ASC`,
      [student_id, full_section]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error("Student Tests Error:", err);
    res.status(500).json({ error: "Failed to load tests" });
  }
});

// 19. Student: Get Test to Take
app.get('/api/student/test/:testId', authenticateToken, studentOnly, async (req, res) => {
  try {
    const test_id = req.params.testId;
    const student_id = req.user.id;
    
    // Check if already submitted
    const submissionCheck = await pool.query(
      'SELECT id FROM test_submissions WHERE test_id = $1 AND student_id = $2',
      [test_id, student_id]
    );
    
    if (submissionCheck.rows.length > 0) {
      return res.status(400).json({ error: "Test already submitted" });
    }
    
    // Get test details
    const result = await pool.query(
      'SELECT id, title, description, questions, total_questions, deadline FROM mcq_tests WHERE id = $1 AND is_active = true',
      [test_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Test not found" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Test Details Error:", err);
    res.status(500).json({ error: "Failed to load test" });
  }
});

// 20. Student: Submit Test
app.post('/api/student/test/submit', authenticateToken, studentOnly, async (req, res) => {
  try {
    const { test_id, answers, time_taken } = req.body;
    const student_id = req.user.id;
    
    console.log("=== TEST SUBMISSION DEBUG ===");
    console.log("Test ID:", test_id);
    console.log("Student Answers:", answers);
    
    // Get student info
    const studentResult = await pool.query(
      'SELECT name, reg_no FROM students WHERE id = $1',
      [student_id]
    );
    
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    
    const { name, reg_no } = studentResult.rows[0];
    
    // Get test questions to calculate score
    const testResult = await pool.query(
      'SELECT questions, total_questions, deadline FROM mcq_tests WHERE id = $1',
      [test_id]
    );
    
    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: "Test not found" });
    }
    
    const { questions, total_questions, deadline } = testResult.rows[0];
    console.log("Test Questions:", questions);
    
    // CALCULATE SCORE IN BACKEND (more reliable than SQL trigger)
    let correct_count = 0;
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const studentAnswer = answers[i.toString()]; // answers is {"0": "A", "1": "B", ...}
      const correctAnswer = question.correct;
      
      console.log(`Q${i}: Student="${studentAnswer}" vs Correct="${correctAnswer}"`);
      
      // Case-insensitive comparison
      if (studentAnswer && correctAnswer && 
          studentAnswer.toUpperCase().trim() === correctAnswer.toUpperCase().trim()) {
        correct_count++;
        console.log(`  [OK] MATCH`);
      } else {
        console.log(`  [X] NO MATCH`);
      }
    }
    
    const score = correct_count;
    const percentage = total_questions > 0 ? ((correct_count / total_questions) * 100).toFixed(2) : 0;
    
    // Check if late submission
    const isLate = new Date() > new Date(deadline);
    const status = isLate ? 'late' : 'completed';
    
    console.log(`Final Score: ${score}/${total_questions} = ${percentage}%`);
    console.log("=== END DEBUG ===");
    
    // Insert submission with calculated score
    const query = `
      INSERT INTO test_submissions (test_id, student_id, student_name, student_reg_no, answers, score, percentage, status, time_taken)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      test_id, student_id, name, reg_no, JSON.stringify(answers), score, percentage, status, time_taken
    ]);
    
    const submission = result.rows[0];
    console.log("Submission saved:", submission);
    
    // NOTIFICATION 1: Notify teacher about submission
    try {
      const testInfo = await pool.query(
        'SELECT teacher_id, teacher_name, section, title FROM mcq_tests WHERE id = $1',
        [test_id]
      );
      
      if (testInfo.rows.length > 0) {
        const testData = testInfo.rows[0];
        const teacher = await notificationService.getTeacherById(testData.teacher_id);
        
        if (teacher) {
          const teacherNotifData = {
            teacher_name: teacher.name,
            student_name: name,
            student_reg_no: reg_no,
            test_title: testData.title,
            score: score,
            total_questions: total_questions,
            percentage: percentage,
            status: status,
            submitted_at: new Date().toISOString(),
            test_id: test_id
          };
          
          // Send email
          await notificationService.sendEmail(
            'TEST_SUBMITTED',
            teacher,
            teacherNotifData,
            { test_id, student_id, submission_id: submission.id }
          );
          
          // Create in-app notification
          await notificationService.createInAppNotification(
            'TEST_SUBMITTED',
            teacher,
            teacherNotifData
          );
          
          console.log(`[OK] Sent TEST_SUBMITTED notification to teacher ${teacher.name}`);
        }
      }
    } catch (notifErr) {
      console.error('Teacher notification error (non-blocking):', notifErr);
    }
    
    // NOTIFICATION 2: Notify student about grade
    try {
      const studentInfo = await pool.query(
        'SELECT email FROM students WHERE id = $1',
        [student_id]
      );
      
      const testInfoGrade = await pool.query(
        'SELECT title FROM mcq_tests WHERE id = $1',
        [test_id]
      );
      
      if (studentInfo.rows.length > 0 && testInfoGrade.rows.length > 0) {
        const student = {
          id: student_id,
          type: 'student',
          email: studentInfo.rows[0].email,
          name: name
        };
        
        const gradeNotifData = {
          student_name: name,
          test_title: testInfoGrade.rows[0].title,
          score: score,
          total_questions: total_questions,
          percentage: percentage,
          status: status
        };
        
        // Send email
        await notificationService.sendEmail(
          'GRADE_POSTED',
          student,
          gradeNotifData,
          { test_id, submission_id: submission.id }
        );
        
        // Create in-app notification
        await notificationService.createInAppNotification(
          'GRADE_POSTED',
          student,
          gradeNotifData
        );
        
        console.log(`[OK] Sent GRADE_POSTED notification to student ${name}`);
      }
    } catch (notifErr) {
      console.error('Student grade notification error (non-blocking):', notifErr);
    }
    
    res.json({ success: true, submission });
  } catch (err) {
    console.error("Test Submission Error:", err);
    res.status(500).json({ error: "Failed to submit test: " + err.message });
  }
});

// 21. Student: Get My Progress Overview
app.get('/api/student/progress', authenticateToken, studentOnly, async (req, res) => {
  try {
    const student_id = req.user.id;
    
    const result = await pool.query(
      'SELECT * FROM v_student_test_progress WHERE student_id = $1',
      [student_id]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        total_tests_assigned: 0,
        tests_completed: 0,
        tests_overdue: 0,
        average_score: 0
      });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Progress Error:", err);
    res.status(500).json({ error: "Failed to load progress" });
  }
});

// --- ROUTES: CODING WORKBENCH ---

// 22. Student: Submit Code Solution
app.post('/api/student/submit-code', authenticateToken, studentOnly, async (req, res) => {
  try {
    const { moduleId, code, language, testCases } = req.body;
    const studentId = req.user.id;
    const studentEmail = req.user.email;

    if (!testCases || testCases.length === 0) {
      return res.status(400).json({ error: "No test cases provided." });
    }

    let passedCount = 0;

    // --- EVALUATION LOOP ---
    for (const tc of testCases) {
      const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: language,
          version: "*",
          files: [{ content: code }],
          stdin: tc.input,
        }),
      });

      const result = await response.json();
      const actualOutput = (result.run.stdout || "").trim();

      // Compare output with expected result
      if (actualOutput === tc.expected.trim()) {
        passedCount++;
      }
    }

    // --- CALCULATION ---
    const totalCases = testCases.length;
    const finalScore = ((passedCount / totalCases) * 100).toFixed(2);

    // --- DATABASE STORAGE ---
    const query = `
      INSERT INTO student_submissions (student_id, student_email, module_id, submitted_code, language, test_cases_passed, total_test_cases, score) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING score, test_cases_passed, total_test_cases;
    `;
    const values = [studentId, studentEmail, moduleId, code, language, passedCount, totalCases, finalScore];
    const dbResult = await pool.query(query, values);

    // --- RESPONSE FOR POPUP ---
    res.json({ 
      success: true, 
      score: dbResult.rows[0].score, 
      passed: dbResult.rows[0].test_cases_passed, 
      total: dbResult.rows[0].total_test_cases 
    });
  } catch (err) {
    console.error("SERVER ERROR:", err.message);
    res.status(500).json({ error: "Internal Server Error: " + err.message });
  }
});

// ============================================================
// NOTIFICATION SYSTEM ENDPOINTS
// ============================================================

// Get user notification preferences
app.get('/api/notifications/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role;
    
    const result = await pool.query(
      `SELECT * FROM v_user_notification_settings 
       WHERE user_id = $1 AND user_type = $2
       ORDER BY category, event_name`,
      [userId, userType]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Get Notification Preferences Error:', err);
    res.status(500).json({ error: 'Failed to load notification preferences' });
  }
});

// Update notification preference
app.put('/api/notifications/preferences/:eventCode', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role;
    const eventCode = req.params.eventCode;
    const { email_enabled, sms_enabled } = req.body;
    
    const result = await pool.query(
      `INSERT INTO notification_preferences (user_id, user_type, event_code, email_enabled, sms_enabled)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, user_type, event_code) 
       DO UPDATE SET 
         email_enabled = EXCLUDED.email_enabled,
         sms_enabled = EXCLUDED.sms_enabled,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, userType, eventCode, email_enabled, sms_enabled]
    );
    
    res.json({ success: true, preference: result.rows[0] });
  } catch (err) {
    console.error('Update Notification Preference Error:', err);
    res.status(500).json({ error: 'Failed to update notification preference' });
  }
});

// Get user notification history
app.get('/api/notifications/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const result = await pool.query(
      `SELECT * FROM v_recent_notifications 
       WHERE recipient_id = $1 AND recipient_type = $2
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, userType, limit, offset]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Get Notification History Error:', err);
    res.status(500).json({ error: 'Failed to load notification history' });
  }
});

// Get notification statistics (admin/teacher)
app.get('/api/notifications/stats', authenticateToken, async (req, res) => {
  try {
    // Only allow teachers and admins
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const result = await pool.query(
      `SELECT * FROM v_notification_stats 
       WHERE date >= CURRENT_DATE - INTERVAL '30 days'
       ORDER BY date DESC, event_code`
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Get Notification Stats Error:', err);
    res.status(500).json({ error: 'Failed to load notification statistics' });
  }
});

// ============================================================
// IN-APP NOTIFICATIONS (Bell Icon)
// ============================================================

// Get user's in-app notifications
app.get('/api/notifications/inbox', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await pool.query(
      `SELECT id, event_code, title, message, link, is_read, created_at
       FROM in_app_notifications 
       WHERE user_id = $1 AND user_type = $2
       ORDER BY created_at DESC
       LIMIT $3`,
      [userId, userType, limit]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Get In-App Notifications Error:', err);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

// Get unread notification count
app.get('/api/notifications/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role;
    
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM in_app_notifications 
       WHERE user_id = $1 AND user_type = $2 AND is_read = false`,
      [userId, userType]
    );
    
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('Get Unread Count Error:', err);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Mark notification as read
app.patch('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    const userType = req.user.role;
    
    const result = await pool.query(
      `UPDATE in_app_notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2 AND user_type = $3
       RETURNING id`,
      [notificationId, userId, userType]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Mark Read Error:', err);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
app.patch('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role;
    
    await pool.query(
      `UPDATE in_app_notifications 
       SET is_read = true 
       WHERE user_id = $1 AND user_type = $2 AND is_read = false`,
      [userId, userType]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error('Mark All Read Error:', err);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Manual test notification (development only)
if (process.env.ENABLE_DEV_ENDPOINTS === 'true' || process.env.NODE_ENV !== 'production') {
  app.post('/api/notifications/test', authenticateToken, async (req, res) => {
    try {
      const { eventCode, data } = req.body;
      
      const recipient = {
        id: req.user.id,
        type: req.user.role,
        email: req.user.email,
        name: req.user.name || 'User'
      };
      
      const result = await notificationService.sendEmail(eventCode, recipient, data, { test: true });
      res.json({ success: true, result });
    } catch (err) {
      console.error('Test Notification Error:', err);
      res.status(500).json({ error: err.message });
    }
  });
}

// Export app for testing, only listen if run directly
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`SERVER ACTIVE ON PORT ${PORT}`));
}

module.exports = app;