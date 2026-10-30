import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const $ = id => document.getElementById(id);
let uid = null, started = false, stopMessages = null, stopConversation = null, messageCount = 0, userMessageCount = 0, messageLimit = 30, isUnlimited = false, currentName = 'Guest', selectedPlan = 'messages150';
const timeLabel = ts => ts?.toDate ? ts.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '';
function toastCloud(message){const t=$('toast');if(!t)return;t.textContent=message;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),3000);}
// The public profile shows the admin's live status (not in the admin panel). A heartbeat older than 90 seconds is treated as offline.
let stopPublicPresence=null;
function watchAdminPresence(){const label=$('publicOnlineStatus');if(!label||stopPublicPresence)return;stopPublicPresence=onSnapshot(doc(db,'presence','admin'),snap=>{const data=snap.exists()?snap.data():{};const last=data.lastSeen?.toDate?data.lastSeen.toDate().getTime():0;const online=data.status==='online' && (Date.now()-last)<90000;label.textContent=online?'Online now':'Offline';label.classList.toggle('is-online',online);label.classList.toggle('is-offline',!online);},err=>{console.warn('Presence unavailable',err);label.textContent='Status unavailable';label.classList.remove('is-online');label.classList.add('is-offline');});}
function renderCloudMessages(items){const wrap=$('messages');if(!wrap)return;wrap.replaceChildren();messageCount=items.length;userMessageCount=0;items.forEach(m=>{if(m.sender==='user')userMessageCount++;const row=document.createElement('div');row.className='message-row '+(m.sender==='user'?'mine':'');const bubble=document.createElement('div');bubble.className='bubble';if(m.mediaType==='image'&&m.mediaUrl){const img=document.createElement('img');img.src=m.mediaUrl;img.alt='Shared image';img.className='chat-media-image';img.loading='lazy';img.addEventListener('click',()=>window.open(m.mediaUrl,'_blank','noopener'));bubble.append(img);if(m.text&&m.text!=='[Image]'){const cap=document.createElement('div');cap.textContent=m.text;bubble.append(cap);}}else if(m.mediaType==='audio'&&m.mediaUrl){const audio=document.createElement('audio');audio.controls=true;audio.preload='metadata';audio.src=m.mediaUrl;audio.className='chat-audio';bubble.append(audio);}else{bubble.textContent=m.text||'';}const time=document.createElement('span');time.className='message-time';time.textContent=timeLabel(m.createdAt);row.append(bubble,time);wrap.append(row);});const body=$('chatBody');if(body)body.scrollTop=body.scrollHeight;const locked=!isUnlimited && userMessageCount>=messageLimit;$('composer')?.classList.toggle('hidden',locked);$('lockedNotice')?.classList.toggle('hidden',!locked);if(locked && $('upgradeModal') && !window.__upgradeShown){window.__upgradeShown=true;setTimeout(()=>{if(userMessageCount>=messageLimit)$('upgradeModal').classList.remove('hidden');},500);}}
async function ensureConversation(user){const key='mishika_chat_name';let name=localStorage.getItem(key)||'';if(!name){name=(prompt('Chat shuru karne ke liye apna naam likhein:')||'').trim().slice(0,60);if(!name)name='Guest';localStorage.setItem(key,name);}currentName=name;const convRef=doc(db,'conversations',user.uid);const existing=await getDoc(convRef);await setDoc(convRef,{uid:user.uid,name,lastText:'',messageLimit:existing.exists()?(existing.data().paidPlan ? (Number(existing.data().messageLimit)||30) : 30):30,isUnlimited:existing.exists()?Boolean(existing.data().isUnlimited):false,paidPlan:existing.exists()?(existing.data().paidPlan||'free'):'free',createdAt:existing.exists()?(existing.data().createdAt||serverTimestamp()):serverTimestamp(),updatedAt:serverTimestamp()},{merge:true});}
window.startCloudChat=async function(){if(started)return;started=true;window.cloudChatActive=true;try{await setPersistence(auth,browserLocalPersistence);let signingIn=false;onAuthStateChanged(auth,async user=>{if(!user){if(!signingIn){signingIn=true;try{await signInAnonymously(auth);}catch(err){console.error(err);toastCloud('Guest login nahi hua. Firebase Anonymous Auth enable karein.');started=false;window.cloudChatActive=false;}}return;}uid=user.uid;watchAdminPresence();try{await ensureConversation(user);stopMessages?.();stopConversation?.();stopConversation=onSnapshot(doc(db,'conversations',uid),snap=>{if(snap.exists()){const data=snap.data();currentName=data.name||currentName;messageLimit=Math.max(30,Number(data.messageLimit)||30);isUnlimited=Boolean(data.isUnlimited);renderLockOnly();}},err=>console.error(err));const q=query(collection(db,'conversations',uid,'messages'),orderBy('createdAt','asc'));stopMessages=onSnapshot(q,snap=>renderCloudMessages(snap.docs.map(d=>d.data())),err=>{console.error(err);toastCloud('Chat load nahi hui. Firebase Rules check karein.');});}catch(err){console.error(err);toastCloud('Chat setup error. Firebase Rules/config check karein.');}});}catch(err){console.error(err);toastCloud('Firebase connect nahi hua. Hosting domain aur Auth settings check karein.');started=false;window.cloudChatActive=false;}};
function renderLockOnly(){const locked=!isUnlimited && userMessageCount>=messageLimit;$('composer')?.classList.toggle('hidden',locked);$('lockedNotice')?.classList.toggle('hidden',!locked);if(locked)$('upgradeModal')?.classList.remove('hidden');}
window.sendCloudMessage=async function(){const input=$('messageInput'),text=(input?.value||'').trim();if(!text||!uid)return;try{if(!isUnlimited && userMessageCount>=messageLimit){renderLockOnly();return;}
 await addDoc(collection(db,'conversations',uid,'messages'),{text,sender:'user',createdAt:serverTimestamp()});await setDoc(doc(db,'conversations',uid),{lastText:text,updatedAt:serverTimestamp()},{merge:true});input.value='';}catch(err){console.error(err);toastCloud('Message send nahi hua. Firestore Rules check karein.');}};

