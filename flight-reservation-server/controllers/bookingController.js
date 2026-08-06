const Flight = require('../models/Flight');
const Passenger = require('../models/Passenger');
const Seat = require("../models/Seat");
const Meal = require("../models/Meal");
const Reservation = require("../models/Reservation");
const AuditLog = require("../models/AuditLog");

exports.showBookingPage = async (req, res) => {
    try {
        const flight = await Flight.findById(req.params.id).lean();
        const passengers = await Passenger.find({ user_id: req.session.user._id });
        console.log(passengers);

        res.render('booking', {
            title: 'Book Flight',
            flight,
            passengers
        });

    } catch (err) {
        console.log(err);
        res.redirect('/search');
    }
};

exports.savePassenger = async (req, res) => {
    try {

        const user = req.session.user;
        const userId = user._id;

        const passenger = await Passenger.create({

            user_id: userId,
            full_name: req.body.full_name,
            contact_num: req.body.contact_num,
            email: req.body.email,
            passport_num: req.body.passport_num,
            nationality: req.body.nationality,
            birth_date: req.body.birth_date,
            gender: req.body.gender,
            emergency_contact: req.body.emergency_contact
        });

        res.json(passenger);

    } catch (err) {

        console.log(err);
        res.status(500).json(err);

    }
};

exports.getSeats = async (req, res) => {
    try {

        const seats = await Seat.find({ flight_id: req.params.id });
        res.json(seats);

    } catch (err) {

        console.log(err);
        res.status(500).json({ success: false });
    }

};

exports.getMeals = async (req, res) => {
    try {

        const meals = await Meal.find();
        res.json(meals);

    } catch (err) {

        console.log(err);
        res.status(500).json({ success: false });
    }
};

exports.getFlightPrice = async (req, res) => {
    const flight = await Flight.findById(req.params.id);

    res.json({
        basePrice: flight.basePrice
    });
};

exports.bookFlight = async (req, res) => {

    console.log(req.body);

    if (!req.session || !req.session.user) {
        return res.status(401).json({
            success: false,
            message: "User not authenticated. Please log in again."
        });
    }

    const user = req.session.user;
    const userId = user._id;

    try {

        const reservation = await Reservation.create({

            userId: userId,
            passengerId: req.body.passengerId,
            flightId: req.body.flightId,
            seatNumber: req.body.seatNumber,
            mealPreference: req.body.mealPreference,
            mealPrice: req.body.mealPrice,
            extraServices: req.body.extraServices,
            extraServicesPrice: req.body.extraServicesPrice,
            booking_ref: req.body.booking_ref,
            status: "Confirmed",
            total_price: req.body.total_price

        });

        const updatedSeat = await Seat.findOneAndUpdate(
            {
                flight_id: req.body.flightId,
                seatNumber: req.body.seatNumber
            },
            {
                status: "Occupied",
                reservation_id: reservation._id
            },
            {
                new: true
            }
        );

        // AUDIT LOG
        await AuditLog.create({
            username: user.email,
            role: user.role,
            activity: "Reservation Creation",
            resource: reservation.booking_ref,

            after: {
                flightId: reservation.flightId,
                passengerId: reservation.passengerId,
                seatNumber: reservation.seatNumber,
                status: reservation.status
            }

        });

        res.json(reservation);

    }

    catch (err) {

        console.log(err);
        res.status(500).json(err);

    }

};