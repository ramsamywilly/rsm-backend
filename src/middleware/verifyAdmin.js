const verifyAdmin = (req, res, next) => {
  // Vérification si l'utilisateur a le rôle "admin ou manager"
   if (!['admin', 'manager'].includes(req.role)) {
    // Si l'utilisateur n'a pas le rôle "admin" ou "manager", renvoie une erreur avec le code 403 (interdit)
    return res.status(403).send({
      success: false,
      message: 'Vous n\'êtes pas autorisé à effectuer cette action' 
    });
  }
  next(); 
};

module.exports = verifyAdmin; 
