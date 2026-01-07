import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middleware/auth.js';

// Hasher un mot de passe
export const hashPassword = async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

// Vérifier un mot de passe
export const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

// Générer un token JWT
export const generateToken = (matricule, email, role = 'student') => {
    return jwt.sign(
        {
            matricule,
            email,
            role
        },
        JWT_SECRET,
        { expiresIn: '7d' } // Token valide pendant 7 jours
    );
};

// Générer un token de rafraîchissement (optionnel, pour une meilleure sécurité)
export const generateRefreshToken = (matricule) => {
    return jwt.sign(
        { matricule, type: 'refresh' },
        JWT_SECRET,
        { expiresIn: '30d' }
    );
};