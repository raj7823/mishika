import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, doc, setDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const $ = id => document.getElementById(id);
let uid = null, started = false, stopMessages = null, messageCount = 0;
const timeLabel = ts => ts?.toDate ? ts.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '';
function toastCloud(message){const t=$('toast');if(!t)return;t.textContent=message;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),3000);}
function renderCloudMessages(items){const wrap=$('messages');if(!wrap)return;wrap.replaceChildren();messageCount=items.length;let userCount=0;items.forEach(m=>{if(m.sender==='user')userCount++;const row=document.createElement('div');row.className='message-row '+(m.sender==='user'?'mine':'');const bubble=document.createElement('div');bubble.className='bubble';bubble.textContent=m.text||'';const time=document.createElement('span');time.className='message-time';time.textContent=timeLabel(m.createdAt);row.append(bubble,time);wrap.append(row);});const body=$('chatBody');if(body)body.scrollTop=body.scrollHeight;
 // Retain the existing 30-message demo limit, but note that unlock/payment remains manual and must be secured before accepting money.
 const locked=userCount>=30 && localStorage.getItem('mishika_demo_unlocked')!=='yes';$('composer')?.classList.toggle('hidden',locked);$('lockedNotice')?.classList.toggle('hidden',!locked);if(locked && $('upgradeModal') && !window.__upgradeShown){window.__upgradeShown=true;setTimeout(()=>{if(localStorage.getItem('mishika_demo_unlocked')!=='yes')$('upgradeModal').classList.remove('hidden');},800);}}
async function ensureConversation(user){const key='mishika_chat_name';let name=localStorage.getItem(key)||'';if(!name){name=(prompt('Chat shuru karne ke liye apna naam likhein:')||'').trim().slice(0,60);if(!name)name='Guest';localStorage.setItem(key,name);}await setDoc(doc(db,'conversations',user.uid),{uid:user.uid,name,lastText:'',createdAt:serverTimestamp(),updatedAt:serverTimestamp()},{merge:true});}
window.startCloudChat=async function(){if(started)return;started=true;window.cloudChatActive=true;try{await signInAnonymously(auth);onAuthStateChanged(auth,async user=>{if(!user)return;uid=user.uid;try{await ensureConversation(user);stopMessages?.();const q=query(collection(db,'conversations',uid,'messages'),orderBy('createdAt','asc'));stopMessages=onSnapshot(q,snap=>renderCloudMessages(snap.docs.map(d=>d.data())),err=>{console.error(err);toastCloud('Chat load nahi hui. Firebase Rules check karein.');});}catch(err){console.error(err);toastCloud('Chat setup error. Firebase Rules/config check karein.');}});}catch(err){console.error(err);toastCloud('Firebase connect nahi hua. Hosting domain aur Auth settings check karein.');started=false;window.cloudChatActive=false;}};
window.sendCloudMessage=async function(){const input=$('messageInput'),text=(input?.value||'').trim();if(!text||!uid)return;try{const q=query(collection(db,'conversations',uid,'messages'),orderBy('createdAt','asc')); // current count is total messages; enforce 30 user messages locally as a basic UX limit only
 const userCount=Array.from($('messages')?.querySelectorAll('.message-row.mine')||[]).length;if(userCount>=30&&localStorage.getItem('mishika_demo_unlocked')!=='yes'){$('upgradeModal')?.classList.remove('hidden');return;}
 await addDoc(collection(db,'conversations',uid,'messages'),{text,sender:'user',createdAt:serverTimestamp()});await setDoc(doc(db,'conversations',uid),{lastText:text,updatedAt:serverTimestamp()},{merge:true});input.value='';}catch(err){console.error(err);toastCloud('Message send nahi hua. Firestore Rules check karein.');}};
// Existing app.js click/Enter handlers delegate to window.sendCloudMessage once cloud mode starts.
$('paidBtn')?.addEventListener('click',()=>toastCloud('Payment request abhi demo hai; real approval backend pending hai.'));
