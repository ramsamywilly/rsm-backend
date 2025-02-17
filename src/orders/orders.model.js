// Import de mongoose, une bibliothèque MongoDB pour Node.js
const mongoose = require('mongoose');

// Définition du schéma de commande
const orderSchema = new mongoose.Schema(
  {
    // Identifiant unique de la commande
    orderId: String,

    // Tableau de produits dans la commande
    products: [
      {
        productId: {
          type: String, // Identifiant du produit
          required: true // Ce champ est obligatoire
        },
        quantity: {
          type: Number, // Quantité de ce produit dans la commande
          required: true // Ce champ est obligatoire

        },
        productName: {
          type: String, // Nom du produit, ajouté à la commande
          required: true,
        },
      }
    ],

    // Montant total de la commande
    amount: Number,

    // Email de l'utilisateur ayant passé la commande
    email: {
      type: String, // Adresse email de l'utilisateur
      required: true // Ce champ est obligatoire
    },

    // Statut de la commande
    status: {
      type: String, // Statut actuel de la commande
      enum: ["pending", "processing", "shipped", "completed"], // Liste des statuts valides
      default: "En Attente" // Valeur par défaut : "En Attente"
    },

    // Référence à l'utilisateur
    userId: {
      type: mongoose.Schema.Types.ObjectId, // Référence au modèle User
      ref: 'User', // Le nom du modèle User
     
    }
  },
  {
    timestamps: true // Ajoute automatiquement les champs createdAt et updatedAt
  }
);

// Création du modèle Order à partir du schéma
const Order = mongoose.model('order', orderSchema);

// Exportation du modèle pour l'utiliser ailleurs dans le projet
module.exports = Order;
