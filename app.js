/* ==========================================================
   APP LOGIC
   ----------------------------------------------------------
   Loaded as an ES module (see index.html) so it can import
   Firebase-backed auth.js and friends.js. data.js is still a
   plain script and exposes QUESTION_BANK / getCategories /
   formatCategoryName as globals, which this module can read
   directly.

   NOTE: Truths/dares posts, likes, and the feed still live in
   this browser's localStorage for now — they'll move to
   Firestore in the next update so they sync across devices
   too. Accounts and friends are already fully cross-device.
   ========================================================== */
import { signup, login, logout, watchAuthState, getCurrentUser } from './auth.js';
import { searchUsers, sendFriendRequest, getIncomingRequests, respondToRequest, getFriendsList } from './friends.js';
import { getNotifications, getUnreadCount, markAllRead } from './notifications.js';

const POSTS_KEY = 'tod_posts';

/* ---------- Posts (still local to this device for now) ---------- */
function getPosts(){
  return JSON.parse(localStorage.getItem(POSTS_KEY) || '[]');
}
function savePosts(posts){
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}
function addPost(post){
  const posts = getPosts();
  posts.unshift(post);
  savePosts(posts);
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  wireAuthScreen();
  wireAppScreen();

  // Firebase restores a logged-in session automatically if one exists
  watchAuthState((user) => {
    if(user){
      enterApp();
    }
  });
});

/* ==========================================================
   AUTH SCREEN WIRING
   ========================================================== */
function wireAuthScreen(){
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  document.getElementById('showSignup').addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
  });
  document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');
    const btn = loginForm.querySelector('button[type="submit"]');

    btn.disabled = true; btn.textContent = 'Logging in...';
    const result = await login(username, password);
    btn.disabled = false; btn.textContent = 'Log In';

    if(result.ok){
      errEl.textContent = '';
      enterApp();
    } else {
      errEl.textContent = result.error;
    }
  });

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const displayName = document.getElementById('signupDisplayName').value;
    const password = document.getElementById('signupPassword').value;
    const password2 = document.getElementById('signupPassword2').value;
    const errEl = document.getElementById('signupError');
    const btn = signupForm.querySelector('button[type="submit"]');

    if(password !== password2){
      errEl.textContent = 'Passwords do not match.';
      return;
    }

    btn.disabled = true; btn.textContent = 'Signing up...';
    const result = await signup(username, displayName, password);
    btn.disabled = false; btn.textContent = 'Sign Up';

    if(result.ok){
      errEl.textContent = '';
      enterApp();
    } else {
      errEl.textContent = result.error;
    }
  });
}

/* ==========================================================
   ENTER APP (after successful login/signup)
   ========================================================== */
function enterApp(){
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');

  const user = getCurrentUser();
  document.getElementById('welcomeUser').textContent = `Hi, ${user.displayName} 👋`;

  populateCategoryDropdowns();
  renderFeed();
  renderProfile();
  refreshNotifBadge();
  showTab('home');
}

/* ==========================================================
   APP SCREEN WIRING
   ========================================================== */
function wireAppScreen(){
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.dataset.tab));
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await logout();
    document.getElementById('appScreen').classList.add('hidden');
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('loginForm').reset();
  });

  document.getElementById('truthDrawBtn').addEventListener('click', () => drawPrompt('truth'));
  document.getElementById('dareDrawBtn').addEventListener('click', () => drawPrompt('dare'));

  document.getElementById('createForm').addEventListener('submit', (e) => {
    e.preventDefault();
    handleCreatePost();
  });

  // Friends tab
  document.getElementById('friendSearchBtn').addEventListener('click', handleFriendSearch);
  document.getElementById('friendSearchInput').addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){ e.preventDefault(); handleFriendSearch(); }
  });
}

function showTab(tabName){
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  document.getElementById(`${tabName}-section`).classList.add('active');

  if(tabName === 'home') renderFeed();
  if(tabName === 'profile') renderProfile();
  if(tabName === 'friends') renderFriendsTab();
  if(tabName === 'notifications') renderNotificationsTab();
}

/* ==========================================================
   CATEGORY DROPDOWNS  (unchanged from before)
   ========================================================== */
function populateCategoryDropdowns(){
  fillSelect('truthCategory', 'truth', true);
  fillSelect('dareCategory', 'dare', true);
  fillSelect('createCategory', 'truth', false);

  document.querySelectorAll('input[name="createType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      fillSelect('createCategory', e.target.value, false);
    });
  });
}

