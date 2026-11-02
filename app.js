const $ = id => document.getElementById(id);
const KEY = "chatspace_demo_v1";
const state = loadState();

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {
      messages: [],
      unlocked: false,
      paymentRequest: null,
      userName: "Visitor",
      followed: false
    };
  } catch (e) {
    return {
      messages: [],
      unlocked: false,
      paymentRequest: null,
      userName: "Visitor",
      followed: false
    };
  }
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function toast(message) {
  const t = $("toast");
  if (!t) return;

  t.textContent = message;
  t.classList.remove("hidden");

  setTimeout(() => t.classList.add("hidden"), 2600);
}

function openChat() {
  $("chatOverlay")?.classList.remove("hidden");

  if (window.startCloudChat) {
    window.startCloudChat();
  } else {
    renderMessages();
    updateLock();
  }

  setTimeout(() => $("messageInput")?.focus(), 100);
}

function closeChat() {
  $("chatOverlay")?.classList.add("hidden");
}

function renderMessages() {
  const wrap = $("messages");
  if (!wrap) return;

  wrap.innerHTML = "";

  state.messages.forEach(m => {
    const row = document.createElement("div");
    row.className = "message-row " + (m.from === "user" ? "mine" : "");

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = m.text;

    const time = document.createElement("span");
    time.className = "message-time";
    time.textContent = m.time || "";

    row.appendChild(bubble);
    row.appendChild(time);
    wrap.appendChild(row);
  });

  const body = $("chatBody");
  if (body) body.scrollTop = body.scrollHeight;
}

function userMessageCount() {
  return state.messages.filter(m => m.from === "user").length;
}

function updateLock() {
  const locked = !state.unlocked && userMessageCount() >= 150;

  $("composer")?.classList.toggle("hidden", locked);
  $("lockedNotice")?.classList.toggle("hidden", !locked);

  if (locked && !state.upgradeTimerShown) {
    state.upgradeTimerShown = true;
    save();

    setTimeout(() => {
      if (!state.unlocked && userMessageCount() >= 150) {
        $("upgradeModal")?.classList.remove("hidden");
      }
    }, 5000);
  }
}

function sendMessage() {
  if (window.cloudChatActive && window.sendCloudMessage) {
    window.sendCloudMessage();
    return;
  }

  const input = $("messageInput");
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  if (!state.unlocked && userMessageCount() >= 150) {
    updateLock();
    return;
  }

  state.messages.push({
    from: "user",
    text,
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })
  });

  input.value = "";
  save();
  renderMessages();
  updateLock();

  if (userMessageCount() === 150) {
    toast("You can still read your conversation.");

    setTimeout(() => {
      if (!state.unlocked) {
        $("upgradeModal")?.classList.remove("hidden");
      }
    }, 5000);
  }
}

/* =========================================
   REAL PAYMENT QR IMAGE
   Image path: assets/payment-qr.png
========================================= */

function showPaymentQR() {
  const box = $("qrPlaceholder");
  if (!box) return;

  box.innerHTML = "";

  const img = document.createElement("img");
  img.src = "assets/payment-qr.png";
  img.alt = "Payment QR Code";

  img.style.width = "100%";
  img.style.maxWidth = "260px";
  img.style.height = "auto";
  img.style.display = "block";
  img.style.margin = "0 auto";
  img.style.objectFit = "contain";

  img.onerror = function () {
    box.innerHTML = "";

    const error = document.createElement("p");
    error.textContent =
      "QR image nahi mili. Check karein: /assets/payment-qr.png";

    error.style.color = "#b91c1c";
    error.style.textAlign = "center";

    box.appendChild(error);
  };

  box.appendChild(img);
}

/* =========================================
   CHAT AND UPGRADE BUTTONS
========================================= */

$("messageBtn")?.addEventListener("click", openChat);
$("backBtn")?.addEventListener("click", closeChat);
$("sendBtn")?.addEventListener("click", sendMessage);

$("messageInput")?.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});

