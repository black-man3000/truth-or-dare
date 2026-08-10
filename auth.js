/* ==========================================================
   AUTH (Firebase-backed — works across devices/locations)
   ----------------------------------------------------------
   Users sign up with a username + password. Behind the scenes
   we turn the username into a fake email (username@truthordare.app)
   because Firebase Auth's simplest method needs an email format —
   the user never sees or types an email themselves.

   Real profile data (username, display name) lives in Firestore
   under  users/{uid}  so other people can search for you.
   A separate  usernames/{username}  doc just maps a username to
   a uid, so we can quickly check "is this username taken?".
   ========================================================== */
import { firebaseApp } from './firebase-config.js';
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

// In-memory cache of the logged-in user's profile (username, displayName, joined date)
let currentProfile = null;

function usernameToEmail(username){
  return `${username}@truthordare.app`;
}

export async function signup(usernameRaw, displayNameRaw, password){
  const username = usernameRaw.trim().toLowerCase();
  const displayName = displayNameRaw.trim() || username;

  if(!username || !password) return { ok:false, error:'Please fill in all fields.' };
  if(username.length < 3) return { ok:false, error:'Username must be at least 3 characters.' };

  try{
    // Check if username is already taken
    const usernameRef = doc(db, 'usernames', username);
    const existing = await getDoc(usernameRef);
    if(existing.exists()) return { ok:false, error:'That username is already taken.' };

    const cred = await createUserWithEmailAndPassword(auth, usernameToEmail(username), password);
    const uid = cred.user.uid;
    const joined = new Date().toISOString();

    await setDoc(doc(db, 'users', uid), { username, displayName, joined });
    await setDoc(usernameRef, { uid });

    currentProfile = { uid, username, displayName, joined };
    return { ok:true };
  } catch(err){
    return { ok:false, error: friendlyAuthError(err) };
  }
}

export async function login(usernameRaw, password){
  const username = usernameRaw.trim().toLowerCase();
  try{
    const cred = await signInWithEmailAndPassword(auth, usernameToEmail(username), password);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if(snap.exists()){
      currentProfile = { uid: cred.user.uid, ...snap.data() };
    }
    return { ok:true };
  } catch(err){
    return { ok:false, error:'Incorrect username or password.' };
  }
}

export async function logout(){
  await signOut(auth);
  currentProfile = null;
}

function friendlyAuthError(err){
  if(err.code === 'auth/weak-password') return 'Password should be at least 6 characters.';
  if(err.code === 'auth/invalid-email') return 'Please use only letters and numbers in your username.';
  return 'Something went wrong. Please try again.';
}

/* Returns the cached profile of whoever is logged in right now (or null). */
export function getCurrentUser(){
  return currentProfile;
}

/* Call once when the app loads. Fires `callback(profileOrNull)` whenever
   login state changes (e.g. Firebase restoring a session automatically). */
export function watchAuthState(callback){
  onAuthStateChanged(auth, async (user) => {
    if(user){
      const snap = await getDoc(doc(db, 'users', user.uid));
      currentProfile = snap.exists() ? { uid: user.uid, ...snap.data() } : null;
    } else {
      currentProfile = null;
    }
    callback(currentProfile);
  });
}
