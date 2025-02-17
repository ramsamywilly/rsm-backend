const mongoose = require('mongoose');

// Définition du schéma pour les articles de blog
const BlogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
    },
    date: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
    },
    article: {
      type: String,
    },
    likes: {
      type: Number,
      default: 0,  // Nombre initial de likes
    },
  },
  { timestamps: true }
);

// Création du modèle Blog à partir du schéma BlogSchema
const Blog = mongoose.model('Blog', BlogSchema);

module.exports = Blog;
