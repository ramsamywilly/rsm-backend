const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET_KEY;

// Middleware pour vérifier la validité du token JWT
const verifyToken = (req, res, next) => {
  try {
    // Récupération du token depuis les cookies
    const token = req.cookies.token;
    // Alternative avec l'en-tête Authorization : décommenter cette ligne si vous utilisez des en-têtes pour transmettre le token
    // const token = req.headers['authorization'].split(" ")[1];

    // Vérifie si le token existe
    if (!token) {
      return res.status(401).send({ message: 'Token invalide' }); // Réponse si aucun token n'est fourni
    }

    // Décodage du token avec la clé secrète
    const decoded = jwt.verify(token, JWT_SECRET);

    // Vérifie si le token est valide (s'il a pu être décodé)
    if (!decoded) {
      return res.status(401).send({ message: 'Token invalide ou non valide' }); // Réponse si le token est invalide
    }

    // Attachement des informations de l'utilisateur dans la requête
    req.userId = decoded.userId;
    req.role = decoded.role;

    // Appel au middleware suivant si la vérification est réussie
    next();
  } catch (error) {
    // Gestion des erreurs de vérification du token
    console.error('Erreur de vérification du jeton', error); // Log de l'erreur pour débogage
    res.status(401).send({ message: 'Erreur de vérification du jeton' }); // Réponse d'erreur si une exception est levée
  }
};

module.exports = verifyToken; // Exportation du middleware pour l'utiliser dans d'autres parties de l'application
