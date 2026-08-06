const User = require('../models/User');
const Passenger = require('../models/Passenger');
const Reservation = require('../models/Reservation');

// HELPER FUNCTION : check for duplicate passport
async function isPassportDuplicate(passportNumber, excludeUserId) {
    const passport = passportNumber.toUpperCase().trim();
    
    const existingPassenger = await Passenger.findOne({
        passport_num: passport,
        user_id: { $ne: excludeUserId }
    });
    
    if (existingPassenger) {
        return true;
    }
    
    return false;
}

exports.showProfilePage = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        // get the main passenger profile 
        let passenger = await Passenger.findOne({ user_id: req.session.user._id });
        
        if (!passenger) {
            // create main passenger if it doesn't exist
            passenger = new Passenger({
                user_id: req.session.user._id,
                full_name: 'User',
                contact_num: req.session.user.phone || 'N/A',
                email: req.session.user.email || 'N/A',
                passport_num: 'PENDING',
                nationality: 'Filipino',
                birth_date: new Date('2000-01-01'),
                gender: 'Prefer not to say',
                type: 'Adult',
                emergency_contact: 'N/A',
                paymentMethods: [],
                notificationPreferences: {
                    promotionalOffers: true,
                    flightStatusAlerts: true,
                    loyaltyUpdates: true,
                    smsAlerts: true
                }
            });
            await passenger.save();
        }

        const savedPassengers = await Passenger.find({ 
            user_id: req.session.user._id 
        }).select('_id full_name passport_num nationality birth_date gender type emergency_contact');

        if (!passenger.paymentMethods) {
            passenger.paymentMethods = [];
        }
        if (!passenger.notificationPreferences) {
            passenger.notificationPreferences = {
                promotionalOffers: true,
                flightStatusAlerts: true,
                loyaltyUpdates: true,
                smsAlerts: true
            };
        }

        // get user's reservations
        let reservations = [];
        try {
            reservations = await Reservation.find({ userId: req.session.user._id })
                .populate('flightId')
                .populate('passengerId')
                .sort({ createdAt: -1 })
                .limit(5);
        } catch (err) {
            console.log('No reservations found');
        }

        const userData = {
            _id: req.session.user._id,
            email: req.session.user.email,
            phone: req.session.user.phone,
            role: req.session.user.role,
            full_name: passenger.full_name || '',
            contact_num: passenger.contact_num || '',
            email: passenger.email || '',
            passport_num: passenger.passport_num || '',
            nationality: passenger.nationality || 'Filipino',
            birth_date: passenger.birth_date || new Date('2000-01-01'),
            gender: passenger.gender || 'Prefer not to say',
            type: passenger.type || 'Adult',
            emergency_contact: passenger.emergency_contact || '',
            profilePicture: passenger.profilePicture || null,
            paymentMethods: passenger.paymentMethods || [],
            notificationPreferences: passenger.notificationPreferences || {
                promotionalOffers: true,
                flightStatusAlerts: true,
                loyaltyUpdates: true,
                smsAlerts: true
            },
            createdAt: passenger.createdAt || new Date(),
            savedPassengers: savedPassengers
        };

        res.render('profile', {
            title: 'My Profile',
            user: userData,
            reservations: reservations,
            isAuthenticated: true
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.render('profile', {
            title: 'My Profile',
            user: req.session.user || { email: 'Guest' },
            reservations: [],
            savedPassengers: [],
            isAuthenticated: false
        });
    }
};

exports.showEditProfilePage = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        let passenger = await Passenger.findOne({ user_id: req.session.user._id });
        
        if (!passenger) {
            passenger = new Passenger({
                user_id: req.session.user._id,
                full_name: 'User',
                contact_num: req.session.user.phone || 'N/A',
                passport_num: 'PENDING',
                nationality: 'Filipino',
                birth_date: new Date('2000-01-01'),
                gender: 'Prefer not to say',
                type: 'Adult',
                emergency_contact: 'N/A'
            });
            await passenger.save();
        }

        const userData = {
            _id: req.session.user._id,
            email: req.session.user.email,
            phone: req.session.user.phone,
            role: req.session.user.role,
            full_name: passenger.full_name || '',
            contact_num: passenger.contact_num || '',
            passport_num: passenger.passport_num || '',
            nationality: passenger.nationality || 'Filipino',
            birth_date: passenger.birth_date || new Date('2000-01-01'),
            gender: passenger.gender || 'Prefer not to say',
            type: passenger.type || 'Adult',
            emergency_contact: passenger.emergency_contact || '',
            profilePicture: passenger.profilePicture || null
        };

        res.render('edit-profile', {
            title: 'Edit Profile',
            user: userData,
            isAuthenticated: true
        });
    } catch (error) {
        console.error('Edit profile error:', error);
        res.render('edit-profile', {
            title: 'Edit Profile',
            user: req.session.user || { email: 'Guest' },
            isAuthenticated: false
        });
    }
};

