-- ===================================================
-- MySQL Database Setup Script for Student Course Registration
-- Database Name: website
-- Username: root
-- Password: root
-- ===================================================

CREATE DATABASE IF NOT EXISTS website;
USE website;

-- 1. Student Table
CREATE TABLE IF NOT EXISTS student (
  student_id INT NOT NULL AUTO_INCREMENT,
  student_name VARCHAR(100) DEFAULT NULL,
  roll_no VARCHAR(30) NOT NULL,
  branch VARCHAR(50) DEFAULT NULL,
  email VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Courses Table
CREATE TABLE IF NOT EXISTS courses (
  course_id INT NOT NULL AUTO_INCREMENT,
  course_code VARCHAR(20) DEFAULT NULL,
  course_name VARCHAR(100) DEFAULT NULL,
  credits INT DEFAULT NULL,
  department VARCHAR(50) DEFAULT NULL,
  semester INT DEFAULT NULL,
  PRIMARY KEY (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Registrations Table
CREATE TABLE IF NOT EXISTS registrations (
  registration_id INT NOT NULL AUTO_INCREMENT,
  student_id INT DEFAULT NULL,
  course_id INT DEFAULT NULL,
  registration_date DATE DEFAULT NULL,
  status VARCHAR(45) DEFAULT NULL,
  PRIMARY KEY (registration_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample Courses Data
INSERT IGNORE INTO courses (course_id, course_code, course_name, credits, department, semester) VALUES
(1, 'C23001', 'DBMS', 3, 'CSE', 5),
(2, 'C56210', 'OS', 2, 'CSE-AI', 6),
(3, 'C29832', 'AI', 4, 'ECE', 4),
(4, 'C47652', 'Machine Learning', 3, 'EEE', 7),
(5, 'C10902', 'FSD', 2, 'Mechanical', 6),
(6, 'C30391', 'Data Science', 3, 'Civil', 4);

-- Sample Students Data
INSERT IGNORE INTO student (student_id, student_name, roll_no, branch, email) VALUES
(100, 'Srujal', '23CSE100', 'CSE', 'srujal@gmail.com'),
(101, 'Sai Bhargav', '23AI101', 'CSE-AI', 'bhargav@gmail.com'),
(102, 'Rakesh', '23ECE102', 'ECE', 'rakesh@gmail.com'),
(103, 'Eswar', '23EEE103', 'EEE', 'eswar@gmail.com'),
(104, 'Ravi', '23ME104', 'Mechanical', 'ravi@gmail.com'),
(105, 'Gnaneshwar', '23CE105', 'Civil', 'gnaneshwar@gmail.com');

-- Sample Initial Registrations
INSERT IGNORE INTO registrations (registration_id, student_id, course_id, registration_date, status) VALUES
(1, 100, 1, '2026-10-14', 'Registered'),
(2, 101, 2, '2026-10-12', 'Registered'),
(3, 102, 3, '2026-10-10', 'Registered'),
(4, 103, 4, '2026-10-20', 'Not Registered'),
(5, 104, 5, '2026-10-05', 'Not Registered'),
(6, 105, 6, '2026-09-29', 'Registered');