$("upgradeBtn")?.addEventListener("click", () => {
  // Open the upgrade modal and show the existing payment QR immediately.
  $("upgradeModal")?.classList.remove("hidden");
  $("qrArea")?.classList.remove("hidden");

  const qrLabel = $("qrPaymentLabel");
  if (qrLabel) {
    qrLabel.textContent = `Scan the UPI QR and pay ₹${selectedChatPlan.amount}`;
  }

  showPaymentQR();
});

$("closeUpgrade")?.addEventListener("click", () => {
  $("upgradeModal")?.classList.add("hidden");
});

/* =========================================
   CHAT PAYMENT PLANS
   Plan 1: ₹199 = 150 additional messages
   Plan 2: ₹499 = Unlimited chat
========================================= */

let selectedChatPlan = {
  amount: 199,
  plan: "150_messages"
};

function selectChatPlan(plan) {
  selectedChatPlan = plan === "unlimited"
    ? {
        amount: 499,
        plan: "unlimited"
      }
    : {
        amount: 199,
        plan: "150_messages"
      };

  const selectedLabel = $("selectedPlanAmount");

  if (selectedLabel) {
    selectedLabel.textContent =
      `Selected plan: ₹${selectedChatPlan.amount}. Pay the exact amount shown.`;
  }

  const qrLabel = $("qrPaymentLabel");

  if (qrLabel) {
    qrLabel.textContent =
      `Scan the UPI QR and pay ₹${selectedChatPlan.amount}`;
  }

  $("qrArea")?.classList.remove("hidden");

  showPaymentQR();
}

$("buy150Btn")?.addEventListener("click", () => {
  selectChatPlan("150_messages");
});

$("buyUnlimitedBtn")?.addEventListener("click", () => {
  selectChatPlan("unlimited");
});

$("showQrBtn")?.addEventListener("click", () => {
  $("qrArea")?.classList.remove("hidden");

  const qrLabel = $("qrPaymentLabel");

  if (qrLabel) {
    qrLabel.textContent =
      `Scan the UPI QR and pay ₹${selectedChatPlan.amount}`;
  }

  showPaymentQR();
});

/* =========================================
   PAYMENT REQUEST SUBMISSION
========================================= */

$("paidBtn")?.addEventListener("click", () => {
  if (window.cloudChatActive) {
    toast("Please use the connected payment flow.");
    return;
  }

  const utrInput = $("paymentUtr");
  const utr = utrInput ? utrInput.value.trim() : "";

  if (!utr) {
    toast("Please enter your UPI transaction ID / UTR.");
    utrInput?.focus();
    return;
  }

  state.paymentRequest = {
    status: "pending",
    requestedAt: new Date().toISOString(),
    userName: state.userName || "Visitor",
    amount: selectedChatPlan.amount,
    plan: selectedChatPlan.plan,
    utr: utr
  };

  save();

  const status = $("paymentStatus");

  if (status) {
    status.classList.remove("hidden");
    status.textContent =
      `Payment request for ₹${selectedChatPlan.amount} sent. Waiting for admin approval.`;
  }

  const button = $("paidBtn");

  if (button) {
    button.disabled = true;
    button.textContent = "Request sent";
  }

  toast("Payment request saved. Admin verification is required.");
});

$("chatMenuBtn")?.addEventListener("click", () => {
  toast("ChatSpace demo conversation");
});

window.addEventListener("storage", e => {
  if (window.cloudChatActive) return;

  if (e.key === KEY) {
    Object.assign(state, loadState());

    renderMessages();
    updateLock();

    if (state.unlocked) {
      $("upgradeModal")?.classList.add("hidden");
      toast("Chat unlocked by admin.");
    }
  }
});

window.addEventListener("focus", () => {
  if (window.cloudChatActive) return;

  Object.assign(state, loadState());

  renderMessages();
  updateLock();

  if (state.unlocked) {
    $("upgradeModal")?.classList.add("hidden");
    $("composer")?.classList.remove("hidden");
    $("lockedNotice")?.classList.add("hidden");
  }
});

renderMessages();
updateLock();

