const express = require('express');
const User = require('./user.model');
const generateToken = require('../middleware/generateToken');

const router = express.Router();

// Enregistrement de l'utilisateur
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, adresse, telephone } = req.body;
    
    // Création d'un nouvel utilisateur avec les données reçues
    const user = new User({ username, email, password, adresse, telephone });
    
    // Sauvegarde de l'utilisateur dans la base de données
    await user.save();
    
    res.status(201).send({ message: 'Utilisateur enregistré avec succès !' });
  } catch (error) {
    console.error('Erreur d’enregistrement de l’utilisateur', error);
    res.status(500).send({ message: 'Erreur d’enregistrement de l’utilisateur' });
  }
});

// Connexion de l'utilisateur
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Recherche de l'utilisateur dans la base de données
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: 'Utilisateur introuvable' });
    }

    // Comparaison du mot de passe fourni avec celui stocké dans la base de données
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).send({ message: 'Mot de passe incorrect' });
    }

    // Génération d'un token d'authentification
    const token = await generateToken(user._id);

    // Envoi du token dans un cookie sécurisé
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None', // Correction de 'semeSite' en 'sameSite'
    });

    res.status(200).send({
      message: 'Connexion réussie',
      token,
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        profileImage: user.profileImage,
        adresse: user.adresse,
        telephone: user.telephone,
      },
    });
  } catch (error) {
    console.error('Erreur de connexion de l’utilisateur', error);
    res.status(500).send({ message: 'Erreur de connexion de l’utilisateur' });
  }
});

// Déconnexion de l'utilisateur
router.post('/logout', (req, res) => {
  res.clearCookie('token'); // Suppression du cookie contenant le token
  res.status(200).send({ message: 'Déconnexion réussie' });
});

// Suppression d'un utilisateur
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Suppression de l'utilisateur par son identifiant
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).send({ message: 'Utilisateur introuvable' });
    }
    res.status(200).send({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur de suppression de l’utilisateur', error);
    res.status(500).send({ message: 'Erreur de suppression de l’utilisateur' });
  }
});

// Récupération de tous les utilisateurs
router.get('/users', async (req, res) => {
  try {
    // Récupération des utilisateurs avec uniquement les champs id, email, et role
    const users = await User.find({}, '_id email role').sort({ createdAt: -1 });

    // Réponse avec la liste des utilisateurs récupérés
    res.status(200).send(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs :', error);
    res.status(500).send({ message: 'Erreur lors de la récupération des utilisateurs' });
  }
});

// Mise à jour du rôle de l'utilisateur
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Mise à jour du rôle de l'utilisateur
    const user = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!user) {
      return res.status(404).send({ message: 'Utilisateur introuvable' });
    }
    res.status(200).send({ message: 'Mise à jour du rôle de l’utilisateur réussie' });
  } catch (error) {
    console.error('Erreur de mise à jour du rôle de l’utilisateur', error);
    res.status(500).send({ message: 'Erreur de mise à jour du rôle de l’utilisateur' });
  }
});

// Modification ou mise à jour du profil de l'utilisateur
router.patch('/edit-profile', async (req, res) => {
  try {
    const { userId, username, profileImage, adresse, telephone } = req.body;

    // Vérification que l'identifiant de l'utilisateur est fourni
    if (!userId) {
      return res.status(404).send({ message: 'Identifiant utilisateur requis' });
    }

    // Recherche de l'utilisateur par son identifiant
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).send({ message: 'Profil introuvable' });
    }

    // Modification des champs du profil uniquement s'ils sont définis
    if (username !== undefined) user.username = username;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (adresse !== undefined) user.adresse = adresse;
    if (telephone !== undefined) user.telephone = telephone;

    // Sauvegarde des modifications
    await user.save();

    res.status(200).send({
      message: 'Profil modifié avec succès',
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        profileImage: user.profileImage,
        adresse: user.adresse,
        telephone: user.telephone,
      },
    });
  } catch (error) {
    console.error('Erreur de mise à jour du profil', error);
    res.status(500).send({ message: 'Erreur de mise à jour du profil' });
  }
});

module.exports = router;

