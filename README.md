# 🧩 Script Google Sheets — Détection de Marques avec l’API Dandelion

## 🎯 Objectif

Ce script Google Apps Script permet de **détecter automatiquement la présence d’une marque ou d’une organisation** dans une cellule Google Sheets grâce à l’API **Dandelion**.  

Il renvoie :
- `VRAI` → une marque ou organisation est détectée  
- `FAUX` → aucune marque détectée  
- `"-"` → la cellule est vide  

---

## ⚙️ Installation du script

### Étape 1 : ouvrir l’éditeur de scripts
1. Ouvre ta feuille **Google Sheets**.  
2. Clique sur **Extensions → Apps Script**.  
3. Supprime tout contenu existant.  
4. Colle le contenu du fichier `dandelion.js`.  
5. Enregistre (**Ctrl + S** / **⌘ + S**).

### Étape 2 : créer un compte sur Dandelion pour accéder à l'API https://dandelion.eu/

### Étape 3 : enregistrer ton token Dandelion
1. Dans l’éditeur Apps Script, choisis la fonction `setDandelionToken` et exécute-la.  
2. Autorise l’accès si nécessaire.  
3. Entre ton token personnel :

   ```javascript
   setDandelionToken("TON_TOKEN_DANDELION_ICI");


   