// update profile
exports.updateProfile = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const { full_name, contact_num, passport_num, nationality, birth_date, gender, type, emergency_contact } = req.body;

        if (!full_name || !contact_num || !passport_num || !nationality || !birth_date || !gender) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be filled'
            });
        }

        const phoneRegex = /^\+?[0-9\s\-\(\)]{7,20}$/;
        if (!phoneRegex.test(contact_num)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid phone number (e.g., +63 912 345 6789)'
            });
        }

        const formattedPassport = passport_num.toUpperCase().trim();
        if (!/^[A-Z0-9]{6,10}$/.test(formattedPassport)) {
            return res.status(400).json({
                success: false,
                message: 'Passport number must be 6-10 alphanumeric characters'
            });
        }

        // check for duplicate passport number
        const isDuplicate = await isPassportDuplicate(formattedPassport, req.session.user._id);
        if (isDuplicate) {
            return res.status(400).json({
                success: false,
                message: 'This passport number is already registered to another passenger'
            });
        }

        // update user phone
        await User.findByIdAndUpdate(
            req.session.user._id,
            { phone: contact_num },
            { new: true }
        );

        // update passenger
        const updateData = {
            full_name: full_name,
            contact_num: contact_num,
            passport_num: formattedPassport,
            nationality: nationality || 'Filipino',
            birth_date: new Date(birth_date),
            gender: gender || 'Prefer not to say',
            type: type || 'Adult',
            emergency_contact: emergency_contact || 'N/A'
        };

        const updatedPassenger = await Passenger.findOneAndUpdate(
            { user_id: req.session.user._id },
            updateData,
            { new: true, runValidators: true, upsert: true }
        );

        if (!updatedPassenger) {
            return res.status(404).json({
                success: false,
                message: 'Passenger profile not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedPassenger
        });
    } catch (error) {
        console.error('Update profile error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'This passport number is already registered to another passenger'
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating profile'
        });
    }
};

exports.uploadProfilePicture = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const { profilePicture } = req.body;

        if (!profilePicture) {
            return res.status(400).json({
                success: false,
                message: 'No image provided'
            });
        }

        let passenger = await Passenger.findOne({ user_id: req.session.user._id });
        
        if (!passenger) {
            passenger = new Passenger({
                user_id: req.session.user._id,
                full_name: 'User',
                contact_num: req.session.user.phone || 'N/A',
                passport_num: 'PENDING',
                nationality: 'Filipino',
                birth_date: new Date('2000-01-01'),
                gender: 'Prefer not to say',
                type: 'Adult',
                emergency_contact: 'N/A',
                profilePicture: profilePicture
            });
            await passenger.save();
        } else {
            passenger.profilePicture = profilePicture;
            await passenger.save();
        }

        res.json({
            success: true,
            message: 'Profile picture updated successfully',
            data: passenger
        });
    } catch (error) {
        console.error('Upload picture error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading profile picture'
        });
    }
};

exports.getProfileData = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const passenger = await Passenger.findOne({ user_id: req.session.user._id });
        
        if (!passenger) {
            return res.status(404).json({
                success: false,
                message: 'Passenger profile not found'
            });
        }

        const recentReservations = await Reservation.find({ userId: req.session.user._id })
            .populate('flightId')
            .populate('passengerId')
            .sort({ createdAt: -1 })
            .limit(3);

        // get passenger name from reservation
        var passengerName = 'Unknown Passenger';
        if (recentReservations.length > 0 && recentReservations[0].passengerId) {
            passengerName = recentReservations[0].passengerId.full_name || 'Unknown Passenger';
        } else if (passenger) {
            passengerName = passenger.full_name || 'Unknown Passenger';
        }

        const userData = {
            _id: req.session.user._id,
            email: req.session.user.email,
            phone: req.session.user.phone,
            full_name: passengerName,
            contact_num: passenger.contact_num || '',
            passport_num: passenger.passport_num || '',
            nationality: passenger.nationality || 'Filipino',
            birth_date: passenger.birth_date || new Date('2000-01-01'),
            gender: passenger.gender || 'Prefer not to say',
            type: passenger.type || 'Adult',
            emergency_contact: passenger.emergency_contact || '',
            profilePicture: passenger.profilePicture || null,
            paymentMethods: passenger.paymentMethods || []
        };

        res.json({
            success: true,
            data: {
                user: userData,
                recentReservations: recentReservations
            }
        });
    } catch (error) {
        console.error('Get profile data error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile data'
        });
    }
};

