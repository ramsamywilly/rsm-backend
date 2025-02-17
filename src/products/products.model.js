const mongoose = require('mongoose'); // Importation de mongoose pour interagir avec MongoDB

// Définition du schéma pour le modèle Product
const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String, // Type String pour le nom du produit
      required: true, // Le nom est obligatoire
    },
    category: {
      type: String, // Type String pour la catégorie
    },
    description: {
      type: String, // Type String pour la description
    },
    price: {
      type: Number, // Type Number pour le prix
      required: true, // Le prix est obligatoire
    },
    oldPrice: {
      type: Number, // Type Number pour l'ancien prix
    },
    image: {
      type: String, // Type String pour l'image du produit
    },
    gamme: {
      type: String, // Type String pour la gamme du produit
    },
    rating: {
      type: Number, // Type Number pour la note du produit
      default: 0, // Valeur par défaut de la note
    },
    author: {
      type: mongoose.Schema.Types.ObjectId, // Type ObjectId pour la référence à l'utilisateur (créateur)
      ref: "User", // Référence au modèle "User" pour lier le produit à un utilisateur
      required: true, // L'auteur est obligatoire
    },
  },
  { timestamps: true } // Ajout automatique des champs createdAt et updatedAt pour chaque produit
);

// Création du modèle "Product" à partir du schéma ProductSchema
const Products = mongoose.model('Product', ProductSchema);

// Exportation du modèle pour l'utiliser ailleurs dans l'application
module.exports = Products;

