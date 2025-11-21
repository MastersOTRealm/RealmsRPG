// REPLACED: Full file rewritten to mirror retrieval pattern used in library.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-check.js";

const FALLBACK_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><rect width="100%" height="100%" fill="%23053357"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-size="44" fill="white" font-family="Arial">?</text></svg>';

async function loadHeaderFooter() {
  const header = document.getElementById('header');
  const footer = document.getElementById('footer');
  if (header) header.innerHTML = await fetch('/header.html').then(r => r.text()).catch(()=>'')
  if (footer) footer.innerHTML = await fetch('/footer.html').then(r => r.text()).catch(()=>'')
}

function createSampleCard(grid) {
  const a = document.createElement('a');
  a.href = '/characterSheet.html?id=placeholder';
  a.className = 'character-card sample';
  a.innerHTML = `
    <div class="portrait">
      <img src="${FALLBACK_AVATAR}" alt="Sample">
    </div>
    <p class="name">GATH (SAMPLE)</p>
  `;
  grid.appendChild(a);
}

function createAddSlot(grid) {
  const div = document.createElement('div');
  div.className = 'character-card add-new';
  div.innerHTML = `
    <div class="portrait placeholder"><span class="plus">+</span></div>
    <p class="name add-text">Add Character</p>
  `;
  div.addEventListener('click', () => {
    window.location.href = '/characterCreator.html';
  });
  grid.appendChild(div);
}

function createCharacterCard(docSnap) {
  const data = docSnap.data();
  const card = document.createElement('div');
  card.className = 'character-card';
  const portrait = data.portrait || FALLBACK_AVATAR;
  const name = (data.name || 'Unnamed').toUpperCase();
  card.innerHTML = `
    <div class="portrait">
      <img src="${portrait}" alt="${name}" onerror="this.src='${FALLBACK_AVATAR}'">
    </div>
    <p class="name">${name}</p>
  `;
  card.addEventListener('click', () => {
    window.location.href = `/characterSheet.html?id=${docSnap.id}`;
  });
  return card;
}

async function loadCharacters(db, uid) {
  const grid = document.getElementById('character-grid');
  if (!grid) return;
  grid.innerHTML = '';
  createSampleCard(grid);

  try {
    const snap = await getDocs(collection(db, 'users', uid, 'character'));
    if (snap.empty) {
      const emptyMsg = document.createElement('div');
      emptyMsg.style.padding = '16px';
      emptyMsg.style.opacity = '.75';
      emptyMsg.textContent = 'You have no saved characters yet.';
      grid.appendChild(emptyMsg);
      createAddSlot(grid);
      return;
    }
    snap.forEach(docSnap => {
      grid.appendChild(createCharacterCard(docSnap));
    });
    createAddSlot(grid);
  } catch (e) {
    console.error('Error loading characters:', e);
    const msg = document.createElement('div');
    msg.style.padding = '16px';
    msg.style.color = '#dc3545';
    msg.style.fontWeight = 'bold';
    if (e.code === 'permission-denied') {
      msg.innerHTML = `
        <p>⚠️ Permission denied loading characters.</p>
        <p style="font-size:0.9em;margin-top:8px;">Please contact the administrator to update Firebase security rules for the 'character' collection.</p>
      `;
    } else {
      msg.textContent = 'Error loading characters: ' + (e.message || 'Unknown error');
    }
    grid.appendChild(msg);
    createAddSlot(grid);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadHeaderFooter();
  let firebaseConfig;
  try {
    firebaseConfig = await fetch('/__/firebase/init.json').then(r => r.json());
  } catch {
    console.error('Failed to fetch firebase config');
    return;
  }
  firebaseConfig.authDomain = 'realmsroleplaygame.com';
  const app = initializeApp(firebaseConfig);

  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6Ld4CaAqAAAAAMXFsM-yr1eNlQGV2itSASCC7SmA'),
    isTokenAutoRefreshEnabled: true
  });

  const auth = getAuth(app);
  const db = getFirestore(app);

  onAuthStateChanged(auth, user => {
    if (user) {
      console.log('User is signed in:', user.uid);
      loadCharacters(db, user.uid);
    } else {
      console.log('No user is signed in');
      const grid = document.getElementById('character-grid');
      if (!grid) return;
      grid.innerHTML = '';
      createSampleCard(grid);
      createAddSlot(grid);
    }
  });
});
