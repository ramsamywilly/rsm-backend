const express = require('express');
const router = express.Router();
const Products = require('./products.model');
const Reviews = require('../reviews/reviews.model');
const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verifyAdmin");

// Route pour créer un produit
router.post("/create-product", async(req, res) => {
  try {
    // Création du produit à partir des données envoyées dans la requête
    const newProduct = new Products({
      ...req.body
    });

    // Sauvegarde du produit dans la base de données
    const savedProduct = await newProduct.save();

    // Calcul des avis associés à ce produit
    const reviews = await Reviews.find({ productId: savedProduct._id });
    if (reviews.length > 0) {
      const totalRating = reviews.reduce(
        (acc, review) => acc + review.rating, 0);
      const averageRating = totalRating / reviews.length;
      savedProduct.rating = averageRating;
      await savedProduct.save();
    }

    // Réponse avec le produit sauvegardé
    res.status(201).send(savedProduct);
  } catch (error) {
    console.error('Erreur lors de la création du produit :', error);
    res.status(500).send({ message: 'Erreur serveur.' });
  }
});

// Route pour obtenir tous les produits
router.get("/", async(req, res) => {
  try {
    // Récupération des paramètres de filtrage depuis la requête
    const { category, gamme, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

    let filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (gamme && gamme !== 'all') {
      filter.gamme = gamme;
    }
    if (minPrice && maxPrice) {
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);
      if (!isNaN(min) && !isNaN(max)) {
        filter.price = { $gte: min, $lte: max };
      }
    }

    // Calcul de la pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalProducts = await Products.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    // Récupération des produits filtrés et paginés
    const products = await Products.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("author", "email")
      .sort({ createdAt: -1 });

    // Réponse avec les produits, nombre total de produits et pages
    res.status(200).send({ products, totalPages, totalProducts });
  } catch (error) {
    console.error('Erreur lors de la récupération des produits :', error);
    res.status(500).send({ message: 'Erreur serveur.' });
  }
});

// Route pour obtenir les détails d'un produit spécifique
router.get("/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Products.findById(productId).populate("author", "email username");

    if (!product) {
      return res.status(404).send({ message: "Produit introuvable" });
    }

    // Récupération des avis pour ce produit
    const reviews = await Reviews.find({ productId }).populate("userId", "username email");
    res.status(200).send({ product, reviews });
  } catch (error) {
    console.error('Erreur lors de la récupération des détails du produit :', error);
    res.status(500).send({ message: 'Erreur serveur.' });
  }
});

// Route pour mettre à jour un produit
router.patch("/update-product/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const productId = req.params.id;
    const updatedProduct = await Products.findByIdAndUpdate(productId, { ...req.body }, { new: true });

    if (!updatedProduct) {
      return res.status(404).send({ message: "Produit introuvable" });
    }

    // Réponse confirmant la mise à jour du produit
    res.status(200).send({
      message: 'Produit mis à jour avec succès',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du produit :', error);
    res.status(500).send({ message: 'Erreur serveur.', error });
  }
});

// Route pour supprimer un produit
router.delete("/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const deletedProduct = await Products.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).send({ message: "Produit introuvable" });
    }

    // Suppression des avis associés au produit
    await Reviews.deleteMany({ productId: productId });

    // Réponse confirmant la suppression du produit
    res.status(200).send({
      message: 'Produit supprimé avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du produit :', error);
    res.status(500).send({ message: 'Erreur serveur.', error });
  }
});

// Route pour obtenir des produits relatés (similaires)
router.get("/relate/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(404).send({ message: "ID du produit introuvable" });
    }

    // Récupérer le produit par ID
    const product = await Products.findById(id);
    if (!product) {
      return res.status(404).send({ message: "Produit introuvable" });
    }

    // Générer une regex basée sur les mots du nom du produit
    const titleRegex = new RegExp(
      product.name
        .split(" ")
        .filter((word) => word.length > 1)
        .join("|"),
      "i"
    );

    // Trouver les produits relatés
    const relatedProducts = await Products.find({
      _id: { $ne: id }, // Exclure le produit courant
      $or: [
        { name: { $regex: titleRegex } }, // Produits ayant des noms similaires
        { category: product.category }   // Produits de la même catégorie
      ]
    });

    // Réponse avec les produits relatés
    res.status(200).send(relatedProducts);
  } catch (error) {
    console.error("Erreur lors de la récupération des produits relatés :", error);
    res.status(500).send({ message: "Erreur serveur.", error });
  }
});

module.exports = router;
