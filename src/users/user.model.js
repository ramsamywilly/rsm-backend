const { Schema, model } = require('mongoose');
const bcrypt = require('bcrypt');

// Définition du schéma pour l'utilisateur
const userSchema = new Schema({
    username: { 
        type: String, 
        required: true,  // Correction de 'require' en 'required'
    },
    email: { 
        type: String, 
        required: true,  // Correction de 'require' en 'required'
        unique: true  // L'email doit être unique
    },
    password: { 
        type: String, 
        required: true  // Le mot de passe est requis
    },
    role: { 
        type: String, 
        default: 'user'  // Le rôle par défaut est 'user'
    },
    profileImage: String,  // Image de profil (optionnelle)
    adresse: { 
        type: String, 
        required: true,
        maxLength: 200  // La bio peut avoir un maximum de 200 caractères
    },
    telephone: String,  // Profession de l'utilisateur (optionnelle)
    createdAT: { 
        type: Date, 
        required: true,
        default: Date.now  // La date de création par défaut est la date actuelle
    },
});

// Hachage du mot de passe avant de sauvegarder l'utilisateur
userSchema.pre('save', async function(next) {
    const user = this;

    // Si le mot de passe n'est pas modifié, on passe à l'étape suivante
    if (!user.isModified("password")) return next();

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;  // Remplace le mot de passe en clair par son haché
    next();
});

// Méthode pour comparer le mot de passe fourni avec celui stocké
userSchema.methods.comparePassword = function(candidatePassword) {
    // Comparaison du mot de passe avec celui haché dans la base de données
    return bcrypt.compare(candidatePassword, this.password);
};

// Création du modèle utilisateur
const User = model('User', userSchema);

// Export du modèle
module.exports = User;

