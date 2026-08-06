const mongoose = require('mongoose');

const resServiceSchema = new mongoose.Schema({
    reservation_service_id: { // d primary keyy
        type: Number,
        required: true,
        unique: true,
        index: true
    },

    reservation_id: { 
        type: Number,
        ref: 'Reservation',
        required: [true, 'A Reservation ID is required']
    },

    service_id: {
        type: Number,
        ref: 'ExtraService',
        required: false
    },
    
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must at least be 1'],
        default: 1

    }
});

module.exports = mongoose.model('ResService', resServiceSchema);
