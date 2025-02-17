const express = require('express');
const router = express.Router();
const Blog = require('./blog.model');

// Route pour créer une nouvelle publication
router.post('/create-post', async (req, res) => {
  try {
    const newPost = new Blog({
      ...req.body,
    });

    const savedPost = await newPost.save();
    
    // Ajout d'un message de confirmation
    res.status(201).send({
      message: 'Enregistrement du blog avec succès !',
      post: savedPost
    });
  } catch (error) {
    console.error('Erreur lors de la création de la publication :', error);
    res.status(500).send({ message: 'Erreur serveur.' });
  }
});

// Route pour récupérer des articles avec pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 4 } = req.query; // Valeur par défaut à 4 articles par page

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalPosts = await Blog.countDocuments();
    const totalPages = Math.ceil(totalPosts / parseInt(limit));

    // Si 'limit' est supérieur à 100, on considère qu'on veut "tous" les articles
    const posts = await Blog.find()
      .skip(skip)
      .limit(parseInt(limit) <= 100 ? parseInt(limit) : 100)
      .sort({ createdAt: -1 });

    res.status(200).send({ posts, totalPages, totalPosts });
  } catch (error) {
    console.error('Erreur lors de la récupération des publications :', error);
    res.status(500).send({ message: 'Erreur serveur.' });
  }
});


// Route pour récupérer les détails d'une publication spécifique
router.get('/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Blog.findById(postId);

    if (!post) {
      return res.status(404).send({ message: 'Publication introuvable.' });
    }

    res.status(200).send(post);
  } catch (error) {
    console.error('Erreur lors de la récupération de la publication :', error);
    res.status(500).send({ message: 'Erreur serveur.' });
  }
});

// Route pour mettre à jour une publication
router.patch('/update-post/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    const updatedPost = await Blog.findByIdAndUpdate(postId, { ...req.body }, { new: true });

    if (!updatedPost) {
      return res.status(404).send({ message: 'Publication introuvable.' });
    }

    res.status(200).send({
      message: 'Publication mise à jour avec succès.',
      post: updatedPost,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la publication :', error);
    res.status(500).send({ message: 'Erreur serveur.', error });
  }
});

// Route pour supprimer une publication
router.delete('/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    const deletedPost = await Blog.findByIdAndDelete(postId);

    if (!deletedPost) {
      return res.status(404).send({ message: 'Publication introuvable.' });
    }

    res.status(200).send({
      message: 'Publication supprimée avec succès.',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la publication :', error);
    res.status(500).send({ message: 'Erreur serveur.', error });
  }
});

router.get('/blog/all', async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query; // Limite par défaut de 100

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalPosts = await Blog.countDocuments();
    const totalPages = Math.ceil(totalPosts / parseInt(limit));

    // Récupération de tous les articles triés par date (du plus récent au plus ancien)
    const posts = await Blog.find()
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).send({ posts, totalPages, totalPosts });
  } catch (error) {
    console.error('Erreur lors de la récupération des publications :', error); // Log plus détaillé
    res.status(500).send({ message: 'Erreur serveur.', error: error.message });
  }
});

// Ajouter un like
router.put('/like/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send('Blog non trouvé');

    blog.likes += 1; // Incrémente le nombre de likes
    await blog.save();
    res.status(200).json(blog);
  } catch (err) {
    res.status(500).send('Erreur serveur');
  }
});

// Supprimer un like
router.put('/unlike/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send('Blog non trouvé');

    blog.likes = Math.max(blog.likes - 1, 0); // Décrémente le nombre de likes, mais ne descend pas en dessous de 0
    await blog.save();
    res.status(200).json(blog);
  } catch (err) {
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router;
