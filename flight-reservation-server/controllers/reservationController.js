const Reservation = require('../models/Reservation');
const Flight = require('../models/Flight');
const Passenger = require('../models/Passenger');

// ============================================================
// PAGE ROUTES
// ============================================================

exports.showMyReservations = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        console.log('Fetching reservations for user:', req.session.user._id);

        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Changed to 10 for debugging
        const skip = (page - 1) * limit;

        // Get all reservations for this user
        const reservations = await Reservation.find({ userId: req.session.user._id })
            .populate('flightId')
            .populate('passengerId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        console.log('Found reservations:', reservations.length);

        const total = await Reservation.countDocuments({ userId: req.session.user._id });
        console.log('Total reservations:', total);

        // Format reservations for the view
        const formattedReservations = reservations.map(function(reservation) {
            // Debug each reservation
            console.log('🔍 Processing reservation:', {
                id: reservation._id,
                booking_ref: reservation.booking_ref,
                hasFlight: !!reservation.flightId,
                hasPassenger: !!reservation.passengerId
            });

            var mealPrices = {
                'Standard': 0,
                'Vegetarian': 150,
                'Vegan': 200,
                'Halal': 250,
                'Kosher': 300,
                'Gluten-Free': 200
            };
            
            var mealPrice = mealPrices[reservation.mealPreference] || 0;
            
            var passengerName = 'Unknown Passenger';
            if (reservation.passengerId) {
                passengerName = reservation.passengerId.full_name || 'Unknown Passenger';
            }

            // Get flight details 
            var flightDetails = null;
            if (reservation.flightId) {
                flightDetails = {
                    flight_number: reservation.flightId.flight_number || 'N/A',
                    airline: reservation.flightId.airline || 'N/A',
                    origin: reservation.flightId.origin || 'N/A',
                    destination: reservation.flightId.destination || 'N/A',
                    departureTime: reservation.flightId.departureTime || new Date(),
                    arrivalTime: reservation.flightId.arrivalTime || new Date()
                };
            }
            
            return {
                _id: reservation._id.toString(),
                reservation_id: reservation.reservation_id || 'N/A',
                booking_ref: reservation.booking_ref || 'N/A',
                passengerName: passengerName,
                flight: flightDetails, // Send full flight object
                seatNumber: reservation.seatNumber || 'N/A',
                status: reservation.status || 'Pending',
                total_price: reservation.total_price || 0,
                trip_type: reservation.trip_type || 'One-way',
                mealPreference: reservation.mealPreference || 'Standard',
                mealPrice: mealPrice,
                booking_date: reservation.booking_date || new Date(),
                specialRequests: reservation.specialRequests || ''
            };
        });

        console.log('Formatted reservations:', formattedReservations.length);

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
            user: req.session.user,
            error: error.message
        });
    }
};

// ============================================================
// GET reservation details using AJAX
// ============================================================

exports.getReservationDetails = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const reservationId = req.params.id;
        console.log('🔍 Getting details for reservation:', reservationId);
        
        if (!reservationId || reservationId === 'undefined' || reservationId === 'null') {
            return res.status(400).json({
                success: false,
                message: 'Invalid reservation ID'
            });
        }

        const reservation = await Reservation.findById(reservationId)
            .populate('flightId')
            .populate('userId')
            .populate('passengerId');

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        // Check ownership
        if (reservation.userId._id.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        var mealPrices = {
            'Standard': 0,
            'Vegetarian': 150,
            'Vegan': 200,
            'Halal': 250,
            'Kosher': 300,
            'Gluten-Free': 200
        };
        var mealPrice = mealPrices[reservation.mealPreference] || 0;

        var passengerName = 'Unknown Passenger';
        var passengerDetails = {};
        if (reservation.passengerId) {
            passengerName = reservation.passengerId.full_name || 'Unknown Passenger';
            passengerDetails = {
                fullName: reservation.passengerId.full_name || '',
                contactNumber: reservation.passengerId.contact_num || '',
                passportNumber: reservation.passengerId.passport_num || '',
                nationality: reservation.passengerId.nationality || '',
                dateOfBirth: reservation.passengerId.birth_date || '',
                gender: reservation.passengerId.gender || '',
                type: reservation.passengerId.type || 'Adult',
                emergencyContact: reservation.passengerId.emergency_contact || ''
            };
        }

        res.json({
            success: true,
            data: {
                _id: reservation._id,
                reservation_id: reservation.reservation_id,
                booking_ref: reservation.booking_ref,
                passengerName: passengerName,
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
                booking_date: reservation.booking_date,
                trip_type: reservation.trip_type || 'One-way'
            }
        });
    } catch (error) {
        console.error('Get reservation details error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching reservation details'
        });
    }
};

// ============================================================
// Get Available Seats
// ============================================================

