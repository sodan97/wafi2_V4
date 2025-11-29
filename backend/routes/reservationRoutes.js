import express from 'express';
const router = express.Router();
import Reservation from '../models/Reservation.js';
import { protect, admin } from '../middleware/authMiddleware.js';

// @desc    Create a new reservation
// @route   POST /api/reservations
// @access  Private
router.post('/', protect, async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.id; // Get user ID from token

  if (!productId) {
    return res.status(400).json({ message: 'Product ID is required' });
  }

  try {
    const existingReservation = await Reservation.findOne({ productId, userId });
    if (existingReservation) {
      return res.status(400).json({ message: 'You have already reserved this product' });
    }

    const newReservation = new Reservation({ productId, userId });
    const createdReservation = await newReservation.save();
    res.status(201).json(createdReservation);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get reservations for the logged-in user
// @route   GET /api/reservations/mine
// @access  Private
router.get('/mine', protect, async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.user.id })
                                          .populate('productId', 'name imageUrls'); // Populate product details
    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const reservations = await Reservation.find({})
                                          .populate('productId', 'name')
                                          .populate('userId', 'firstName lastName email');
    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Remove reservations for a specific product
// @route   DELETE /api/reservations/product/:productId
// @access  Private/Admin
router.delete('/product/:productId', protect, admin, async (req, res) => {
  const { productId } = req.params;
  try {
    await Reservation.deleteMany({ productId });
    res.json({ message: 'Reservations for the product have been removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
