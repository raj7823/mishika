/* Firebase multi-user chat module for Mishika Family.
   Setup: create ../firebase-config.js from firebase-config.example.js, then import this module.
   Firebase Authentication must have Anonymous enabled. Firestore rules are in this folder. */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, doc, setDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig } from '../firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let uid = null, stopMessages = null;
const $ = id => document.getElementById(id);
const timeLabel = ts => ts?.toDate ? ts.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '…';

export async function startCloudChat() {
  const savedName = localStorage.getItem('mishika_chat_name') || '';
  let name = savedName;
  if (!name) {
    name = (prompt('Chat shuru karne ke liye apna naam likhein:') || '').trim().slice(0,60);
    if (!name) name = 'Guest';
    localStorage.setItem('mishika_chat_name', name);
  }
  await signInAnonymously(auth);
  onAuthStateChanged(auth, async user => {
    if (!user) return;
    uid = user.uid;
    await setDoc(doc(db,'conversations',uid), { uid, name, lastText:'', updatedAt:serverTimestamp(), createdAt:serverTimestamp() }, {merge:true});
    if (stopMessages) stopMessages();
    const q = query(collection(db,'conversations',uid,'messages'), orderBy('createdAt','asc'));
    stopMessages = onSnapshot(q, snap => {
      const wrap = $('messages'); if (!wrap) return;
      wrap.replaceChildren();
      snap.forEach(d => {
        const m = d.data(); const row = document.createElement('div');
        row.className = 'message-row ' + (m.sender === 'user' ? 'mine' : '');
        const bubble = document.createElement('div'); bubble.className='bubble'; bubble.textContent=m.text;
        const time = document.createElement('span'); time.className='message-time'; time.textContent=timeLabel(m.createdAt);
        row.append(bubble,time); wrap.append(row);
      });
      const body=$('chatBody'); if(body) body.scrollTop=body.scrollHeight;
    });
  });
}

export async function sendCloudMessage() {
  const input=$('messageInput'); const text=(input?.value||'').trim(); if(!text || !uid) return;
  const name=localStorage.getItem('mishika_chat_name')||'Guest';
  await addDoc(collection(db,'conversations',uid,'messages'), {text, sender:'user', createdAt:serverTimestamp()});
  await setDoc(doc(db,'conversations',uid), {name, uid, lastText:text, updatedAt:serverTimestamp()}, {merge:true});
  input.value='';
}

export { app, auth, db, onAuthStateChanged, doc, collection, addDoc, query, orderBy, onSnapshot, setDoc, serverTimestamp };
