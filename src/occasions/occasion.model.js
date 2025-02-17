const mongoose = require('mongoose');

const occasionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    condition: { type: String, enum: ['Neuf', 'Très bon état', 'Bon état', 'satisfaisant'], required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Occasion', occasionSchema);
