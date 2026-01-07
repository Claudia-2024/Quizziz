# Documentation d'Authentification Étudiant - EQuizz

## Vue d'ensemble

Le système d'authentification complet pour les étudiants inclut :

- Inscription avec vérification d'email institutionnel
- Connexion par matricule et mot de passe
- Connexion par carte étudiante
- Vérification d'email
- Changement de classe pour l'année académique N+1

## Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@equizz.cm
FRONTEND_URL=https://quizziz-backend-ir16.onrender.com
```

## Endpoints d'Authentification

### 1. Inscription (Register)

**POST** `/student/register`

Inscrit un nouvel étudiant avec vérification d'email institutionnel.

**Body:**

```json
{
  "matricule": "STU123456",
  "email": "etudiant@univ-yaounde.cm",
  "firstName": "Jean",
  "lastName": "Dupont",
  "phoneNumber": 123456789,
  "password": "motdepasse123",
  "classId": 1,
  "studentCardId": "CARD123456" // Optionnel
}
```

**Réponse (201):**

```json
{
  "message": "Inscription réussie. Veuillez vérifier votre email pour activer votre compte.",
  "student": {
    "matricule": "STU123456",
    "email": "etudiant@univ-yaounde.cm",
    "firstName": "Jean",
    "lastName": "Dupont",
    "emailVerified": false,
    "classId": 1
  }
}
```

**Erreurs possibles:**

- `400`: Champs manquants ou email non institutionnel
- `409`: Matricule, email ou carte étudiante déjà utilisés

### 2. Connexion par Matricule

**POST** `/student/login`

Connecte un étudiant avec son matricule et mot de passe.

**Body:**

```json
{
  "matricule": "STU123456",
  "password": "motdepasse123"
}
```

**Réponse (200):**

```json
{
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "student": {
    "matricule": "STU123456",
    "email": "etudiant@univ-yaounde.cm",
    "firstName": "Jean",
    "lastName": "Dupont",
    "emailVerified": true,
    "classId": 1,
    "class": {
      "classId": 1,
      "level": "L3",
      "department": "Informatique"
    }
  }
}
```

**Erreurs possibles:**

- `400`: Matricule ou mot de passe manquant
- `401`: Matricule ou mot de passe incorrect

### 3. Connexion par Carte Étudiante

**POST** `/student/login/card`

Connecte un étudiant avec son numéro de carte étudiante et mot de passe.

**Body:**

```json
{
  "studentCardId": "CARD123456",
  "password": "motdepasse123"
}
```

**Réponse (200):** Identique à la connexion par matricule

**Erreurs possibles:**

- `400`: Carte étudiante ou mot de passe manquant
- `401`: Carte étudiante ou mot de passe incorrect

### 4. Vérification d'Email

**GET** `/student/verify-email?token=VERIFICATION_TOKEN`

Vérifie l'email de l'étudiant avec le token reçu par email.

**Query Parameters:**

- `token`: Token de vérification reçu par email

**Réponse (200):**

```json
{
  "message": "Email vérifié avec succès"
}
```

**Erreurs possibles:**

- `400`: Token manquant
- `404`: Token invalide ou expiré

### 5. Changement de Classe (Année N+1)

**PUT** `/student/change-class`

Permet à un étudiant de changer de classe pour l'année académique suivante (N+1).

**Headers:**

```
Authorization: Bearer JWT_TOKEN
```

**Body:**

```json
{
  "newClassId": 2,
  "academicYearId": 3 // Optionnel, vérifie que c'est bien l'année N+1
}
```

**Réponse (200):**

```json
{
  "message": "Classe mise à jour avec succès pour l'année académique suivante",
  "student": {
    "matricule": "STU123456",
    "classId": 2,
    "class": {
      "classId": 2,
      "level": "M1",
      "department": "Informatique"
    }
  }
}
```

**Erreurs possibles:**

- `400`: Nouvelle classe manquante ou année académique invalide
- `401`: Token manquant ou invalide
- `404`: Étudiant, classe ou année académique non trouvés

## Middleware d'Authentification

Pour protéger une route, utilisez le middleware `authenticateToken` :

```javascript
import { authenticateToken } from "../middleware/auth.js";

router.get("/protected-route", authenticateToken, (req, res) => {
  // req.student contient les informations de l'étudiant connecté
  // req.matricule contient le matricule de l'étudiant
  res.json({ message: "Route protégée", student: req.student });
});
```

## Vérification d'Email Institutionnel

Le système vérifie automatiquement que l'email fourni est une adresse institutionnelle valide. Les domaines acceptés par défaut sont :

- `univ-yaounde.cm`
- `univ-douala.cm`
- `univ-buea.cm`
- `univ-dschang.cm`
- `univ-maroua.cm`
- `univ-ndere.cm`
- `univ-bamenda.cm`

Pour ajouter d'autres domaines, modifiez la fonction `isInstitutionalEmail` dans `services/emailService.js`.

## Sécurité

1. **Mots de passe**: Tous les mots de passe sont hashés avec bcrypt (10 rounds)
2. **JWT**: Les tokens JWT expirent après 7 jours
3. **Email**: Les emails de vérification contiennent un token unique valide 24h
4. **Validation**: Vérification stricte des emails institutionnels

## Migration de Base de Données

Exécutez la migration pour ajouter les nouveaux champs :

```bash
npx sequelize-cli db:migrate
```

Ou manuellement avec votre outil de migration.

## Notes Importantes

1. **Une fois enregistré, l'étudiant n'a plus besoin de s'enregistrer à nouveau** sauf s'il change de classe pour l'année N+1
2. **L'email doit être vérifié** avant que certaines fonctionnalités soient disponibles (selon votre logique métier)
3. **Le changement de classe** n'est autorisé que pour l'année académique suivante (N+1)
4. **La carte étudiante** est optionnelle lors de l'inscription mais peut être utilisée pour se connecter
