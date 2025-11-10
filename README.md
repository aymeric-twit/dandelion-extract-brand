# 🧩 Script Google Sheets — Détection de marques avec l’API Dandelion

## Objectif

Ce script Google Apps Script permet de **détecter automatiquement la présence d’une marque ou d’une organisation** dans une cellule Google Sheets grâce à l’API **Dandelion**.  

Il renvoie :
- `TRUE` → une marque ou organisation est détectée  
- `FALSE` → aucune marque détectée  
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



# Utilisation dans Google Sheets

Cette section décrit comment utiliser le script et ses fonctions directement dans Google Sheets pour détecter la présence de marques dans du texte.

## ▶️ Détection simple

Vérifie si une marque est détectée dans une cellule :

```
=BRAND_PRESENT(A2)
```

**Résultat :**
- `VRAI` → une marque est détectée
- `FAUX` → aucune marque détectée
- `"-"` → la cellule est vide

Tu peux aussi ajuster la langue (fr, en, it, etc.) et le niveau de confiance (entre 0 et 1) :

```
=BRAND_PRESENT(A2;"fr";0.5)
```

### Exemples :

| Texte dans A2 | Formule utilisée | Résultat |
|---------------|------------------|----------|
| Nike Air Max | `=BRAND_PRESENT(A2)` | VRAI |
| J'adore mon sac à dos | `=BRAND_PRESENT(A2)` | FAUX |
| (cellule vide) | `=BRAND_PRESENT(A2)` | "-" |

---

## 📋 Liste des marques détectées

Affiche toutes les marques reconnues dans le texte d'une cellule :

```
=BRAND_LIST(A2)
```

**Fonctionnement :**
- Analyse le contenu de la cellule pour trouver toutes les marques mentionnées.
- Retourne une liste verticale de marques détectées.
- Si aucune marque n'est trouvée, renvoie `"-"`.

### Exemples :

| Texte dans A2 | Formule utilisée | Résultat |
|---------------|------------------|----------|
| Je porte un pull Nike et un sac Adidas | `=BRAND_LIST(A2)` | Nike<br>Adidas |
| Un café au Starbucks avec mon iPhone | `=BRAND_LIST(A2)` | Starbucks<br>Apple |
| J'aime le café maison | `=BRAND_LIST(A2)` | "-" |

---

## 🧠 Détection intelligente (avec ta propre liste)

Combine la détection Dandelion avec ta liste personnalisée de marques locales.

Cette méthode améliore la précision et reconnaît les marques mal identifiées (par exemple ba&sh).

### Configuration :

1. Crée une nouvelle feuille appelée **Brands**.
2. Ajoute ta liste de marques dans la colonne A :

| A |
|---|
| ba&sh |
| Zara |
| Uniqlo |
| H&M |
| Dior |

3. Utilise la formule suivante :

```
=BRAND_PRESENT_SMART(A2;Brands!A:A)
```

**Paramètres :**
- `A2` → cellule contenant le texte à analyser
- `Brands!A:A` → plage de ta liste personnalisée de marques

**Résultat :**
- `VRAI` → marque trouvée par Dandelion ou dans ta liste
- `FAUX` → aucune marque trouvée
- `"-"` → cellule vide

### Exemples :

| Texte dans A2 | Formule utilisée | Résultat |
|---------------|------------------|----------|
| bash polo | `=BRAND_PRESENT_SMART(A2;Brands!A:A)` | VRAI (détecte ba&sh) |
| chemise Zara femme | `=BRAND_PRESENT_SMART(A2;Brands!A:A)` | VRAI |
| pull sans marque | `=BRAND_PRESENT_SMART(A2;Brands!A:A)` | FAUX |
| (cellule vide) | `=BRAND_PRESENT_SMART(A2;Brands!A:A)` | "-" |

---

## 🧩 Résumé rapide des fonctions

| Fonction | Description | Exemple | Résultat |
|----------|-------------|---------|----------|
| `BRAND_PRESENT(text; [lang]; [min_confiance])` | Détection automatique via l'API Dandelion | `=BRAND_PRESENT(A2;"fr";0.6)` | VRAI / FAUX / "-" |
| `BRAND_LIST(text; [lang]; [min_confiance])` | Liste toutes les marques détectées | `=BRAND_LIST(A2)` | Liste verticale ou "-" |
| `BRAND_PRESENT_SMART(text; brandRange; [lang]; [min_confiance])` | Combine Dandelion + ta liste locale | `=BRAND_PRESENT_SMART(A2;Brands!A:A)` | VRAI / FAUX / "-

