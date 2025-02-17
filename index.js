const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
require('dotenv').config();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const port = process.env.PORT || 5000;


// Middleware setup
app.use(express.json({limit: "25mb"}));
//app.use(express.urlencoded({limit: "25mb"}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}))
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))

//telechargement image
const uploadImage = require("./src/utils/uploadImage");

//All routes
const authRoutes = require('./src/users/user.route');
const productRoutes = require('./src/products/products.route');
const reviewRoutes = require('./src/reviews/reviews.router');
const orderRoutes = require('./src/orders/orders.router');
const statsRoutes = require('./src/stats/stats.route');
const blogRoutes = require('./src/blogs/blog.routes');
const occasionRoutes = require('./src/occasions/occasion.router');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/occasions', occasionRoutes);


// Connexion à MongoDB
main()
  .then(() => console.log('MongoDB s’est connecté avec succès !'))
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect(process.env.DB_URI);

// Définir une route de base
app.get('/', (req, res) => {
  res.send('Le serveur RSM E-commerce est en cours d’exécution....!');
});

}


app.post("/uploadImage", (req, res) => {
  uploadImage(req.body.image)
  .then((url) => res.send(url))
  .catch((err) => res.status(500).send(err));
});

// Lancer le serveur
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

