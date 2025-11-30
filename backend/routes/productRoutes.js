
import express from 'express';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();

// GET all products
router.get('/', async (req, res) => {
  try {
    const productsRef = req.db.collection('products');
    const snapshot = await productsRef.get();
    
    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(products);

  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET a single product by ID
router.get('/:id', [
  param('id').isString().notEmpty().withMessage('Product ID must be a valid string')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const docRef = req.db.collection('products').doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ id: doc.id, ...doc.data() });

  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST add a new product (Admin only - middleware to be added)
router.post('/', [
  body('name').isString().notEmpty(),
  body('description').isString().notEmpty(),
  body('price').isFloat({ gt: 0 }),
  body('category').isString().notEmpty(),
  body('stock').isInt({ gt: -1 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, price, category, stock, imageUrls } = req.body;
    const newProduct = {
      name,
      description,
      price,
      category,
      stock,
      imageUrls: imageUrls || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await req.db.collection('products').add(newProduct);
    res.status(201).json({ id: docRef.id, ...newProduct });

  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update an existing product (Admin only - middleware to be added)
router.put('/:id', [
  param('id').isString().notEmpty(),
], async (req, res) => {
  try {
    const docRef = req.db.collection('products').doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updateData = { ...req.body, updatedAt: new Date().toISOString() };

    await docRef.update(updateData);
    
    const updatedDoc = await docRef.get();

    res.json({ id: updatedDoc.id, ...updatedDoc.data() });

  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE a product (Admin only - middleware to be added)
router.delete('/:id', [
  param('id').isString().notEmpty(),
], async (req, res) => {
  try {
    const docRef = req.db.collection('products').doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await docRef.delete();
    res.json({ message: 'Product deleted successfully' });

  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
