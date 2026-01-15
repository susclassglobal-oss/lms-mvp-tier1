# Sustainable Classroom - API Documentation

## 🚀 Server Status
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173

---

## 📋 Complete API Endpoints (13 Total)

### 🔐 Authentication

#### 1. Admin Login
```
POST /api/admin/login
Body: { email, password }
Response: { success, token }
```

#### 2. Student/Teacher Login
```
POST /api/login
Body: { email, password, role }
Response: { success, token, user }
```

---

### 👨‍💼 Admin Operations (Protected - Admin Only)

#### 3. Register Teacher
```
POST /api/admin/register-teacher
Headers: Authorization: Bearer <token>
Body: { name, email, password, staff_id, dept, media }
Response: { success }
```

#### 4. Register Student
```
POST /api/admin/register-student
Headers: Authorization: Bearer <token>
Body: { name, email, password, reg_no, class_dept, section, media }
Response: { success }
```

#### 5. Get All Teachers
```
GET /api/teachers
Headers: Authorization: Bearer <token>
Response: [{ id, name, staff_id, dept, allocated_sections }]
```

#### 6. Allocate Sections to Teacher
```
PUT /api/teachers/:id/allocate
Headers: Authorization: Bearer <token>
Body: { sections: ["ECE A", "CSE B"] }
Response: { success }
```

---

### 👨‍🏫 Teacher Operations (Protected - Teacher Only)

#### 7. Get Teacher Profile
```
GET /api/teacher/me
Headers: Authorization: Bearer <token>
Response: { id, name, email, staff_id, dept, media, allocated_sections }
```

#### 8. Get Students in Section
```
GET /api/teacher/students/:section
Headers: Authorization: Bearer <token>
Response: [{ id, name, reg_no, class_dept, section, media }]
```

#### 9. Get Modules for Section
```
GET /api/teacher/modules/:section
Headers: Authorization: Bearer <token>
Response: [{ id, topic_title, teacher_name, step_count, created_at }]
```

#### 10. Upload/Publish Module
```
POST /api/teacher/upload-module
Headers: Authorization: Bearer <token>
Body: { 
  section: "ECE A", 
  topic: "JavaScript Basics", 
  steps: [
    { type: "text", header: "Introduction", data: "..." },
    { type: "video", header: "Tutorial", data: "https://youtube.com/..." },
    { type: "mcq", header: "Quiz", data: { question: "...", a: "...", b: "...", c: "...", d: "...", correct: "A" } },
    { type: "code", header: "Example", data: "console.log('Hello');" }
  ]
}
Response: { success, moduleId }
```

---

### 👨‍🎓 Student Operations (Protected - Student Only)

#### 11. Get Student Profile
```
GET /api/student/profile
Headers: Authorization: Bearer <token>
Response: { id, name, email, reg_no, class_dept, section, media, profilePic, progress }
```

#### 12. Get My Modules
```
GET /api/student/my-modules
Headers: Authorization: Bearer <token>
Response: [{ id, topic_title, teacher_name, step_count, created_at }]
```

#### 13. Get Module Content
```
GET /api/student/module/:moduleId
Headers: Authorization: Bearer <token>
Response: [{ id, step_type, content_text, mcq_data }]
```

---

### 📤 Media Upload

#### 14. Upload Image to Cloudinary
```
POST /api/upload
Headers: Authorization: Bearer <token>
Body: FormData with 'image' field
Response: { url, public_id, type }
```

---

## 🗄️ Database Setup

**IMPORTANT**: Before testing, you must create the database tables!

1. Go to your Neon PostgreSQL console: https://console.neon.tech
2. Select your database: `neondb`
3. Open the SQL Editor
4. Copy and paste the contents of `database-setup.sql`
5. Execute the script

This will create:
- `teachers` table
- `students` table
- `modules` table
- Necessary indexes

---

## 🧪 Testing the Application

### Step 1: Setup Database
Run the SQL script in Neon console (see above)

### Step 2: Login as Admin
1. Go to http://localhost:5173
2. Select "ADMIN" role
3. Email: `susclass.global@gmail.com`
4. Password: `Sc2026**`

### Step 3: Register a Teacher
1. In Admin Dashboard, go to "Add Teacher" tab
2. Fill in details (upload photo optional)
3. Click "REGISTER TEACHER"

### Step 4: Allocate Sections
1. Go to "Teacher Allocation" tab
2. Select the teacher
3. Enter sections: `ECE A, CSE B`
4. Click "Update Allocation"

### Step 5: Register Students
1. Go to "Add Student" tab
2. Fill in details
3. **Important**: Set section as "ECE A" or "CSE B" to match teacher allocation
4. Click "REGISTER STUDENT"

### Step 6: Login as Teacher
1. Logout from admin
2. Select "TEACHER" role
3. Use the teacher credentials you created
4. Go to "Module Builder"
5. Create a learning module with multiple steps

### Step 7: Login as Student
1. Logout from teacher
2. Select "STUDENT" role
3. Use the student credentials you created
4. Go to "Learning Modules"
5. You should see the modules created by your teacher!

---

## 🔧 Environment Variables

Located in `backend/.env`:
```
PORT=5000
DATABASE_URL=postgresql://...
ADMIN_EMAIL=susclass.global@gmail.com
ADMIN_PASSWORD=Sc2026**
CLOUDINARY_CLOUD_NAME=dsegymiip
CLOUDINARY_API_KEY=795884329264685
CLOUDINARY_API_SECRET=PuJymyfEO6ka6XLhpFuKBxbOyqM
JWT_SECRET=hellothisissusclassglobal@1234567890
```

---

## ✅ What's Working Now

- ✅ All 13 API endpoints implemented
- ✅ Admin can manage teachers and students
- ✅ Teachers can create and view modules
- ✅ Students can view and complete modules
- ✅ Cloudinary image uploads
- ✅ JWT authentication
- ✅ Role-based access control

---

## 📝 Notes

- All passwords are hashed with bcrypt (10 rounds)
- JWT tokens expire in 24 hours
- Images are stored in Cloudinary folder: `classroom_v2`
- Section format: "DEPT SECTION" (e.g., "ECE A", "CSE B")
- Module steps support 4 types: text, video, mcq, code
