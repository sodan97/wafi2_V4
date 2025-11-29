import express from 'express';
const router = express.Router();
import Favorite from '../models/Favorite.js';
import Product from '../models/Product.js';
import { protect } from '../middleware/authMiddleware.js';

// @desc    Get all favorites for the logged-in user
// @route   GET /api/favorites
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id })
                                    .populate('productId')
                                    .sort({ date: -1 });

    // Filter out favorites where product no longer exists or is deleted
    const validFavorites = favorites.filter(fav => fav.productId && fav.productId.status !== 'deleted');

    res.json(validFavorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Add a product to favorites
// @route   POST /api/favorites
// @access  Private
router.post('/', protect, async (req, res) => {
  const { productId } = req.body; // This is the numeric id
  const userId = req.user.id;

  if (!productId) {
    return res.status(400).json({ message: 'Product ID is required' });
  }

  try {
    // Find the product by its numeric id to get the MongoDB _id
    const product = await Product.findOne({ id: productId });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if already in favorites using the MongoDB _id
    const existingFavorite = await Favorite.findOne({ productId: product._id, userId });
    if (existingFavorite) {
      return res.status(400).json({ message: 'Product already in favorites' });
    }

    // Create favorite with the MongoDB _id
    const newFavorite = new Favorite({ productId: product._id, userId });
    const createdFavorite = await newFavorite.save();

    // Populate product details before sending response
    await createdFavorite.populate('productId');

    res.status(201).json(createdFavorite);
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @desc    Remove a product from favorites
// @route   DELETE /api/favorites/:productId
// @access  Private
router.delete('/:productId', protect, async (req, res) => {
  const { productId } = req.params; // This is the numeric id
  const userId = req.user.id;

  try {
    // Find the product by its numeric id to get the MongoDB _id
    const product = await Product.findOne({ id: parseInt(productId) });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete favorite using the MongoDB _id
    const favorite = await Favorite.findOneAndDelete({ productId: product._id, userId });

    if (!favorite) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    res.json({ message: 'Favorite removed successfully' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Check if a product is in favorites
// @route   GET /api/favorites/check/:productId
// @access  Private
router.get('/check/:productId', protect, async (req, res) => {
  const { productId } = req.params; // This is the numeric id
  const userId = req.user.id;

  try {
    // Find the product by its numeric id to get the MongoDB _id
    const product = await Product.findOne({ id: parseInt(productId) });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check favorite using the MongoDB _id
    const favorite = await Favorite.findOne({ productId: product._id, userId });
    res.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error('Error checking favorite:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
