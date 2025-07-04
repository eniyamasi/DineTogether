const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const SharedCartSchema = new mongoose.Schema({
    cartId: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ownerUsername: {
        type: String,
        required: true
    },
    items: [{
        name: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        addedBy: {
            type: String,
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    totalAmount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    allowedUsers: [{
        type: String // usernames of people who can add to cart
    }]
});

// Update totalAmount whenever items are modified
SharedCartSchema.pre('save', function(next) {
    this.totalAmount = this.items.reduce((total, item) => total + item.price, 0);
    this.lastUpdated = new Date();
    next();
});

module.exports = mongoose.model('SharedCart', SharedCartSchema);