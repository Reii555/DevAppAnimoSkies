const express = require('express');
const session = require('express-session');
const exphbs = require('express-handlebars');
const path = require('path');
const connectDB = require('./config/database');

// MODELS
const User = require('./models/User');
const Passenger = require('./models/Passenger');
const Reservation = require('./models/Reservation');
const Flight = require('./models/Flight');
const Seat = require('./models/Seat');
const Meal = require('./models/Meal');
const ExtraService = require('./models/ExtraService');
const AuditLog = require('./models/AuditLog');


// Load environment variables
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// DATABASE CONNECTION
connectDB();

// MIDDLEWARE
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// EXPRESS SESSION - ENABLED
app.use(session({
    secret: process.env.SESSION_SECRET || 'mysecretkey',
    resave: false,
    saveUninitialized: false
}));

app.use((req, res, next) => {
    res.locals.user = req.session?.user || null;
    next();
});

// HANDLEBARS VIEW ENGINE WITH HELPERS
const hbs = exphbs.create({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    },
    helpers: {
        formatDate: function(date) {
            if (!date) {
                return 'N/A';
            }
            const d = new Date(date);
            if (isNaN(d.getTime())) {
                return 'N/A';
            }
            return d.toLocaleDateString('en-PH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'Asia/Manila'
            });
        },
        formatDateInput: function(date) {
            if (!date) {
                return '';
            }
            const d = new Date(date);
            if (isNaN(d.getTime())) {
                return '';
            }
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return year + '-' + month + '-' + day;
        },
        eq: function(a, b) {
            return a === b;
        },
        or: function(a, b) {
            return a || b;
        },
        formatTime: function(date) {
            if (!date) {
                return 'N/A';
            }
            const d = new Date(date);
            if (isNaN(d.getTime())) {
                return 'N/A';
            }
            return d.toLocaleTimeString('en-PH', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Manila'
            });
        },
        formatCurrency: function(amount) {
            if (!amount && amount !== 0) {
                return '₱0.00';
            }
            return '₱' + parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        },
        inc: function(value) {
            return parseInt(value) + 1;
        },
        dec: function(value) {
            return parseInt(value) - 1;
        }
    }
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// ROUTES
const searchRoutes = require('./routes/searchRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminFlightRoutes = require('./routes/admin-flights-routes');
const adminDashboardRoutes = require('./routes/admin-dashboard-routes');
const profileRoutes = require('./routes/profileRoutes');
const loginRoutes = require('./routes/login-routes');
const registerRoutes = require('./routes/register-routes');
const reservationRoutes = require('./routes/reservationRoutes');
const adminUsersRoutes = require('./routes/admin-users-routes');
const adminReservationsRoutes = require('./routes/admin-reservations-routes');
const homeRoutes = require('./routes/homeRoutes');
const adminRoutes = require('./routes/admin-audits-routes');

app.use('/', loginRoutes);
app.use('/', registerRoutes);
app.use('/search', searchRoutes);
app.use('/booking', bookingRoutes);
app.use('/profile', profileRoutes);
app.use('/reservations', reservationRoutes);
app.use('/admin-dashboard', adminDashboardRoutes);
app.use('/admin-flights', adminFlightRoutes);
app.use('/admin-users', adminUsersRoutes);
app.use('/admin-reservations', adminReservationsRoutes);
app.use('/', homeRoutes);
app.use('/admin-audit', adminRoutes);


// REGISTER ROUTES
app.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('register', { title: 'Sign Up' });
});

app.post('/register', async (req, res) => {
    try {
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.send('Email already registered. Please login using a new email.');
        }

        const user = new User({
            email: req.body.email,
            phone: req.body.phone,
            password: req.body.password,
            role: 'passenger',
            status: 'active'
        });

        await user.save();
        console.log('User created:', user.email);
        res.redirect('/login');
    } catch (error) {
        console.error('Register error:', error);
        res.send('Error creating account. Please try again.');
    }
});

// DASHBOARD ROUTE
app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    res.render('dashboard', {
        title: 'Dashboard',
        user: req.session.user
    });
});

// START SERVER
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});