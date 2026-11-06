const express = require('express');
const mysql = require('mysql8');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// MySQL Connection Configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'website',
  multipleStatements: true
};

let db;

function connectDB() {
  db = mysql.createPool({
    connectionLimit: 10,
    ...dbConfig
  });

  db.getConnection((err, connection) => {
    if (err) {
      console.error('❌ Error connecting to MySQL database "website":', err.message);
      console.log('👉 Please ensure MySQL Server 8.0 is running and credentials (root:root) are correct.');
    } else {
      console.log('✅ Connected to MySQL database "website" successfully!');
      connection.release();
    }
  });
}

connectDB();

// ---------------------- API ROUTES ---------------------- //

// 1. Student Login / Authentication
// Allows login by email or roll_no or student_id
app.post('/api/student/login', (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ success: false, message: 'Please enter Roll Number, Email, or Student ID' });
  }

  const query = `
    SELECT student_id, student_name, roll_no, branch, email
    FROM student
    WHERE email = ? OR roll_no = ? OR student_id = ?
    LIMIT 1
  `;
  
  db.query(query, [credential.trim(), credential.trim(), credential.trim()], (err, results) => {
    if (err) {
      console.error('Login query error:', err);
      return res.status(500).json({ success: false, message: 'Database error during login' });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Student account not found with the provided credential' });
    }
    res.json({ success: true, student: results[0] });
  });
});

// 2. Student Registration (register.html)
app.post('/api/student/register', (req, res) => {
  const { student_name, roll_no, branch, email } = req.body;

  if (!student_name || !roll_no || !branch || !email) {
    return res.status(400).json({ success: false, message: 'All fields (Name, Roll No, Branch, Email) are required' });
  }

  // Check if roll_no or email already exists
  const checkSql = 'SELECT student_id FROM student WHERE roll_no = ? OR email = ? LIMIT 1';
  db.query(checkSql, [roll_no.trim(), email.trim()], (err, existing) => {
    if (err) {
      console.error('Check error:', err);
      return res.status(500).json({ success: false, message: 'Database error during registration check' });
    }
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'A student with this Roll Number or Email already exists!' });
    }

    // Insert new student
    const insertSql = `
      INSERT INTO student (student_name, roll_no, branch, email)
      VALUES (?, ?, ?, ?)
    `;
    db.query(insertSql, [student_name.trim(), roll_no.trim(), branch.trim(), email.trim()], (err, result) => {
      if (err) {
        console.error('Insert student error:', err);
        return res.status(500).json({ success: false, message: 'Failed to create student account: ' + err.message });
      }

      const newStudentId = result.insertId;
      const newStudent = {
        student_id: newStudentId,
        student_name: student_name.trim(),
        roll_no: roll_no.trim(),
        branch: branch.trim(),
        email: email.trim()
      };

      res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        student: newStudent
      });
    });
  });
});