if (state.unlocked) {
  $("upgradeModal")?.classList.add("hidden");
}

/* =========================================
   POSTS
========================================= */

const BASE_POSTS = [
  "assets/mishika-profile.jpeg",
  "assets/mishika-post-2.jpeg",
  "assets/mishika-post-3.jpeg"
];

const POSTS_KEY = "mishika_family_posts_v1";

function getPosts() {
  try {
    const saved = JSON.parse(localStorage.getItem(POSTS_KEY));

    return Array.isArray(saved) && saved.length
      ? saved
      : BASE_POSTS;
  } catch (e) {
    return BASE_POSTS;
  }
}

/* =========================================
   SOCIAL STATE
========================================= */

const SOCIAL_KEY = "mishika_family_social_v1";

function socialState() {
  try {
    return JSON.parse(localStorage.getItem(SOCIAL_KEY)) || {
      likes: {},
      likedByMe: {},
      following: 310
    };
  } catch (e) {
    return {
      likes: {},
      likedByMe: {},
      following: 310
    };
  }
}

function saveSocial(v) {
  localStorage.setItem(SOCIAL_KEY, JSON.stringify(v));
}

function renderSocialStats() {
  const st = socialState();
  const fc = $("followingCount");

  if (fc) fc.textContent = st.following;
}

/* =========================================
   RENDER POSTS AND LIKES
========================================= */

function renderPosts() {
  const grid = $("postGrid");
  if (!grid) return;

  const posts = getPosts();
  const st = socialState();

  grid.innerHTML = "";

  posts.forEach((src, i) => {
    const tile = document.createElement("div");
    tile.className = "post-tile-wrap";

    const img = document.createElement("img");
    img.className = "post-photo";
    img.src = src;
    img.alt = "Mishika post " + (i + 1);
    img.loading = "lazy";

    img.addEventListener("click", () => openPostViewer(i));

    const actions = document.createElement("div");
    actions.className = "post-social-actions";

    const like = document.createElement("button");
    like.type = "button";

    like.className =
      "post-like" + (st.likedByMe?.[i] ? " is-liked" : "");

    like.innerHTML =
      (st.likedByMe?.[i] ? "♥" : "♡") +
      " <span>" + (st.likes[i] || 0) + "</span>";

    like.setAttribute(
      "aria-label",
      st.likedByMe?.[i] ? "Photo liked" : "Like photo"
    );

    like.disabled = !!st.likedByMe?.[i];

    like.addEventListener("click", () => {
      const now = socialState();

      now.likes = now.likes || {};
      now.likedByMe = now.likedByMe || {};

      if (now.likedByMe[i]) return;

      now.likes[i] = (now.likes[i] || 0) + 1;
      now.likedByMe[i] = true;

      saveSocial(now);
      renderPosts();
    });

    actions.appendChild(like);
    tile.append(img, actions);
    grid.appendChild(tile);
  });

  const count = $("postCount");
  if (count) count.textContent = posts.length;

  const viewerCount = $("viewerPostCount");
  if (viewerCount) viewerCount.textContent = posts.length;
}

/* =========================================
   STORY PACKS
========================================= */

const STORY_PACKS = {
  1: {
    title: "5 Private Photo’s",
    name: "Private Photo Pack",
    price: 299,
    description: "Unlock the 5 Private Photo’s pack."
  },

  2: {
    title: "10 Night Photo’s",
    name: "Night Photo Pack",
    price: 599,
    description: "Unlock the 10 Night Photo’s pack."
  },

  3: {
    title: "3 Hot Videos",
    name: "Video Pack",
    price: 899,
    description: "Unlock the 3-video pack."
  }
};

let selectedStoryPack = 1;