function fillSelect(selectId, type, includeAll){
  const select = document.getElementById(selectId);
  select.innerHTML = '';

  if(includeAll){
    const allOpt = document.createElement('option');
    allOpt.value = 'all';
    allOpt.textContent = 'All Topics';
    select.appendChild(allOpt);
  }

  getCategories(type).forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = formatCategoryName(cat);
    select.appendChild(opt);
  });

  getCustomCategories(type).forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = formatCategoryName(cat) + ' (community)';
    select.appendChild(opt);
  });
}

function getCustomCategories(type){
  const builtIn = getCategories(type);
  const posts = getPosts().filter(p => p.type === type);
  return [...new Set(posts.map(p => p.category))].filter(c => !builtIn.includes(c));
}

/* ==========================================================
   DRAW A TRUTH / DARE  (unchanged from before)
   ========================================================== */
function drawPrompt(type){
  const categorySelect = document.getElementById(type === 'truth' ? 'truthCategory' : 'dareCategory');
  const chosenCategory = categorySelect.value;

  let candidates = [];
  const categoriesToUse = chosenCategory === 'all' ? getCategories(type) : [chosenCategory];

  categoriesToUse.forEach(cat => {
    (QUESTION_BANK[type][cat] || []).forEach(text => {
      candidates.push({ text, category: cat, source: 'Built-in' });
    });
  });

  getPosts()
    .filter(p => p.type === type && (chosenCategory === 'all' || p.category === chosenCategory))
    .forEach(p => candidates.push({ text: p.text, category: p.category, source: `@${p.author}` }));

  const textEl = document.getElementById(type === 'truth' ? 'truthText' : 'dareText');
  const metaEl = document.getElementById(type === 'truth' ? 'truthMeta' : 'dareMeta');

  if(candidates.length === 0){
    textEl.textContent = "No prompts here yet — be the first to add one in Create!";
    metaEl.textContent = '';
    return;
  }

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  textEl.textContent = pick.text;
  metaEl.textContent = `${formatCategoryName(pick.category)} · ${pick.source}`;
}

/* ==========================================================
   CREATE POST  (unchanged from before)
   ========================================================== */
function handleCreatePost(){
  const type = document.querySelector('input[name="createType"]:checked').value;
  const dropdownCategory = document.getElementById('createCategory').value;
  const newCategoryRaw = document.getElementById('newCategoryInput').value.trim();
  const text = document.getElementById('createText').value.trim();
  const successEl = document.getElementById('createSuccess');

  if(!text){
    successEl.style.color = '#ff7a7a';
    successEl.textContent = 'Please write something first.';
    return;
  }

  const category = newCategoryRaw ? newCategoryRaw.toLowerCase().replace(/\s+/g, '_') : dropdownCategory;
  const user = getCurrentUser();

  const post = {
    id: 'p_' + Date.now() + '_' + Math.floor(Math.random()*1000),
    type, category, text,
    author: user.username,
    authorName: user.displayName,
    createdAt: new Date().toISOString(),
    likes: 0,
    likedBy: [],
    comments: []
  };
  addPost(post);

  document.getElementById('createText').value = '';
  document.getElementById('newCategoryInput').value = '';
  successEl.style.color = '#3fae6a';
  successEl.textContent = 'Posted! Check the Home feed 🎉';

  fillSelect(type === 'truth' ? 'truthCategory' : 'dareCategory', type, true);
  fillSelect('createCategory', type, false);
  setTimeout(() => { successEl.textContent = ''; }, 3000);
}

/* ==========================================================
   FEED  (unchanged from before)
   ========================================================== */
function renderFeed(){
  const feedList = document.getElementById('feedList');
  const posts = getPosts();

  if(posts.length === 0){
    feedList.innerHTML = `<p class="empty-msg">No posts yet. Be the first to write a truth or dare in the Create tab!</p>`;
    return;
  }

  feedList.innerHTML = posts.map(post => renderPostCard(post)).join('');
  attachLikeHandlers(feedList);
  attachCommentHandlers(feedList);
}

const expandedComments = new Set(); // tracks which posts have comments open, so re-renders don't collapse them