function compressImageIfPossible(file){
  return new Promise(resolve=>{
    if(!file.type.startsWith('image/') || file.size<700*1024 || !('createImageBitmap' in window)){resolve(file);return;}
    createImageBitmap(file).then(bitmap=>{
      const maxSide=1600,scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));
      const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
      const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();
      canvas.toBlob(blob=>{if(blob&&blob.size<file.size)resolve(new File([blob],(file.name||'photo').replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg',lastModified:Date.now()}));else resolve(file);},'image/jpeg',0.78);
    }).catch(()=>resolve(file));
  });
}
function uploadWithProgress(storageRef,file,onProgress){
  return new Promise((resolve,reject)=>{
    const task=uploadBytesResumable(storageRef,file,{contentType:file.type||'application/octet-stream'});
    task.on('state_changed',snap=>onProgress?.(snap.totalBytes?Math.round(snap.bytesTransferred/snap.totalBytes*100):0),reject,()=>resolve(task.snapshot));
  });
}
async function uploadAndSendMedia(file, mediaType){
  if(!file||!uid)return;
  if(!isUnlimited&&userMessageCount>=messageLimit){renderLockOnly();return;}
  if(mediaType==='image')file=await compressImageIfPossible(file);
  const max=mediaType==='image'?12*1024*1024:12*1024*1024;
  if(file.size>max){toastCloud(mediaType==='image'?'Photo 12 MB se chhoti honi chahiye.':'Voice message 12 MB se chhota hona chahiye.');return;}
  const allowed=mediaType==='image'?file.type.startsWith('image/'):file.type.startsWith('audio/');
  if(!allowed){toastCloud('Yeh file format supported nahi hai. JPG/PNG photo ya voice message try karein.');return;}
  const label=mediaType==='image'?'Photo':'Voice';
  const toast=$('toast');let progressTimer;
  const showProgress=p=>{if(toast){toast.textContent=`${label} send ho rahi hai… ${p}%`;toast.classList.remove('hidden');}};
  showProgress(0);
  try{
    const ext=mediaType==='image'?(file.type==='image/jpeg'?'jpg':(file.type.split('/')[1]||'img').replace('jpeg','jpg')):(file.type.includes('mp4')?'m4a':file.type.includes('ogg')?'ogg':'webm');
    const path=`chat-media/${uid}/${Date.now()}-${mediaType}.${ext}`;
    const storageRef=ref(storage,path);
    await uploadWithProgress(storageRef,file,showProgress);
    const mediaUrl=await getDownloadURL(storageRef);
    const text=mediaType==='image'?'[Image]':'[Voice message]';
    await addDoc(collection(db,'conversations',uid,'messages'),{text,mediaType,mediaUrl,mediaPath:path,sender:'user',createdAt:serverTimestamp()});
    await setDoc(doc(db,'conversations',uid),{lastText:text,updatedAt:serverTimestamp()},{merge:true});
    toastCloud(mediaType==='image'?'Photo sent ✓':'Voice message sent ✓');
  }catch(err){
    console.error('Media upload/send failed:',err);
    let msg='Send nahi hua.';
    if(err.code==='storage/unauthorized')msg='Permission error: Firebase Storage Rules publish karein.';
    else if(err.code==='storage/bucket-not-found')msg='Firebase Storage abhi enable nahi hai.';
    else if(err.code==='storage/unauthenticated')msg='Login error: page refresh karke dobara try karein.';
    else if(err.code==='permission-denied')msg='Firestore Rules mein messages create permission check karein.';
    else if(err.code==='storage/canceled')msg='Upload cancel ho gaya.';
    else msg+=` (${err.code||err.message||'network error'})`;
    toastCloud(msg);
  }
}
$('imageBtn')?.addEventListener('click',()=>$('imageInput')?.click());$('imageInput')?.addEventListener('change',async e=>{const f=e.target.files?.[0];if(f)await uploadAndSendMedia(f,'image');e.target.value='';});
let mediaRecorder=null,recordedChunks=[],recordingStream=null;
$('recordBtn')?.addEventListener('click',async()=>{const btn=$('recordBtn');if(mediaRecorder&&mediaRecorder.state==='recording'){mediaRecorder.stop();btn.classList.remove('is-recording');return;}if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){toastCloud('Is browser mein voice recording supported nahi hai.');return;}try{recordingStream=await navigator.mediaDevices.getUserMedia({audio:true});recordedChunks=[];const mime=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'].find(t=>MediaRecorder.isTypeSupported(t));mediaRecorder=new MediaRecorder(recordingStream,mime?{mimeType:mime}:undefined);mediaRecorder.ondataavailable=e=>{if(e.data?.size)recordedChunks.push(e.data);};mediaRecorder.onstop=async()=>{recordingStream?.getTracks().forEach(t=>t.stop());$('recordingStatus')?.classList.add('hidden');const type=mediaRecorder?.mimeType||'audio/webm';const ext=type.includes('mp4')?'m4a':type.includes('ogg')?'ogg':'webm';const blob=new Blob(recordedChunks,{type});if(blob.size)await uploadAndSendMedia(new File([blob],`voice-${Date.now()}.${ext}`,{type}), 'audio');};mediaRecorder.start();btn.classList.add('is-recording');$('recordingStatus')?.classList.remove('hidden');toastCloud('Voice recording chal rahi hai. Send karne ke liye mic dobara dabayein.');}catch(err){console.error(err);toastCloud('Microphone permission allow karein. Website HTTPS par honi chahiye.');}});
const themeKey='mishika_dark_mode';function setTheme(dark){document.body.classList.toggle('dark-mode',dark);const b=$('themeToggle');if(b){b.textContent=dark?'☀':'☾';b.title=dark?'Light mode':'Dark mode';b.setAttribute('aria-label',b.title);}localStorage.setItem(themeKey,dark?'1':'0');}setTheme(localStorage.getItem(themeKey)==='1');$('themeToggle')?.addEventListener('click',()=>setTheme(!document.body.classList.contains('dark-mode')));
// Manual UPI payment requests: ₹199 adds 150 messages; ₹499 unlocks unlimited chat after admin verification.
function selectPlan(plan){selectedPlan=plan;const amount=plan==='unlimited'?499:199;const label=plan==='unlimited'?'Unlimited Chat':'150 More Messages';const amountEl=$('selectedPlanAmount');if(amountEl)amountEl.textContent=`Selected: ${label} · ₹${amount}`;const qrLabel=$('qrPaymentLabel');if(qrLabel)qrLabel.textContent=`Scan the UPI QR and pay ₹${amount}`;const qrArea=$('qrArea');qrArea?.classList.remove('hidden');}
$('buy150Btn')?.addEventListener('click',()=>selectPlan('messages150'));
$('buyUnlimitedBtn')?.addEventListener('click',()=>selectPlan('unlimited'));
$('showQrBtn')?.addEventListener('click',()=>selectPlan(selectedPlan));
$('paidBtn')?.addEventListener('click',async()=>{if(!uid){toastCloud('Pehle chat/login shuru karein.');return;}const utr=($('paymentUtr')?.value||'').trim();if(utr.length<6){toastCloud('UPI Transaction ID/UTR enter karein.');$('paymentUtr')?.focus();return;}const btn=$('paidBtn'),amount=selectedPlan==='unlimited'?499:199;btn.disabled=true;try{await addDoc(collection(db,'paymentRequests'),{uid,userName:currentName||'Guest',plan:selectedPlan,amount,utr:utr.slice(0,80),status:'pending',messagesToAdd:selectedPlan==='unlimited'?0:150,unlimited:selectedPlan==='unlimited',createdAt:serverTimestamp()});$('paymentStatus').textContent=`₹${amount} ki request bhej di gayi. Admin payment verify karke ${selectedPlan==='unlimited'?'Unlimited Chat':'150 aur messages'} unlock karega.`;$('paymentStatus').classList.remove('hidden');btn.textContent='Request Sent';toastCloud('Payment request Admin Panel mein bhej di gayi.');}catch(err){console.error(err);toastCloud('Payment request save nahi hui: '+(err.code||err.message||'Firestore Rules check karein.'));const ps=$('paymentStatus');if(ps){ps.textContent='Request save nahi hui ('+(err.code||'error')+'): '+(err.message||'Firestore Rules publish karein.');ps.classList.remove('hidden');}btn.disabled=false;}});
