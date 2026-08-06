const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// show registration page
router.get('/register', (req, res) => {
    if (req.session.user) {
        if (req.session.user.role === 'admin') {
            return res.redirect('/admin');
        }
        return res.redirect('/');
    }
    
    res.render('register', {
        title: 'Sign Up',
        layout: 'main',
        error: null,
        success: null,
        formData: {}
    });
});

router.get('/signup', (req, res) => {
    if (req.session.user) {
        if (req.session.user.role === 'admin') {
            return res.redirect('/admin');
        }
        return res.redirect('/');
    }
    
    res.render('register', {
        title: 'Sign Up',
        layout: 'main',
        error: null,
        success: null,
        formData: {}
    });
});

router.post('/signup', async (req, res) => {
    try {
        const { email, phone, password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.render('register', {
                title: 'Sign Up',
                layout: 'main',
                error: 'Passwords do not match.',
                success: null,
                formData: req.body
            });
        }

        if (password.length < 8) {
            return res.render('register', {
                title: 'Sign Up',
                layout: 'main',
                error: 'Password must be at least 8 characters.',
                success: null,
                formData: req.body
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.render('register', {
                title: 'Sign Up',
                layout: 'main',
                error: 'Email already registered. Please login.',
                success: null,
                formData: req.body
            });
        }

        const existingPhone = await User.findOne({ phone: phone.trim() });
        if (existingPhone) {
            return res.render('register', {
                title: 'Sign Up',
                layout: 'main',
                error: 'Phone number already registered.',
                success: null,
                formData: req.body
            });
        }

        const user = new User({
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            password: password,
            role: 'passenger',
            status: 'active',
            created_at: new Date()
        });

        await user.save();
        console.log('New user signed up:', user.email);

        // audit log
        await AuditLog.create({
            username: user.email,
            role: user.role,
            activity: "User Registration",
            resource: user.email,

            after: {
                email: user.email,
                phone: user.phone,
                role: user.role,
                status: user.status
            }
        });

        res.render('login', {
            title: 'Login',
            layout: false,
            success: 'Account created successfully! Please login.',
            error: null
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.render('register', {
            title: 'Sign Up',
            layout: 'main',
            error: 'Error creating account. Please try again.',
            success: null,
            formData: req.body
        });
    }
});

module.exports = router;