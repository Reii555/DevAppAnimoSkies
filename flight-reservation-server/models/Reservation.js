const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  flightId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flight',
    required: [true, 'Flight ID is required']
  },

  passengerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Passenger",
    required: true
  },

  seatNumber: {
    type: String,
    required: true
  },

  mealPreference: {
    type: String,
    enum: ['Standard', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free'],
    default: 'Standard'
  },

  mealPrice: {
    type: Number,
    default: 0
  },

  extraServices: {
    checkedBaggage: {
      type: Number,
      default: 0
    },
    carryOn: {
      type: Number,
      default: 0
    },
    priorityBoarding: {
      type: Boolean,
      default: false
    },
    travelInsurance: {
      type: Boolean,
      default: false
    },
    loungeAccess: {
      type: Boolean,
      default: false
    }
  },

  extraServicesPrice: {
    type: Number,
    default: 0
  },

  booking_ref: {
    type: String,
    required: [true, 'Booking reference is required'],
    uppercase: true,
    maxlength: [10, 'Booking reference must be up to 10 chars only']
  },
  
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['Pending', 'Confirmed', 'Cancelled', 'Completed'],
      message: 'Status must be "Pending", "Confirmed", "Cancelled", or "Completed"'
    },
    default: 'Pending'
  },
    
  total_price: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  
  booking_date: {
    type: Date,
    required: [true, 'Booking date is required'],
    default: Date.now
  },
  
  specialRequests: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Reservation', reservationSchema);