exports.getAvailableSeats = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const flightId = req.params.flightId;
        const reservationId = req.params.reservationId;

        if (!flightId || flightId === 'undefined' || flightId === 'null') {
            return res.status(400).json({
                success: false,
                message: 'Invalid flight ID'
            });
        }

        const flight = await Flight.findById(flightId);
        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Flight not found'
            });
        }

        const query = {
            flightId: flightId,
            status: { $in: ['Pending', 'Confirmed'] }
        };
        
        if (reservationId && reservationId !== 'undefined' && reservationId !== 'null') {
            query._id = { $ne: reservationId };
        }

        const bookedReservations = await Reservation.find(query);
        const bookedSeats = bookedReservations.map(function(r) {
            return r.seatNumber;
        });

        let currentSeat = null;
        if (reservationId && reservationId !== 'undefined' && reservationId !== 'null') {
            const currentReservation = await Reservation.findById(reservationId);
            if (currentReservation) {
                currentSeat = currentReservation.seatNumber;
            }
        }

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

        const availableCount = allSeats.filter(function(s) {
            return !s.isBooked || s.isCurrent;
        }).length;

        res.json({
            success: true,
            data: {
                availableSeats: availableCount,
                totalSeats: allSeats.length,
                currentSeat: currentSeat,
                allSeats: allSeats,
                flight: {
                    id: flight._id,
                    flightId: flight.flight_number,
                    route: flight.origin + ' → ' + flight.destination
                }
            }
        });
    } catch (error) {
        console.error('Get available seats error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching available seats'
        });
    }
};

// ============================================================
// Update Reservation Seat (AJAX)
// ============================================================

exports.updateReservationSeat = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const reservationId = req.params.id;
        const { seatNumber, mealPreference, specialRequests, extraServices, extraServicesPrice } = req.body;

        if (!reservationId || reservationId === 'undefined' || reservationId === 'null') {
            return res.status(400).json({
                success: false,
                message: 'Invalid reservation ID'
            });
        }

        const reservation = await Reservation.findById(reservationId);
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        if (reservation.userId.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (reservation.status !== 'Pending' && reservation.status !== 'Confirmed') {
            return res.status(400).json({
                success: false,
                message: 'Reservation cannot be updated in its current status'
            });
        }

        if (!seatNumber) {
            return res.status(400).json({
                success: false,
                message: 'Seat number is required'
            });
        }

        const seatRegex = /^[0-9]{1,3}[A-Z]$/;
        if (!seatRegex.test(seatNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid seat format. Must be number followed by letter (e.g., 12A)'
            });
        }

        if (seatNumber !== reservation.seatNumber) {
            const existingReservation = await Reservation.findOne({
                flightId: reservation.flightId,
                seatNumber: seatNumber,
                status: { $in: ['Pending', 'Confirmed'] },
                _id: { $ne: reservationId }
            });

            if (existingReservation) {
                return res.status(400).json({
                    success: false,
                    message: 'This seat is already booked'
                });
            }
        }

        var mealPrices = {
            'Standard': 0,
            'Vegetarian': 150,
            'Vegan': 200,
            'Halal': 250,
            'Kosher': 300,
            'Gluten-Free': 200
        };
        
        var newMealPrice = mealPrices[mealPreference] || 0;
        var oldMealPrice = mealPrices[reservation.mealPreference] || 0;
        var priceDifference = (newMealPrice - oldMealPrice) + (extraServicesPrice || 0);
        var newTotalPrice = reservation.total_price + priceDifference;

        var extraServicesObj = {
            checkedBaggage: 0,
            carryOn: 0,
            priorityBoarding: false,
            travelInsurance: false,
            loungeAccess: false
        };

        if (extraServices && extraServices.length > 0) {
            extraServices.forEach(function(service) {
                var name = service.name;
                if (name === 'Checked-in Baggage') {
                    extraServicesObj.checkedBaggage = 1;
                } else if (name === 'Carry-on Baggage') {
                    extraServicesObj.carryOn = 1;
                } else if (name === 'Priority Boarding') {
                    extraServicesObj.priorityBoarding = true;
                } else if (name === 'Travel Insurance') {
                    extraServicesObj.travelInsurance = true;
                } else if (name === 'Lounge Access') {
                    extraServicesObj.loungeAccess = true;
                }
            });
        }

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
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating reservation'
        });
    }
};

// ============================================================
// Cancel Reservation
// ============================================================

exports.cancelReservation = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const reservationId = req.params.id;

        if (!reservationId || reservationId === 'undefined' || reservationId === 'null') {
            return res.status(400).json({
                success: false,
                message: 'Invalid reservation ID'
            });
        }

        const reservation = await Reservation.findById(reservationId);
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        if (reservation.userId.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (reservation.status !== 'Pending' && reservation.status !== 'Confirmed') {
            return res.status(400).json({
                success: false,
                message: 'Reservation cannot be cancelled in its current status'
            });
        }

        reservation.status = 'Cancelled';
        await reservation.save();

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
        res.status(500).json({
            success: false,
            message: error.message || 'Error cancelling reservation'
        });
    }
};

// ============================================================
// Get Reservation Count
// ============================================================

exports.getReservationCount = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const count = await Reservation.countDocuments({
            userId: req.session.user._id,
            status: { $in: ['Pending', 'Confirmed'] }
        });

        res.json({
            success: true,
            data: { count: count }
        });
    } catch (error) {
        console.error('❌ Get reservation count error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reservation count'
        });
    }
};