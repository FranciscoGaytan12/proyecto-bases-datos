const request = require('supertest');
const app = require('./server');

describe('Payment Routes', () => {
  describe('POST /api/payments', () => {
    it('should create a payment successfully', async () => {
      const paymentData = {
        policy_id: 1,
        amount: 100,
        payment_method: 'credit_card',
        payment_date: '2025-05-27',
        transaction_id: '123456789',
        status: 'completed',
        card_last_four: '1234',
        card_holder: 'John Doe'
      };

      const response = await request(app)
        .post('/api/payments')
        .send(paymentData)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Pago registrado exitosamente');
      expect(response.body).toHaveProperty('payment_id');
    });

    it('should return an error for missing fields', async () => {
      const paymentData = {
        policy_id: 1,
        amount: 100
      };

      const response = await request(app)
        .post('/api/payments')
        .send(paymentData)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Todos los campos son requeridos');
    });
  });
});
