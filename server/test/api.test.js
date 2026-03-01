const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../server');

describe('API', () => {
  describe('GET /health', () => {
    it('returns status ok', async () => {
      const res = await request(app).get('/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'ok');
    });
  });

  describe('GET /api/products', () => {
    it('returns an array of products', async () => {
      const res = await request(app).get('/api/products');
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.body));
      assert(res.body.length >= 1);
      assert(res.body[0].id);
      assert(res.body[0].name);
      assert(res.body[0].price);
    });
  });

  describe('GET /api/products/:id', () => {
    it('returns product when id exists', async () => {
      const res = await request(app).get('/api/products/1');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.id, 1);
      assert(res.body.name);
    });

    it('returns 404 when product not found', async () => {
      const res = await request(app).get('/api/products/99999');
      assert.strictEqual(res.status, 404);
    });
  });

  describe('POST /api/cart', () => {
    it('returns 400 when required fields missing', async () => {
      const res = await request(app)
        .post('/api/cart')
        .send({ productId: 1 });
      assert.strictEqual(res.status, 400);
    });

    it('creates cart item with valid data', async () => {
      const res = await request(app)
        .post('/api/cart')
        .send({
          productId: 1,
          name: 'Test Product',
          price: 10,
          quantity: 1,
        });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.productId, 1);
      assert.strictEqual(res.body.quantity, 1);
    });
  });
});
