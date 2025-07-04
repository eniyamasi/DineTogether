const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('C:\\Users\\eniya\\OneDrive\\Desktop\\rishabs\\user.js');
const SharedCart = require('./sharedCart.js');
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
    const { cart, total,referrerId } = req.body;
    // const userId = req.user.userId;
    const userId = req.user.userId;
    if(referrerId){
      console.log(referrerId);
      userId = referrerId;
    }
    
    // const userId = referrerId;
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
router.post('/update-cart', authenticateToken, async (req, res) => {
  console.log("Entered update cart");
  const { referrerId, item } = req.body;

  if (!referrerId || !item) {
      return res.status(400).json({ success: false, message: "Missing referrerId or item" });
  }

  try {
      const user1 = await User.findOne({username: referrerId});
      const user2 = await User.findOne({username: req.user.username});
      if(user2){
        console.log("user2 is present");
      }
      if(user1){
        console.log("user1 is present");
      }
      if (!user1||!user2) {
          return res.status(404).json({ success: false, message: "User not found." });
      }
      if (!user1.items) {
        user1.items = [];
      }
      if (!user2.items) {
        user2.items = [];
      }
      // console.log("user1's cart",user1.username);
      user1.items.push({ name: item.name, price: item.price, addedBy: user2.username });
      user2.items.push({ name: item.name, price: item.price, addedBy: user2.username });
      await user1.save();
      await user2.save();
      res.json({ success: true, message: "Item added to referrer’s cart." });
  } catch (error) {
      console.error("Error updating sender's cart:", error);
      res.status(500).json({ success: false, message: "Server error." });
  }
});

// Create shared cart
router.post('/create-shared-cart', authenticateToken, async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.user.userId;
    const username = req.user.username;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Create new shared cart
    const sharedCart = new SharedCart({
      ownerId: userId,
      ownerUsername: username,
      items: items.map(item => ({
        name: item.name,
        price: item.price,
        addedBy: username
      }))
    });

    await sharedCart.save();

    // Generate shareable link
    const shareUrl = `${req.headers.origin || 'http://localhost:5500'}/menu.html?cartId=${sharedCart.cartId}`;

    res.json({
      success: true,
      cartId: sharedCart.cartId,
      shareUrl: shareUrl,
      message: "Shared cart created successfully!"
    });
  } catch (error) {
    console.error("Error creating shared cart:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Get shared cart details
router.get('/shared-cart/:cartId', async (req, res) => {
  try {
    const { cartId } = req.params;
    
    const sharedCart = await SharedCart.findOne({ cartId, isActive: true });
    if (!sharedCart) {
      return res.status(404).json({ success: false, message: "Shared cart not found or expired." });
    }

    res.json({
      success: true,
      cart: {
        cartId: sharedCart.cartId,
        ownerUsername: sharedCart.ownerUsername,
        items: sharedCart.items,
        totalAmount: sharedCart.totalAmount,
        createdAt: sharedCart.createdAt
      }
    });
  } catch (error) {
    console.error("Error fetching shared cart:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Add item to shared cart
router.post('/add-to-shared-cart', authenticateToken, async (req, res) => {
  try {
    const { cartId, item } = req.body;
    const username = req.user.username;

    if (!cartId || !item) {
      return res.status(400).json({ success: false, message: "Missing cartId or item." });
    }

    const sharedCart = await SharedCart.findOne({ cartId, isActive: true });
    if (!sharedCart) {
      return res.status(404).json({ success: false, message: "Shared cart not found or expired." });
    }

    // Add item to shared cart
    sharedCart.items.push({
      name: item.name,
      price: item.price,
      addedBy: username
    });

    await sharedCart.save();

    // Emit real-time update to cart owner and other users
    if (global.io) {
      global.io.emit(`sharedCart-${cartId}`, {
        type: 'itemAdded',
        item: {
          name: item.name,
          price: item.price,
          addedBy: username
        },
        totalAmount: sharedCart.totalAmount
      });
    }

    res.json({
      success: true,
      message: "Item added to shared cart!",
      totalAmount: sharedCart.totalAmount
    });
  } catch (error) {
    console.error("Error adding item to shared cart:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Checkout shared cart (only owner can checkout)
router.post('/checkout-shared-cart', authenticateToken, async (req, res) => {
  try {
    const { cartId } = req.body;
    const userId = req.user.userId;
    const username = req.user.username;

    if (!cartId) {
      return res.status(400).json({ success: false, message: "Missing cartId." });
    }

    const sharedCart = await SharedCart.findOne({ cartId, isActive: true });
    if (!sharedCart) {
      return res.status(404).json({ success: false, message: "Shared cart not found or expired." });
    }

    // Check if the user is the owner of the cart
    if (sharedCart.ownerId.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: "Only the cart owner can checkout. You can only add items to this shared cart." 
      });
    }

    if (sharedCart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty." });
    }

    // Create order from shared cart
    const Order = require('./order.js');
    const newOrder = await Order.create({
      username: username,
      items: sharedCart.items.map(item => ({
        name: item.name,
        price: item.price
      })),
      totalAmount: sharedCart.totalAmount,
      orderDate: new Date(),
    });

    // Mark shared cart as inactive
    sharedCart.isActive = false;
    await sharedCart.save();

    // Emit checkout notification
    if (global.io) {
      global.io.emit(`sharedCart-${cartId}`, {
        type: 'cartCheckedOut',
        orderId: newOrder._id,
        message: 'Cart has been checked out successfully!'
      });
    }

    res.json({
      success: true,
      message: "Order placed successfully!",
      orderId: newOrder._id,
      totalAmount: sharedCart.totalAmount
    });
  } catch (error) {
    console.error("Error checking out shared cart:", error);
    res.status(500).json({ success: false, message: "Server error." });
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