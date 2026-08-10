# Truth or Dare — Web App

A social-media-style Truth or Dare web app: light pink/white/yellow/warm
color theme, login system, Truth & Dare sections with topics, and the
ability for users to write and share their own truths/dares in a feed.

## Files
```
truth-or-dare/
├── index.html        ← page structure (login screen + main app)
├── css/style.css      ← all colors & styling (theme lives in :root at the top)
└── js/
    ├── data.js         ← built-in question bank, organized by category
    ├── auth.js          ← login/signup/logout (uses browser localStorage)
    └── app.js            ← navigation, drawing prompts, posting, feed, profile
```

## How to run it (with your tools)
1. Open the `truth-or-dare` folder in **Acode**.
2. Long-press `index.html` → Open with → your device's browser
   (or use Acode's built-in preview if you have that plugin installed).
   No server or internet connection is required — it runs entirely
   in the browser.
3. If you ever want a local server for testing (some Acode plugins need
   one), **Pydroid3** can run one in a pinch:
   ```python
   import http.server, socketserver
   PORT = 8000
   with socketserver.TCPServer(("", PORT), http.server.SimpleHTTPRequestHandler) as httpd:
       httpd.serve_forever()
   ```
   Run that from inside the `truth-or-dare` folder, then visit
   `http://localhost:8000` in your browser.
4. **Zarchiver**: if you download this as a `.zip`, just extract it
   with Zarchiver into a folder and open it in Acode as above.

## ⚠️ Firebase now requires real hosting (not file://)
Since accounts and friends now talk to Firebase, opening
`index.html` directly as a file (`file:///...`) will NOT work —
browsers block Firebase's modules that way. You need to serve
the app over http/https. Two options:

**A) Quick local test (Pydroid3):**
```python
import http.server, socketserver
PORT = 8000
with socketserver.TCPServer(("", PORT), http.server.SimpleHTTPRequestHandler) as httpd:
    httpd.serve_forever()
```
Run from inside the `truth-or-dare` folder, then visit `http://localhost:8000`.

**B) Real hosting for two people in different locations (recommended):**
Push this folder to GitHub, then turn on **GitHub Pages** in the
repo's Settings → Pages → deploy from the `main` branch. That
gives you a real `https://yourname.github.io/...` URL both
people can open from anywhere.
⚠️ Also go to Firebase Console → Authentication → Settings →
Authorized domains, and add your GitHub Pages domain (and
`localhost` for testing) — Firebase blocks logins from domains
it doesn't recognize.

## Firestore security rules
The database currently allows anyone to read/write for the
first 30 days ("test mode"). Before that expires, paste the
rules from `firestore.rules.txt` into Firebase Console →
Firestore Database → Rules tab → Publish.

## How accounts work right now
Accounts now run on **Firebase Authentication + Firestore**, so
they work across any device or location — sign up on one phone,
log in on another, same account. Usernames/passwords are handled
securely by Firebase (not stored in plain text).

**Friends** (new): search by username, send a request, and the
other person accepts or declines from their Friends tab. Accepted
friends show up in both people's friends list. This is the
foundation for the next update — inviting a friend straight into
a shared live game room.

**Still local for now:** the truths/dares feed, likes, and post
history still live in this browser's `localStorage`, so a post
you write won't show up on someone else's device yet. That's the
next thing to move over to Firestore.

## How to extend it
- **Add a new topic/category**: open `js/data.js` and add a new key
  to `QUESTION_BANK.truth` or `QUESTION_BANK.dare`, e.g.:
  ```js
  travel: ["Tell us about your dream trip.", "..."]
  ```
  It will automatically show up in the dropdowns — no other changes needed.
- **Add more built-in questions**: just push more strings into an
  existing category array in `data.js`.
- **Change colors**: edit the CSS variables at the top of `css/style.css`
  (`--pink`, `--yellow`, `--orange`, etc.) — every element references
  those variables, so the whole theme updates from one place.
- **Add a new tab/section** (e.g. "Groups", "Random Wheel"): copy the
  pattern of an existing `<section class="tab-section">` in
  `index.html`, add a matching `<button class="tab-btn" data-tab="...">`
  in the nav, and it will automatically wire into `showTab()` in `app.js`.
- **Move to a real backend later**: the localStorage calls are isolated
  in `auth.js` (`getUsers`/`saveUsers`) and `app.js` (`getPosts`/`savePosts`).
  Swapping those for `fetch()` calls to a real API is the main step —
  the UI code doesn't need to change.

Have fun building on top of it! 🎉
