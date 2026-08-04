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



// Home Page
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'Home',
        loggedIn: req.session.user ? true : false
    });
});

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
            role: 'customer',
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

app.get('/customer', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    if (req.session.user.role !== 'customer') {
        return res.send('Access Denied. Customers only.');
    }

    res.render('customer', {
        title: 'Customer Dashboard',
        user: req.session.user
    });
});

// START SERVER
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ============================================================
// SAMPLE DATA 
// ============================================================
(async () => {
    try {
        console.log('=== STARTING SAMPLE DATA CREATION ===');

        await Reservation.deleteMany({});
        console.log('Deleted existing reservations');

        // Create or get User
        let testUser = await User.findOne({ email: 'reina.lagos@hotmail.com' });
        
        if (!testUser) {
            testUser = new User({
                email: 'reina.lagos@hotmail.com',
                phone: '+639988776655',
                password: 'password123',
                role: 'customer',
                status: 'active',
                last_login: new Date('2026-07-12')
            });
            await testUser.save();
            console.log('User created:', testUser.email);
        } else {
            console.log('User already exists:', testUser.email);
        }

        let adminUser = await User.findOne({ email: 'admin@animoskies.com' });

        if (!adminUser) {
            adminUser = new User({
                email: 'test@admin.com',
                phone: '+639123456789',
                password: 'admin123',
                role: 'admin',
                status: 'active',
                created_at: new Date()
            });
            await adminUser.save();
            console.log('Admin user created:', adminUser.email);
            console.log('   Email: test@admin.com');
            console.log('   Password: admin123');
        } else {
            console.log('Admin user already exists:', adminUser.email);
        }

        //  Create or get Passenger
        let passenger = await Passenger.findOne({ user_id: testUser._id });
        
        if (!passenger) {
            passenger = new Passenger({
                user_id: testUser._id,
                full_name: 'Reina Lagos',
                contact_num: '+639988776655',
                passport_num: 'A12345678',
                nationality: 'Filipino',
                birth_date: new Date('1992-03-15'),
                gender: 'Female',
                type: 'Adult',
                emergency_contact: 'Mama Lagos'
            });
            await passenger.save();
            console.log('Passenger created with ID:', passenger._id);
        } else {
            console.log('Passenger already exists with ID:', passenger._id);
        }

        // Create Meals
        const mealCount = await Meal.countDocuments();
        if (mealCount === 0) {
            const meals = [
                { meal_name: 'Standard', description: 'Classic in-flight meal: Chicken or Pasta with Salad.', additional_price: 0 },
                { meal_name: 'Vegetarian', description: 'Fresh stir-fry vegetables with quinoa & green salad.', additional_price: 500 },
                { meal_name: 'Vegan', description: 'Plant-based protein bowl, roasted veggies, dairy-free.', additional_price: 700 },
                { meal_name: 'Halal', description: 'Certified Halal chicken with saffron rice.', additional_price: 1000 },
                { meal_name: 'Kosher', description: 'Glatt Kosher meal, pre-packaged under supervision.', additional_price: 1200 },
                { meal_name: 'Gluten Free', description: 'Gluten-free pasta, fresh vegetables, GF dessert.', additional_price: 1500 }
            ];
            for (let mealData of meals) {
                await new Meal(mealData).save();
            }
            console.log('Meals created');
        } else {
            console.log('Meals already exist');
        }

        // Create Extra Services
        const serviceCount = await ExtraService.countDocuments();
        if (serviceCount === 0) {
            const services = [
                { service_name: 'Checked-in Baggage', description: 'Add one checked-in baggage to your reservation.', price: 600 },
                { service_name: 'Carry-on Baggage', description: 'Additional carry-on baggage allowance.', price: 300 },
                { service_name: 'Priority Boarding', description: 'Board the aircraft earlier for a more convenient experience.', price: 500 },
                { service_name: 'Travel Insurance', description: 'Provides coverage for unexpected travel-related emergencies.', price: 700 },
                { service_name: 'Lounge Access', description: 'Enjoy airport lounge facilities before your flight.', price: 1000 }
            ];
            for (let serviceData of services) {
                await new ExtraService(serviceData).save();
            }
            console.log('Extra Services created');
        } else {
            console.log('Extra Services already exist');
        }

        // Create Flights
        let flight1, flight2, flight3;
        const flightCount = await Flight.countDocuments();
        
        if (flightCount === 0) {
            flight1 = new Flight({
                flight_number: 'AS1001',
                airline: 'Philippine Airlines',
                cabinClass: 'Economy',
                origin: 'Manila (MNL)',
                destination: 'Cebu (CEB)',
                departureTime: new Date('2026-07-20T08:00:00'),
                arrivalTime: new Date('2026-07-20T09:30:00'),
                duration: '1h 30m',
                tripType: 'One-way',
                layoversCount: 0,
                layoverDetails: 'Direct Flight',
                checkedIn: 15,
                carryOn: 6,
                basePrice: 3000,
                availableSeats: 40,
                status: 'Upcoming',
                airlineLogo: null
            });

            flight2 = new Flight({
                flight_number: 'AS1002',
                airline: 'Cebu Pacific',
                cabinClass: 'Economy',
                origin: 'Cebu (CEB)',
                destination: 'Davao (DVO)',
                departureTime: new Date('2026-07-21T13:15:00'),
                arrivalTime: new Date('2026-07-21T14:40:00'),
                duration: '1h 25m',
                tripType: 'One-way',
                layoversCount: 0,
                layoverDetails: 'Direct Flight',
                checkedIn: 20,
                carryOn: 7,
                basePrice: 2800,
                availableSeats: 40,
                status: 'Upcoming',
                airlineLogo: null
            });

            flight3 = new Flight({
                flight_number: 'AS1003',
                airline: 'AirAsia',
                cabinClass: 'Premium Economy',
                origin: 'Manila (MNL)',
                destination: 'Puerto Princesa (PPS)',
                departureTime: new Date('2026-07-22T06:45:00'),
                arrivalTime: new Date('2026-07-22T08:10:00'),
                duration: '1h 25m',
                tripType: 'Round-trip',
                returnDate: new Date('2026-07-26T18:30:00'),
                layoversCount: 0,
                layoverDetails: 'Direct Flight',
                checkedIn: 20,
                carryOn: 7,
                basePrice: 3300,
                availableSeats: 40,
                status: 'Upcoming',
                airlineLogo: null
            });

            await flight1.save();
            await flight2.save();
            await flight3.save();
            console.log('Flights created');
        } else {
            const flights = await Flight.find({});
            flight1 = flights[0];
            flight2 = flights[1] || flights[0];
            flight3 = flights[2] || flights[0];
            console.log('Flights already exist');
        }

        // Create Seats
        const seatCount = await Seat.countDocuments();
        if (seatCount === 0) {
            const flights = await Flight.find({});
            for (let flight of flights) {
                const seats = [];
                const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
                for (let row = 1; row <= 10; row++) {
                    for (let letter of letters) {
                        seats.push({
                            flight_id: flight._id,
                            seatNumber: row + letter,
                            status: 'Unoccupied'
                        });
                    }
                }
                if (seats.length > 0) {
                    seats[1].status = 'Occupied';
                    seats[5].status = 'Occupied';
                    seats[10].status = 'Occupied';
                }
                await Seat.insertMany(seats);
            }
            console.log('Seats created');
        } else {
            console.log('Seats already exist');
        }

        // Create Reservations
        const lastReservation = await Reservation.findOne({}, {}, { sort: { 'reservation_id': -1 } });
        let nextId = 1000;
        if (lastReservation) {
            nextId = lastReservation.reservation_id + 1;
        }

        const passengerId = passenger._id;
        console.log('Using passengerId:', passengerId);

        const reservationData = [
            {
                reservation_id: nextId,
                userId: testUser._id,
                flightId: flight1._id,
                passengerId: passengerId,
                seatNumber: '12A',
                mealPreference: 'Vegetarian',
                mealPrice: 150,
                extraServices: {
                    checkedBaggage: 0,
                    carryOn: 0,
                    priorityBoarding: false,
                    travelInsurance: false,
                    loungeAccess: false
                },
                extraServicesPrice: 0,
                booking_ref: 'BK20260720',
                trip_type: 'oneway',
                status: 'Confirmed',
                total_price: 3150,
                booking_date: new Date('2026-07-10T10:30:00'),
                specialRequests: 'Window seat preferred'
            },
            {
                reservation_id: nextId + 1,
                userId: testUser._id,
                flightId: flight2._id,
                passengerId: passengerId,
                seatNumber: '7C',
                mealPreference: 'Standard',
                mealPrice: 0,
                extraServices: {
                    checkedBaggage: 1,
                    carryOn: 0,
                    priorityBoarding: true,
                    travelInsurance: false,
                    loungeAccess: false
                },
                extraServicesPrice: 500,
                booking_ref: 'BK20260721',
                trip_type: 'oneway',
                status: 'Pending',
                total_price: 3300,
                booking_date: new Date('2026-07-11T14:20:00'),
                specialRequests: ''
            },
            {
                reservation_id: nextId + 2,
                userId: testUser._id,
                flightId: flight3._id,
                passengerId: passengerId,
                seatNumber: '3F',
                mealPreference: 'Halal',
                mealPrice: 300,
                extraServices: {
                    checkedBaggage: 2,
                    carryOn: 1,
                    priorityBoarding: true,
                    travelInsurance: true,
                    loungeAccess: true
                },
                extraServicesPrice: 1200,
                booking_ref: 'BK20260722',
                trip_type: 'roundtrip',
                status: 'Confirmed',
                total_price: 4800,
                booking_date: new Date('2026-07-12T09:15:00'),
                specialRequests: 'Aisle seat preferred'
            },
            {
                reservation_id: nextId + 3,
                userId: testUser._id,
                flightId: flight1._id,
                passengerId: passengerId,
                seatNumber: '8B',
                mealPreference: 'Standard',
                mealPrice: 0,
                extraServices: {
                    checkedBaggage: 0,
                    carryOn: 0,
                    priorityBoarding: false,
                    travelInsurance: false,
                    loungeAccess: false
                },
                extraServicesPrice: 0,
                booking_ref: 'BK20260715',
                trip_type: 'oneway',
                status: 'Completed',
                total_price: 3000,
                booking_date: new Date('2026-07-01T16:45:00'),
                specialRequests: ''
            },
            {
                reservation_id: nextId + 4,
                userId: testUser._id,
                flightId: flight2._id,
                passengerId: passengerId,
                seatNumber: '10A',
                mealPreference: 'Vegan',
                mealPrice: 200,
                extraServices: {
                    checkedBaggage: 0,
                    carryOn: 1,
                    priorityBoarding: false,
                    travelInsurance: false,
                    loungeAccess: false
                },
                extraServicesPrice: 200,
                booking_ref: 'BK20260716',
                trip_type: 'oneway',
                status: 'Cancelled',
                total_price: 3200,
                booking_date: new Date('2026-07-02T11:00:00'),
                specialRequests: ''
            }
        ];

        // Delete existing reservations first
        await Reservation.deleteMany({});
        console.log('Deleted old reservations');

        for (let data of reservationData) {
            const reservation = new Reservation(data);
            await reservation.save();
        }
        
        console.log('Reservations created with passengerId:', passengerId);

        // Update available seats
        await Flight.findByIdAndUpdate(flight1._id, { $inc: { availableSeats: -3 } });
        await Flight.findByIdAndUpdate(flight2._id, { $inc: { availableSeats: -2 } });
        await Flight.findByIdAndUpdate(flight3._id, { $inc: { availableSeats: -1 } });
        console.log('Updated available seats');

        const verifyReservations = await Reservation.find({}).populate('passengerId');
        console.log('=== VERIFICATION ===');
        for (let r of verifyReservations) {
            console.log('Reservation:', r.booking_ref, 'Passenger:', r.passengerId ? r.passengerId.full_name : 'NULL');
        }

        console.log('=== SAMPLE DATA CREATION COMPLETE ===');

    } catch (err) {
        console.log('Error creating sample data:', err.message);
        console.log('Stack trace:', err.stack);
    }
})();