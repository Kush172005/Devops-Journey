require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data storage
let products = [
  {
    id: 1,
    name: 'Wireless Headphones',
    description: 'Premium noise-cancelling wireless headphones with 30-hour battery life',
    price: 199.99,
    emoji: '🎧'
  },
  {
    id: 2,
    name: 'Smart Watch',
    description: 'Fitness tracking smartwatch with heart rate monitor and GPS',
    price: 299.99,
    emoji: '⌚'
  },
  {
    id: 3,
    name: 'Laptop Stand',
    description: 'Ergonomic aluminum laptop stand with adjustable height',
    price: 49.99,
    emoji: '💻'
  },
  {
    id: 4,
    name: 'Mechanical Keyboard',
    description: 'RGB backlit mechanical keyboard with tactile switches',
    price: 129.99,
    emoji: '⌨️'
  },
  {
    id: 5,
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with precision tracking',
    price: 59.99,
    emoji: '🖱️'
  },
  {
    id: 6,
    name: 'USB-C Hub',
    description: 'Multi-port USB-C hub with HDMI, USB 3.0, and SD card reader',
    price: 79.99,
    emoji: '🔌'
  }
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
