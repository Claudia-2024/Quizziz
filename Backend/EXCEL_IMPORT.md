# Documentation Import Excel - EQuizz

## Vue d'ensemble

Le système d'import Excel permet d'importer des questions depuis un fichier Excel (.xlsx, .xls, .ods). Le système supporte plusieurs formats de fichiers Excel et peut créer automatiquement les questions et leurs choix associés.

## Endpoints

### 1. Télécharger un Template Excel

**GET** `/excel/template`

Télécharge un fichier Excel template avec des exemples de questions pour faciliter la création de votre fichier d'import.

**Réponse:**

- Fichier Excel (.xlsx) avec des exemples

**Utilisation:**

```bash
curl -O https://quizziz-backend-ir16.onrender.com/excel/template
```

### 2. Importer des Questions

**POST** `/excel/import`

Importe des questions depuis un fichier Excel.

**Content-Type:** `multipart/form-data`

**Body:**

- `file`: Fichier Excel (requis)
- `courseCode`: Code du cours (optionnel)

**Exemple avec curl:**

```bash
curl -X POST https://quizziz-backend-ir16.onrender.com/excel/import \
  -F "file=@questions.xlsx" \
  -F "courseCode=INF101"
```

**Exemple avec JavaScript (FormData):**

```javascript
const formData = new FormData();
formData.append("file", fileInput.files[0]);
formData.append("courseCode", "INF101");

fetch("/excel/import", {
  method: "POST",
  body: formData,
})
  .then((response) => response.json())
  .then((data) => console.log(data));
```

**Réponse (201):**

```json
{
  "message": "3 question(s) importée(s) avec succès",
  "imported": 3,
  "failed": 0,
  "success": [
    {
      "questionId": 1,
      "text": "Quelle est la capitale du Cameroun?",
      "type": "MCQ",
      "order": 1
    },
    ...
  ]
}
```

**Réponse (207 - Partiellement réussi):**

```json
{
  "message": "2 question(s) importée(s) avec succès",
  "imported": 2,
  "failed": 1,
  "success": [...],
  "errors": [
    "Erreur lors de la création de la question \"...\": ..."
  ]
}
```

**Erreurs possibles:**

- `400`: Format de fichier invalide, erreurs de parsing ou validation
- `404`: Cours non trouvé (si courseCode fourni)
- `500`: Erreur serveur

## Format du Fichier Excel

Le système supporte plusieurs formats de fichiers Excel. Voici les formats recommandés :

### Format 1: Une ligne par question (Recommandé)

| Question Text                       | Type  | Order | Choice 1 | Choice 1 Correct | Choice 2 | Choice 2 Correct | Choice 3  | Choice 3 Correct | Points |
| ----------------------------------- | ----- | ----- | -------- | ---------------- | -------- | ---------------- | --------- | ---------------- | ------ |
| Quelle est la capitale du Cameroun? | MCQ   | 1     | Yaoundé  | X                | Douala   |                  | Bafoussam |                  | 5      |
| Expliquez le concept de POO         | Open  | 2     |          |                  |          |                  |           |                  | 10     |
| JavaScript est compilé              | Close | 3     | Vrai     |                  | Faux     | X                |           |                  | 3      |

**Colonnes requises:**

- `Question Text` ou `Question`: Le texte de la question (requis)
- `Type`: MCQ, Open, ou Close (requis)
- `Order`: Numéro d'ordre (optionnel, auto-généré si absent)

**Colonnes pour les choix (MCQ/Close uniquement):**

- `Choice 1`, `Choice 2`, etc.: Texte du choix
- `Choice 1 Correct`, `Choice 2 Correct`, etc.: Marquer avec X, true, 1, oui, yes, vrai pour la bonne réponse

**Colonnes optionnelles:**

- `Points`: Points attribués à la question

### Format 2: Une ligne par choix

| Question Text           | Type | Order | Choice Text | Is Correct | Points |
| ----------------------- | ---- | ----- | ----------- | ---------- | ------ |
| Quelle est la capitale? | MCQ  | 1     | Yaoundé     | X          | 5      |
| Quelle est la capitale? | MCQ  | 1     | Douala      |            | 5      |
| Quelle est la capitale? | MCQ  | 1     | Bafoussam   |            | 5      |
| Expliquez la POO        | Open | 2     |             |            | 10     |

