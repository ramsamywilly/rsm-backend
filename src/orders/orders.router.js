const express = require('express');
const router = express.Router();
const Order = require('./orders.model');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verifyAdmin");
const User = require('../users/user.model');   
const mongoose = require('mongoose');
const Product = require('../products/products.model');

// Route pour créer une session de paiement Stripe
router.post("/create-checkout-session", async (req, res) => {
  const { products } = req.body;
  try {
    // Préparer les articles pour Stripe Checkout
    const lineItems = products.map((product) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: product.name,
          images: [product.image]
        },
        unit_amount: Math.round(product.price * 100)
      },
      quantity: product.quantity
    }));

    // Créer la session de paiement
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: 'http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:5173/cancel'
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("Erreur lors de la création de la session de paiement :", error);
    res.status(500).send({ message: "Échec de la création de la session de paiement" });
  }
});

// Route pour confirmer un paiement
router.post("/confirm-payment", async (req, res) => {
  const { session_id } = req.body;

  try {
    // Récupérer les détails de la session Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items", "payment_intent"]
    });

    const paymentIntentId = session.payment_intent.id;
    let order = await Order.findOne({ orderId: paymentIntentId });

    if (!order) {
      // Si aucune commande n'existe, en créer une nouvelle
      const lineItems = session.line_items.data.map((item) => {
        const product = item.price.product; // Récupérer l'objet produit
        
        return {
          productId: product, // ID du produit
          quantity: item.quantity,
          productName: item.description || 'Nom indisponible', 
        };
      });

      const amount = session.amount_total / 100;
      order = new Order({
        orderId: paymentIntentId,
        amount,
        products: lineItems,
        email: session.customer_details.email,
        status: session.payment_intent.status === "succeeded" ? 'pending' : 'failed'
      });
    } else {
      // Mettre à jour le statut de la commande existante
      order.status = session.payment_intent.status === "succeeded" ? 'pending' : 'failed';
    }

    await order.save();
    res.json({ order });
  } catch (error) {
    console.error("Erreur lors de la confirmation du paiement :", error);
    res.status(500).send({ message: "Échec de la confirmation du paiement" });
  }
});




router.get("/:email", async (req, res) => {
    const email = req.params.email.trim().toLowerCase();

    try {
        // Trouver les commandes associées à l'e-mail
        const orders = await Order.find({ email });

        if (orders.length === 0) {
            return res.status(404).send({ orders: 0, message: "Aucune commande trouvée pour cet e-mail" });
        }

        // Trouver l'utilisateur correspondant à l'e-mail
        const user = await User.findOne({ email }).select("adresse telephone"); // Inclure uniquement l'adresse et le téléphone

        // Ajouter les informations utilisateur dans chaque commande
        const enrichedOrders = orders.map(order => ({
            ...order.toObject(), // Convertir le document en objet JavaScript
            adresse: user ? user.adresse : null,
            telephone: user ? user.telephone : null
        }));

        res.status(200).send({ orders: enrichedOrders });
    } catch (error) {
        res.status(500).send({ message: "Erreur lors de la récupération des commandes", error });
    }
});






router.get("/order/:id", async (req, res) => {
   const { id } = req.params;
  try {
    const order = await Order.findById(req.params.id);
    
    // Vérification si la commande existe
    if (!order) {
      return res.status(404).send({ message: 'Commande non trouvée' });
    }
    
    // Envoi de la commande trouvée
    res.status(200).send(order);

  } catch (error) {
    // Gestion des erreurs et journalisation
    console.error("Erreur lors de la récupération de la commande :", error);
    res.status(500).send({ message: "Une erreur est survenue lors de la récupération de la commande" });
  }
});

//verifyToken, verifyAdmin,
router.get("/", async (req, res) => {
  try {
    // Récupération des commandes, triées par date de création décroissante
    const orders = await Order.find().sort({ createdAt: -1 });
    
    // Vérification si aucune commande n'est trouvée
    if (orders.length === 0) {
      return res.status(404).send({ message: "Aucune commande trouvée", orders: [] });
    }

    // Envoi de la liste des commandes
    res.status(200).send({ orders });

  } catch (error) {
    // Gestion des erreurs et journalisation
    console.error("Erreur lors de la récupération des commandes :", error);
    res.status(500).send({ message: "Une erreur est survenue lors de la récupération des commandes" });
  }
});

//verifyToken, verifyAdmin,
router.patch("/update-order-status/:id",  async (req, res) => {
  const { id } = req.params;  // Récupère l'ID de la commande depuis l'URL
  const { status } = req.body; // Récupère le nouveau statut depuis le corps de la requête

  // Vérifie si le statut est fourni
  if (!status) {
    return res.status(400).send({ message: 'Le statut est requis' });
  }

  try {
    // Recherche et met à jour la commande avec le nouvel statut
    const updatedOrder = await Order.findByIdAndUpdate(id, {
      status: status,
      updatedAt: new Date(),
    }, {
      new: true, runValidators: true
    });

    // Vérifie si la commande existe
    if (!updatedOrder) {
      return res.status(404).send({
        message: 'Commande non trouvée',
        order: updatedOrder
      });
    }

    // Envoie une réponse avec le succès de la mise à jour
    res.status(200).json({ message: "Commande : statut mis à jour avec succès" });

  } catch (error) {
    // Gestion des erreurs
    console.error("Erreur lors de la mise à jour du statut de la commande :", error);
    res.status(500).send({ message: "Échec de la mise à jour du statut de la commande" });
  }
});


router.delete("/delete-order/:id", async (req, res) => {
  const { id } = req.params; 

  try {
    // Recherche et suppression de la commande
    const deletedOrder = await Order.findByIdAndDelete(id);

    // Vérifie si la commande existe
    if (!deletedOrder) {
      return res.status(404).send({ message: 'Aucune commande trouvée' });
    }

    // Réponse en cas de succès
    res.status(200).json({
      message: 'Commande supprimée avec succès',
      order: deletedOrder 
    });

  } catch (error) {
    // Gestion des erreurs
    console.error("Erreur lors de la suppression de la commande :", error);
    res.status(500).send({ message: "Échec de la suppression de la commande" });
  }
});



router.get('/order/product-details/:subOrderId', async (req, res) => {
  const { subOrderId } = req.params;

  try {
    // Étape 1 : Trouver la commande contenant la sous-commande
    const order = await Order.findOne({ 'products._id': subOrderId });

    if (!order) {
      return res.status(404).json({ message: 'Sous-commande non trouvée dans les commandes' });
    }

    // Étape 2 : Trouver la sous-commande correspondante
    const subOrder = order.products.find(
      (product) => product._id.toString() === subOrderId
    );

    if (!subOrder) {
      return res.status(404).json({ message: 'Sous-commande introuvable' });
    }

    // Étape 3 : Récupérer les détails du produit réel
    const product = await Product.findById(subOrder.productId);

    if (!product) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }

    // Étape 4 : Retourner les détails du produit
    res.status(200).json({
      product: {
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: subOrder.quantity,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des détails du produit :', error);
    res.status(500).json({ message: 'Erreur interne', error: error.message });
  }
});


// Exporter le routeur
module.exports = router;
