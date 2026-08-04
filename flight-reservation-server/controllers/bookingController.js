const Flight = require('../models/Flight');
const Passenger = require('../models/Passenger');
const Seat = require("../models/Seat");
const Meal = require("../models/Meal");
const Reservation = require("../models/Reservation");

exports.showBookingPage = async (req, res) => {
    try {
        const flight = await Flight.findById(req.params.id).lean();

        res.render('booking', {
            title: 'Book Flight',
            flight
        });

    } catch (err) {
        console.log(err);
        res.redirect('/search');
    }
};

exports.savePassenger = async (req, res) => {
    try {

        const passenger = await Passenger.create({

            user_id: req.body.user_id,
            full_name: req.body.full_name,
            contact_num: req.body.contact_num,
            passport_num: req.body.passport_num,
            nationality: req.body.nationality,
            birth_date: req.body.birth_date,
            gender: req.body.gender,
            emergency_contact: req.body.emergency_contact
        });

        res.json(passenger);

    } catch(err) {

        console.log(err);
        res.status(500).json(err);

    }
};

exports.getSeats = async (req, res) => {
    try {

        const seats = await Seat.find({flight_id: req.params.id});
        res.json(seats);

    } catch(err) {

        console.log(err);
        res.status(500).json({success:false});
    }

};

exports.getMeals = async (req, res) => {
    try {

        const meals = await Meal.find();
        res.json(meals);

    } catch(err){

        console.log(err);
        res.status(500).json({success:false});
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
    const userId = req.session.user._id;

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


        await Passenger.findByIdAndUpdate(
            req.body.passengerId,{reservation_id: reservation._id}

        );

        res.json(reservation);

    }

    catch(err){

        console.log(err);
        res.status(500).json(err);

    }

};