function renderPostCard(post){
  const user = getCurrentUser();
  const liked = post.likedBy && post.likedBy.includes(user.username);
  const comments = post.comments || [];
  const initials = (post.authorName || post.author).slice(0,2).toUpperCase();
  const dateStr = new Date(post.createdAt).toLocaleDateString();
  const isOpen = expandedComments.has(post.id);

  const commentsHtml = comments.map(c => `
    <div class="comment"><b>${escapeHtml(c.authorName)}:</b> ${escapeHtml(c.text)}</div>
  `).join('');

  return `
    <div class="post-card type-${post.type}" data-id="${post.id}">
      <div class="post-header">
        <div class="avatar">${initials}</div>
        <div>
          <div class="post-author">${escapeHtml(post.authorName || post.author)}</div>
          <div class="post-sub">${dateStr}</div>
        </div>
        <span class="badge ${post.type}">${post.type} · ${formatCategoryName(post.category)}</span>
      </div>
      <p class="post-text">${escapeHtml(post.text)}</p>
      <div class="post-footer">
        <button class="btn btn-like ${liked ? 'liked' : ''}" data-id="${post.id}">
          ❤️ <span class="like-count">${post.likes}</span>
        </button>
        <button class="btn btn-like btn-comment-toggle" data-id="${post.id}">
          💬 <span>${comments.length}</span>
        </button>
      </div>
      <div class="comments-section ${isOpen ? '' : 'hidden'}" data-comments-for="${post.id}">
        ${commentsHtml || '<p class="empty-msg" style="padding:10px 0;">No comments yet.</p>'}
        <form class="comment-form" data-id="${post.id}">
          <input type="text" class="comment-input text-input" placeholder="Write a comment...">
          <button type="submit" class="btn btn-like">Post</button>
        </form>
      </div>
    </div>
  `;
}

function attachLikeHandlers(container){
  container.querySelectorAll('.btn-like:not(.btn-comment-toggle)').forEach(btn => {
    btn.addEventListener('click', () => toggleLike(btn.dataset.id));
  });
}

function attachCommentHandlers(container){
  container.querySelectorAll('.btn-comment-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if(expandedComments.has(id)) expandedComments.delete(id);
      else expandedComments.add(id);
      const section = container.querySelector(`[data-comments-for="${id}"]`);
      if(section) section.classList.toggle('hidden');
    });
  });

  container.querySelectorAll('.comment-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('.comment-input');
      const text = input.value.trim();
      if(!text) return;
      expandedComments.add(form.dataset.id); // keep it open after posting
      addComment(form.dataset.id, text);
    });
  });
}

function addComment(postId, text){
  const user = getCurrentUser();
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if(!post) return;

  post.comments = post.comments || [];
  post.comments.push({
    id: 'c_' + Date.now() + '_' + Math.floor(Math.random()*1000),
    author: user.username,
    authorName: user.displayName,
    text,
    createdAt: new Date().toISOString()
  });
  savePosts(posts);
  renderFeed();
  renderProfile();
}

function toggleLike(postId){
  const user = getCurrentUser();
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if(!post) return;

  post.likedBy = post.likedBy || [];
  const idx = post.likedBy.indexOf(user.username);
  if(idx === -1){
    post.likedBy.push(user.username);
    post.likes++;
  } else {
    post.likedBy.splice(idx, 1);
    post.likes = Math.max(0, post.likes - 1);
  }
  savePosts(posts);
  renderFeed();
}

/* ==========================================================
   NOTIFICATIONS TAB
   ========================================================== */
async function refreshNotifBadge(){
  const badge = document.getElementById('notifBadge');
  const count = await getUnreadCount();
  badge.classList.toggle('hidden', count === 0);
}

async function renderNotificationsTab(){
  const listEl = document.getElementById('notificationsList');
  listEl.innerHTML = `<p class="empty-msg">Loading...</p>`;

  const notifications = await getNotifications();
  if(notifications.length === 0){
    listEl.innerHTML = `<p class="empty-msg">No notifications yet.</p>`;
  } else {
    listEl.innerHTML = notifications.map(n => `
      <div class="post-card ${n.read ? '' : 'unread'}">
        <p class="post-text">${escapeHtml(n.message)}</p>
        <div class="post-sub">${new Date(n.createdAt).toLocaleString()}</div>
      </div>
    `).join('');
  }

  await markAllRead();
  refreshNotifBadge();
}

/* ==========================================================
   FRIENDS TAB  (new — cross-device via Firestore)
   ========================================================== */
async function renderFriendsTab(){
  await renderIncomingRequests();
  await renderFriendsList();
}

