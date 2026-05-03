require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data storage — prices in INR; images from Unsplash (free to use)
let products = [
  {
    id: 1,
    name: 'Wireless Headphones',
    description: 'Premium noise-cancelling wireless headphones with 30-hour battery life and soft ear cushions.',
    price: 14999,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
  },
  {
    id: 2,
    name: 'Smart Watch',
    description: 'Fitness tracking smartwatch with heart rate monitor, GPS, and 7-day battery.',
    price: 24999,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
  },
  {
    id: 3,
    name: 'Aluminum Laptop Stand',
    description: 'Ergonomic aluminum laptop stand with adjustable height and cable management.',
    price: 3999,
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80',
  },
  {
    id: 4,
    name: 'Mechanical Keyboard',
    description: 'RGB backlit mechanical keyboard with tactile switches and durable keycaps.',
    price: 8999,
    imageUrl: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=600&q=80',
  },
  {
    id: 5,
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with precision tracking and silent clicks.',
    price: 2499,
    imageUrl: 'https://images.unsplash.com/photo-1527814054347-8474b12b0538?w=600&q=80',
  },
  {
    id: 6,
    name: 'USB-C Hub',
    description: 'Multi-port USB-C hub with HDMI 4K, USB 3.0, and SD card reader.',
    price: 5499,
    imageUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80',
  },
  {
    id: 7,
    name: 'HD Webcam',
    description: '1080p webcam with built-in microphone and auto light correction.',
    price: 4999,
    imageUrl: 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=600&q=80',
  },
  {
    id: 8,
    name: 'Desk Lamp',
    description: 'LED desk lamp with adjustable brightness and warm-to-cool colour temperature.',
    price: 3299,
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80',
  },
  {
    id: 9,
    name: 'Bluetooth Speaker',
    description: 'Portable Bluetooth speaker with 12-hour battery and rich bass.',
    price: 4499,
    imageUrl: 'https://images.unsplash.com/photo-1545454670-2c83bb2e552b?w=600&q=80',
  },
  {
    id: 10,
    name: 'Monitor Arm',
    description: 'Single monitor arm with tilt, swivel, and height adjustment. VESA compatible.',
    price: 5999,
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80',
  },
];

let cart = [];
let cartIdCounter = 1;

// Product Routes
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// Cart Routes
app.get('/api/cart', (req, res) => {
  res.json(cart);
});

app.post('/api/cart', (req, res) => {
  const { productId, name, price, quantity } = req.body;
  
  if (!productId || !name || !price || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newItem = {
    id: cartIdCounter++,
    productId,
    name,
    price,
    quantity
  };

  cart.push(newItem);
  res.status(201).json(newItem);
});

app.put('/api/cart/:id', (req, res) => {
  const itemId = parseInt(req.params.id);
  const { quantity } = req.body;

  const item = cart.find(i => i.id === itemId);
  if (!item) {
    return res.status(404).json({ error: 'Cart item not found' });
  }

  if (quantity !== undefined) {
    item.quantity = quantity;
  }

  res.json(item);
});

app.delete('/api/cart/:id', (req, res) => {
  const itemId = parseInt(req.params.id);
  const index = cart.findIndex(i => i.id === itemId);

  if (index === -1) {
    return res.status(404).json({ error: 'Cart item not found' });
  }

  cart.splice(index, 1);
  res.status(204).send();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve React build on EC2 (same origin: one port for API + frontend)
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('/{*splat}', (req, res) =>
      res.sendFile(path.join(clientDist, 'index.html'))
    );
  }
}

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
