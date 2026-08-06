const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');


// show login page
router.get('/login', (req, res) => {
    if (req.session.user) {
        if (req.session.user.role === 'admin') {
            return res.redirect('/admin');
        }
        return res.redirect('/');
    }
    
    res.render('login', {
        title: 'Login',
        layout: false,
        error: null,
        success: null
    });
});

// process login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findByEmailWithPassword(email);

        // check if user exists
        if (!user) {
            return res.render('login', {
                title: 'Login',
                layout: false,
                error: 'Invalid email or password.',
                success: null,
                formData: req.body
            });
        }

        // check hashed password
        const isValid = await user.comparePassword(password);

        if (!isValid) {
            // audit log
            await AuditLog.create({
                username: user.email,
                role: user.role,
                activity: "User Login - FAILED",
                resource: "unknown"
            });

            return res.render('login', {
                title: 'Login',
                layout: false,
                error: 'Invalid email or password.',
                success: null,
                formData: req.body
            });
        }

        // update last_login
        user.last_login = new Date();
        await user.save();

        // save user to session
        req.session.user = {
            _id: user._id,
            email: user.email,
            role: user.role
        };

        console.log("Session saved:", req.session.user);

        console.log('User logged in:', user.email);
        console.log('Role:', user.role);

        // audit log
        await AuditLog.create({
            username: user.email,
            role: user.role,
            activity: "User Login - SUCCESS",
            resource: user.email
        });

        // redirect based on role
        if (user.role === 'admin') {
            return res.redirect('/admin-dashboard');
        } else {
            return res.redirect('/');
        }

    } catch (error) {
        console.error('Login error:', error);
        res.render('login', {
            title: 'Login',
            layout: false,
            error: 'Error logging in. Please try again.',
            success: null,
            formData: req.body
        });
    }
});

// logout route
router.get('/logout', async (req, res) => {

    const user = req.session.user;

    // audit log
    await AuditLog.create({
        username: user.email,
        role: user.role,
        activity: "User Logout",
        resource: user.email
    });

    req.session.destroy((err) => {

        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/login');
    });
});

module.exports = router;