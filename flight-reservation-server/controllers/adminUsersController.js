const User = require("../models/User");

exports.renderPage = async (req, res) => {
    try {
        res.render('admin-users', {
            title: 'Users',
            layout: 'main-admin',
            user: req.session.user,
            activePage: 'users'
        });
    } catch (error) {
        console.error('Error loading admin-users:', error);
        res.status(500).send('Error loading users: ' + error.message);
    }
};

exports.getUsers = async (req, res) => {
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
};