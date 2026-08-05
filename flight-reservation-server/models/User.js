const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  user_id: {
    type: Number,
    unique: true,
    index: true 
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        const phoneRegex = /^\+?[0-9\s\-\(\)]{7,20}$/;
        if (!phoneRegex.test(v)) {
          return false;
        }
        const digits = v.replace(/\D/g, '');
        return digits.length >= 7 && digits.length <= 15;
      },
      message: 'Please enter a valid phone number (e.g., +63 912 345 6789, +1 234 567 8900)'
    }
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  
  profilePicture: {
    type: String,
    default: null
  },
  
  created_at: {
    type: Date,
    default: Date.now
  },
  
  last_login: {
    type: Date,
    default: null
  },
  
  role: {
    type: String,
    enum: ['passenger', 'admin'],
    default: 'passenger'
  },
  
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const lastUser = await this.constructor.findOne({}, {}, { sort: { 'user_id': -1 } });
      if (lastUser) {
        this.user_id = lastUser.user_id + 1;
      } else {
        this.user_id = 1000;
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Find by email with password
userSchema.statics.findByEmailWithPassword = function(email) {
  return this.findOne({ email }).select('+password');
};

module.exports = mongoose.model('User', userSchema);