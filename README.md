# Full-Stack E-Commerce Application

A modern e-commerce application built with React, Tailwind CSS, Node.js, and Express.

## Quick Start

### Backend
```bash
cd server
npm install
npm start
```
Server runs on `http://localhost:3000`

### Frontend
```bash
cd client
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

## Environment Setup

### Client
Copy `.env.example` to `.env`:
```bash
cd client
cp .env.example .env
```

### Server
Copy `.env.example` to `.env`:
```bash
cd server
cp .env.example .env
```

## Tech Stack

- **Frontend**: React 19, Vite 7, Tailwind CSS v4.0
- **Backend**: Node.js, Express 5
- **CI/CD**: GitHub Actions

## API Endpoints

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/cart` - Get cart items
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item quantity
- `DELETE /api/cart/:id` - Remove item from cart

## GitHub Actions

Workflows automatically test frontend build and backend server on push/PR.
