# 📝 Sample Coding Problem - Ready to Paste

## Problem: Sum of Two Numbers

### 📋 Problem Description (Copy this)
```
Write a program that takes two integers as input and prints their sum.

INPUT FORMAT:
Two space-separated integers on a single line

OUTPUT FORMAT:
A single integer representing the sum

EXAMPLE:
Input: 5 10
Output: 15

CONSTRAINTS:
- Both numbers will be between -1000 and 1000
- Output should be a single integer with no extra text
```

---

## 🎯 Starter Code Templates (Already filled in - just verify)

### Java:
```java
import java.util.*;

public class Solution {
  public static void main(String[] args) {
    Scanner in = new Scanner(System.in);
    
    // Read two integers
    int a = in.nextInt();
    int b = in.nextInt();
    
    // Calculate and print sum
    System.out.println(a + b);
  }
}
```

### Python:
```python
# Read two integers from input
a, b = map(int, input().split())

# Calculate and print sum
print(a + b)
```

### JavaScript (Node.js):
```javascript
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (line) => {
  const [a, b] = line.split(' ').map(Number);
  console.log(a + b);
  rl.close();
});
```

### C++:
```cpp
#include <iostream>
using namespace std;

int main() {
  int a, b;
  cin >> a >> b;
  cout << a + b << endl;
  return 0;
}
```

---

## ✅ Test Cases (Add these one by one)

### Test Case 1 (Visible - Basic)
- **Input:** `5 10`
- **Expected:** `15`
- **Hidden:** ❌ (Uncheck)

### Test Case 2 (Visible - Zero)
- **Input:** `0 0`
- **Expected:** `0`
- **Hidden:** ❌ (Uncheck)

### Test Case 3 (Hidden - Negative)
- **Input:** `-5 10`
- **Expected:** `5`
- **Hidden:** ✅ (Check)

### Test Case 4 (Hidden - Both Negative)
- **Input:** `-20 -30`
- **Expected:** `-50`
- **Hidden:** ✅ (Check)

### Test Case 5 (Hidden - Large Numbers)
- **Input:** `999 1`
- **Expected:** `1000`
- **Hidden:** ✅ (Check)

---

## ⚙️ Settings
- **Time Limit:** 5000 ms
- **Memory Limit:** 256 MB
- **Allowed Languages:** All (Java, Python, JavaScript, C++)

---

# 🚀 Alternative Problem: Even or Odd

### 📋 Problem Description
```
Write a program that reads an integer and prints whether it is EVEN or ODD.

INPUT FORMAT:
A single integer

OUTPUT FORMAT:
Print "EVEN" if the number is even, "ODD" if the number is odd

EXAMPLE:
Input: 4
Output: EVEN

Input: 7
Output: ODD

CONSTRAINTS:
- The number will be between -1000 and 1000
- Output must be exactly "EVEN" or "ODD" (all caps, no extra text)
```

### Java Starter:
```java
import java.util.*;

public class Solution {
  public static void main(String[] args) {
    Scanner in = new Scanner(System.in);
    int n = in.nextInt();
    
    // Check if even or odd
    if (n % 2 == 0) {
      System.out.println("EVEN");
    } else {
      System.out.println("ODD");
    }
  }
}
```

### Python Starter:
```python
n = int(input())

if n % 2 == 0:
    print("EVEN")
else:
    print("ODD")
```

### Test Cases:
1. Input: `4` → Expected: `EVEN` (Visible)
2. Input: `7` → Expected: `ODD` (Visible)
3. Input: `0` → Expected: `EVEN` (Hidden)
4. Input: `-5` → Expected: `ODD` (Hidden)
5. Input: `100` → Expected: `EVEN` (Hidden)

---

# 🎓 Alternative Problem: Maximum of Three

### 📋 Problem Description
```
Write a program that reads three integers and prints the largest one.

INPUT FORMAT:
Three space-separated integers on a single line

OUTPUT FORMAT:
A single integer (the maximum of the three)

EXAMPLE:
Input: 5 12 8
Output: 12

CONSTRAINTS:
- All numbers will be between -1000 and 1000
- If multiple numbers are equal and maximum, print that value once
```

### Java Starter:
```java
import java.util.*;

public class Solution {
  public static void main(String[] args) {
    Scanner in = new Scanner(System.in);
    
    int a = in.nextInt();
    int b = in.nextInt();
    int c = in.nextInt();
    
    // Find maximum
    int max = Math.max(a, Math.max(b, c));
    System.out.println(max);
  }
}
```

### Python Starter:
```python
a, b, c = map(int, input().split())
print(max(a, b, c))
```

### Test Cases:
1. Input: `5 12 8` → Expected: `12` (Visible)
2. Input: `1 1 1` → Expected: `1` (Visible)
3. Input: `-5 -10 -3` → Expected: `-3` (Hidden)
4. Input: `0 100 50` → Expected: `100` (Hidden)
5. Input: `999 998 1000` → Expected: `1000` (Hidden)

---

# 📊 Quick Copy Format for Teachers

## Problem 1: Sum of Two Numbers
**Description:** Write a program that takes two integers as input and prints their sum.

INPUT: Two space-separated integers
OUTPUT: Single integer (sum)
EXAMPLE: Input: 5 10 → Output: 15

**Test Cases:**
- `5 10` → `15` (Visible)
- `0 0` → `0` (Visible)
- `-5 10` → `5` (Hidden)
- `-20 -30` → `-50` (Hidden)
- `999 1` → `1000` (Hidden)

---

## Problem 2: Factorial Calculator

### Description:
```
Write a program that calculates the factorial of a given number.

INPUT FORMAT:
A single non-negative integer N

OUTPUT FORMAT:
The factorial of N (N!)

EXAMPLE:
Input: 5
Output: 120

EXPLANATION:
5! = 5 × 4 × 3 × 2 × 1 = 120

CONSTRAINTS:
- 0 ≤ N ≤ 12
- Remember: 0! = 1
```

### Java Starter:
```java
import java.util.*;

public class Solution {
  public static void main(String[] args) {
    Scanner in = new Scanner(System.in);
    int n = in.nextInt();
    
    long factorial = 1;
    for (int i = 1; i <= n; i++) {
      factorial *= i;
    }
    
    System.out.println(factorial);
  }
}
```

### Python Starter:
```python
n = int(input())

factorial = 1
for i in range(1, n + 1):
    factorial *= i

print(factorial)
```

### Test Cases:
1. Input: `5` → Expected: `120` (Visible)
2. Input: `0` → Expected: `1` (Visible)
3. Input: `1` → Expected: `1` (Hidden)
4. Input: `10` → Expected: `3628800` (Hidden)
5. Input: `7` → Expected: `5040` (Hidden)

---

## 🎯 Quick Steps to Add Problem:

1. **Select:** "💻 Coding Problem (Auto-Graded)"
2. **Paste:** Problem description
3. **Verify:** Starter code templates (already filled)
4. **Add:** Test cases one by one
5. **Mark:** Some as hidden (✅ checkbox)
6. **Click:** "Add Step"
7. **Click:** "Publish Module"

Done! 🎉
