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

app.use(cors());
app.use(express.json());

const products = [
  {
    id: 1,
    name: 'Wireless Headphones',
    description:
      'Premium noise-cancelling wireless headphones with 30-hour battery life and soft ear cushions.',
    price: 14999,
    category: 'Audio',
    imageUrl: '/products/01-headphones.jpg',
  },
  {
    id: 2,
    name: 'Smart Watch',
    description: 'Fitness tracking smartwatch with heart rate monitor, GPS, and 7-day battery.',
    price: 24999,
    category: 'Wearables',
    imageUrl: '/products/02-watch.jpg',
  },
  {
    id: 3,
    name: 'Aluminum Laptop Stand',
    description: 'Ergonomic aluminum laptop stand with adjustable height and cable management.',
    price: 3999,
    category: 'Desk',
    imageUrl: '/products/03-stand.jpg',
  },
  {
    id: 4,
    name: 'Mechanical Keyboard',
    description: 'RGB backlit mechanical keyboard with tactile switches and durable keycaps.',
    price: 8999,
    category: 'Peripherals',
    imageUrl: '/products/04-keyboard.jpg',
  },
  {
    id: 5,
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with precision tracking and silent clicks.',
    price: 2499,
    category: 'Peripherals',
    imageUrl: '/products/05-mouse.jpg',
  },
  {
    id: 6,
    name: 'USB-C Hub',
    description: 'Multi-port USB-C hub with HDMI 4K, USB 3.0, and SD card reader.',
    price: 5499,
    category: 'Desk',
    imageUrl: '/products/06-hub.jpg',
  },
  {
    id: 7,
    name: 'HD Webcam',
    description: '1080p webcam with built-in microphone and auto light correction.',
    price: 4999,
    category: 'Peripherals',
    imageUrl: '/products/07-webcam.jpg',
  },
  {
    id: 8,
    name: 'Desk Lamp',
    description: 'LED desk lamp with adjustable brightness and warm-to-cool colour temperature.',
    price: 3299,
    category: 'Desk',
    imageUrl: '/products/08-lamp.jpg',
  },
  {
    id: 9,
    name: 'Bluetooth Speaker',
    description: 'Portable Bluetooth speaker with 12-hour battery and rich bass.',
    price: 4499,
    category: 'Audio',
    imageUrl: '/products/09-speaker.jpg',
  },
  {
    id: 10,
    name: 'Monitor Arm',
    description: 'Single monitor arm with tilt, swivel, and height adjustment. VESA compatible.',
    price: 5999,
    category: 'Desk',
    imageUrl: '/products/10-arm.jpg',
  },
];

let cart = [];
let cartIdCounter = 1;

function getProduct(id) {
  const n = Number.parseInt(String(id), 10);
  if (Number.isNaN(n)) return null;
  return products.find((p) => p.id === n) || null;
}

app.get('/api/products', (req, res) => {
  const { category } = req.query;
  if (category && typeof category === 'string' && category.trim()) {
    const key = category.trim();
    return res.json(products.filter((p) => p.category === key));
  }
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = getProduct(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

app.get('/api/cart', (req, res) => {
  res.json(cart);
});

app.post('/api/cart', (req, res) => {
  const { productId, name, price, quantity } = req.body;

  if (productId === undefined || productId === null || !name || price === undefined || price === null || quantity === undefined || quantity === null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const product = getProduct(productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
    return res.status(400).json({ error: 'Quantity must be an integer from 1 to 99' });
  }

  const clientPrice = Number(price);
  if (clientPrice !== product.price) {
    return res.status(400).json({ error: 'Price must match the catalog listing' });
  }

  if (String(name).trim() !== product.name) {
    return res.status(400).json({ error: 'Product name must match the catalog listing' });
  }

  const newItem = {
    id: cartIdCounter++,
    productId: product.id,
    name: product.name,
    price: product.price,
    quantity: qty,
  };

  cart.push(newItem);
  res.status(201).json(newItem);
});

app.put('/api/cart/:id', (req, res) => {
  const itemId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(itemId)) {
    return res.status(400).json({ error: 'Invalid cart item id' });
  }

  const { quantity } = req.body;
  const item = cart.find((i) => i.id === itemId);
  if (!item) {
    return res.status(404).json({ error: 'Cart item not found' });
  }

  if (quantity === undefined || quantity === null) {
    return res.status(400).json({ error: 'Quantity is required' });
  }

  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
    return res.status(400).json({ error: 'Quantity must be an integer from 1 to 99' });
  }

  item.quantity = qty;
  res.json(item);
});

app.delete('/api/cart/:id', (req, res) => {
  const itemId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(itemId)) {
    return res.status(400).json({ error: 'Invalid cart item id' });
  }

  const index = cart.findIndex((i) => i.id === itemId);
  if (index === -1) {
    return res.status(404).json({ error: 'Cart item not found' });
  }

  cart.splice(index, 1);
  res.status(204).send();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

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
