
import express from 'express';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();

// POST /api/orders - Add a new order
router.post('/', [
  body('customer').isObject(),
  body('items').isArray({ min: 1 }),
  body('total').isFloat({ gt: 0 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { customer, items, total, userId } = req.body;
    const newOrder = {
      customer,
      items,
      total,
      userId: userId || null,
      status: 'Pas commencé', // Default status
      createdAt: new Date().toISOString(),
    };

    const docRef = await req.db.collection('orders').add(newOrder);
    res.status(201).json({ id: docRef.id, ...newOrder });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/orders - Get all orders (for admin)
router.get('/', async (req, res) => {
  try {
    const ordersRef = req.db.collection('orders');
    const snapshot = await ordersRef.orderBy('createdAt', 'desc').get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(orders);

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/orders/myorders - Get orders for a specific user
router.get('/myorders', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const ordersRef = req.db.collection('orders');
    const snapshot = await ordersRef.where('userId', '==', userId).orderBy('createdAt', 'desc').get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(orders);

  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /api/orders/:id/status - Update order status (for admin)
router.put('/:id/status', [
  param('id').isString().notEmpty(),
  body('status').isString().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { status } = req.body;

    const docRef = req.db.collection('orders').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await docRef.update({ status });

    const updatedDoc = await docRef.get();
    res.json({ id: updatedDoc.id, ...updatedDoc.data() });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
