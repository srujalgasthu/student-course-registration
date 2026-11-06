# Student Course Registration System

A responsive, complete web application for university student course registration, built with **HTML5, CSS3, JavaScript, Node.js, Express**, and connected to **MySQL Workbench** (`website` database).

---

## 📑 Required Pages

1. **`index.html`** - Welcome / Home page with feature highlights and portal overview
2. **`register.html`** - Student Account Registration (saves to MySQL `student` table)
3. **`dashboard.html`** - Student's main dashboard with registration statistics and active courses
4. **`profile.html`** - View and edit student details with live database synchronization
5. **`courses.html`** - Display all available courses with search and filters (Department, Semester)
6. **`course-details.html`** - Detailed course view with syllabus and one-click registration / drop
7. **`registration.html`** - Select courses with credit limit validation (Max 24 credits)
8. **`my-courses.html`** - View registered courses, drop courses, and print registration slip
9. **End Student Session** - Secure logout / session termination across all pages

---

## 🗄️ MySQL Database Setup

- **Database Name**: `website`
- **Username**: `root`
- **Password**: `root`

The schema script is provided in `database.sql`. You can run it directly in **MySQL Workbench** or via command line:
```bash
mysql -u root -proot < database.sql
```

---

## 🚀 How to Run

1. Open your terminal in this directory.
2. Ensure dependencies are installed (already included):
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   node server.js
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
