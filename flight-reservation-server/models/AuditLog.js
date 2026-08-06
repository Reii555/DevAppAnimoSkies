const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({

        dateTime: {
            type: Date,
            default: Date.now
        },

        username: {
            type: String,
            required: true
        },

        role: {
            type: String,
            required: true // admin or passenger
        },

        activity: {
            type: String,
            required: true 
        }, 

        resource: { 
            type: String,
            required: true
        },

        before: { 
            type: Object,
        },

        after: { 
            type: Object,
        }

});

module.exports = mongoose.model("AuditLog", auditLogSchema);