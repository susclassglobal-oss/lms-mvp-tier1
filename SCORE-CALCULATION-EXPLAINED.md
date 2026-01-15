# Score Calculation - How It Works

## ✅ CONFIRMATION: Nothing is Hardcoded!

Your system is **already working correctly** with dynamic data:

### 1. Teacher Creates MCQ Test
- Teacher fills form with title, description, dates
- Teacher adds questions one by one (or uploads CSV)
- All questions stored in database `mcq_tests` table
- Example: 15 questions → stored as JSONB array

**Database Storage:**
```json
{
  "id": 1,
  "title": "Digital Electronics Quiz",
  "section": "CSE A",
  "questions": [
    {
      "question": "What is a NAND gate?",
      "option_a": "AND + NOT",
      "option_b": "OR + NOT",
      "option_c": "XOR + NOT",
      "option_d": "None",
      "correct": "A"
    },
    // ... 14 more questions
  ],
  "total_questions": 15
}
```

---

### 2. Student Takes Test
- Student sees all 15 questions
- Student selects answers (A/B/C/D for each)
- Clicks "Submit Test"
- Frontend sends: `{"0": "A", "1": "B", "2": "C", ..., "14": "D"}`

---

### 3. Score Calculation (Backend - server.js lines 595-615)

```javascript
// Step 1: Get teacher's questions from database
const testResult = await pool.query(
  'SELECT questions, total_questions FROM mcq_tests WHERE id = $1',
  [test_id]
);
const questions = testResult.rows[0].questions; // Teacher's 15 questions
const total_questions = testResult.rows[0].total_questions; // 15

// Step 2: Get student's answers from submission
const { answers } = req.body; // {"0": "A", "1": "B", ..., "14": "D"}

// Step 3: Compare each answer
let correct_count = 0;

for (let i = 0; i < questions.length; i++) {
  const teacherCorrectAnswer = questions[i].correct;  // From DB
  const studentAnswer = answers[i.toString()];        // From submission
  
  if (studentAnswer === teacherCorrectAnswer) {
    correct_count++; // Increment if match
  }
}

// Step 4: Calculate percentage
const score = correct_count;
const percentage = (correct_count / total_questions) * 100;

// Example: 12 correct out of 15
// percentage = (12 / 15) * 100 = 80.00%
```

---

### 4. Formula Breakdown

**For 15 Questions:**
- Student gets 12 correct
- Formula: `(12 / 15) × 100 = 80.00%`

**For 20 Questions:**
- Student gets 18 correct
- Formula: `(18 / 20) × 100 = 90.00%`

**For 5 Questions:**
- Student gets 3 correct
- Formula: `(3 / 5) × 100 = 60.00%`

---

### 5. Data Flow

```
TEACHER CREATES TEST
    ↓
[Database: mcq_tests table]
    ↓
STUDENT TAKES TEST
    ↓
[Frontend sends answers]
    ↓
BACKEND COMPARES
    ↓
Teacher's correct answer (from DB) vs Student's answer (from submission)
    ↓
CALCULATE SCORE
    ↓
(correct / total) × 100
    ↓
[Database: test_submissions table]
    ↓
DISPLAY ON DASHBOARD
```

---

## Teacher Dashboard Test List

The test list should show on the "MCQ Tests" tab with:
- Test title
- Created date
- Deadline
- Active/Expired status
- Number of questions
- Submissions count
- Average score
- Passed count

**Location:** `TeacherDashboard.jsx` lines 270-330

**API Endpoint:** `GET /api/teacher/tests/:section`

**Database View:** `v_test_statistics`

---

## Troubleshooting

If tests are not showing on teacher dashboard:

1. **Check if tests exist in database:**
   ```sql
   SELECT * FROM mcq_tests WHERE section = 'CSE A';
   ```

2. **Check if view exists:**
   ```sql
   SELECT * FROM v_test_statistics;
   ```

3. **Check browser console for errors:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for "Fetch Tests Error"

4. **Check backend console:**
   - Look for "Fetch Tests Error"
   - Verify database connection

5. **Verify section name matches:**
   - Teacher's section: "CSE A"
   - Test's section: "CSE A"
   - Must match exactly (case-insensitive in query)

---

## Summary

✅ **No hardcoding** - All data from database  
✅ **Dynamic questions** - Teacher creates any number  
✅ **Correct formula** - (correct/total) × 100  
✅ **Stored in DB** - Both questions and answers  
✅ **Test list** - Shows on teacher dashboard  

Everything is working as designed!