**Note:** Les questions avec le même texte et ordre seront regroupées.

### Format 3: Format simple

Le système peut aussi détecter automatiquement les colonnes si elles contiennent des mots-clés comme:

- Question, Texte, Question Text
- Type
- Order, Ordre
- Choice, Choix, Option, Réponse

## Types de Questions

### MCQ (Multiple Choice Question)

- Doit avoir au moins 2 choix
- Au moins un choix doit être marqué comme correct
- Exemple: "Quelle est la capitale du Cameroun?"

### Open (Question ouverte)

- Pas de choix requis
- L'étudiant répond avec du texte libre
- Exemple: "Expliquez le concept de programmation orientée objet"

### Close (Question fermée - Vrai/Faux)

- Doit avoir exactement 2 choix (généralement Vrai/Faux)
- Un choix doit être marqué comme correct
- Exemple: "JavaScript est un langage compilé"

## Validation

Le système valide automatiquement:

1. **Format du fichier**: Doit être .xlsx, .xls, ou .ods
2. **Taille**: Maximum 10MB
3. **Colonnes requises**: Question Text et Type
4. **Types valides**: MCQ, Open, ou Close
5. **Choix minimum**: MCQ/Close doivent avoir au moins 2 choix
6. **Choix correct**: Au moins un choix doit être marqué comme correct pour MCQ/Close
7. **Doublons**: Détection des choix en double (avertissement)

## Exemples de Valeurs pour "Is Correct"

Les valeurs suivantes sont acceptées comme "correct":

- `X` ou `x`
- `true` ou `True`
- `1`
- `oui` ou `Oui`
- `yes` ou `Yes`
- `vrai` ou `Vrai`

Toute autre valeur est considérée comme incorrecte.

## Gestion des Erreurs

### Erreurs de Parsing

Si le fichier ne peut pas être lu ou parsé, une erreur 400 est retournée avec les détails.

### Erreurs de Validation

Si les données ne passent pas la validation, une erreur 400 est retournée avec:

- Liste des erreurs
- Liste des avertissements (si applicable)

### Erreurs Partielles

Si certaines questions sont importées avec succès et d'autres échouent, un code 207 (Multi-Status) est retourné avec:

- Nombre de questions importées
- Liste des succès
- Liste des erreurs

## Bonnes Pratiques

1. **Utilisez le template**: Téléchargez d'abord le template pour voir le format exact
2. **Vérifiez les types**: Assurez-vous que les types sont en majuscules (MCQ, Open, Close)
3. **Ordre des choix**: Les choix sont automatiquement ordonnés selon leur numéro (Choice 1, Choice 2, etc.)
4. **Points**: Les points sont optionnels mais recommandés
5. **Testez avec peu de questions**: Testez d'abord avec quelques questions avant d'importer un grand fichier

## Limitations

- **Taille maximale**: 10MB
- **Formats supportés**: .xlsx, .xls, .ods
- **Nombre de choix**: Pas de limite, mais recommandé entre 2 et 6 pour MCQ
- **Caractères spéciaux**: Supportés dans le texte des questions et choix

## Dépannage

### "Format de fichier non supporté"

- Vérifiez que le fichier est bien un fichier Excel (.xlsx, .xls, .ods)
- Essayez de réenregistrer le fichier dans Excel

### "Colonne Question Text introuvable"

- Vérifiez que la première ligne contient bien les en-têtes
- Vérifiez l'orthographe: "Question Text", "Question", "Texte", etc.

### "Les questions MCQ/Close doivent avoir au moins 2 choix"

- Assurez-vous que les colonnes Choice 1, Choice 2, etc. sont remplies
- Vérifiez qu'il n'y a pas d'espaces supplémentaires dans les noms de colonnes

### "Au moins un choix doit être marqué comme correct"

- Vérifiez que la colonne "Choice X Correct" contient X, true, 1, oui, yes, ou vrai pour au moins un choix

## Notes Techniques

- Les fichiers uploadés sont temporairement stockés dans le dossier `uploads/` et supprimés après traitement
- Le dossier `uploads/` est créé automatiquement s'il n'existe pas
- Les fichiers sont nommés avec un timestamp pour éviter les conflits
- Les questions existantes avec le même texte ne sont pas dupliquées (utilise la question existante)
