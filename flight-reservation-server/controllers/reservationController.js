const Reservation = require('../models/Reservation');
const Flight = require('../models/Flight');
const Passenger = require('../models/Passenger');

// ============================================================
// PAGE ROUTES
// ============================================================

exports.showMyReservations = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const reservations = await Reservation.find({ userId: req.session.user._id })
            .populate('flightId')
            .populate('passengerId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Reservation.countDocuments({ userId: req.session.user._id });

        // Get all passengers for the user (for dropdown in edit modal)
        const userPassengers = await Passenger.find({ 
            user_id: req.session.user._id 
        }).select('_id full_name passport_num nationality birth_date gender type emergency_contact');

        const formattedReservations = reservations.map(function(reservation) {
            var mealPrices = {
                'Standard': 0,
                'Vegetarian': 150,
                'Vegan': 200,
                'Halal': 250,
                'Kosher': 300,
                'Gluten-Free': 200
            };
            var mealPrice = mealPrices[reservation.mealPreference] || 0;
            
            var passengerName = reservation.passengerId ? 
                reservation.passengerId.full_name : 'Unknown Passenger';
            
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
                booking_date: reservation.booking_date,
                flight: reservation.flightId
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
            userPassengers: userPassengers, 
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
            userPassengers: [],
            isAuthenticated: true,
            user: req.session.user
        });
    }
};

// ============================================================
// GET reservation details using AJAX
// ============================================================

exports.getReservationDetails = async (req, res) => {
    try {
        const reservationId = req.params.id;
        
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

        // Get all passengers for this user (for dropdown)
        const userPassengers = await Passenger.find({ 
            user_id: req.session.user._id 
        }).select('_id full_name passport_num nationality birth_date gender type emergency_contact');

        // Get all passengers on this flight (for seat map reference)
        const flightPassengers = await Passenger.find({
            reservation_id: { $in: await Reservation.find({ 
                flightId: reservation.flightId, 
                status: { $in: ['Pending', 'Confirmed'] }
            }).distinct('passengerId') }
        });

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
                userPassengers: userPassengers, // For dropdown
                flightPassengers: flightPassengers, // For seat map
                specialRequests: reservation.specialRequests || '',
                booking_date: reservation.booking_date
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
// Update Reservation
// ============================================================

exports.updateReservation = async (req, res) => {
    try {
        const reservationId = req.params.id;
        const { 
            passengerId, 
            seatNumber, 
            mealPreference, 
            specialRequests, 
            extraServices, 
            extraServicesPrice 
        } = req.body;

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

        // Update passenger if changed
        if (passengerId && passengerId !== reservation.passengerId.toString()) {
            // Verify the passenger belongs to the user
            const passenger = await Passenger.findOne({
                _id: passengerId,
                user_id: req.session.user._id
            });

            if (!passenger) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid passenger'
                });
            }

            reservation.passengerId = passengerId;
        }

        // Update seat
        if (seatNumber && seatNumber !== reservation.seatNumber) {
            // Validate seat format
            const seatRegex = /^[0-9]{1,3}[A-Z]$/;
            if (!seatRegex.test(seatNumber)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid seat format. Must be number followed by letter (e.g., 12A)'
                });
            }

            // Check if seat is occupied
            const occupiedSeats = await getOccupiedSeats(reservation.flightId, reservationId);
            if (occupiedSeats.includes(seatNumber)) {
                return res.status(400).json({
                    success: false,
                    message: 'This seat is already booked'
                });
            }
            reservation.seatNumber = seatNumber;
        }

        // Update meal
        if (mealPreference) {
            const mealPrices = {
                'Standard': 0,
                'Vegetarian': 150,
                'Vegan': 200,
                'Halal': 250,
                'Kosher': 300,
                'Gluten-Free': 200
            };
            reservation.mealPrice = mealPrices[mealPreference] || 0;
            reservation.mealPreference = mealPreference;
        }

        // Update other fields
        if (specialRequests !== undefined) {
            reservation.specialRequests = specialRequests;
        }
        if (extraServices) {
            reservation.extraServices = extraServices;
        }
        if (extraServicesPrice !== undefined) {
            reservation.extraServicesPrice = extraServicesPrice;
        }

        // Recalculate total
        const basePrice = reservation.total_price - 
            (reservation.mealPrice || 0) - 
            (reservation.extraServicesPrice || 0);
        reservation.total_price = basePrice + 
            (reservation.mealPrice || 0) + 
            (reservation.extraServicesPrice || 0);

        await reservation.save();

        // Return updated reservation
        const updatedReservation = await Reservation.findById(reservationId)
            .populate('flightId')
            .populate('passengerId');

        res.json({
            success: true,
            message: 'Reservation updated successfully',
            data: {
                _id: updatedReservation._id,
                booking_ref: updatedReservation.booking_ref,
                passengerName: updatedReservation.passengerId.full_name,
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
        console.error('Update reservation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating reservation'
        });
    }
};

// ============================================================
// Helper Functions
// ============================================================

// Helper function to get occupied seats
async function getOccupiedSeats(flightId, excludeReservationId) {
    const reservations = await Reservation.find({
        flightId: flightId,
        status: { $in: ['Pending', 'Confirmed'] },
        _id: { $ne: excludeReservationId }
    });

    return reservations.map(r => r.seatNumber);
}

// ============================================================
// Get Seat Map
// ============================================================

exports.getSeatMap = async (req, res) => {
    try {
        const flightId = req.params.flightId;
        
        const flight = await Flight.findById(flightId);
        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Flight not found'
            });
        }

        // Get all occupied seats
        const occupiedSeats = await getOccupiedSeats(flightId, null);

        // Generate all possible seats
        const allSeats = [];
        const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
        const maxRows = 10;

        for (let row = 1; row <= maxRows; row++) {
            for (let col = 0; col < rows.length; col++) {
                const seatNumber = row + rows[col];
                allSeats.push({
                    seat: seatNumber,
                    isOccupied: occupiedSeats.includes(seatNumber),
                    isBooked: occupiedSeats.includes(seatNumber)
                });
            }
        }

        res.json({
            success: true,
            data: {
                allSeats: allSeats,
                occupiedSeats: occupiedSeats,
                availableCount: allSeats.filter(s => !s.isOccupied).length,
                totalSeats: allSeats.length
            }
        });
    } catch (error) {
        console.error('Get seat map error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================================
// Cancel Reservation
// ============================================================

exports.cancelReservation = async (req, res) => {
    try {
        const reservationId = req.params.id;

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
        const count = await Reservation.countDocuments({
            userId: req.session.user._id,
            status: { $in: ['Pending', 'Confirmed'] }
        });

        res.json({
            success: true,
            data: { count: count }
        });
    } catch (error) {
        console.error('Get reservation count error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reservation count'
        });
    }
};