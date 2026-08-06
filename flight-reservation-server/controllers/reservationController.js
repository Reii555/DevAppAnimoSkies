const Reservation = require('../models/Reservation');
const Flight = require('../models/Flight');
const Passenger = require('../models/Passenger');
const Seat = require('../models/Seat'); 
const AuditLog = require('../models/AuditLog');

// ============================================================
// Show My Reservations
// ============================================================
exports.showMyReservations = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        // Fetch reservations for this user
        const reservations = await Reservation.find({ userId: req.session.user._id })
            .populate('flightId')
            .populate('passengerId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Reservation.countDocuments({ userId: req.session.user._id });

        const formattedReservations = reservations.map(function(reservation) {
            var mealPrices = {
                'Standard': 0, 'Vegetarian': 150, 'Vegan': 200,
                'Halal': 250, 'Kosher': 300, 'Gluten-Free': 200
            };
            var mealPrice = mealPrices[reservation.mealPreference] || 0;
            
            var passengerName = reservation.passengerId ? reservation.passengerId.full_name : 'Unknown Passenger';
            
            return {
                _id: reservation._id.toString(),
                booking_ref: reservation.booking_ref,
                passengerName: passengerName,
                passengerId: reservation.passengerId ? reservation.passengerId._id : null,
                flight_id: reservation.flightId,
                seatNumber: reservation.seatNumber,
                status: reservation.status,
                total_price: reservation.total_price,
                trip_type: reservation.trip_type || 'One-way',
                meal_id: { 
                    meal_name: reservation.mealPreference || 'Standard',
                    meal_price: mealPrice
                },
                booking_date: reservation.booking_date
            };
        });

        res.render('my-reservations', {
            title: 'My Reservations',
            reservations: formattedReservations,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit) || 1,
                totalItems: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            },
            isAuthenticated: true,
            user: req.session.user
        });
    } catch (error) {
        console.error('My reservations error:', error);
        res.render('my-reservations', {
            title: 'My Reservations',
            reservations: [],
            pagination: {
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                hasNext: false,
                hasPrev: false
            },
            isAuthenticated: true,
            user: req.session.user
        });
    }
};

