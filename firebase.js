// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendEmailVerification,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBUoNm0UQOSKm0_s8k_uarYYn5nnbvASs8",
    authDomain: "srishtiwebapp.firebaseapp.com",
    projectId: "srishtiwebapp",
    storageBucket: "srishtiwebapp.firebasestorage.app",
    messagingSenderId: "662576698314",
    appId: "1:662576698314:web:f9c85e13fc20bf5d283533",
    measurementId: "G-9WGLWDQ59S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const loginMessage = document.getElementById('login-message');
const registerMessage = document.getElementById('register-message');

// Function to show message
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            element.classList.remove('success');
            element.style.display = 'none';
        }, 5000);
    }
}

// Function to show loading state
function setLoading(button, isLoading) {
    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');
    
    if (isLoading) {
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');
        button.disabled = true;
    } else {
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
        button.disabled = false;
    }
}

// Function to validate registration form
function validateRegistrationForm() {
    const fullName = document.getElementById('full-name').value.trim();
    const classYear = document.getElementById('class-year').value;
    const degreeName = document.getElementById('degree-name').value;
    const department = document.getElementById('department').value;
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const rollNumber = document.getElementById('roll-number').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Check for empty fields
    if (!fullName || !classYear || !degreeName || !department || !email || !phone || !rollNumber || !password || !confirmPassword) {
        showMessage(registerMessage, 'All fields are required!', 'error');
        return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage(registerMessage, 'Please enter a valid email address!', 'error');
        return false;
    }
    
    // Validate phone number (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
        showMessage(registerMessage, 'Phone number must be 10 digits!', 'error');
        return false;
    }
    
    // Check password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
        showMessage(registerMessage, 'Password must be at least 8 characters with uppercase, lowercase, and a number!', 'error');
        return false;
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
        showMessage(registerMessage, 'Passwords do not match!', 'error');
        return false;
    }
    
    return true;
}

// Registration form submit handler
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateRegistrationForm()) {
        return;
    }
    
    // Get form values
    const fullName = document.getElementById('full-name').value.trim();
    const classYear = document.getElementById('class-year').value;
    const degreeName = document.getElementById('degree-name').value;
    const department = document.getElementById('department').value;
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const rollNumber = document.getElementById('roll-number').value.trim();
    const password = document.getElementById('password').value;
    
    try {
        // Show loading state
        setLoading(registerBtn, true);
        
        // Create user with Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Send email verification
        await sendEmailVerification(user);
        
        // Prepare user data for Firestore
        const userData = {
            fullName: fullName,
            classYear: classYear,
            degreeName: degreeName,
            department: department,
            email: email,
            phone: phone,
            rollNumber: rollNumber,
            uid: user.uid,
            emailVerified: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Save user data to Firestore
        await setDoc(doc(db, "users", user.uid), userData);
        
        // Show success message
        showMessage(registerMessage, 'Registration successful! Please check your email for verification link.', 'success');
        
        // Reset form
        registerForm.reset();
        
        // Show success modal
        document.getElementById('success-modal').classList.remove('hidden');
        
    } catch (error) {
        console.error('Registration error:', error);
        
        // Show appropriate error message
        let errorMessage = 'Registration failed. Please try again.';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Email already in use. Please try another email.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak. Please use a stronger password.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your internet connection.';
                break;
        }
        
        showMessage(registerMessage, errorMessage, 'error');
    } finally {
        // Hide loading state
        setLoading(registerBtn, false);
    }
});

// Login form submit handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showMessage(loginMessage, 'Please enter email and password!', 'error');
        return;
    }

    try {
        setLoading(loginBtn, true);

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // ❗ Email verification check
        if (!user.emailVerified) {
            showMessage(loginMessage, 'Please verify your email before logging in.', 'error');
            setLoading(loginBtn, false);
            return;
        }

        // ✅ SUCCESS → REDIRECT
        showMessage(loginMessage, 'Login successful! Redirecting...', 'success');

        setTimeout(() => {
            window.location.href = 'lijhgfdxfghbghjuygh.html';
        }, 1200);

    } catch (error) {
        console.error('Login error:', error);
        showMessage(loginMessage, 'Invalid email or password.', 'error');
    } finally {
        setLoading(loginBtn, false);
    }
});


// Protect dashboard and enforce email verification
onAuthStateChanged(auth, (user) => {
    if (window.location.pathname.includes("lijhgfdxfghbghjuygh.html")) {
        if (!user) {
            // Not logged in
            window.location.href = "sjniusghcvbiasoijhjg.html";
        } else if (!user.emailVerified) {
            // Logged in but email not verified
            alert("Please verify your email before accessing the dashboard.");
            window.location.href = "sjniusghcvbiasoijhjg.html";
        }
        // else: user is logged in and verified → allow access
    }
});


// Export Firebase services for use in other modules if needed
export { auth, db };
