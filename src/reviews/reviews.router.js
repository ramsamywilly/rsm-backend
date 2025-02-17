const express = require('express');
const router = express.Router();
const Reviews = require('./reviews.model');
const Products = require('../products/products.model');

// Route pour publier un avis
router.post('/post-review', async (req, res) => {
    try {
        const { comment, rating, productId, userId } = req.body;

        // Validation des champs obligatoires
        if (!comment || !rating || !productId || !userId) {
            return res.status(400).send({ message: 'Tous les champs (commentaire, note, produit, utilisateur) sont obligatoires.' });
        }

        // Vérification de l'existence d'une revue pour ce produit et cet utilisateur
        const existingReview = await Reviews.findOne({ productId, userId });

        if (existingReview) {
            // Mise à jour de l'avis existant si trouvé
            existingReview.comment = comment;
            existingReview.rating = rating;
            await existingReview.save();
        } else {
            // Création d'un nouvel avis si aucun n'existe pour ce produit et utilisateur
            const newReview = new Reviews({
                comment,
                rating,
                productId,
                userId,
            });
            await newReview.save();
        }

        // Calcul de la note moyenne du produit après l'ajout ou la mise à jour de l'avis
        const reviews = await Reviews.find({ productId });
        if (reviews.length > 0) {
            const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
            const averageRating = totalRating / reviews.length;
            
            // Mise à jour de la note moyenne du produit
            const product = await Products.findById(productId);
            if (product) {
                product.rating = averageRating;
                await product.save({ validateBeforeSave: false });
            } else {
                return res.status(404).send({ message: 'Produit introuvable. Impossible de mettre à jour la note.' });
            }
        }

        // Réponse de succès
        res.status(200).send({
            message: 'Votre avis a été publié avec succès.',
            reviews: reviews,
        });
    } catch (error) {
        // Gestion des erreurs
        res.status(500).send({ message: 'Une erreur interne est survenue. Veuillez réessayer plus tard.' });
    }
});

// Route pour obtenir le nombre total d'avis
router.get('/total-review', async (req, res) => {
    try {
        const totalReviews = await Reviews.countDocuments({});
        res.status(200).send({ totalReviews });
    } catch (error) {
        // Gestion des erreurs
        res.status(500).send({ message: 'Une erreur interne est survenue. Veuillez réessayer plus tard.' });
    }
});

// Route pour obtenir les avis d'un utilisateur spécifique
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    
    // Validation de l'existence de l'ID utilisateur
    if (!userId) {
        return res.status(400).send({ message: 'L\'identifiant utilisateur est requis.' });
    }
    
    try {
        // Récupération des avis de l'utilisateur, triés par date de création
        const reviews = await Reviews.find({ userId: userId }).sort({ createdAt: -1 });
        
        // Vérification s'il y a des avis pour l'utilisateur
        if (reviews.length === 0) {
            return res.status(404).send({ message: 'Aucun avis trouvé pour cet utilisateur.' });
        }

        res.status(200).send(reviews);
    } catch (error) {
        // Gestion des erreurs
        res.status(500).send({ message: 'Une erreur interne est survenue. Veuillez réessayer plus tard.' });
    }
});

module.exports = router;

