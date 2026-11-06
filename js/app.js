/**
 * Student Course Registration System - Common Application Logic
 */

const API_BASE = ''; // Same origin

// ----------------- Session Management ----------------- //
const SessionManager = {
  KEY: 'scr_student_session',

  getStudent() {
    try {
      const data = localStorage.getItem(this.KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Session read error:', e);
    }
    // Default fallback to Srujal (student_id: 100) if no session set
    return {
      student_id: 100,
      student_name: 'Srujal',
      roll_no: '23CSE100',
      branch: 'CSE',
      email: 'srujal@gmail.com'
    };
  },

  setStudent(student) {
    localStorage.setItem(this.KEY, JSON.stringify(student));
    this.updateNavbarUI();
  },

  clearSession() {
    localStorage.removeItem(this.KEY);
    showToast('Student session ended successfully', 'info');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 600);
  },

  updateNavbarUI() {
    const student = this.getStudent();
    const nameEl = document.getElementById('navStudentName');
    const rollEl = document.getElementById('navStudentRoll');
    const avatarEl = document.getElementById('navStudentAvatar');

    if (nameEl) nameEl.textContent = student ? student.student_name : 'Guest';
    if (rollEl) rollEl.textContent = student ? (student.roll_no || student.branch) : 'Not Logged In';
    if (avatarEl) {
      avatarEl.textContent = student && student.student_name ? student.student_name.charAt(0).toUpperCase() : '?';
    }
  }
};

// ----------------- Toast Notifications ----------------- //
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ----------------- Switch / Login Modal ----------------- //
async function openSwitchStudentModal() {
  let modal = document.getElementById('switchStudentModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'switchStudentModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Student Account Login</h3>
          <button class="modal-close" onclick="closeSwitchStudentModal()">&times;</button>
        </div>
        <div style="margin-bottom: 20px;">
          <p style="color: var(--muted); font-size: 0.9rem; margin-bottom: 16px;">
            Sign in using your Roll Number, Email, or Student ID from MySQL database <code>website</code>:
          </p>
          <div class="form-group">
            <label class="form-label">Roll No / Email / Student ID</label>
            <input type="text" id="loginCredentialInput" class="form-control" placeholder="e.g. srujal@gmail.com, 100, male" />
          </div>
          <button class="btn btn-primary" style="width: 100%;" onclick="handleStudentLogin()">Sign In</button>
        </div>

        <div style="border-top: 1px solid var(--border); padding-top: 16px;">
          <div style="font-size: 0.85rem; font-weight: 600; color: var(--muted); margin-bottom: 8px;">
            Or Quick Switch to Existing MySQL Student:
          </div>
          <div id="quickStudentList" style="display: flex; flex-direction: column; gap: 8px; max-height: 180px; overflow-y: auto;">
            <div style="text-align: center; color: var(--muted); padding: 10px;">Loading student list...</div>
          </div>
        </div>

        <div style="margin-top: 20px; text-align: center; font-size: 0.9rem;">
          Don't have an account? <a href="register.html">Register here &rarr;</a>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  modal.classList.add('active');

  // Load students from DB
  try {
    const res = await fetch('/api/students/list');
    const data = await res.json();
    const listEl = document.getElementById('quickStudentList');
    if (data.success && data.students.length > 0) {
      listEl.innerHTML = data.students.map(s => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--light-bg); border-radius: var(--radius-sm); border: 1px solid var(--border);">
          <div>
            <strong>${escapeHtml(s.student_name)}</strong>
            <span style="font-size: 0.75rem; color: var(--muted);"> (${escapeHtml(s.branch)} - ID: ${s.student_id})</span>
          </div>
          <button class="btn btn-sm btn-outline" onclick="selectStudentDirectly(${s.student_id}, '${escapeHtml(s.student_name)}', '${escapeHtml(s.roll_no)}', '${escapeHtml(s.branch)}', '${escapeHtml(s.email)}')">Switch</button>
        </div>
      `).join('');
    } else {
      listEl.innerHTML = '<div style="color: var(--muted); font-size: 0.85rem;">No students found in database.</div>';
    }
  } catch (err) {
    console.error('Failed to load student list:', err);
  }
}

function closeSwitchStudentModal() {
  const modal = document.getElementById('switchStudentModal');
  if (modal) modal.classList.remove('active');
}

async function handleStudentLogin() {
  const input = document.getElementById('loginCredentialInput');
  const val = input ? input.value.trim() : '';
  if (!val) {
    showToast('Please enter your Roll Number or Email', 'error');
    return;
  }

  try {
    const res = await fetch('/api/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: val })
    });
    const data = await res.json();
    if (data.success) {
      SessionManager.setStudent(data.student);
      showToast(`Welcome back, ${data.student.student_name}!`, 'success');
      closeSwitchStudentModal();
      setTimeout(() => window.location.reload(), 400);
    } else {
      showToast(data.message || 'Login failed', 'error');
    }
  } catch (e) {
    showToast('Error connecting to server', 'error');
  }
}

function selectStudentDirectly(student_id, student_name, roll_no, branch, email) {
  SessionManager.setStudent({ student_id, student_name, roll_no, branch, email });
  showToast(`Switched student to ${student_name}`, 'success');
  closeSwitchStudentModal();
  setTimeout(() => window.location.reload(), 400);
}

// ----------------- End Student Session Modal ----------------- //
function confirmEndSession() {
  const student = SessionManager.getStudent();
  const confirmed = confirm(`Are you sure you want to end student session for ${student ? student.student_name : 'Current Student'}?`);
  if (confirmed) {
    SessionManager.clearSession();
  }
}

// ----------------- Mobile Menu Toggle ----------------- //
function toggleMobileMenu() {
  const nav = document.querySelector('.nav-links');
  if (nav) nav.classList.toggle('open');
}

// ----------------- HTML Escape Helper ----------------- //
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  SessionManager.updateNavbarUI();
});