async function handleFriendSearch(){
  const term = document.getElementById('friendSearchInput').value;
  const resultsEl = document.getElementById('searchResults');
  resultsEl.innerHTML = `<p class="empty-msg">Searching...</p>`;

  const results = await searchUsers(term);
  if(results.length === 0){
    resultsEl.innerHTML = `<p class="empty-msg">No users found.</p>`;
    return;
  }

  resultsEl.innerHTML = results.map(u => `
    <div class="post-card">
      <div class="post-header">
        <div class="avatar">${u.username.slice(0,2).toUpperCase()}</div>
        <div>
          <div class="post-author">${escapeHtml(u.displayName)}</div>
          <div class="post-sub">@${escapeHtml(u.username)}</div>
        </div>
        <button class="btn btn-like add-friend-btn" data-uid="${u.uid}" data-username="${escapeHtml(u.username)}">Add</button>
      </div>
    </div>
  `).join('');

  resultsEl.querySelectorAll('.add-friend-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = '...';
      const result = await sendFriendRequest(btn.dataset.uid, btn.dataset.username);
      btn.textContent = result.ok ? 'Sent ✓' : result.error;
    });
  });
}

async function renderIncomingRequests(){
  const listEl = document.getElementById('incomingRequests');
  listEl.innerHTML = `<p class="empty-msg">Loading...</p>`;

  const requests = await getIncomingRequests();
  if(requests.length === 0){
    listEl.innerHTML = `<p class="empty-msg">No pending requests.</p>`;
    return;
  }

  listEl.innerHTML = requests.map(r => `
    <div class="post-card">
      <div class="post-header">
        <div class="avatar">${r.fromUsername.slice(0,2).toUpperCase()}</div>
        <div>
          <div class="post-author">${escapeHtml(r.fromDisplayName)}</div>
          <div class="post-sub">@${escapeHtml(r.fromUsername)} wants to be friends</div>
        </div>
      </div>
      <div class="post-footer">
        <button class="btn btn-primary accept-btn" data-id="${r.id}">Accept</button>
        <button class="btn btn-ghost decline-btn" data-id="${r.id}">Decline</button>
      </div>
    </div>
  `).join('');

  listEl.querySelectorAll('.accept-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const request = requests.find(r => r.id === btn.dataset.id);
      btn.disabled = true;
      await respondToRequest(request, true);
      renderFriendsTab();
    });
  });
  listEl.querySelectorAll('.decline-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const request = requests.find(r => r.id === btn.dataset.id);
      btn.disabled = true;
      await respondToRequest(request, false);
      renderFriendsTab();
    });
  });
}

async function renderFriendsList(){
  const listEl = document.getElementById('friendsList');
  listEl.innerHTML = `<p class="empty-msg">Loading...</p>`;

  const friends = await getFriendsList();
  if(friends.length === 0){
    listEl.innerHTML = `<p class="empty-msg">No friends yet — search for someone above!</p>`;
    return;
  }

  listEl.innerHTML = friends.map(f => `
    <div class="post-card">
      <div class="post-header">
        <div class="avatar">${f.username.slice(0,2).toUpperCase()}</div>
        <div>
          <div class="post-author">${escapeHtml(f.displayName)}</div>
          <div class="post-sub">@${escapeHtml(f.username)}</div>
        </div>
      </div>
    </div>
  `).join('');
}

/* ==========================================================
   PROFILE  (unchanged from before)
   ========================================================== */
function renderProfile(){
  const user = getCurrentUser();
  if(!user) return;

  const initials = user.displayName.slice(0,2).toUpperCase();
  document.getElementById('profileAvatar').textContent = initials;
  document.getElementById('profileName').textContent = user.displayName;
  document.getElementById('profileUsername').textContent = '@' + user.username;

  const myPosts = getPosts().filter(p => p.author === user.username);
  const totalLikes = myPosts.reduce((sum, p) => sum + p.likes, 0);

  document.getElementById('statPosts').textContent = myPosts.length;
  document.getElementById('statLikes').textContent = totalLikes;
  document.getElementById('statJoined').textContent = new Date(user.joined).toLocaleDateString(undefined, { month:'short', year:'numeric' });

  const myPostsList = document.getElementById('myPostsList');
  if(myPosts.length === 0){
    myPostsList.innerHTML = `<p class="empty-msg">You haven't posted anything yet.</p>`;
  } else {
    myPostsList.innerHTML = myPosts.map(post => renderPostCard(post)).join('');
    attachLikeHandlers(myPostsList);
    attachCommentHandlers(myPostsList);
  }
}

/* ==========================================================
   HELPERS
   ========================================================== */
function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
