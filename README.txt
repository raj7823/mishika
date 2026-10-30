MISHIKA FAMILY — INSTAGRAM-STYLE CHAT STARTER

Files:
- index.html  : Mishika profile + chat UI
- admin.html  : local demo admin panel
- style.css   : responsive design
- app.js      : demo chat logic, 30 user-message limit, upgrade modal, random QR-looking placeholder
- admin.js    : demo approve/reject controls

HOW TO TEST
1. Extract the ZIP.
2. Open index.html in Chrome.
3. Click Message and send 30 messages (the count is based on messages sent by the visitor).
4. At the limit, the composer locks and the Upgrade modal appears after a short delay.
5. Click "Show Payment QR" to display a RANDOM PLACEHOLDER pattern.
6. Open admin.html in the SAME browser and same folder/session, then refresh.
7. Approve the request. Return to index.html and refresh/focus to see the demo unlock.

IMPORTANT LIMITATIONS
- This is a front-end prototype only. It uses localStorage, so the profile/chat/admin data is shared only within the same browser profile on the same device. It does NOT yet work for real users on different phones.
- The QR shown is a random placeholder pattern and is NOT a valid payment QR. Do not use it to collect money. Replace it with your real UPI QR image after you decide what payment handle to use.
- The admin panel has no real login/security. Do not publish this demo as a production service.
- Real deployment needs Firebase (or another backend), authenticated admin access, server-side message limits and unlock checks, secure database rules, and a reliable payment verification process. With a static UPI QR, manual verification in your UPI app is required before approving.
- The profile name and username are set to Mishika and @Mishika__a. Review the bio and price before launch.
- This prototype is not affiliated with Instagram and uses an original ChatSpace demo brand.

NEXT STEP
After you review the look and flow, configure your profile branding and Firebase backend so messages from different users can securely reach your admin panel.

PROFILE PHOTOS
- assets/mishika-profile.jpeg is used for the profile photo and first grid post.
- assets/mishika-post-2.jpeg and assets/mishika-post-3.jpeg are the other uploaded grid photos.


LATEST PROFILE UPDATE
- Profile story circles use Mishika's first uploaded photo, animate gently, and show "Open only paid users".
- Clicking a story opens the paid-only message and upgrade option.
- The posts count is now based on the number of photos in the profile grid.
- Admin panel now includes "Upload photos" and photo removal controls.
- Photo uploads use this browser's localStorage and are only for local testing. They do not upload files to a server or distribute them to other visitors.

PROFILE / POST INTERACTIONS
- Tap the main profile photo to open a profile-detail modal, similar to a social profile view.
- Tap any post thumbnail to open a larger post viewer with previous/next navigation.


FIREBASE LIVE CHAT UPDATE
See firebase-chat-setup/SETUP-HINDI.txt before deployment. Admin page is now /admin.html. Publish the provided Firestore rules and create an admins/{your-auth-uid} document before testing. Payment/QR remains demo only.
