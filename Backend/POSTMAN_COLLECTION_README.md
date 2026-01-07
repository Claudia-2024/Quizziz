# Collection Postman - EQuizz API

## 📥 Importation

1. Ouvrez Postman
2. Cliquez sur **Import**
3. Sélectionnez le fichier `EQuizz_API_Collection.postman_collection.json`
4. La collection sera importée avec tous les endpoints organisés par catégories

## 🔧 Configuration

### Variables d'Environnement

La collection utilise deux variables :

1. **`base_url`** : URL de base de l'API (par défaut: `https://quizziz-backend-ir16.onrender.com`)
2. **`auth_token`** : Token JWT pour l'authentification (à remplir après login)

### Configuration des Variables

1. Dans Postman, cliquez sur la collection **EQuizz API Collection**
2. Allez dans l'onglet **Variables**
3. Modifiez `base_url` si nécessaire
4. Le `auth_token` sera automatiquement rempli après une connexion réussie

## 📋 Structure de la Collection

### 1. Authentication - Étudiants

- Register Student
- Login Student
- Login with Card
- Verify Email
- Change Class (N+1)

### 2. Students Management

- Get All Students
- Get Student by Matricule
- Update Student
- Delete Student

### 3. Academic Years

- Get All Academic Years
- Get Current Academic Year
- Create Academic Year
- Update Academic Year

### 4. Semesters

- Get All Semesters
- Get Current Semester
- Create Semester
- Update Semester

### 5. Classes

- Get All Classes
- Get Class by ID
- Create Class
- Update Class
- Delete Class

### 6. Courses

- Get All Courses
- Get Course by Code
- Create Course
- Update Course
- Delete Course

### 7. Teachers

- Get All Teachers
- Get Teacher by ID
- Create Teacher
- Update Teacher
- Delete Teacher

### 8. Questions

- Get All Questions
- Get Questions by Evaluation ID
- Create Question
- Update Question
- Delete Question

### 9. Choices

- Get All Choices
- Get Choices by Question ID
- Create Choice
- Update Choice
- Delete Choice

### 10. Evaluations

- Get All Evaluations
- Get Evaluations by Course Code
- Create Evaluation Session
- Update Evaluation
- Delete Evaluation

### 11. Response Sheets

- Get All Response Sheets
- Get Response Sheet by Matricule and Evaluation
- Create Response Sheet
- Update Response Sheet

### 12. Answers

- Get All Answers
- Get Answers by Response Sheet ID
- Create Answer (MCQ/Close)
- Create Open Answer
- Update Answer

### 13. Notifications

- Get All Notifications
- Create Notification

### 14. Administrators

- Create Administrator
- Update Administrator

### 15. Device Tokens (Push Notifications)

- Register Device Token
- Unregister Device Token
- Get My Tokens
- Update Token Last Used

### 16. Excel Import

- Download Template
- Import Questions from Excel

### 17. Offline Support

- Save Offline Answer
- Save Offline Open Answer
- Sync Pending Answer
- Sync All Pending Answers
- Get Pending Answers
- Submit Evaluation with Sync

## 🚀 Utilisation Rapide

### Étape 1: Authentification

1. Exécutez **Register Student** ou **Login Student**
2. Copiez le `token` de la réponse
3. Collez-le dans la variable `auth_token` de la collection

### Étape 2: Utiliser les Endpoints Protégés

Tous les endpoints nécessitant une authentification utilisent automatiquement la variable `{{auth_token}}` dans le header `Authorization`.

## 📝 Exemples de Payloads

### Inscription Étudiant

```json
{
  "matricule": "STU2024001",
  "email": "etudiant@univ-yaounde.cm",
  "firstName": "Jean",
  "lastName": "Dupont",
  "phoneNumber": 123456789,
  "password": "motdepasse123",
  "classId": 1,
  "studentCardId": "CARD123456"
}
```

### Création d'Évaluation

```json
{
  "courseCode": "INF101",
  "type": "Mid Term",
  "publishedDate": "2025-01-15",
  "startTime": "10:00:00",
  "endTime": "12:00:00",
  "uploadDate": "2025-01-10",
  "questions": [
    {
      "text": "Quelle est la capitale du Cameroun?",
      "type": "MCQ",
      "order": 1,
      "points": 5,
      "choices": [
        {
          "text": "Yaoundé",
          "isCorrect": true,
          "order": 1
        },
        {
          "text": "Douala",
          "isCorrect": false,
          "order": 2
        }
      ]
    }
  ]
}
```

### Réponse Hors Ligne

```json
{
  "clientId": "client-generated-uuid-123",
  "evaluationId": 1,
  "questionId": 5,
  "questionType": "MCQ",
  "selectedOption": 2,
  "clientTimestamp": "2025-01-01T12:00:00.000Z"
}
```

## 🔐 Authentification

La plupart des endpoints nécessitent un token JWT. Pour obtenir un token :

1. Utilisez **Login Student** ou **Login with Card**
2. Copiez le `token` de la réponse JSON
3. Collez-le dans la variable `auth_token` de la collection

Le token est valide pendant 7 jours.

## 📌 Notes Importantes

- **Base URL** : Par défaut `https://quizziz-backend-ir16.onrender.com`, modifiez selon votre configuration
- **Content-Type** : Tous les endpoints POST/PUT utilisent `application/json` sauf l'import Excel qui utilise `multipart/form-data`
- **Email Institutionnel** : Les emails doivent être des adresses institutionnelles (ex: `@univ-yaounde.cm`)
- **Types de Questions** : `MCQ`, `Open`, ou `Close`
- **Types d'Évaluations** : `Mid Term`, `CC`, `Final Exam`, `TP`, `Resit`, `TD`, `Other`
- **Device Types** : `ios`, `android`, ou `web`

## 🐛 Dépannage

### Erreur 401 (Unauthorized)

- Vérifiez que le token est valide et non expiré
- Assurez-vous que la variable `auth_token` est correctement définie

### Erreur 400 (Bad Request)

- Vérifiez le format JSON du payload
- Vérifiez que tous les champs requis sont présents
- Pour les emails, vérifiez qu'ils sont des adresses institutionnelles

### Erreur 404 (Not Found)

- Vérifiez que l'ID/Code dans l'URL existe
- Vérifiez que la base URL est correcte

## 📚 Documentation Complète

Pour plus de détails sur chaque endpoint, consultez :

- `AUTHENTICATION.md` - Authentification
- `PUSH_NOTIFICATIONS.md` - Push Notifications
- `EXCEL_IMPORT.md` - Import Excel
- `OFFLINE_SUPPORT.md` - Support Hors Ligne