// get user's passengers 
exports.getUserPassengers = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        // get all passengers belonging to the logged-in user
        const passengers = await Passenger.find({ 
            user_id: req.session.user._id 
        }).select('_id full_name passport_num nationality birth_date gender type emergency_contact');

        // if user doesn't have any passengers, create one
        if (passengers.length === 0) {
            const newPassenger = new Passenger({
                user_id: req.session.user._id,
                full_name: req.session.user.email.split('@')[0],
                contact_num: req.session.user.phone || 'N/A',
                passport_num: 'PENDING',
                nationality: 'Filipino',
                birth_date: new Date('2000-01-01'),
                gender: 'Prefer not to say',
                type: 'Adult',
                emergency_contact: 'N/A'
            });
            await newPassenger.save();
            
            // fetch again
            const updatedPassengers = await Passenger.find({ 
                user_id: req.session.user._id 
            }).select('_id full_name passport_num nationality birth_date gender type emergency_contact');
            
            return res.json({
                success: true,
                data: updatedPassengers
            });
        }

        res.json({
            success: true,
            data: passengers
        });
    } catch (error) {
        console.error('Get user passengers error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching passengers'
        });
    }
};

// saved passengers 
exports.getSavedPassengers = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        // get all passengers belonging to the user
        const passengers = await Passenger.find({ 
            user_id: req.session.user._id 
        }).select('_id full_name passport_num nationality birth_date gender type emergency_contact');

        res.json({
            success: true,
            data: passengers
        });
    } catch (error) {
        console.error('Get saved passengers error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching saved passengers'
        });
    }
};

exports.addSavedPassenger = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const { full_name, contact_num, passport_num, nationality, birth_date, gender, type, emergency_contact } = req.body;

        if (!full_name || !passport_num || !birth_date || !gender) {
            return res.status(400).json({
                success: false,
                message: 'Required fields are missing'
            });
        }

        const formattedPassport = passport_num.toUpperCase().trim();
        if (!/^[A-Z0-9]{6,10}$/.test(formattedPassport)) {
            return res.status(400).json({
                success: false,
                message: 'Passport number must be 6-10 alphanumeric characters'
            });
        }

        // check for duplicate passport
        const isDuplicate = await isPassportDuplicate(formattedPassport, req.session.user._id);
        if (isDuplicate) {
            return res.status(400).json({
                success: false,
                message: 'This passport number is already registered to another passenger'
            });
        }

        const passenger = new Passenger({
            user_id: req.session.user._id,
            full_name: full_name,
            contact_num: contact_num || req.session.user.phone || 'N/A',
            passport_num: formattedPassport,
            nationality: nationality || 'Filipino',
            birth_date: new Date(birth_date),
            gender: gender,
            type: type || 'Adult',
            emergency_contact: emergency_contact || 'N/A'
        });

        await passenger.save();

        // get updated list
        const passengers = await Passenger.find({ 
            user_id: req.session.user._id 
        }).select('_id full_name passport_num nationality birth_date gender type emergency_contact');

        res.json({
            success: true,
            message: 'Passenger saved successfully',
            data: passengers
        });
    } catch (error) {
        console.error('Add saved passenger error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error saving passenger'
        });
    }
};

exports.removeSavedPassenger = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const passengerId = req.params.id;

        // check if passenger is used in any active reservation
        const activeReservation = await Reservation.findOne({
            passengerId: passengerId,
            status: { $in: ['Pending', 'Confirmed'] }
        });

        if (activeReservation) {
            return res.status(400).json({
                success: false,
                message: 'Cannot remove passenger with active reservations'
            });
        }

        await Passenger.findOneAndDelete({
            _id: passengerId,
            user_id: req.session.user._id
        });

        // get updated list
        const passengers = await Passenger.find({ 
            user_id: req.session.user._id 
        }).select('_id full_name passport_num nationality birth_date gender type emergency_contact');

        res.json({
            success: true,
            message: 'Passenger removed successfully',
            data: passengers
        });
    } catch (error) {
        console.error('Remove saved passenger error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing passenger'
        });
    }
};

// payment methods 
exports.getPaymentMethods = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const passenger = await Passenger.findOne({ user_id: req.session.user._id });
        
        if (!passenger) {
            return res.status(404).json({
                success: false,
                message: 'Passenger profile not found'
            });
        }

        res.json({
            success: true,
            data: passenger.paymentMethods || []
        });
    } catch (error) {
        console.error('Get payment methods error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment methods'
        });
    }
};

