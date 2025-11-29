import express from 'express';
import Product from '../models/Product.js'; // Add .js extension
import mongoose from 'mongoose';
import { body, validationResult, param } from 'express-validator';
import { PRODUCTS } from '../constants/products.js'; // Import fallback data
// import { protect } from '../middleware/authMiddleware.js'; // Temporarily disabled for development
// import { admin } from '../middleware/authMiddleware.js'; // Temporarily disabled for development

const router = express.Router();

// GET all active products
router.get('/', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      const products = await Product.find({ status: 'active' });
      res.status(200).json(products);
    } else {
      // Fallback to local data
      console.log('🔄 Using fallback data (MongoDB not connected)');
      const activeProducts = PRODUCTS.filter(p => p.status === 'active');
      res.status(200).json(activeProducts);
    }
  } catch (err) {
    console.error('Error in GET /products:', err);
    // Fallback to local data on error
    const activeProducts = PRODUCTS.filter(p => p.status === 'active');
    res.status(200).json(activeProducts);
  }
});

// GET all products (for admin) - includes archived/deleted
router.get('/admin', /* protect, admin, */ async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      const products = await Product.find({});
      res.json(products);
    } else {
      // Fallback to local data
      console.log('🔄 Using fallback data for admin (MongoDB not connected)');
      res.json(PRODUCTS);
    }
  } catch (err) {
    console.error('Error in GET /admin products:', err);
    // Fallback to local data on error
    res.json(PRODUCTS);
  }
});

// GET a single product by ID
router.get('/:id', async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const productId = parseInt(req.params.id);

    // Check if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      const product = await Product.findOne({ id: productId });
      if (product == null) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.json(product);
    } else {
      // Fallback to local data
      const product = PRODUCTS.find(p => p.id === productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.json(product);
    }
  } catch (err) {
    console.error('Error in GET /products/:id:', err);
    // Fallback to local data on error
    const productId = parseInt(req.params.id);
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  }
});

// POST add a new product
router.post('/', /* protect, admin, */ [
  body('name').isString().notEmpty().withMessage('Name is required and must be a string'),
  body('description').isString().notEmpty().withMessage('Description is required and must be a string'),
  body('price').isFloat({ gt: 0 }).withMessage('Price is required and must be a positive number'),
  body('imageUrls').isArray().withMessage('Image URLs must be an array'),
  body('imageUrls.*').isURL().withMessage('Each image URL must be a valid URL'), // Added validation for each URL in the array
  body('category').isString().notEmpty().withMessage('Category is required and must be a string'),
  body('stock').isInt({ gt: -1 }).withMessage('Stock is required and must be a non-negative integer'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // NOTE: If using Mongoose _id, remove the manual ID generation.
  // The schema should not have an 'id' field with manual generation.
  // If you need a sequential product number for display, handle it separately.
  // const lastProduct = await Product.findOne().sort({ id: -1 }).limit(1);
  // const newId = lastProduct ? lastProduct.id + 1 : 1;

  const product = new Product({
    // id: newId, // Remove if using Mongoose _id
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    imageUrls: req.body.imageUrls,
    category: req.body.category,
    stock: req.body.stock,
    status: req.body.status || 'active',
  });

  try {
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update product status (for admin)
router.put('/:id/status', /* protect, admin, */ [
    param('id').isInt({ gt: 0 }).withMessage('Product ID must be a positive integer'),
    body('status').isIn(['active', 'archived', 'deleted']).withMessage('Invalid status value'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
    try {
        const product = await Product.findOneAndUpdate(
            { id: parseInt(req.params.id) },
            { status: req.body.status },
            { new: true }
        );
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
         res.status(500).json({ message: err.message }); // Use 400 for CastError
    }
});

 // PUT update an existing product
router.put('/:id', /* protect, admin, */ [
  param('id').isInt({ gt: 0 }).withMessage('Product ID must be a positive integer'),
  body('name').optional().isString().notEmpty().withMessage('Name must be a non-empty string'),
  body('description').optional().isString().notEmpty().withMessage('Description must be a non-empty string'),
  body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
  body('imageUrls').optional().isArray().withMessage('Image URLs must be an array'),
  body('imageUrls.*').optional().isURL().withMessage('Each image URL must be a valid URL'),
  body('category').optional().isString().notEmpty().withMessage('Category must be a non-empty string'), // Check if category is required
  body('stock').optional().isInt({ gt: -1 }).withMessage('Stock must be a non-negative integer'),
  body('status').optional().isIn(['active', 'archived', 'deleted']).withMessage('Invalid status value'), // ✅ Add status validation
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const product = await Product.findOne({ id: parseInt(req.params.id) });
    if (product == null) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (req.body.name != null) product.name = req.body.name;
    if (req.body.description != null) product.description = req.body.description;
    if (req.body.price != null) product.price = req.body.price;
    if (req.body.imageUrls != null) product.imageUrls = req.body.imageUrls;
    if (req.body.category != null) product.category = req.body.category;
    if (req.body.stock != null) product.stock = req.body.stock;
    if (req.body.status != null) product.status = req.body.status; // ✅ Allow status updates

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE permanently delete a product
router.delete('/:id', /* protect, admin, */ [
 param('id').isInt({ gt: 0 }).withMessage('Product ID must be a positive integer'),
], async (req, res) => {
    try {
        const result = await Product.deleteOne({ id: parseInt(req.params.id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product permanently deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE permanently delete a product (alternative route)
router.delete('/:id/permanent', /* protect, admin, */ [
 param('id').isInt({ gt: 0 }).withMessage('Product ID must be a positive integer'),
], async (req, res) => {
    try {
        const result = await Product.deleteOne({ id: parseInt(req.params.id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product permanently deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


export default router;