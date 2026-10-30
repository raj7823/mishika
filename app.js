const $ = id => document.getElementById(id);
const KEY = "chatspace_demo_v1";
const state = loadState();
function loadState(){try{return JSON.parse(localStorage.getItem(KEY)) || {messages:[], unlocked:false, paymentRequest:null, userName:"Visitor", followed:false};}catch(e){return {messages:[],unlocked:false,paymentRequest:null,userName:"Visitor",followed:false};}}
function save(){localStorage.setItem(KEY, JSON.stringify(state));}
function toast(message){const t=$("toast");t.textContent=message;t.classList.remove("hidden");setTimeout(()=>t.classList.add("hidden"),2600);}
function openChat(){ $("chatOverlay").classList.remove("hidden"); if(window.startCloudChat) window.startCloudChat(); else { renderMessages(); updateLock(); } setTimeout(()=>$("messageInput").focus(),100); }
function closeChat(){ $("chatOverlay").classList.add("hidden"); }
function renderMessages(){const wrap=$("messages");wrap.innerHTML="";state.messages.forEach(m=>{const row=document.createElement("div");row.className="message-row "+(m.from==="user"?"mine":"");const bubble=document.createElement("div");bubble.className="bubble";bubble.textContent=m.text;const time=document.createElement("span");time.className="message-time";time.textContent=m.time||"";row.appendChild(bubble);row.appendChild(time);wrap.appendChild(row);});$("chatBody").scrollTop=$("chatBody").scrollHeight;}
function userMessageCount(){return state.messages.filter(m=>m.from==="user").length;}
function updateLock(){const locked=!state.unlocked && userMessageCount()>=150;$("composer").classList.toggle("hidden",locked);$("lockedNotice").classList.toggle("hidden",!locked);if(locked && !state.upgradeTimerShown){state.upgradeTimerShown=true;save();setTimeout(()=>{if(!state.unlocked && userMessageCount()>=150){$("upgradeModal").classList.remove("hidden");}},5000);} }
function sendMessage(){if(window.cloudChatActive && window.sendCloudMessage){window.sendCloudMessage();return;}const input=$("messageInput");const text=input.value.trim();if(!text)return;if(!state.unlocked && userMessageCount()>=150){updateLock();return;}state.messages.push({from:"user",text,time:new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})});input.value="";save();renderMessages();updateLock();if(userMessageCount()===150){toast("You can still read your conversation.");setTimeout(()=>{if(!state.unlocked)$("upgradeModal").classList.remove("hidden");},5000);} }
function makeRandomPlaceholderQR(){const box=$("qrPlaceholder");box.innerHTML="";const n=21;const cells=Array.from({length:n*n},()=>false);function finder(x0,y0){for(let y=0;y<7;y++)for(let x=0;x<7;x++){const xx=x0+x,yy=y0+y;cells[yy*n+xx]=(x===0||x===6||y===0||y===6||(x>=2&&x<=4&&y>=2&&y<=4));}}finder(0,0);finder(n-7,0);finder(0,n-7);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const inFinder=(x<7&&y<7)||(x>=n-7&&y<7)||(x<7&&y>=n-7);if(!inFinder)cells[y*n+x]=Math.random()>.52;}cells.forEach(dark=>{const cell=document.createElement("i");cell.className="qr-cell"+(dark?" dark":"");box.appendChild(cell);});}
$("messageBtn").addEventListener("click",openChat);$("backBtn").addEventListener("click",closeChat);$("sendBtn").addEventListener("click",sendMessage);$("messageInput").addEventListener("keydown",e=>{if(e.key==="Enter")sendMessage();});$("upgradeBtn").addEventListener("click",()=>$("upgradeModal").classList.remove("hidden"));$("closeUpgrade").addEventListener("click",()=>$("upgradeModal").classList.add("hidden"));$("showQrBtn").addEventListener("click",()=>{$("qrArea").classList.remove("hidden");makeRandomPlaceholderQR();});$("paidBtn").addEventListener("click",()=>{if(window.cloudChatActive)return;state.paymentRequest={status:"pending",requestedAt:new Date().toISOString(),userName:state.userName||"Visitor",amount:49};save();$("paymentStatus").classList.remove("hidden");$("paidBtn").disabled=true;$("paidBtn").textContent="Request sent";toast("Demo request sent to admin panel.");});$("chatMenuBtn").addEventListener("click",()=>toast("ChatSpace demo conversation"));window.addEventListener("storage",e=>{if(window.cloudChatActive)return;if(e.key===KEY){Object.assign(state,loadState());renderMessages();updateLock();if(state.unlocked){$("upgradeModal").classList.add("hidden");toast("Chat unlocked by admin.");}}});window.addEventListener("focus",()=>{if(window.cloudChatActive)return;Object.assign(state,loadState());renderMessages();updateLock();if(state.unlocked){$("upgradeModal").classList.add("hidden");$("composer").classList.remove("hidden");$("lockedNotice").classList.add("hidden");}});renderMessages();updateLock();if(state.unlocked){$("upgradeModal").classList.add("hidden");}

