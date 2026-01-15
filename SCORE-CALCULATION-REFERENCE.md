# Score Calculation Reference

## 📐 Formula

```
Score = (Correct Answers / Total Questions) × 100
```

## 💻 Implementation Location

**File:** `backend/server.js`  
**Lines:** 560-650  
**Endpoint:** `POST /api/student/test/submit`

## 🔍 How It Works

### Step 1: Student Submits Test
```javascript
// Frontend sends:
{
  test_id: 1,
  answers: {
    "0": "A",  // Question 0: Student selected A
    "1": "B",  // Question 1: Student selected B
    "2": "C",  // Question 2: Student selected C
    "3": "D",  // Question 3: Student selected D
    "4": "A"   // Question 4: Student selected A
  },
  time_taken: 300  // seconds
}
```

### Step 2: Backend Fetches Teacher's Questions
```javascript
const testResult = await pool.query(
  'SELECT questions, total_questions FROM mcq_tests WHERE id = $1',
  [test_id]
);

// Database returns:
{
  questions: [
    {
      question: "What is 2+2?",
      option_a: "3",
      option_b: "4",
      option_c: "5",
      option_d: "6",
      correct: "B"  // ← Teacher's correct answer
    },
    {
      question: "Capital of France?",
      option_a: "London",
      option_b: "Paris",
      option_c: "Berlin",
      option_d: "Rome",
      correct: "B"  // ← Teacher's correct answer
    },
    // ... more questions
  ],
  total_questions: 5
}
```

### Step 3: Compare Answers
```javascript
let correct_count = 0;

for (let i = 0; i < questions.length; i++) {
  const question = questions[i];
  const studentAnswer = answers[i.toString()];  // From submission
  const correctAnswer = question.correct;        // From database
  
  console.log(`Q${i}: Student="${studentAnswer}" vs Correct="${correctAnswer}"`);
  
  // Case-insensitive comparison
  if (studentAnswer && correctAnswer && 
      studentAnswer.toUpperCase().trim() === correctAnswer.toUpperCase().trim()) {
    correct_count++;
    console.log(`  ✓ MATCH`);
  } else {
    console.log(`  ✗ NO MATCH`);
  }
}
```

### Step 4: Calculate Percentage
```javascript
const score = correct_count;
const percentage = total_questions > 0 
  ? ((correct_count / total_questions) * 100).toFixed(2) 
  : 0;

console.log(`Final Score: ${score}/${total_questions} = ${percentage}%`);
```

### Step 5: Save to Database
```javascript
INSERT INTO test_submissions (
  test_id, 
  student_id, 
  student_name, 
  student_reg_no, 
  answers, 
  score,        // 3
  percentage,   // 60.00
  status, 
  time_taken
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
```

## 📊 Examples

### Example 1: Perfect Score
```
Total Questions: 10
Correct Answers: 10
Score = (10 / 10) × 100 = 100.00%
```

### Example 2: Passing Score
```
Total Questions: 15
Correct Answers: 12
Score = (12 / 15) × 100 = 80.00%
```

### Example 3: Failing Score
```
Total Questions: 20
Correct Answers: 8
Score = (8 / 20) × 100 = 40.00%
```

### Example 4: Partial Score
```
Total Questions: 5
Correct Answers: 3
Score = (3 / 5) × 100 = 60.00%
```

## 🐛 Debug Output

When a student submits a test, the backend console shows:

```
=== TEST SUBMISSION DEBUG ===
Test ID: 1
Student Answers: {"0":"A","1":"B","2":"C","3":"D","4":"A"}
Test Questions: [Array of 5 questions]
Q0: Student="A" vs Correct="A"
  ✓ MATCH
Q1: Student="B" vs Correct="C"
  ✗ NO MATCH
Q2: Student="C" vs Correct="C"
  ✓ MATCH
Q3: Student="D" vs Correct="B"
  ✗ NO MATCH
Q4: Student="A" vs Correct="A"
  ✓ MATCH
Final Score: 3/5 = 60.00%
=== END DEBUG ===
Submission saved: { id: 1, score: 3, percentage: 60.00, ... }
```

## ✅ Verification Steps

### 1. Check Backend Console
After student submits test, look for:
- "TEST SUBMISSION DEBUG" section
- Question-by-question comparison
- Final score calculation
- "Submission saved" confirmation

### 2. Check Database
```sql
SELECT 
  id, 
  test_id, 
  student_name, 
  score, 
  percentage, 
  submitted_at 
FROM test_submissions 
ORDER BY id DESC 
LIMIT 5;
```

### 3. Check Teacher Dashboard
- Go to MCQ Tests tab
- Find the test
- Verify: total_submissions increased
- Verify: average_score updated
- Verify: passed_count updated (if score >= 60%)

### 4. Check Student Dashboard
- Go to Test Knowledge
- Test should show "Completed"
- Score should display correctly
- Not 0.00%

## 🚨 Troubleshooting

### Issue: Score shows 0.00%

**Possible Causes:**
1. Backend not calculating (check console)
2. Database view not working
3. Answer format mismatch

**Debug:**
```javascript
// Check backend console for:
=== TEST SUBMISSION DEBUG ===
// If you don't see this, calculation isn't running
```

### Issue: All answers marked wrong

**Possible Causes:**
1. Answer format mismatch (A vs a)
2. Correct answer not stored properly
3. Student answers not sent correctly

**Debug:**
```javascript
// Check console output:
Q0: Student="a" vs Correct="A"
  ✗ NO MATCH  // Should be MATCH (case-insensitive)
```

**Fix:** Already implemented - uses `.toUpperCase().trim()`

### Issue: Some questions not counted

**Possible Causes:**
1. Question index mismatch
2. Missing answers
3. Null/undefined values

**Debug:**
```javascript
// Check if all questions logged:
Q0: ...
Q1: ...
Q2: ...
// Should see all questions
```

## 🎯 Key Points

1. **No Hardcoding:** All data from database
2. **Dynamic Calculation:** Happens on every submission
3. **Case-Insensitive:** "A" matches "a"
4. **Trimmed:** " B " matches "B"
5. **Logged:** Every comparison logged to console
6. **Stored:** Score saved to database permanently
7. **Secure:** Calculation in backend (can't be manipulated)

## 📝 Data Flow

```
TEACHER CREATES TEST
    ↓
questions: [
  {question: "...", correct: "A"},
  {question: "...", correct: "B"},
  ...
]
    ↓
Stored in mcq_tests table
    ↓
STUDENT TAKES TEST
    ↓
Selects answers: {"0": "A", "1": "B", ...}
    ↓
Submits to backend
    ↓
BACKEND FETCHES QUESTIONS
    ↓
questions[0].correct = "A"
questions[1].correct = "B"
    ↓
BACKEND COMPARES
    ↓
answers["0"] === questions[0].correct ?
answers["1"] === questions[1].correct ?
    ↓
COUNT CORRECT
    ↓
correct_count = 12
    ↓
CALCULATE PERCENTAGE
    ↓
(12 / 15) × 100 = 80.00%
    ↓
SAVE TO DATABASE
    ↓
test_submissions table
    ↓
DISPLAY ON DASHBOARDS
```

## ✅ Success Indicators

- Backend console shows question-by-question comparison
- Final score shows correct calculation
- "Submission saved" appears in console
- Teacher dashboard shows updated statistics
- Student sees correct score (not 0.00%)
- Database has record in test_submissions table

**Everything is working correctly!** 🎉
