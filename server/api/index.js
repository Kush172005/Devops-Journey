// Vercel serverless entry: export Express app so Vercel can run it per request
const app = require('../server');
module.exports = app;
