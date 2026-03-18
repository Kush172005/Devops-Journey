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

- **`GET /health`** – Health check (returns `{ "status": "ok" }`). Use for load balancers, monitoring, and CI.
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/cart` - Get cart items
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item quantity
- `DELETE /api/cart/:id` - Remove item from cart

## GitHub Actions

Workflows automatically test frontend build and backend server on push/PR. Frontend PRs must pass ESLint. Dependabot opens weekly PRs for dependency updates.

---

## Deployment

### Option A: Frontend on GitHub Pages + Backend on Vercel (recommended)

1. **Deploy backend to Vercel**
   - Go to [vercel.com](https://vercel.com), sign in with GitHub, and import your repo.
   - Set **Root Directory** to `server` (so only the server folder is deployed).
   - Deploy. Note the URL (e.g. `https://your-project.vercel.app`).

2. **Deploy frontend to GitHub Pages**
   - In your repo: **Settings → Pages → Build and deployment**: set Source to **GitHub Actions**.
   - Add a repository secret: **Settings → Secrets and variables → Actions**: create `VITE_API_URL` with value = your Vercel backend URL (e.g. `https://your-project.vercel.app`).
   - Push to `main` (or trigger the “Deploy to GitHub Pages” workflow). The workflow builds the client with that API URL and deploys to GitHub Pages.
   - Your site will be at `https://<username>.github.io/<repo>/` (or your custom domain). The frontend will call the Vercel API automatically.

### Option B: Full app on EC2 (GitHub Actions → EC2)

Automated deploy: every push to `main` builds the app, copies it to EC2, and restarts the Node service (pm2).

1. **One-time EC2 setup**
   - Launch an Ubuntu EC2 instance. SSH in and install Node 20 and pm2:
     ```bash
     curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
     sudo apt-get install -y nodejs
     sudo npm install -g pm2
     mkdir -p /home/ubuntu/app/server /home/ubuntu/app/client
     ```
   - Ensure security group allows inbound traffic on port 3000 (or the port your app uses).

2. **GitHub secrets**
   - **EC2_SSH_KEY**: entire contents of your `.pem` file (private key for the EC2 instance).
   - **EC2_HOST**: EC2 public IP or hostname.
   - **EC2_APP_URL** (optional): public URL of your app (e.g. `http://<EC2_IP>:3000`) so the built frontend knows where the API is.
   - **EC2_APP_PATH** (optional): path on EC2 where the app lives; default is `/home/ubuntu/app`.

3. **Deploy**
   - Push to `main` or run the “Deploy App to EC2” workflow manually. It will build the client, copy `server/` and `client/dist` to EC2, run `npm ci` in `server/`, and `pm2 restart shophub` (or `pm2 start` on first run).
   - Open `http://<EC2_IP>:3000` to use the app (API + frontend served from the same origin).