// 3. Get Student Details by ID (profile.html & dashboard.html)
app.get('/api/student/:id', (req, res) => {
  const studentId = req.params.id;
  const sql = 'SELECT student_id, student_name, roll_no, branch, email FROM student WHERE student_id = ?';
  db.query(sql, [studentId], (err, results) => {
    if (err) {
      console.error('Fetch student error:', err);
      return res.status(500).json({ success: false, message: 'Database query error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, student: results[0] });
  });
});

// 4. Update Student Details (profile.html)
app.put('/api/student/:id', (req, res) => {
  const studentId = req.params.id;
  const { student_name, roll_no, branch, email } = req.body;

  if (!student_name || !roll_no || !branch || !email) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const sql = `
    UPDATE student 
    SET student_name = ?, roll_no = ?, branch = ?, email = ?
    WHERE student_id = ?
  `;
  db.query(sql, [student_name.trim(), roll_no.trim(), branch.trim(), email.trim(), studentId], (err, result) => {
    if (err) {
      console.error('Update student error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update student profile: ' + err.message });
    }
    res.json({
      success: true,
      message: 'Profile updated successfully!',
      student: {
        student_id: parseInt(studentId, 10),
        student_name: student_name.trim(),
        roll_no: roll_no.trim(),
        branch: branch.trim(),
        email: email.trim()
      }
    });
  });
});

// 5. Get All Courses (with optional department, semester, and search filters) (courses.html)
app.get('/api/courses', (req, res) => {
  const { department, semester, search, student_id } = req.query;

  let sql = 'SELECT * FROM courses WHERE 1=1';
  const params = [];

  if (department && department !== 'All') {
    sql += ' AND department = ?';
    params.push(department);
  }

  if (semester && semester !== 'All') {
    sql += ' AND semester = ?';
    params.push(parseInt(semester, 10));
  }

  if (search) {
    sql += ' AND (course_name LIKE ? OR course_code LIKE ? OR department LIKE ?)';
    const searchWildcard = `%${search}%`;
    params.push(searchWildcard, searchWildcard, searchWildcard);
  }

  sql += ' ORDER BY semester ASC, course_code ASC';

  db.query(sql, params, (err, courses) => {
    if (err) {
      console.error('Fetch courses error:', err);
      return res.status(500).json({ success: false, message: 'Database error fetching courses' });
    }

    // If student_id provided, annotate with registered status
    if (student_id) {
      const regSql = 'SELECT course_id, status, registration_id FROM registrations WHERE student_id = ?';
      db.query(regSql, [student_id], (err2, regRows) => {
        if (err2) {
          return res.json({ success: true, courses });
        }
        const regMap = {};
        regRows.forEach(r => {
          regMap[r.course_id] = { status: r.status, registration_id: r.registration_id };
        });

        const annotated = courses.map(c => ({
          ...c,
          is_registered: !!regMap[c.course_id],
          registration_status: regMap[c.course_id]?.status || null,
          registration_id: regMap[c.course_id]?.registration_id || null
        }));

        res.json({ success: true, courses: annotated });
      });
    } else {
      res.json({ success: true, courses });
    }
  });
});

// 6. Get Single Course Details by ID or Course Code (course-details.html)
app.get('/api/courses/:id', (req, res) => {
  const identifier = req.params.id;
  const studentId = req.query.student_id;

  const sql = 'SELECT * FROM courses WHERE course_id = ? OR course_code = ? LIMIT 1';
  db.query(sql, [identifier, identifier], (err, results) => {
    if (err) {
      console.error('Fetch course error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const course = results[0];

    // Check student registration status for this course
    if (studentId) {
      const regSql = 'SELECT registration_id, registration_date, status FROM registrations WHERE student_id = ? AND course_id = ? LIMIT 1';
      db.query(regSql, [studentId, course.course_id], (err2, regRows) => {
        if (err2 || regRows.length === 0) {
          course.is_registered = false;
          course.registration_details = null;
        } else {
          course.is_registered = true;
          course.registration_details = regRows[0];
        }
        res.json({ success: true, course });
      });
    } else {
      course.is_registered = false;
      res.json({ success: true, course });
    }
  });
});

// 7. Get Registered Courses for a Student (my-courses.html & dashboard.html)
app.get('/api/registrations/:studentId', (req, res) => {
  const studentId = req.params.studentId;

  const sql = `
    SELECT 
      r.registration_id,
      r.student_id,
      r.course_id,
      DATE_FORMAT(r.registration_date, '%Y-%m-%d') AS registration_date,
      r.status,
      c.course_code,
      c.course_name,
      c.credits,
      c.department,
      c.semester
    FROM registrations r
    JOIN courses c ON r.course_id = c.course_id
    WHERE r.student_id = ?
    ORDER BY r.registration_id DESC
  `;

  db.query(sql, [studentId], (err, rows) => {
    if (err) {
      console.error('Fetch student registrations error:', err);
      return res.status(500).json({ success: false, message: 'Database error fetching registrations' });
    }
    res.json({ success: true, registrations: rows });
  });
});

// 8. Register for Course(s) (registration.html)
app.post('/api/register-course', (req, res) => {
  const { student_id, course_ids } = req.body;

  if (!student_id || !course_ids) {
    return res.status(400).json({ success: false, message: 'Student ID and Course ID(s) are required' });
  }

  const idsToRegister = Array.isArray(course_ids) ? course_ids : [course_ids];
  if (idsToRegister.length === 0) {
    return res.status(400).json({ success: false, message: 'Please select at least one course' });
  }

  // Check which courses are already registered
  const checkSql = 'SELECT course_id FROM registrations WHERE student_id = ? AND course_id IN (?)';
  db.query(checkSql, [student_id, idsToRegister], (err, existing) => {
    if (err) {
      console.error('Registration check error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    const existingIds = existing.map(e => e.course_id);
    const newCourseIds = idsToRegister.filter(id => !existingIds.includes(parseInt(id, 10)));

    if (newCourseIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'All selected courses are already registered by you!' 
      });
    }

    // Insert all new registrations
    const insertValues = newCourseIds.map(cid => [
      student_id,
      cid,
      new Date().toISOString().slice(0, 10),
      'Registered'
    ]);

    const insertSql = 'INSERT INTO registrations (student_id, course_id, registration_date, status) VALUES ?';
    db.query(insertSql, [insertValues], (err, insertResult) => {
      if (err) {
        console.error('Course registration error:', err);
        return res.status(500).json({ success: false, message: 'Failed to complete registration: ' + err.message });
      }

      res.status(201).json({
        success: true,
        message: `Successfully registered for ${newCourseIds.length} course(s)!`,
        registeredCount: newCourseIds.length,
        skippedCount: existingIds.length
      });
    });
  });
});

// 9. Drop/Unregister Course (my-courses.html)
app.delete('/api/drop-course/:registrationId', (req, res) => {
  const regId = req.params.registrationId;
  const sql = 'DELETE FROM registrations WHERE registration_id = ?';
  db.query(sql, [regId], (err, result) => {
    if (err) {
      console.error('Drop course error:', err);
      return res.status(500).json({ success: false, message: 'Failed to drop course' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Registration record not found' });
    }
    res.json({ success: true, message: 'Course successfully dropped!' });
  });
});

// 10. Dashboard Stats (dashboard.html)
app.get('/api/stats/:studentId', (req, res) => {
  const studentId = req.params.studentId;

  const statsQuery = `
    SELECT 
      COUNT(r.registration_id) AS total_registered,
      COALESCE(SUM(c.credits), 0) AS total_credits,
      (SELECT COUNT(*) FROM courses) AS total_available_courses
    FROM registrations r
    JOIN courses c ON r.course_id = c.course_id
    WHERE r.student_id = ? AND r.status = 'Registered'
  `;

  db.query(statsQuery, [studentId], (err, statsResult) => {
    if (err) {
      console.error('Stats query error:', err);
      return res.status(500).json({ success: false, message: 'Database error fetching stats' });
    }

    res.json({
      success: true,
      stats: {
        totalRegistered: statsResult[0]?.total_registered || 0,
        totalCredits: statsResult[0]?.total_credits || 0,
        totalAvailable: statsResult[0]?.total_available_courses || 0
      }
    });
  });
});

// 11. List all demo students for quick switching/testing
app.get('/api/students/list', (req, res) => {
  db.query('SELECT student_id, student_name, roll_no, branch, email FROM student ORDER BY student_id ASC', (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, students: rows });
  });
});

// ---------------------- FRONTEND ROUTE HANDLERS ---------------------- //
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🎓 Student Course Registration Website is Live!`);
  console.log(`🚀 Access at: http://localhost:${PORT}`);
  console.log(`💾 Connected to MySQL Database: website (root:root)`);
  console.log(`=======================================================`);
});
