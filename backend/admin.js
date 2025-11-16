// DOM Elements
const loginForm = document.getElementById('login-form');
const loginContainer = document.getElementById('login-container');
const adminPanel = document.getElementById('admin-panel');
const logoutBtn = document.getElementById('logout-btn');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminDashboard = document.getElementById('adminDashboard');
const adminUsername = document.getElementById('adminUsername');
const adminPassword = document.getElementById('adminPassword');
const fileInput = document.getElementById('file-input');
const dropZone = document.querySelector('.drop-zone');

// Toast Notifications
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Toggle Password Visibility
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('adminPassword');
    const toggleBtn = document.querySelector('.toggle-password i');

    if (!passwordInput || !toggleBtn) return;

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleBtn.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// Form Validation
function validateForm() {
    let isValid = true;
    const username = adminUsername?.value.trim();
    const password = adminPassword?.value.trim();

    if (!username) {
        adminUsername?.classList.add('error');
        showToast('Please enter your username', 'error');
        isValid = false;
    }

    if (!password) {
        adminPassword?.classList.add('error');
        showToast('Please enter your password', 'error');
        isValid = false;
    }

    return isValid;
}

// Admin Login Handler
async function adminLogin() {
    if (!validateForm()) return;

    const username = adminUsername.value.trim();
    const password = adminPassword.value.trim();

    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Login failed');

        localStorage.setItem('adminToken', data.token);
        showToast('Login successful!', 'success');

        adminLoginForm.style.display = 'none';
        adminDashboard.style.display = 'block';
        loadDashboardData();
    } catch (error) {
        showToast(error.message || 'Login failed. Please try again.', 'error');
    }
}

// Admin Logout Handler
function adminLogout() {
    localStorage.removeItem('adminToken');
    adminDashboard.style.display = 'none';
    adminLoginForm.style.display = 'block';
    showToast('Logged out successfully', 'success');
}

// Show Login Form
function showLoginForm() {
    if (loginContainer) loginContainer.style.display = 'flex';
    if (adminPanel) adminPanel.style.display = 'none';
}

// Show Admin Panel
function showAdminPanel() {
    if (loginContainer) loginContainer.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'grid';
    loadDashboardData();
}

// Dashboard Data Loading
async function loadDashboardData() {
    try {
        const stats = await fetchDashboardStats();
        updateDashboardStats(stats);
    } catch (error) {
        showToast('Error loading dashboard data', 'error');
    }
}

// Mock API functions
async function fetchDashboardStats() {
    return { users: 1234, photos: 5678, likes: 10500, views: 25800 };
}

function updateDashboardStats(stats) {
    document.querySelector('[data-stat="users"] .stat-number').textContent = stats.users.toLocaleString();
    document.querySelector('[data-stat="photos"] .stat-number').textContent = stats.photos.toLocaleString();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('adminToken')) {
        showAdminPanel();
    } else {
        showLoginForm();
    }

    adminLoginForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        adminLogin();
    });

    logoutBtn?.addEventListener('click', adminLogout);

    adminUsername?.addEventListener('input', () => adminUsername.classList.remove('error'));
    adminPassword?.addEventListener('input', () => adminPassword.classList.remove('error'));
});

// File Upload
if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#3498db';
    });

    dropZone.addEventListener('dragleave', () => dropZone.style.borderColor = '#ddd');

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ddd';
        fileInput.files = e.dataTransfer.files;
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', () => handleFiles(fileInput.files));
}

// Handle File Upload
async function handleFiles(files) {
    const uploadProgress = document.getElementById('upload-progress');
    if (!uploadProgress) return;

    uploadProgress.innerHTML = '';

    for (const file of files) {
        if (!file.type.startsWith('image/')) continue;

        const formData = new FormData();
        formData.append('photo', file);
        formData.append('category', document.getElementById('category')?.value || '');

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
                body: formData
            });

            const div = document.createElement('div');
            if (response.ok) {
                div.textContent = `${file.name} uploaded successfully`;
                div.style.color = '#2ecc71';
            } else {
                throw new Error('Upload failed');
            }

            uploadProgress.appendChild(div);
        } catch (error) {
            const div = document.createElement('div');
            div.textContent = `Failed to upload ${file.name}`;
            div.style.color = '#e74c3c';
            uploadProgress.appendChild(div);
        }
    }
}
