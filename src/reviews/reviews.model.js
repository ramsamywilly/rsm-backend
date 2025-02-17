const mongoose = require('mongoose'); // Importation de la bibliothèque mongoose pour la gestion des bases de données MongoDB

// Définition du schéma pour les avis (Reviews)
const ReviewSchema = new mongoose.Schema(
  {
    comment: { 
      type: String, 
      required: true // Le champ commentaire est obligatoire
    },
    rating: { 
      type: Number, 
      required: true // Le champ note est obligatoire
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId, // Référence à l'ID de l'utilisateur ayant laissé l'avis
      ref: "User", // Référence au modèle User
      required: true, // Le champ userId est obligatoire
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId, // Référence à l'ID du produit concerné
      ref: "Product", // Référence au modèle Product
      required: true, // Le champ productId est obligatoire
    },
  },
  { timestamps: true } // Ajout automatique des champs createdAt et updatedAt
);

// Création du modèle basé sur le schéma de l'avis
const Reviews = mongoose.model('Review', ReviewSchema);

// Exportation du modèle Reviews afin qu'il puisse être utilisé dans d'autres parties de l'application
module.exports = Reviews;

