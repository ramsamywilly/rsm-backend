const express = require('express');
const router = express.Router();
const User = require('../users/user.model');
const Order = require('../orders/orders.model'); 
const Reviews = require('../reviews/reviews.model');
const Products = require('../products/products.model');


//statistique client
router.get('/user-stats/:email', async (req, res) => {
  const { email } = req.params;
  
  if (!email) {
    return res.status(400).send({ message: "L'adresse e-mail est requise" });
  }

  try {
    const user = await User.findOne({ email: email });

    if (!user) return res.status(404).send({ message: "Utilisateur non trouvé" });
    

    const totalPaymentsResult = await Order.aggregate([
      { $match: { email: email }},
      {
        $group: {_id: null, totalAmount: { $sum: "$amount" }}        
      }
    ]);

const totalPaymentsAmount = totalPaymentsResult.length > 0 ? totalPaymentsResult[0].totalAmount : 0; 

const totalReviews = await Reviews.countDocuments({ userId: user._id });

const purchasedProductIds = await Order.distinct("products.productId", { email: email }); 

const totalPurchasedProducts = purchasedProductIds.length;

   res.status(200).send({
   	totalPayments: totalPaymentsAmount.toFixed(2),
   	totalReviews,
   	totalPurchasedProducts
   });

  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques utilisateur :", error);
    res.status(500).send({ message: "Échec de la récupération des statistiques utilisateur" });
  }
});


//statistique Administrateur

router.get('/admin-stats', async (req, res) => {

    try {
        const totalOrders = await Order.countDocuments();
        const totalProducts = await Products.countDocuments();
        const totalReviews = await Reviews.countDocuments();
        const totalUsers = await User.countDocuments();

        const totalEarningsResult = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: "$amount" }
                }
            }
        ]);

        const totalEarnings = totalEarningsResult.length > 0 ? totalEarningsResult[0].totalEarnings : 0;

        const monthlyEarningsResult = await Order.aggregate([
            {
                $group: {
                    _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                    monthlyEarnings: { $sum: "$amount" }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);

        const monthlyEarnings = monthlyEarningsResult.map((entry) => ({
            month: entry._id.month,
            year: entry._id.year,
            earnings: entry.monthlyEarnings.toFixed(2) // Correction de 'tofixed' -> 'toFixed'
        }));

        res.status(200).json({
            totalOrders, // Correction de 'otalOrders' -> 'totalOrders'
            totalProducts,
            totalReviews,
            totalUsers,
            totalEarnings,
            monthlyEarnings
        });

    } catch (error) {
        console.error("Erreur lors de la récupération des statistiques administrateur :", error);
        res.status(500).send({ message: "Échec de la récupération des statistiques administrateur" });
    }
});

// Statistiques de ventes mensuelles des produits
router.get('/monthly-product-sales', async (req, res) => {
    try {
        // Agrégation pour récupérer les ventes par mois
        const productSalesResult = await Order.aggregate([
            { 
                $unwind: "$products"  // Pour décomposer chaque produit dans la commande
            },
            {
                $group: {
                    _id: { 
                        month: { $month: "$createdAt" }, 
                        year: { $year: "$createdAt" },
                        productId: "$products.productId" 
                    },
                    totalSales: { $sum: "$products.quantity" }  // Total des ventes par produit
                }
            },
            { 
                $sort: { "_id.year": 1, "_id.month": 1 }  // Trie les résultats par année et mois
            },
            {
                $group: {
                    _id: { month: "$_id.month", year: "$_id.year" },  // Regroupe par mois/année
                    totalSales: { $sum: "$totalSales" }  // Calcul du total des ventes pour chaque mois
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }  // Trie par mois et année
            }
        ]);

        // Envoie la réponse avec les ventes mensuelles
        const monthlyProductSales = productSalesResult.map(entry => ({
            month: entry._id.month,
            year: entry._id.year,
            totalSales: entry.totalSales
        }));

        res.status(200).json(monthlyProductSales);
    } catch (error) {
        console.error("Erreur lors de la récupération des ventes mensuelles de produits :", error);
        res.status(500).send({ message: "Échec de la récupération des ventes mensuelles de produits" });
    }
});



module.exports = router;