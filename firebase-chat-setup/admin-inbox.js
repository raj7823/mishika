/* Import this from an admin page served over HTTPS after creating firebase-config.js.
   Admins must sign in with Email/Password and their UID must have an admins/{UID} document
   created manually in Firebase Console. Do not make admin documents writable from the browser. */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, collection, query, orderBy, onSnapshot, doc, setDoc, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig } from '../firebase-config.js';
const app=initializeApp(firebaseConfig), auth=getAuth(app), db=getFirestore(app);
const $=id=>document.getElementById(id); let selected=null, stopList=null, stopChat=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function adminLogin(email,password){await signInWithEmailAndPassword(auth,email,password);}
export async function adminLogout(){await signOut(auth);}
onAuthStateChanged(auth,user=>{ if(!user)return; const q=query(collection(db,'conversations'),orderBy('updatedAt','desc')); stopList?.(); stopList=onSnapshot(q,snap=>{
 const list=$('inboxList'); if(!list)return; list.replaceChildren();
 snap.forEach(d=>{const x=d.data(), b=document.createElement('button');b.className='inbox-user';b.innerHTML=`<strong>${esc(x.name||'Guest')}</strong><span>${esc(x.lastText||'No messages yet')}</span>`;b.onclick=()=>openConversation(d.id,x.name||'Guest');list.append(b);});
 }); });
function openConversation(uid,name){selected=uid;$('chatTitle').textContent=name;stopChat?.();const q=query(collection(db,'conversations',uid,'messages'),orderBy('createdAt','asc'));stopChat=onSnapshot(q,snap=>{const box=$('chatMessages');box.replaceChildren();snap.forEach(d=>{const m=d.data(),p=document.createElement('p');p.className='admin-bubble '+(m.sender==='admin'?'admin-mine':'');p.textContent=(m.sender==='admin'?'You: ':'User: ')+m.text;box.append(p);});box.scrollTop=box.scrollHeight;});}
export async function replyToSelected(){const input=$('adminReply'),text=(input.value||'').trim();if(!selected||!text)return;await addDoc(collection(db,'conversations',selected,'messages'),{text,sender:'admin',createdAt:serverTimestamp()});await setDoc(doc(db,'conversations',selected),{lastText:text,updatedAt:serverTimestamp()},{merge:true});input.value='';}