// ============================================================
// Get Reservation Details 
// ============================================================
exports.getReservationDetails = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const reservationId = req.params.id;
        
        const reservation = await Reservation.findById(reservationId)
            .populate('flightId')
            .populate('userId')
            .populate('passengerId');

        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        if (reservation.userId._id.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        var mealPrices = {
            'Standard': 0, 'Vegetarian': 150, 'Vegan': 200,
            'Halal': 250, 'Kosher': 300, 'Gluten-Free': 200
        };
        var mealPrice = mealPrices[reservation.mealPreference] || 0;

        var passengerName = reservation.passengerId ? reservation.passengerId.full_name : 'Unknown Passenger';
        var passengerDetails = {};
        if (reservation.passengerId) {
            passengerDetails = {
                fullName: reservation.passengerId.full_name || '',
                email: reservation.userId ? reservation.userId.email : 'No email provided',
                contactNumber: reservation.passengerId.contact_num || '',
                passportNumber: reservation.passengerId.passport_num || '',
                nationality: reservation.passengerId.nationality || '',
                dateOfBirth: reservation.passengerId.birth_date || '',
                gender: reservation.passengerId.gender || ''
            };
        }

        res.json({
            success: true,
            data: {
                _id: reservation._id,
                booking_ref: reservation.booking_ref,
                passengerName: passengerName,
                passengerId: reservation.passengerId ? reservation.passengerId._id : null,
                flight: {
                    _id: reservation.flightId._id,
                    flight_number: reservation.flightId.flight_number,
                    airline: reservation.flightId.airline,
                    origin: reservation.flightId.origin,
                    destination: reservation.flightId.destination,
                    departureTime: reservation.flightId.departureTime,
                    arrivalTime: reservation.flightId.arrivalTime
                },
                seatNumber: reservation.seatNumber,
                mealPreference: reservation.mealPreference,
                mealPrice: mealPrice,
                status: reservation.status,
                total_price: reservation.total_price,
                passengerDetails: passengerDetails,
                specialRequests: reservation.specialRequests || '',
                booking_date: reservation.booking_date
            }
        });
    } catch (error) {
        console.error('Get reservation details error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// Get Available Seats 
// ============================================================
exports.getAvailableSeats = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const flightId = req.params.flightId;
        const reservationId = req.params.reservationId;

        const flight = await Flight.findById(flightId);
        if (!flight) {
            return res.status(404).json({ success: false, message: 'Flight not found' });
        }

        // Query active reservations for this flight
        const query = {
            flightId: flightId,
            status: { $in: ['Pending', 'Confirmed'] }
        };
        
        if (reservationId && reservationId !== 'undefined' && reservationId !== 'null') {
            query._id = { $ne: reservationId };
        }

        const bookedReservations = await Reservation.find(query);
        const bookedSeats = bookedReservations.map(r => r.seatNumber);

        let currentSeat = null;
        if (reservationId && reservationId !== 'undefined' && reservationId !== 'null') {
            const currentReservation = await Reservation.findById(reservationId);
            if (currentReservation) {
                currentSeat = currentReservation.seatNumber;
            }
        }

        // Generate grid
        const allSeats = [];
        const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
        const maxRows = 10;

        for (let row = 1; row <= maxRows; row++) {
            for (let col = 0; col < rows.length; col++) {
                const seatNumber = row + rows[col];
                allSeats.push({
                    seat: seatNumber,
                    isBooked: bookedSeats.includes(seatNumber),
                    isCurrent: seatNumber === currentSeat
                });
            }
        }

        const availableCount = allSeats.filter(s => !s.isBooked || s.isCurrent).length;

        res.json({
            success: true,
            data: {
                availableSeats: availableCount,
                totalSeats: allSeats.length,
                currentSeat: currentSeat,
                allSeats: allSeats
            }
        });
    } catch (error) {
        console.error('Get available seats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// Update Reservation Seat 
// ============================================================
exports.updateReservationSeat = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const reservationId = req.params.id;
        const { passengerId, seatNumber, mealPreference, specialRequests, extraServices, extraServicesPrice } = req.body;

        console.log(`[DEBUG] Updating reservation ${reservationId} to seat ${seatNumber}`);

        const oldReservation = await Reservation.findById(reservationId);
        if (!oldReservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        const reservation = oldReservation;

        if (reservation.userId.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        if (reservation.status !== 'Pending' && reservation.status !== 'Confirmed') {
            return res.status(400).json({ success: false, message: 'Reservation cannot be updated in its current status' });
        }

        // Update passenger
        if (passengerId && passengerId !== reservation.passengerId.toString()) {
            const passenger = await Passenger.findOne({ _id: passengerId, user_id: req.session.user._id });
            if (!passenger) {
                return res.status(400).json({ success: false, message: 'Invalid passenger' });
            }
            reservation.passengerId = passengerId;
        }

        // Update Seat
        if (seatNumber && seatNumber !== reservation.seatNumber) {
            const seatRegex = /^[0-9]{1,3}[A-Z]$/;
            if (!seatRegex.test(seatNumber)) {
                return res.status(400).json({ success: false, message: 'Invalid seat format. Must be number followed by letter' });
            }

            console.log(`[DEBUG] Changing seat from ${reservation.seatNumber} to ${seatNumber}`);

            // Check if the seat is already taken
            const existingReservation = await Reservation.findOne({
                flightId: reservation.flightId,
                seatNumber: seatNumber,
                status: { $in: ['Pending', 'Confirmed'] },
                _id: { $ne: reservationId }
            });
            if (existingReservation) {
                return res.status(400).json({ success: false, message: 'This seat is already booked' });
            }

            // Goodbye old seat
            const freedSeat = await Seat.findOneAndUpdate(
                { flight_id: reservation.flightId, seatNumber: reservation.seatNumber },
                { status: 'Unoccupied', reservation_id: null }
            );
            console.log(`[DEBUG] Freed seat: ${reservation.seatNumber}`, freedSeat ? 'Success' : 'Not Found');

            // Occupies the new seat
            const occupiedSeat = await Seat.findOneAndUpdate(
                { flight_id: reservation.flightId, seatNumber: seatNumber },
                { status: 'Occupied', reservation_id: reservation._id }
            );
            console.log(`[DEBUG] Occupied seat: ${seatNumber}`, occupiedSeat ? 'Success' : 'Not Found');

            // If the update fails, throw an error
            if (!occupiedSeat) {
                console.error(`[ERROR] Could not find seat ${seatNumber} for flight ${reservation.flightId}`);
                return res.status(500).json({ success: false, message: 'Failed to occupy new seat in database.' });
            }

            reservation.seatNumber = seatNumber;
        }

        // Calculate price difference
        var mealPrices = {
            'Standard': 0, 'Vegetarian': 150, 'Vegan': 200,
            'Halal': 250, 'Kosher': 300, 'Gluten-Free': 200
        };
        var newMealPrice = mealPrices[mealPreference] || 0;
        var oldMealPrice = mealPrices[reservation.mealPreference] || 0;
        var priceDifference = (newMealPrice - oldMealPrice) + (extraServicesPrice || 0);
        var newTotalPrice = reservation.total_price + priceDifference;

        // Update extras object
        var extraServicesObj = {
            checkedBaggage: 0, carryOn: 0, priorityBoarding: false,
            travelInsurance: false, loungeAccess: false
        };
        if (extraServices && extraServices.length > 0) {
            extraServices.forEach(function(service) {
                if (service.name === 'Checked-in Baggage') extraServicesObj.checkedBaggage = service.quantity || 1;
                else if (service.name === 'Carry-on Baggage') extraServicesObj.carryOn = service.quantity || 1;
                else if (service.name === 'Priority Boarding') extraServicesObj.priorityBoarding = true;
                else if (service.name === 'Travel Insurance') extraServicesObj.travelInsurance = true;
                else if (service.name === 'Lounge Access') extraServicesObj.loungeAccess = true;
            });
        }

        // Update reservation
        const updateData = {
            seatNumber: seatNumber.toUpperCase(),
            mealPreference: mealPreference || 'Standard',
            mealPrice: newMealPrice,
            extraServices: extraServicesObj,
            extraServicesPrice: extraServicesPrice || 0,
            total_price: newTotalPrice
        };
        if (specialRequests !== undefined) {
            updateData.specialRequests = specialRequests;
        }

        const updatedReservation = await Reservation.findByIdAndUpdate(
            reservationId,
            updateData,
            { new: true }
        ).populate('flightId').populate('passengerId');

        console.log(`[DEBUG] Reservation ${reservationId} updated successfully. New price: ${newTotalPrice}`);

        // ============================================================
        // AUDIT LOG 
        // ============================================================
        const user = req.session.user;
        await AuditLog.create({
            username: user.email,
            role: user.role,
            activity: "Reservation Update",
            resource: reservation._id.toString(),
            
            before: {
                seatNumber: oldReservation.seatNumber,
                mealPreference: oldReservation.mealPreference,
                extraServices: oldReservation.extraServices,
                total_price: oldReservation.total_price
            },

            after: {
                seatNumber: updatedReservation.seatNumber,
                mealPreference: updatedReservation.mealPreference,
                extraServices: updatedReservation.extraServices,
                total_price: updatedReservation.total_price
            }
        });

        res.json({
            success: true,
            message: 'Reservation updated successfully',
            data: {
                _id: updatedReservation._id,
                seatNumber: updatedReservation.seatNumber,
                mealPreference: updatedReservation.mealPreference,
                mealPrice: updatedReservation.mealPrice,
                extraServices: updatedReservation.extraServices,
                extraServicesPrice: updatedReservation.extraServicesPrice,
                total_price: updatedReservation.total_price,
                status: updatedReservation.status
            }
        });
    } catch (error) {
        console.error('Update reservation seat error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// Cancel Reservation
// ============================================================
exports.cancelReservation = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const reservationId = req.params.id;
        const reservation = await Reservation.findById(reservationId);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        const before = {
            status: reservation.status
        };

        if (reservation.userId.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        if (reservation.status !== 'Pending' && reservation.status !== 'Confirmed') {
            return res.status(400).json({ success: false, message: 'Reservation cannot be cancelled in its current status' });
        }

        // Free the seat in the seat table
        await Seat.findOneAndUpdate(
            { flight_id: reservation.flightId, seatNumber: reservation.seatNumber },
            { status: 'Unoccupied', reservation_id: null }
        );

        reservation.status = 'Cancelled';
        await reservation.save();

        const user = req.session.user;

        // AUDIT LOG
        await AuditLog.create({
            username: user.email,
            role: user.role,
            activity: "Reservation Cancellation",
            resource: reservation._id.toString(),

            before: before,

            after: {
                status: reservation.status
            }
        });

        // Increment available seats 
        const flight = await Flight.findById(reservation.flightId);
        if (flight) {
            flight.availableSeats = flight.availableSeats + 1;
            await flight.save();
        }

        res.json({
            success: true,
            message: 'Reservation cancelled successfully',
            data: {
                _id: reservation._id,
                status: reservation.status
            }
        });
    } catch (error) {
        console.error('Cancel reservation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// Get Reservation Count
// ============================================================
exports.getReservationCount = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
        const count = await Reservation.countDocuments({
            userId: req.session.user._id,
            status: { $in: ['Pending', 'Confirmed'] }
        });
        res.json({ success: true, data: { count: count } });
    } catch (error) {
        console.error('Get reservation count error:', error);
        res.status(500).json({ success: false, message: 'Error fetching reservation count' });
    }
};