exports.addPaymentMethod = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const { cardType, cardNumber, cardholderName, expiryMonth, expiryYear, isDefault } = req.body;

        if (!cardType || !cardNumber || !cardholderName || !expiryMonth || !expiryYear) {
            return res.status(400).json({
                success: false,
                message: 'All payment fields are required'
            });
        }

        let passenger = await Passenger.findOne({ user_id: req.session.user._id });
        
        if (!passenger) {
            passenger = new Passenger({
                user_id: req.session.user._id,
                full_name: 'User',
                contact_num: req.session.user.phone || 'N/A',
                passport_num: 'PENDING',
                nationality: 'Filipino',
                birth_date: new Date('2000-01-01'),
                gender: 'Prefer not to say',
                type: 'Adult',
                emergency_contact: 'N/A',
                paymentMethods: []
            });
            await passenger.save();
        }

        if (!passenger.paymentMethods) {
            passenger.paymentMethods = [];
        }

        if (isDefault) {
            passenger.paymentMethods.forEach(function(card) {
                card.isDefault = false;
            });
        }

        passenger.paymentMethods.push({
            cardType: cardType,
            cardNumber: cardNumber,
            cardholderName: cardholderName,
            expiryMonth: expiryMonth,
            expiryYear: expiryYear,
            isDefault: isDefault || false
        });

        await passenger.save();

        res.json({
            success: true,
            message: 'Payment method added successfully',
            data: passenger.paymentMethods
        });
    } catch (error) {
        console.error('Add payment method error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error adding payment method'
        });
    }
};

exports.removePaymentMethod = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const cardIndex = req.params.index;

        const passenger = await Passenger.findOne({ user_id: req.session.user._id });
        
        if (!passenger) {
            return res.status(404).json({
                success: false,
                message: 'Passenger profile not found'
            });
        }

        if (!passenger.paymentMethods || cardIndex >= passenger.paymentMethods.length) {
            return res.status(404).json({
                success: false,
                message: 'Payment method not found'
            });
        }

        const removedCard = passenger.paymentMethods[cardIndex];
        passenger.paymentMethods.splice(cardIndex, 1);

        if (removedCard.isDefault && passenger.paymentMethods.length > 0) {
            passenger.paymentMethods[0].isDefault = true;
        }

        await passenger.save();

        res.json({
            success: true,
            message: 'Payment method removed successfully',
            data: passenger.paymentMethods
        });
    } catch (error) {
        console.error('Remove payment method error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing payment method'
        });
    }
};

exports.setDefaultPaymentMethod = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const cardIndex = req.params.index;

        const passenger = await Passenger.findOne({ user_id: req.session.user._id });
        
        if (!passenger) {
            return res.status(404).json({
                success: false,
                message: 'Passenger profile not found'
            });
        }

        if (!passenger.paymentMethods || cardIndex >= passenger.paymentMethods.length) {
            return res.status(404).json({
                success: false,
                message: 'Payment method not found'
            });
        }

        passenger.paymentMethods.forEach(function(card, index) {
            card.isDefault = (index === parseInt(cardIndex));
        });

        await passenger.save();

        res.json({
            success: true,
            message: 'Default payment method updated',
            data: passenger.paymentMethods
        });
    } catch (error) {
        console.error('Set default payment method error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating default payment method'
        });
    }
};

// notification preferences 
exports.updateNotificationPreferences = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const { promotionalOffers, flightStatusAlerts, loyaltyUpdates, smsAlerts } = req.body;

        let passenger = await Passenger.findOne({ user_id: req.session.user._id });
        
        if (!passenger) {
            passenger = new Passenger({
                user_id: req.session.user._id,
                full_name: 'User',
                contact_num: req.session.user.phone || 'N/A',
                passport_num: 'PENDING',
                nationality: 'Filipino',
                birth_date: new Date('2000-01-01'),
                gender: 'Prefer not to say',
                type: 'Adult',
                emergency_contact: 'N/A'
            });
            await passenger.save();
        }

        if (!passenger.notificationPreferences) {
            passenger.notificationPreferences = {
                promotionalOffers: true,
                flightStatusAlerts: true,
                loyaltyUpdates: true,
                smsAlerts: true
            };
        }

        if (promotionalOffers !== undefined) {
            passenger.notificationPreferences.promotionalOffers = promotionalOffers;
        }
        if (flightStatusAlerts !== undefined) {
            passenger.notificationPreferences.flightStatusAlerts = flightStatusAlerts;
        }
        if (loyaltyUpdates !== undefined) {
            passenger.notificationPreferences.loyaltyUpdates = loyaltyUpdates;
        }
        if (smsAlerts !== undefined) {
            passenger.notificationPreferences.smsAlerts = smsAlerts;
        }

        await passenger.save();

        res.json({
            success: true,
            message: 'Notification preferences updated',
            data: passenger.notificationPreferences
        });
    } catch (error) {
        console.error('Update notification preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating notification preferences'
        });
    }
};