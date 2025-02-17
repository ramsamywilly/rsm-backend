const express = require('express');
const router = express.Router();
const Occasion = require('./occasion.model');
const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verifyAdmin");

// Route pour créer une occasion
router.post("/create-occasion", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const newOccasion = new Occasion({ ...req.body });
    const savedOccasion = await newOccasion.save();

    res.status(201).send(savedOccasion);
  } catch (error) {
    console.error('Erreur lors de la création de l\'occasion :', error);
    res.status(500).send({ message: 'Erreur serveur.' });
  }
});

// Route pour obtenir toutes les occasions
router.get("/occasion/all", async (req, res) => {
  try {
    const { category, minPrice, maxPrice, page = 1, limit = 12 } = req.query;

    let filter = {};
    if (category && category !== 'all') filter.category = category;
    if (minPrice && maxPrice) {
      filter.price = { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalOccasions = await Occasion.countDocuments(filter);
    const totalPages = Math.ceil(totalOccasions / parseInt(limit));

    const occasions = await Occasion.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).send({ occasions, totalPages, totalOccasions });
  } catch (error) {
    console.error('Erreur lors de la récupération des occasions :', error);
    res.status(500).send({ message: 'Erreur serveur.' });
  }
});

// Route pour obtenir une occasion spécifique
router.get("/:id", async (req, res) => {
  try {
    const occasion = await Occasion.findById(req.params.id);
    if (!occasion) return res.status(404).send({ message: "Occasion introuvable" });

    res.status(200).send(occasion);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'occasion :', error);
    res.status(500).send({ message: 'Erreur serveur.' });
  }
});

// Route pour mettre à jour une occasion
router.patch("/update-occasion/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const updatedOccasion = await Occasion.findByIdAndUpdate(req.params.id, { ...req.body }, { new: true });

    if (!updatedOccasion) return res.status(404).send({ message: "Occasion introuvable" });

    res.status(200).send({
      message: 'Occasion mise à jour avec succès',
      occasion: updatedOccasion
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'occasion :', error);
    res.status(500).send({ message: 'Erreur serveur.' });
  }
});

// Route pour supprimer une occasion
router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const deletedOccasion = await Occasion.findByIdAndDelete(req.params.id);

    if (!deletedOccasion) return res.status(404).send({ message: "Occasion introuvable" });

    res.status(200).send({ message: 'Occasion supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'occasion :', error);
    res.status(500).send({ message: 'Erreur serveur.' });
  }
});




module.exports = router;
