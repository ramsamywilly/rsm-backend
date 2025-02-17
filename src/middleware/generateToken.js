const jwt = require('jsonwebtoken');
const User = require('../users/user.model');

const JWT_SECRET = process.env.JWT_SECRET_KEY;

// Fonction pour générer un token JWT pour un utilisateur donné
const generateToken = async (userId) => {
  try {
    // Recherche l'utilisateur dans la base de données par son ID
    const user = await User.findById(userId);
    
    // Si l'utilisateur n'est pas trouvé, lever une erreur
    if (!user) {
      throw new Error('Utilisateur introuvable');
    }

    // Générer le token avec les informations nécessaires (userId et role)
    const token = jwt.sign(
      { userId: user._id, role: user.role }, // Payload du token
      JWT_SECRET, // Clé secrète pour signer le token
      { expiresIn: "1h" } // Le token expire dans 1 heure
    );

    return token; // Retourne le token généré
  } catch (error) {
    // En cas d'erreur, on pourrait ajouter un traitement ici (ex: log ou renvoi d'une erreur spécifique)
    console.error(error); // Ajouter un log pour l'erreur si nécessaire
  }
};

module.exports = generateToken; // Export de la fonction pour l'utiliser ailleurs dans l'application
