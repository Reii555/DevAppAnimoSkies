// removed savedPassengers - lena
const mongoose = require("mongoose");

const passengerSchema = new mongoose.Schema({
    
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    full_name: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'Full name cannot exceed 100 characters']
    },

    contact_num: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    passport_num: {
        type: String,
        required: true,
        unique: true,  
        trim: true,
        uppercase: true,
        match: [/^[A-Z0-9]{6,10}$/, 'Passport number must be 6-10 alphanumeric characters']
    },

    nationality: {
        type: String,
        enum: [
            "Filipino",
            "American",
            "Japanese",
            "Chinese",
            "Korean",
            "British",
            "Australian",
            "Canadian",
            "Other"
        ],
        required: true
    },

    birth_date: {
        type: Date,
        required: true
    },

    gender: {
        type: String,
        enum: [
            "Female",
            "Male",
            "Others",
            "Prefer not to say"
        ],
        required: true
    },

    type: {
        type: String,
        enum: [
            "Adult",
            "Child",
            "Infant"
        ],
        default: "Adult",
    },

    emergency_contact: {
        type: String,
        required: true
    },

    profilePicture: {
        type: String,
        default: null
    },

    paymentMethods: [{
        cardType: {
            type: String,
            enum: ['VISA', 'Mastercard', 'Maya', 'GoTyme'],
            required: true
        },
        cardNumber: {
            type: String,
            required: true,
            trim: true
        },
        cardholderName: {
            type: String,
            required: true,
            trim: true
        },
        expiryMonth: {
            type: String,
            required: true
        },
        expiryYear: {
            type: String,
            required: true
        },
        isDefault: {
            type: Boolean,
            default: false
        }
    }],

    notificationPreferences: {
        promotionalOffers: {
            type: Boolean,
            default: true
        },
        flightStatusAlerts: {
            type: Boolean,
            default: true
        },
        loyaltyUpdates: {
            type: Boolean,
            default: true
        },
        smsAlerts: {
            type: Boolean,
            default: true
        }
    }
},
{
    timestamps: true
});

module.exports = mongoose.model("Passenger", passengerSchema);