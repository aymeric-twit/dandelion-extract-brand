function setDandelionToken(token) {
  PropertiesService.getScriptProperties().setProperty('DANDELION_TOKEN', token);
  return 'Token enregistré';
}

function getDandelionToken_() {
  const token = PropertiesService.getScriptProperties().getProperty('DANDELION_TOKEN');
  if (!token) throw new Error('Token Dandelion manquant. Exécutez setDandelionToken("VOTRE_TOKEN").');
  return token;
}

function callDandelionNEX_(text, lang, minConfidence) {
  const url = 'https://api.dandelion.eu/datatxt/nex/v1/';
  const params = {
    method: 'post',
    muteHttpExceptions: true,
    payload: {
      text: String(text || ''),
      lang: lang || 'fr',
      include: 'types',
      min_confidence: String(minConfidence ?? 0.6),
      token: getDandelionToken_()
    }
  };
  const res = UrlFetchApp.fetch(url, params);
  const code = res.getResponseCode();
  if (code < 200 || code >= 300) throw new Error('Dandelion API erreur HTTP ' + code + ' : ' + res.getContentText());
  return JSON.parse(res.getContentText());
}

function isBrandLike_(ann) {
  if (!ann || !ann.types) return false;
  const BRAND_TYPES = [
    'http://dbpedia.org/ontology/Brand',
    'http://dbpedia.org/ontology/Company',
    'http://dbpedia.org/ontology/Organisation',
    'http://dbpedia.org/ontology/Organization'
  ];
  const EXCLUDE_PREFIXES = [
    'http://dbpedia.org/ontology/Person',
    'http://dbpedia.org/ontology/Place',
    'http://dbpedia.org/ontology/ProgrammingLanguage'
  ];
  if (ann.types.some(t => EXCLUDE_PREFIXES.some(ex => t.indexOf(ex) === 0))) return false;
  return ann.types.some(t => BRAND_TYPES.some(bt => t.indexOf(bt) === 0));
}

function normalizeKey_(s) {
  if (s == null) return '';
  return s.toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
}

function localBrandMatch_(text, brandRange) {
  if (!text || !brandRange) return false;
  const textKey = normalizeKey_(text);
  const brands = brandRange.flat().filter(Boolean);
  const keys = new Set(brands.map(b => normalizeKey_(b)));
  const raw = text.toString();
  const tokens = raw.split(/[\s,.;:!?()\[\]'"“”«»]/).filter(Boolean);
  const candidates = new Set();
  candidates.add(textKey);
  tokens.forEach(t => candidates.add(normalizeKey_(t)));
  for (let i = 0; i < tokens.length; i++) {
    let chunk = tokens[i];
    for (let j = i + 1; j < Math.min(tokens.length, i + 4); j++) {
      chunk += ' ' + tokens[j];
      const nk = normalizeKey_(chunk);
      if (nk.length >= 3) candidates.add(nk);
    }
  }
  for (const c of candidates) {
    if (keys.has(c)) return true;
  }
  return false;
}

function BRAND_PRESENT(text, lang, min_confiance) {
  if (text === null || text === undefined || text === '') return '-';
  const data = callDandelionNEX_(text, lang || 'fr', min_confiance ?? 0.6);
  const anns = (data.annotations || []);
  return anns.some(isBrandLike_);
}

function BRAND_LIST(text, lang, min_confiance) {
  if (text === null || text === undefined || text === '') return [['-']];
  const data = callDandelionNEX_(text, lang || 'fr', min_confiance ?? 0.6);
  const labels = (data.annotations || []).filter(isBrandLike_).map(a => a.label || a.title || a.spot).filter(Boolean);
  const uniq = Array.from(new Set(labels));
  return uniq.length ? uniq.map(x => [x]) : [['-']];
}

function BRAND_PRESENT_SMART(text, brandRange, lang, min_confiance) {
  if (text === null || text === undefined || text === '') return '-';
  try {
    const data = callDandelionNEX_(text, lang || 'fr', (min_confiance ?? 0.3));
    const anns = (data.annotations || []);
    const hasBrand = anns.some(isBrandLike_);
    if (hasBrand) return true;
  } catch (e) {}
  return localBrandMatch_(text, brandRange) || false;
}