const BASE_POSTS = [
  "assets/mishika-profile.jpeg",
  "assets/mishika-post-2.jpeg",
  "assets/mishika-post-3.jpeg"
];
const POSTS_KEY = "mishika_family_posts_v1";
function getPosts(){try{const saved=JSON.parse(localStorage.getItem(POSTS_KEY));return Array.isArray(saved)&&saved.length?saved:BASE_POSTS;}catch(e){return BASE_POSTS;}}
const SOCIAL_KEY="mishika_family_social_v1";
function socialState(){try{return JSON.parse(localStorage.getItem(SOCIAL_KEY))||{likes:{},likedByMe:{},following:310};}catch(e){return {likes:{},likedByMe:{},following:310};}}
function saveSocial(v){localStorage.setItem(SOCIAL_KEY,JSON.stringify(v));}
function renderSocialStats(){const st=socialState();const fc=$("followingCount");if(fc)fc.textContent=st.following;}
function renderPosts(){const grid=$("postGrid");if(!grid)return;const posts=getPosts(),st=socialState();grid.innerHTML="";posts.forEach((src,i)=>{const tile=document.createElement("div");tile.className="post-tile-wrap";const img=document.createElement("img");img.className="post-photo";img.src=src;img.alt="Mishika post "+(i+1);img.loading="lazy";img.addEventListener("click",()=>openPostViewer(i));const actions=document.createElement("div");actions.className="post-social-actions";const like=document.createElement("button");like.type="button";like.className="post-like"+(st.likedByMe?.[i]?" is-liked":"");like.innerHTML=(st.likedByMe?.[i]?"♥":"♡")+" <span>"+((st.likes[i]||0))+"</span>";like.setAttribute("aria-label",st.likedByMe?.[i]?"Photo liked":"Like photo");like.disabled=!!st.likedByMe?.[i];like.addEventListener("click",()=>{const now=socialState();now.likes=now.likes||{};now.likedByMe=now.likedByMe||{};if(now.likedByMe[i])return;now.likes[i]=(now.likes[i]||0)+1;now.likedByMe[i]=true;saveSocial(now);renderPosts();});actions.append(like);tile.append(img,actions);grid.appendChild(tile);});const count=$("postCount");if(count)count.textContent=posts.length;const viewerCount=$("viewerPostCount");if(viewerCount)viewerCount.textContent=posts.length;}
const STORY_PACKS={1:{title:"5 Private Photo’s",name:"Private Photo Pack",price:299,description:"Unlock the 5 Private Photo’s pack."},2:{title:"10 Night Photo’s",name:"Night Photo Pack",price:599,description:"Unlock the 10 Night Photo’s pack."},3:{title:"3 Hot Videos",name:"Video Pack",price:899,description:"Unlock the 3-video pack."}};
let selectedStoryPack=1;
document.querySelectorAll("[data-paid-story]").forEach(el=>el.addEventListener("click",()=>{const n=Number(el.dataset.paidStory);const pack=STORY_PACKS[n]||STORY_PACKS[1];selectedStoryPack=n;$("paidStoryTitle").textContent=pack.title;$("paidStoryDescription").textContent=pack.description;$("paidStoryPackName").textContent=pack.name;$("paidStoryPrice").textContent="₹"+pack.price;$("paidStoryUpgrade").textContent="Request access · ₹"+pack.price;$("paidStoryModal").classList.remove("hidden");}));
$("followBtn")?.addEventListener("click",()=>{const st=socialState();if(state.followed){state.followed=false;st.following=Math.max(0,(st.following||310)-1);save();saveSocial(st);$("followBtn").textContent="Follow";renderSocialStats();toast("You unfollowed Mishika");return;}state.followed=true;st.following=(st.following||310)+1;save();saveSocial(st);$("followBtn").textContent="Following";renderSocialStats();toast("Thanks for following Mishika 💗");});
if($("followBtn"))$("followBtn").textContent=state.followed?"Following":"Follow";
window.addEventListener("storage",e=>{if(e.key===SOCIAL_KEY){renderSocialStats();renderPosts();}});
renderSocialStats();
$("closePaidStory")?.addEventListener("click",()=>$("paidStoryModal").classList.add("hidden"));
$("paidStoryUpgrade")?.addEventListener("click",()=>{const pack=STORY_PACKS[selectedStoryPack];toast("Selected: "+pack.name+" · ₹"+pack.price+". Connect a real payment gateway to accept payment.");});
window.addEventListener("storage",e=>{if(e.key===POSTS_KEY)renderPosts();});
renderPosts();

let currentPostIndex=0;
function openProfileViewer(){const modal=$("profileViewer");if(!modal)return;const count=$("viewerPostCount");if(count)count.textContent=getPosts().length;modal.classList.remove("hidden");}
function closeProfileViewer(){$("profileViewer")?.classList.add("hidden");}
function openPostViewer(index){const posts=getPosts();if(!posts.length)return;currentPostIndex=(index+posts.length)%posts.length;const img=$("postViewerImage");img.src=posts[currentPostIndex];img.alt="Mishika post "+(currentPostIndex+1);$("postViewerIndex").textContent=(currentPostIndex+1)+" / "+posts.length;$("postViewer").classList.remove("hidden");}
function changePost(step){openPostViewer(currentPostIndex+step);}
$("profilePhotoButton")?.addEventListener("click",openProfileViewer);
$("closeProfileViewer")?.addEventListener("click",closeProfileViewer);
$("viewerMessageBtn")?.addEventListener("click",()=>{closeProfileViewer();openChat();});
$("closePostViewer")?.addEventListener("click",()=>$("postViewer").classList.add("hidden"));
$("prevPostBtn")?.addEventListener("click",()=>changePost(-1));
$("nextPostBtn")?.addEventListener("click",()=>changePost(1));
$("postGrid")?.addEventListener("click",e=>{const img=e.target.closest(".post-photo");if(!img)return;const index=Array.from($("postGrid").querySelectorAll(".post-photo")).indexOf(img);openPostViewer(index);});
