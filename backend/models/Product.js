import mongoose from 'mongoose';
import notificationService from '../services/notificationService.js';

const productSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  imageUrls: {
    type: [String],
    default: [],
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    required: true,
    default: 'active',
    enum: ['active', 'archived', 'deleted'],
  },
});

// Pre-save hook to generate sequential ID
productSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastProduct = await this.constructor.findOne({}, {}, { sort: { 'id': -1 } });
    this.id = lastProduct ? lastProduct.id + 1 : 1;
  }

  // Capturer l'ancien stock avant la sauvegarde (pour détecter les changements)
  if (!this.isNew) {
    const original = await this.constructor.findById(this._id);
    this._originalStock = original ? original.stock : 0;
  }

  next();
});

// Post-save hook to detect stock changes and send notifications
productSchema.post('save', async function(doc) {
  try {
    // Vérifier si le stock est passé de 0 (ou moins) à une valeur positive
    const wasOutOfStock = this._originalStock !== undefined && this._originalStock <= 0;
    const isNowInStock = doc.stock > 0;

    if (wasOutOfStock && isNowInStock) {
      console.log(`🔔 [Product Model] Stock restored for product "${doc.name}" (${this._originalStock} → ${doc.stock})`);

      // Envoyer les notifications de manière asynchrone (ne pas bloquer la sauvegarde)
      notificationService.notifyStockAvailable(doc).catch(error => {
        console.error(`❌ [Product Model] Error sending notifications for product "${doc.name}":`, error);
      });
    }
  } catch (error) {
    console.error(`❌ [Product Model] Error in post-save hook:`, error);
    // Ne pas propager l'erreur pour ne pas bloquer la sauvegarde du produit
  }
});

const Product = mongoose.model('Product', productSchema);

export default Product;