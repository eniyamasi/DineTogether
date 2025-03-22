const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },

  items: [{
    name: {
      type: String,
      required: true,
  },
  price: {
      type: Number,
      required: true,
      min: 0, // Ensure price is non-negative
  }
  }],
  totalAmount: {
    type: Number,
    required: true,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  preparationStatus: { 
    type: String, 
    default: 'Pending' 
  },//'Pending', 'Prepared'
  receivedStatus: { 
    type: String, 
    default: 'Not Received' 
  }, // 'Not Received', 'Received'
});

module.exports = mongoose.model('Order', OrderSchema);
