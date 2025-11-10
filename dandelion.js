/** ==========================
 *  Dandelion NEX for Google Sheets (Apps Script)
 *  Version améliorée : robustesse, retries, JSDoc, UserProperties
 *  ==========================
 */

/** Enregistre ton token Dandelion (stocké par utilisateur).
 * @param {string} token
 * @return {string}
 * @customfunction
 */
function setDandelionToken(token) {
  PropertiesService.getUserProperties().setProperty('DANDELION_TOKEN', String(token || ''));
  return 'Token enregistré pour cet utilisateur';
}

function getDandelionToken_() {
  const token = PropertiesService.getUserProperties().getProperty('DANDELION_TOKEN');
  if (!token) throw new Error('Token Dandelion manquant. Exécutez =setDandelionToken("VOTRE_TOKEN").');
  return token;
}

/**
 * Appel Dandelion NEX avec petite logique de retry (429/503) et gestion d’erreurs JSON.
 * @param {string} text
 * @param {string} lang
 * @param {number} minConfidence
 * @return {Object}
 * @private
 */
function callDandelionNEX_(text, lang, minConfidence) {
  const url = 'https://api.dandelion.eu/datatxt/nex/v1/';
  const payload = {
    text: String(text || ''),
    lang: lang || 'fr',          // tu peux passer 'auto'
    include: 'types',
    min_confidence: String(minConfidence ?? 0.6),
    token: getDandelionToken_(),
  };

  const options = {
    method: 'post',
    muteHttpExceptions: true,
    payload, // form-encoded par défaut (OK pour Dandelion)
  };

  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = UrlFetchApp.fetch(url, options);
    const code = res.getResponseCode();
    const body = res.getContentText() || '';

    if (code >= 200 && code < 300) {
      const json = body ? JSON.parse(body) : {};
      if (json.error) {
        throw new Error(`Dandelion API erreur ${json.error.code || ''}: ${json.error.message || JSON.stringify(json.error)}`);
      }
      return json;
    }

    if (code === 429 || code === 503) {
      const retryAfter = Number(res.getHeaders()['Retry-After'] || 0);
      Utilities.sleep(Math.max(500, retryAfter * 1000 || (500 * (attempt + 1))));
      lastErr = new Error(`Dandelion API HTTP ${code}: ${body}`);
      continue;
    }

    throw new Error(`Dandelion API HTTP ${code}: ${body}`);
  }

  throw lastErr || new Error('Échec de l’appel Dandelion après retries.');
}

/**
 * Détermine si une annotation ressemble à une marque/organisation.
 * @param {Object} ann
 * @return {boolean}
 * @private
 */
function isBrandLike_(ann) {
  if (!ann || !ann.types) return false;
  const BRAND_TYPES = [
    'http://dbpedia.org/ontology/Brand',
    'http://dbpedia.org/ontology/Company',
    'http://dbpedia.org/ontology/Organisation',
    'http://dbpedia.org/ontology/Organization',
  ];
  const EXCLUDE_PREFIXES = [
    'http://dbpedia.org/ontology/Person',
    'http://dbpedia.org/ontology/Place',
    'http://dbpedia.org/ontology/ProgrammingLanguage',
  ];
  if (ann.types.some(t => EXCLUDE_PREFIXES.some(ex => t.indexOf(ex) === 0))) return false;
  return ann.types.some(t => BRAND_TYPES.some(bt => t.indexOf(bt) === 0));
}

/**
 * Normalisation pour les comparaisons (case/accents/symboles).
 * @param {string} s
 * @return {string}
 * @private
 */
function normalizeKey_(s) {
  if (s == null) return '';
  return s.toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Fallback local : détection par liste utilisateur (n-grammes jusqu’à 3).
 * @param {string} text
 * @param {Range|Array<Array<string>>} brandRange
 * @return {boolean}
 * @private
 */
function localBrandMatch_(text, brandRange) {
  if (!text || !brandRange) return false;

  // brandRange peut être une Range ou une matrice 2D déjà lue
  const values = typeof brandRange.getValues === 'function'
    ? brandRange.getValues()
    : brandRange;

  const brands = (values || []).flat().filter(Boolean);
  if (!brands.length) return false;

  const keys = new Set(brands.map(b => normalizeKey_(b)));
  const raw = text.toString();
  const tokens = raw.split(/[\s,.;:!?()\[\]'"“”«»]/).filter(Boolean);

  const candidates = new Set();
  candidates.add(normalizeKey_(raw));
  tokens.forEach(t => candidates.add(normalizeKey_(t)));

  const maxN = 3;
  for (let i = 0; i < tokens.length; i++) {
    let chunk = tokens[i];
    for (let j = i + 1; j < Math.min(tokens.length, i + maxN); j++) {
      chunk += ' ' + tokens[j];
      const nk = normalizeKey_(chunk);
      if (nk.length >= 3) candidates.add(nk);
    }
  }

  for (const c of candidates) {
    if (c && keys.has(c)) return true;
  }
  return false;
}

/** Renvoie VRAI si au moins une marque/organisation est détectée par Dandelion, sinon FAUX.
 * @param {string} text
 * @param {string=} lang  Par ex. "fr" (défaut) ou "auto"
 * @param {number=} min_confiance  Par ex. 0.6 (défaut)
 * @return {boolean}
 * @customfunction
 */
function BRAND_PRESENT(text, lang, min_confiance) {
  if (text === null || text === undefined || text === '') return false;
  const data = callDandelionNEX_(text, lang || 'fr', min_confiance ?? 0.6);
  const anns = (data.annotations || []);
  return anns.some(isBrandLike_);
}

/** Liste unique des marques/organisations détectées (colonne). Vide si rien.
 * @param {string} text
 * @param {string=} lang  Par ex. "fr" (défaut) ou "auto"
 * @param {number=} min_confiance  Par ex. 0.6 (défaut)
 * @return {string[][]}
 * @customfunction
 */
function BRAND_LIST(text, lang, min_confiance) {
  if (text === null || text === undefined || text === '') return [['']];
  const data = callDandelionNEX_(text, lang || 'fr', min_confiance ?? 0.6);
  const labels = (data.annotations || [])
    .filter(isBrandLike_)
    .map(a => a.label || a.title || a.spot)
    .filter(Boolean);
  const uniq = Array.from(new Set(labels));
  return uniq.length ? uniq.map(x => [x]) : [['']];
}

/** Version "maligne": tente Dandelion (seuil plus bas), sinon fallback par liste locale.
 * @param {string} text
 * @param {Range|Array<Array<string>>} brandRange  plage de marques connues par l’utilisateur
 * @param {string=} lang  Par ex. "fr" (défaut) ou "auto"
 * @param {number=} min_confiance  Par ex. 0.3 (défaut)
 * @return {boolean}
 * @customfunction
 */
function BRAND_PRESENT_SMART(text, brandRange, lang, min_confiance) {
  if (text === null || text === undefined || text === '') return false;
  try {
    const data = callDandelionNEX_(text, lang || 'fr', (min_confiance ?? 0.3));
    const anns = (data.annotations || []);
    if (anns.some(isBrandLike_)) return true;
  } catch (e) {
    // silencieux: on retombe sur le match local
  }
  return localBrandMatch_(text, brandRange) || false;
}

/** Fonction de test (facultatif): renvoie le JSON brut pour inspection rapide.
 * @return {string}
 * @customfunction
 */
function DANDELION_TEST() {
  const json = callDandelionNEX_('J’adore mon iPhone Apple', 'fr', 0.5);
  return JSON.stringify(json);
}
