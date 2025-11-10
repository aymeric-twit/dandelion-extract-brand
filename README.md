# 🧩 Script Google Sheets — Détection de Marques avec l’API Dandelion

## 🎯 Objectif

Ce script Google Apps Script permet de **détecter automatiquement la présence d’une marque ou d’une organisation** dans une cellule Google Sheets grâce à l’API **Dandelion**.  

Il renvoie :
- `VRAI` → une marque/organisation est détectée  
- `FAUX` → aucune marque détectée  
- `"-"` → cellule vide  

---

## ⚙️ Installation du script

### 1️⃣ Ouvrir l’éditeur de scripts
1. Ouvre ta feuille **Google Sheets**.  
2. Clique sur **Extensions → Apps Script**.  
3. Supprime le contenu existant.  
4. Colle l’intégralité du script (`Code.gs`) dans l’éditeur.  
5. Enregistre avec **Ctrl + S** ou **⌘ + S**.

---

### 2️⃣ Ajouter ton token Dandelion
1. Dans l’éditeur Apps Script, clique sur **Exécuter → Exécuter la fonction → setDandelionToken**.  
2. Autorise l’accès si demandé.  
3. Ajoute ton token Dandelion dans le code :
   ```javascript
   setDandelionToken("TON_TOKEN_DANDELION_ICI");
