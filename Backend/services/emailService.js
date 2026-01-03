import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Configuration du transporteur email (à configurer selon votre serveur SMTP)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
    }
});

// Générer un token de vérification
export const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Vérifier si un email est une adresse institutionnelle
// Cette fonction peut être adaptée selon les domaines d'emails institutionnels
export const isInstitutionalEmail = (email) => {
    if (!email || typeof email !== 'string') {
        return false;
    }

    // Liste des domaines institutionnels (à adapter selon votre université)
    const institutionalDomains = [
        'univ-yaounde.cm',
        'univ-douala.cm',
        'univ-buea.cm',
        'univ-dschang.cm',
        'univ-maroua.cm',
        'univ-ndere.cm',
        'univ-bamenda.cm',
        'saintjeaningenieur.org'
        // Ajoutez d'autres domaines selon vos besoins
        // Exemples supplémentaires :
        // 'ens.cm',
        // 'polytechnique.cm',
    ];

    const emailLower = email.toLowerCase().trim();
    const emailParts = emailLower.split('@');

    if (emailParts.length !== 2) {
        return false;
    }

    const emailDomain = emailParts[1];
    return institutionalDomains.some(domain => emailDomain === domain || emailDomain.endsWith('.' + domain));
};

// Envoyer un email de vérification
export const sendVerificationEmail = async (email, token, firstName) => {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@equizz.cm',
        to: email,
        subject: 'Vérification de votre adresse email - EQuizz',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">Bonjour ${firstName},</h2>
                <p>Merci de vous être inscrit sur la plateforme EQuizz.</p>
                <p>Pour activer votre compte, veuillez cliquer sur le lien ci-dessous pour vérifier votre adresse email :</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}"
                       style="background-color: #3498db; color: white; padding: 12px 24px;
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Vérifier mon email
                    </a>
                </p>
                <p>Ou copiez et collez ce lien dans votre navigateur :</p>
                <p style="color: #7f8c8d; word-break: break-all;">${verificationUrl}</p>
                <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
                    Ce lien expirera dans 24 heures.
                </p>
                <p style="color: #7f8c8d; font-size: 12px;">
                    Si vous n'avez pas créé de compte, ignorez cet email.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        return false;
    }
};

// Vérifier la configuration email
export const testEmailConnection = async () => {
    try {
        await transporter.verify();
        console.log('Email server is ready to send messages');
        return true;
    } catch (error) {
        console.error('Email server configuration error:', error);
        return false;
    }
};

