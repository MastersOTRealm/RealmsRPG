import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-check.js";

let db;
export { db };

export async function initializeFirebase() {
  const response = await fetch('/__/firebase/init.json');
  const firebaseConfig = await response.json();
  firebaseConfig.authDomain = 'realmsroleplaygame.com';
  const app = initializeApp(firebaseConfig);
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6Ld4CaAqAAAAAMXFsM-yr1eNlQGV2itSASCC7SmA'),
    isTokenAutoRefreshEnabled: true
  });
  await new Promise(r => setTimeout(r, 500));
  db = getDatabase(app);
  return db;
}

export let allTraits = {};
export let allSpecies = [];
export let allFeats = [];
export let archetypeFeats = [];
export let characterFeats = [];
export let allSkills = [];
export let allEquipment = [];

let traitsLoaded = false;
let speciesLoaded = false;

export async function loadTraits() {
  if (traitsLoaded) return;
  console.log('Loading traits...');
  const snap = await get(ref(db, 'traits'));
  const data = snap.val();
  if (data) {
    allTraits = data;
    console.log(`✓ Loaded ${Object.keys(allTraits).length} traits`);
  }
  traitsLoaded = true;
}

export async function loadSpecies() {
  if (speciesLoaded) return;
  console.log('Loading species...');
  const snap = await get(ref(db, 'species'));
  const data = snap.val();
  if (!data) return;
  
  allSpecies = Object.values(data).map(s => {
    let adulthood_lifespan = Array.isArray(s.adulthood_lifespan) ? s.adulthood_lifespan.map(n => parseInt(String(n).trim())) : (typeof s.adulthood_lifespan === 'string' ? s.adulthood_lifespan.split(',').map(n => parseInt(n.trim())) : [0, 0]);
    let adulthood = adulthood_lifespan[0] || 0;
    let max_age = adulthood_lifespan[1] || 0;
    let skills = typeof s.skills === 'string' ? s.skills.split(',').map(sk => sk.trim()) : (Array.isArray(s.skills) ? s.skills : []);
    let languages = typeof s.languages === 'string' ? s.languages.split(',').map(l => l.trim()) : (Array.isArray(s.languages) ? s.languages : []);
    let species_traits = typeof s.species_traits === 'string' ? s.species_traits.split(',').map(name => name.trim()) : (Array.isArray(s.species_traits) ? s.species_traits : []);
    let ancestry_traits = typeof s.ancestry_traits === 'string' ? s.ancestry_traits.split(',').map(name => name.trim()) : (Array.isArray(s.ancestry_traits) ? s.ancestry_traits : []);
    let flaws = typeof s.flaws === 'string' ? s.flaws.split(',').map(name => name.trim()) : (Array.isArray(s.flaws) ? s.flaws : []);
    let characteristics = typeof s.characteristics === 'string' ? s.characteristics.split(',').map(name => name.trim()) : (Array.isArray(s.characteristics) ? s.characteristics : []);
    
    function sanitizeId(name) {
      if (!name) return '';
      return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    }
    
    species_traits = species_traits.map(name => ({ name, desc: allTraits[sanitizeId(name)]?.description || 'No description' }));
    ancestry_traits = ancestry_traits.map(name => ({ name, desc: allTraits[sanitizeId(name)]?.description || 'No description' }));
    flaws = flaws.map(name => ({ name, desc: allTraits[sanitizeId(name)]?.description || 'No description' }));
    characteristics = characteristics.map(name => ({ name, desc: allTraits[sanitizeId(name)]?.description || 'No description' }));
    
    return {
      ...s,
      ave_height: s.ave_hgt_cm,
      ave_weight: s.ave_wgt_kg,
      adulthood,
      max_age,
      skills,
      languages,
      species_traits,
      ancestry_traits,
      flaws,
      characteristics,
      sizes: typeof s.sizes === 'string' ? s.sizes.split(',').map(sz => sz.trim()) : (Array.isArray(s.sizes) ? s.sizes : []),
      type: s.type || '',
    };
  });
  console.log(`✓ Loaded ${allSpecies.length} species`);
  speciesLoaded = true;
}

export async function loadFeats() {
  if (allFeats.length > 0) return;
  console.log('Loading feats...');
  const snap = await get(ref(db, 'feats'));
  const data = snap.val();
  if (data) {
    allFeats = Object.values(data).map(f => ({
      ...f,
      char_feat: f.char_feat || false,
    }));
    archetypeFeats = allFeats.filter(f => !f.char_feat);
    characterFeats = allFeats.filter(f => f.char_feat);
    console.log(`✓ Loaded ${allFeats.length} feats (${archetypeFeats.length} archetype, ${characterFeats.length} character)`);
  }
}

export async function loadSkills() {
  if (allSkills.length > 0) return;
  console.log('Loading skills...');
  const snap = await get(ref(db, 'skills'));
  const data = snap.val();
  if (data) {
    allSkills = Object.values(data).map(s => ({
      ...s,
      ability: typeof s.ability === 'string' ? s.ability.split(',').map(a => a.trim()).filter(a => a) : (Array.isArray(s.ability) ? s.ability : []),
    }));
    console.log(`✓ Loaded ${allSkills.length} skills`);
  }
}

export async function loadEquipment() {
  if (allEquipment.length > 0) return;
  console.log('Loading equipment...');
  const snap = await get(ref(db, 'items'));
  const data = snap.val();
  if (data) {
    allEquipment = Object.values(data).map(e => ({
      ...e,
      currency: parseInt(e.currency) || 0,
    }));
    console.log(`✓ Loaded ${allEquipment.length} equipment`);
  }
}
