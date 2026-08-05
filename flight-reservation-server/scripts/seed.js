// scripts/seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Passenger = require('../models/Passenger');
const Reservation = require('../models/Reservation');
const Flight = require('../models/Flight');
const Seat = require('../models/Seat');
const Meal = require('../models/Meal');
const ExtraService = require('../models/ExtraService');

async function seedDatabase() {
    try {
        console.log('=== STARTING DATABASE SEEDING ===');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        /*
        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Passenger.deleteMany({}),
            Reservation.deleteMany({}),
            Flight.deleteMany({}),
            Seat.deleteMany({}),
            Meal.deleteMany({}),
            ExtraService.deleteMany({})
        ]);
        console.log('Cleared existing data');
        */
       
        // Create Users
        const hashedPassword = await bcrypt.hash('password123', 10);
        const adminPassword = await bcrypt.hash('admin123', 10); 

        const testUser = new User({
            email: 'reina.lagos@hotmail.com',
            phone: '+639988776655',
            password: 'password123',
            role: 'customer',
            status: 'active',
            last_login: new Date('2026-07-12')
        });
        await testUser.save();

        const adminUser = new User({
            email: 'admin@animoskies.com',
            phone: '+639123456789',
            password: 'admin123',
            role: 'admin',
            status: 'active',
            created_at: new Date()
        });
        await adminUser.save();
        console.log('Users created');

        // Create multiple Passengers for the user
        const passengers = [
            {
                user_id: testUser._id,
                full_name: 'Reina Lagos',
                contact_num: '+639988776655',
                passport_num: 'A12345678',
                nationality: 'Filipino',
                birth_date: new Date('1992-03-15'),
                gender: 'Female',
                type: 'Adult',
                emergency_contact: 'Mama Lagos'
            },
            {
                user_id: testUser._id,
                full_name: 'Maria Santos',
                contact_num: '+639977665544',
                passport_num: 'B87654321',
                nationality: 'Filipino',
                birth_date: new Date('1988-06-20'),
                gender: 'Female',
                type: 'Adult',
                emergency_contact: 'Papa Santos'
            },
            {
                user_id: testUser._id,
                full_name: 'Juan Dela Cruz',
                contact_num: '+639955443322',
                passport_num: 'C12345678',
                nationality: 'Filipino',
                birth_date: new Date('1995-11-05'),
                gender: 'Male',
                type: 'Adult',
                emergency_contact: 'Maria Dela Cruz'
            }
        ];
        await Passenger.insertMany(passengers);
        console.log('Passengers created');

        // Create Meals
        const meals = [
            { meal_name: 'Standard', description: 'Classic in-flight meal', additional_price: 0 },
            { meal_name: 'Vegetarian', description: 'Fresh stir-fry vegetables', additional_price: 150 },
            { meal_name: 'Vegan', description: 'Plant-based protein bowl', additional_price: 200 },
            { meal_name: 'Halal', description: 'Certified Halal chicken', additional_price: 250 },
            { meal_name: 'Kosher', description: 'Glatt Kosher meal', additional_price: 300 },
            { meal_name: 'Gluten Free', description: 'Gluten-free pasta', additional_price: 200 }
        ];
        await Meal.insertMany(meals);
        console.log('Meals created');

        // Create Extra Services
        const services = [
            { service_name: 'Checked-in Baggage', description: 'Add checked-in baggage', price: 600 },
            { service_name: 'Carry-on Baggage', description: 'Additional carry-on baggage', price: 300 },
            { service_name: 'Priority Boarding', description: 'Board aircraft earlier', price: 500 },
            { service_name: 'Travel Insurance', description: 'Travel coverage', price: 700 },
            { service_name: 'Lounge Access', description: 'Airport lounge facilities', price: 1000 }
        ];
        await ExtraService.insertMany(services);
        console.log('Extra services created');

        // Create Flights
        const flights = [
            {
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
            },
            {
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
            }
        ];
        const createdFlights = await Flight.insertMany(flights);
        console.log('Flights created');

        // Create Seats
        const seats = [];
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        
        for (const flight of createdFlights) {
            for (let row = 1; row <= 10; row++) {
                for (const letter of letters) {
                    seats.push({
                        flight_id: flight._id,
                        seatNumber: row + letter,
                        status: 'Unoccupied'
                    });
                }
            }
        }
        await Seat.insertMany(seats);
        console.log('Seats created');

        // Create Reservations
        const mainPassenger = await Passenger.findOne({ user_id: testUser._id });
        
        const reservations = [
            {
                userId: testUser._id,
                flightId: createdFlights[0]._id,
                passengerId: mainPassenger._id,
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
                status: 'Confirmed',
                total_price: 3150,
                booking_date: new Date('2026-07-10T10:30:00'),
                specialRequests: 'Window seat preferred'
            },
            {
                userId: testUser._id,
                flightId: createdFlights[1]._id,
                passengerId: mainPassenger._id,
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
                status: 'Pending',
                total_price: 3300,
                booking_date: new Date('2026-07-11T14:20:00'),
                specialRequests: ''
            }
        ];
        await Reservation.insertMany(reservations);
        console.log('Reservations created');

        // Update occupied seats in Seat model
        await Seat.findOneAndUpdate(
            { flight_id: createdFlights[0]._id, seatNumber: '12A' },
            { status: 'Occupied' }
        );
        await Seat.findOneAndUpdate(
            { flight_id: createdFlights[1]._id, seatNumber: '7C' },
            { status: 'Occupied' }
        );

        console.log('=== DATABASE SEEDING COMPLETE ===');
        console.log('Test User: reina.lagos@hotmail.com / password123');
        console.log('Admin User: admin@animoskies.com / admin123');
        console.log('Added 3 passengers for dropdown testing');

        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seedDatabase();