document.querySelectorAll("[data-paid-story]").forEach(el => {
  el.addEventListener("click", () => {
    const n = Number(el.dataset.paidStory);
    const pack = STORY_PACKS[n] || STORY_PACKS[1];

    selectedStoryPack = n;

    if ($("paidStoryTitle")) {
      $("paidStoryTitle").textContent = pack.title;
    }

    if ($("paidStoryDescription")) {
      $("paidStoryDescription").textContent = pack.description;
    }

    if ($("paidStoryPackName")) {
      $("paidStoryPackName").textContent = pack.name;
    }

    if ($("paidStoryPrice")) {
      $("paidStoryPrice").textContent = "₹" + pack.price;
    }

    if ($("paidStoryUpgrade")) {
      $("paidStoryUpgrade").textContent =
        "Request access · ₹" + pack.price;
    }

    $("paidStoryModal")?.classList.remove("hidden");
  });
});

/* =========================================
   FOLLOW BUTTON
========================================= */

$("followBtn")?.addEventListener("click", () => {
  const st = socialState();

  if (state.followed) {
    state.followed = false;

    st.following = Math.max(0, (st.following || 310) - 1);

    save();
    saveSocial(st);

    $("followBtn").textContent = "Follow";

    renderSocialStats();
    toast("You unfollowed Mishika");

    return;
  }

  state.followed = true;
  st.following = (st.following || 310) + 1;

  save();
  saveSocial(st);

  $("followBtn").textContent = "Following";

  renderSocialStats();
  toast("Thanks for following Mishika 💗");
});

if ($("followBtn")) {
  $("followBtn").textContent = state.followed
    ? "Following"
    : "Follow";
}

window.addEventListener("storage", e => {
  if (e.key === SOCIAL_KEY) {
    renderSocialStats();
    renderPosts();
  }
});

renderSocialStats();

/* =========================================
   STORY MODAL BUTTONS
========================================= */

$("closePaidStory")?.addEventListener("click", () => {
  $("paidStoryModal")?.classList.add("hidden");
});

$("paidStoryUpgrade")?.addEventListener("click", () => {
  const pack = STORY_PACKS[selectedStoryPack];

  toast(
    "Selected: " + pack.name +
    " · ₹" + pack.price +
    ". Connect a real payment gateway to accept payment."
  );
});

window.addEventListener("storage", e => {
  if (e.key === POSTS_KEY) renderPosts();
});

renderPosts();

/* =========================================
   PROFILE AND POST VIEWER
========================================= */

let currentPostIndex = 0;

function openProfileViewer() {
  const modal = $("profileViewer");
  if (!modal) return;

  const count = $("viewerPostCount");
  if (count) count.textContent = getPosts().length;

  modal.classList.remove("hidden");
}

function closeProfileViewer() {
  $("profileViewer")?.classList.add("hidden");
}

function openPostViewer(index) {
  const posts = getPosts();

  if (!posts.length) return;

  currentPostIndex = (index + posts.length) % posts.length;

  const img = $("postViewerImage");

  if (img) {
    img.src = posts[currentPostIndex];
    img.alt = "Mishika post " + (currentPostIndex + 1);
  }

  const indexLabel = $("postViewerIndex");

  if (indexLabel) {
    indexLabel.textContent =
      (currentPostIndex + 1) + " / " + posts.length;
  }

  $("postViewer")?.classList.remove("hidden");
}

function changePost(step) {
  openPostViewer(currentPostIndex + step);
}

$("profilePhotoButton")?.addEventListener(
  "click",
  openProfileViewer
);

$("closeProfileViewer")?.addEventListener(
  "click",
  closeProfileViewer
);

$("viewerMessageBtn")?.addEventListener("click", () => {
  closeProfileViewer();
  openChat();
});

$("closePostViewer")?.addEventListener("click", () => {
  $("postViewer")?.classList.add("hidden");
});

$("prevPostBtn")?.addEventListener("click", () => {
  changePost(-1);
});

$("nextPostBtn")?.addEventListener("click", () => {
  changePost(1);
});

$("postGrid")?.addEventListener("click", e => {
  const img = e.target.closest(".post-photo");
  if (!img) return;

  const grid = $("postGrid");
  if (!grid) return;

  const index = Array.from(
    grid.querySelectorAll(".post-photo")
  ).indexOf(img);

  openPostViewer(index);
});
