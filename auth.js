const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('C:\\Users\\eniya\\OneDrive\\Desktop\\rishabs\\user.js');
const cors = require('cors'); // Import CORS

const app = express();
const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server);

global.io = io; // Make it accessible globally
app.use(express.static('public'));
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  // Join room for notifications
  socket.on('joinRoom', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// app.use(cors({ origin: ['http://localhost:5000','http://127.0.0.1:5000'] })); 

router.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    try {
        const newUser = new User({ username, password });
        await newUser.save();
        res.status(201).json({ message: 'User created' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        // Token generation
        const token = jwt.sign(
            { userId: user._id, username: user.username },// Payload
            process.env.JWT_SECRET, // Secret key
            { expiresIn: '1h' } // Token expiration
        );
        console.log("Token generated:", token);
        // Send token in the response
        res.status(200).json({ 
            message: 'Login successful',
            token: token  // Send the token back to the client
        })
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Place Order route
const Order = require('./order.js'); // Import the Order model
// Middleware for verifying token and extracting username
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token missing' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ message: 'Invalid or expired token' });
      req.user = user; // Attach user info to the request object
      next();
  });
};
router.post('/place-order',authenticateToken, async (req, res) => {
  const { cart, total } = req.body;
  const userId = req.user.userId;
  console.log("Received order request:", req.body); // Log incoming order data
  
  try {
    const user = await User.findById(userId);
    if(!user){
      return res.status(404).json({message: 'user not found'});
    }
    // Create a new order document using the Order model
    const newOrder = await Order.create({
      username: user.username,
      items: cart,  // Assumes cart is an array of item objects like [{ item: "Burger", quantity: 2, price: 5 }]
      totalAmount: total,
      orderDate: new Date(),
    });

    console.log("Order placed successfully:", newOrder);

    // Send the success response
    res.status(200).json({
      success: true,
      message: 'Order placed successfully!',
      orderId: newOrder._id,
    });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ success: false, message: 'Failed to place order.' });
  }
});
// Update status (Preparation or Received)
app.use(express.json()); // Add this line in your server setup before your routes


// Route to get orders based on date range

router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find(); // Fetch all orders
    res.status(200).json({ orders });  // Sending { orders: [...] }
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }``
});
// Endpoint to filter orders by date range
router.get('/orders/filter', async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required." });
  }

  try {
      // Convert start and end dates to Date objects
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Find orders within the date range
      const orders = await Order.find({
          orderDate: {
              $gte: start,
              $lte: end
          }
      });

      res.status(200).json(orders);
  } catch (error) {
      console.error('Error filtering orders:', error);
      res.status(500).json({ message: "Failed to fetch filtered orders." });
  }
});
// PATCH route to update order status
router.patch('/orders/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    // Update order status in the database
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Emit notification to the user via Socket.IO
    const userId = order.userId; // Assuming order schema contains userId
    global.io.to(userId).emit('orderStatusUpdate', {
      orderId: order._id,
      status,
    });

    res.status(200).json({ message: `Order status updated to ${status}` });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status' });
  }
});

app.listen(5500, () => {
  console.log("Server running on http://localhost:5500");
});
module.exports = router;