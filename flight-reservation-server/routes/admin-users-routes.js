// routes/admin-users-routes.js
const express = require('express');
const router = express.Router();
const User = require("../models/User");

// GET /admin/users - Render users page
router.get('/', async (req, res) => {
    try {
        res.render('admin-users', {
            title: 'Users',
            layout: 'main-admin',
            user: req.session.user || { firstName: 'Test', lastName: 'Admin' },
            activePage: 'users'
        });
    } catch (error) {
        console.error('Error loading admin-users:', error);
        res.status(500).send('Error loading users: ' + error.message);
    }
});

// GET /admin/users/api - Get users data for AJAX
router.get('/api', async (req, res) => {
    try {
        const { page = 1, limit = 5, filter = 'all', search = '' } = req.query;
        const skip = (page - 1) * limit;
        
        let query = {};
        if (filter !== 'all') {
            query.status = filter;
        }
        if (search) {
            query.email = { $regex: search, $options: 'i' };
        }
        
        const users = await User.find(query)
            .sort({ created_at: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit));
        
        const total = await User.countDocuments(query);
        
        const formattedUsers = users.map(user => ({
            id: user._id,
            name: user.email,
            email: user.email,
            phone: user.phone || 'N/A',
            created_at: user.created_at || new Date(),
            last_login: user.last_login || 'Never',
            status: user.status || 'active',
            role: user.role || 'passenger'
        }));
        
        res.json({
            users: formattedUsers,
            total: total
        });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;