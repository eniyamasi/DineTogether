# Shared Cart System Guide

## Overview

The enhanced canteen ordering system now includes a robust shared cart feature that allows users to create shareable cart links, collaborate on orders, and manage group food ordering efficiently.

## Features

### 🔗 **Shareable Cart Links**
- Create a unique shareable link for your cart
- Share the link with friends via any messaging platform
- Link is automatically copied to clipboard when created

### 👥 **Collaborative Cart Management**
- Friends can add items to your shared cart using the link
- Real-time updates show when items are added by others
- Track who added each item in the cart

### 🔒 **Access Control**
- Only the cart owner (creator) can checkout and place the final order
- Friends can only add items, not remove or checkout
- Clear visual indicators show cart ownership

### ⚡ **Real-time Updates**
- Instant notifications when someone adds items to your shared cart
- Live cart total updates for all participants
- Automatic UI updates when cart is checked out

## How It Works

### Creating a Shared Cart

1. **Add Items**: Add items to your cart as usual
2. **Share Cart**: Click the green "Share Cart" button in the cart modal
3. **Get Link**: The shareable link is automatically copied to your clipboard
4. **Share**: Send the link to your friends via text, email, or any messaging app

### Joining a Shared Cart

1. **Click Link**: Click the shared cart link sent by your friend
2. **Login**: Make sure you're logged in to your account
3. **Add Items**: You can now add items to the shared cart
4. **Collaborate**: See real-time updates as others add items

### Checkout Process

- **Owner Only**: Only the person who created the shared cart can checkout
- **Final Order**: The checkout includes all items added by all participants
- **Order Attribution**: The order is placed under the cart owner's name
- **Cart Closure**: Once checked out, the cart becomes inactive

## User Interface Features

### Shared Cart Banner
When viewing a shared cart, you'll see:
- Cart owner information
- Your access level (owner vs. contributor)
- Creation timestamp
- "Copy Link Again" button for owners

### Cart Items Display
- Each item shows who added it
- Real-time updates with notifications
- Different permissions based on your role

### Visual Indicators
- **Green badge**: Shows cart owner
- **Disabled buttons**: Indicates restricted actions
- **Notifications**: Real-time updates and status messages

## Technical Implementation

### Backend API Endpoints

#### Create Shared Cart
```
POST /auth/create-shared-cart
Headers: Authorization: Bearer <token>
Body: { items: [{ name: "Item", price: 100 }] }
```

#### Get Shared Cart
```
GET /auth/shared-cart/:cartId
Returns: Cart details, items, owner info
```

#### Add to Shared Cart
```
POST /auth/add-to-shared-cart
Body: { cartId: "uuid", item: { name: "Item", price: 100 } }
```

#### Checkout Shared Cart
```
POST /auth/checkout-shared-cart
Body: { cartId: "uuid" }
Access: Owner only
```

### Database Schema

#### SharedCart Model
```javascript
{
  cartId: String (UUID),
  ownerId: ObjectId,
  ownerUsername: String,
  items: [{
    name: String,
    price: Number,
    addedBy: String,
    addedAt: Date
  }],
  totalAmount: Number,
  isActive: Boolean,
  createdAt: Date,
  lastUpdated: Date
}
```

### Real-time Features

- **Socket.io Integration**: Real-time cart updates
- **Event Broadcasting**: Notify all cart participants of changes
- **Automatic UI Updates**: Seamless user experience

## Usage Examples

### Example 1: Office Lunch Order
1. Sarah creates a cart and adds a burger
2. She shares the cart link in the office group chat
3. John, Mike, and Lisa add their items using the link
4. Sarah sees all additions in real-time
5. Sarah checks out the complete order for everyone

### Example 2: Friend Group Dinner
1. Alex starts a cart for pizza night
2. Shares link with 5 friends
3. Each friend adds their preferred items
4. Real-time notifications keep everyone updated
5. Alex places the final order with everyone's items

## Security Features

- **JWT Authentication**: All API calls require valid tokens
- **Owner Verification**: Checkout restricted to cart creator
- **Token Expiration**: Automatic session management
- **Input Validation**: Secure data handling

## Error Handling

### Common Scenarios
- **Expired Cart**: Graceful handling of inactive carts
- **Unauthorized Access**: Clear error messages for permission issues
- **Network Issues**: Retry mechanisms and user feedback
- **Invalid Links**: User-friendly error messages

## Browser Compatibility

- **Modern Browsers**: Full support for Chrome, Firefox, Safari, Edge
- **Clipboard API**: Automatic link copying
- **WebSocket Support**: Real-time features
- **Responsive Design**: Works on mobile and desktop

## Troubleshooting

### Link Not Working
- Check if you're logged in
- Verify the cart is still active
- Ensure stable internet connection

### Can't Checkout
- Verify you're the cart owner
- Check if cart has items
- Ensure valid authentication

### Real-time Updates Not Working
- Check internet connection
- Refresh the page
- Verify JavaScript is enabled

## Future Enhancements

- **Cart Expiration**: Automatic cart cleanup after time
- **Item Limits**: Set maximum items per user
- **Payment Integration**: Split payment options
- **Order History**: Shared cart order tracking
- **Mobile App**: Native mobile application

## Support

For technical issues or questions:
1. Check this guide first
2. Verify your internet connection
3. Try refreshing the page
4. Contact system administrator

---

**Happy Collaborative Ordering! 🍕🍔🍟**