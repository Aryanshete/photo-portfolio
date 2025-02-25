document.addEventListener('DOMContentLoaded', () => {
    // Form Elements
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const userDashboard = document.getElementById('user-dashboard');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const logoutBtn = document.getElementById('logout-btn');

    // Password Toggle Buttons
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    
    // Password Requirements Elements
    const passwordInput = document.getElementById('register-password');
    const lengthCheck = document.getElementById('length-check');
    const uppercaseCheck = document.getElementById('uppercase-check');
    const numberCheck = document.getElementById('number-check');
    const specialCheck = document.getElementById('special-check');

    // Dashboard Elements
    const menuBtns = document.querySelectorAll('.menu-btn');
    const dashboardSections = document.querySelectorAll('.dashboard-section');
    const newCollectionBtn = document.getElementById('new-collection-btn');
    const settingsForm = document.getElementById('settings-form');
    const avatarInput = document.getElementById('avatar-input');
    const previewAvatar = document.getElementById('preview-avatar');

    // Form Switching Animation
    function switchForm(currentForm, targetForm) {
        currentForm.classList.add('slide-out');
        setTimeout(() => {
            currentForm.style.display = 'none';
            currentForm.classList.remove('slide-out');
            targetForm.style.display = 'block';
            targetForm.classList.add('slide-in');
            setTimeout(() => {
                targetForm.classList.remove('slide-in');
            }, 300);
        }, 300);
    }

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchForm(loginForm, registerForm);
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchForm(registerForm, loginForm);
    });

    // Password Visibility Toggle
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            const icon = btn.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // Real-time Password Validation
    function validatePassword(password) {
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*]/.test(password)
        };

        lengthCheck.classList.toggle('valid', checks.length);
        uppercaseCheck.classList.toggle('valid', checks.uppercase);
        numberCheck.classList.toggle('valid', checks.number);
        specialCheck.classList.toggle('valid', checks.special);

        return Object.values(checks).every(check => check);
    }

    passwordInput?.addEventListener('input', (e) => {
        validatePassword(e.target.value);
    });

    // Form Submission with Loading State
    function setLoadingState(form, isLoading) {
        const button = form.querySelector('.submit-btn');
        const loader = button.querySelector('.loader');
        const span = button.querySelector('span');

        button.disabled = isLoading;
        if (isLoading) {
            loader.style.display = 'block';
            span.style.opacity = '0';
        } else {
            loader.style.display = 'none';
            span.style.opacity = '1';
        }
    }

    // Login Form Handler
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me').checked;

        try {
            setLoadingState(loginForm, true);
            const response = await fetch('/api/user/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, rememberMe })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('userToken', data.token);
                if (rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                }
                showDashboard();
                showToast('Welcome back!', 'success');
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setLoadingState(loginForm, false);
        }
    });

    // Registration Form Handler
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (!validatePassword(password)) {
            showToast('Please meet all password requirements', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        try {
            setLoadingState(registerForm, true);
            const response = await fetch('/api/user/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('userToken', data.token);
                showDashboard();
                showToast('Account created successfully!', 'success');
            } else {
                throw new Error(data.error || 'Registration failed');
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setLoadingState(registerForm, false);
        }
    });

    // Dashboard Navigation
    menuBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.id === 'logout-btn') return;

            const targetTab = btn.dataset.tab;
            menuBtns.forEach(b => b.classList.remove('active'));
            dashboardSections.forEach(s => s.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    // Settings Form Handler
    settingsForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const displayName = document.getElementById('display-name').value;
        const notifyLikes = document.getElementById('notify-likes').checked;
        const notifyComments = document.getElementById('notify-comments').checked;

        try {
            setLoadingState(settingsForm, true);
            const response = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
                },
                body: JSON.stringify({
                    displayName,
                    notifications: {
                        likes: notifyLikes,
                        comments: notifyComments
                    }
                })
            });

            if (response.ok) {
                showToast('Settings updated successfully', 'success');
            } else {
                throw new Error('Failed to update settings');
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setLoadingState(settingsForm, false);
        }
    });

    // Avatar Upload Handler
    avatarInput?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file', 'error');
            return;
        }

        // Preview image
        const reader = new FileReader();
        reader.onload = (e) => {
            previewAvatar.src = e.target.result;
        };
        reader.readAsDataURL(file);

        // Upload to server
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await fetch('/api/user/avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
                },
                body: formData
            });

            if (response.ok) {
                showToast('Profile picture updated', 'success');
            } else {
                throw new Error('Failed to update profile picture');
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    // New Collection Handler
    newCollectionBtn?.addEventListener('click', () => {
        const name = prompt('Enter collection name:');
        if (!name) return;

        createCollection(name);
    });

    async function createCollection(name) {
        try {
            const response = await fetch('/api/user/collections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
                },
                body: JSON.stringify({ name })
            });

            if (response.ok) {
                showToast('Collection created', 'success');
                loadCollections();
            } else {
                throw new Error('Failed to create collection');
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    // Logout Handler
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('rememberMe');
        showLoginForm();
        showToast('Logged out successfully', 'success');
    });

    // Toast Notification
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        const container = document.getElementById('toast-container');
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // View Management
    function showDashboard() {
        document.querySelector('.auth-container').style.display = 'none';
        userDashboard.style.display = 'block';
        loadUserData();
    }

    function showLoginForm() {
        userDashboard.style.display = 'none';
        document.querySelector('.auth-container').style.display = 'flex';
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    }

    // Load User Data
    async function loadUserData() {
        try {
            const response = await fetch('/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
                }
            });

            if (response.ok) {
                const user = await response.json();
                document.getElementById('user-name').textContent = user.name;
                document.getElementById('user-email').textContent = user.email;
                if (user.avatar) {
                    document.getElementById('user-avatar').src = user.avatar;
                }

                // Load favorites and collections
                loadFavorites();
                loadCollections();
            } else {
                throw new Error('Failed to load user data');
            }
        } catch (error) {
            showToast(error.message, 'error');
            showLoginForm();
        }
    }

    // Check Authentication Status
    const token = localStorage.getItem('userToken');
    if (token) {
        showDashboard();
    } else {
        showLoginForm();
    }
});
