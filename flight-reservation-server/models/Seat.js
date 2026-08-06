const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({

    flight_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flight',
        required: true
    },

    reservation_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reservation',
        default: null
    },

    seatNumber: {
        type: String,
        required: true,
        trim: true
    },

    status: {
        type: String,
        enum: ['Occupied', 'Unoccupied'],
        default: 'Unoccupied',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Seat', seatSchema);
