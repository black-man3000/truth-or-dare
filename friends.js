/* ==========================================================
   FRIENDS
   ----------------------------------------------------------
   Search users by username, send a friend request, and
   accept/decline incoming requests. Once accepted, both
   people get each other added to their friends list — this
   is the foundation the next update (live shared game rooms)
   will build on: you'll be able to invite a friend from this
   list straight into a room.
   ========================================================== */
import { auth, db } from './auth.js';
import { createNotification } from './notifications.js';
import {
  collection, doc, getDoc, getDocs, query, where,
  addDoc, updateDoc, setDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

/* Search for users whose username starts with the given text */
export async function searchUsers(searchTermRaw){
  const searchTerm = searchTermRaw.trim().toLowerCase();
  if(!searchTerm) return [];

  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('username', '>=', searchTerm),
    where('username', '<=', searchTerm + '\uf8ff')
  );
  const snap = await getDocs(q);
  const myUid = auth.currentUser?.uid;
  return snap.docs
    .map(d => ({ uid: d.id, ...d.data() }))
    .filter(u => u.uid !== myUid);
}

/* Send a friend request. Prevents duplicate pending requests. */
export async function sendFriendRequest(toUid, toUsername){
  const myUid = auth.currentUser.uid;
  const myProfileSnap = await getDoc(doc(db, 'users', myUid));
  const myProfile = myProfileSnap.data();

  const existingQ = query(
    collection(db, 'friendRequests'),
    where('fromUid', '==', myUid),
    where('toUid', '==', toUid),
    where('status', '==', 'pending')
  );
  const existing = await getDocs(existingQ);
  if(!existing.empty) return { ok:false, error:'Request already sent.' };

  await addDoc(collection(db, 'friendRequests'), {
    fromUid: myUid,
    fromUsername: myProfile.username,
    fromDisplayName: myProfile.displayName,
    toUid,
    toUsername,
    status: 'pending',
    createdAt: new Date().toISOString()
  });

  await createNotification(toUid, 'friend_request', `@${myProfile.username} sent you a friend request`);

  return { ok:true };
}

/* Get all pending requests sent TO the current user */
export async function getIncomingRequests(){
  const myUid = auth.currentUser.uid;
  const q = query(
    collection(db, 'friendRequests'),
    where('toUid', '==', myUid),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/* Accept or decline a request. On accept, adds each user to the
   other's friends list (mirrored both directions). */
export async function respondToRequest(request, accept){
  const myUid = auth.currentUser.uid;
  const reqRef = doc(db, 'friendRequests', request.id);
  await updateDoc(reqRef, { status: accept ? 'accepted' : 'declined' });

  if(accept){
    const myProfileSnap = await getDoc(doc(db, 'users', myUid));
    const myProfile = myProfileSnap.data();

    await setDoc(doc(db, 'friends', myUid, 'list', request.fromUid), {
      username: request.fromUsername,
      displayName: request.fromDisplayName,
      since: new Date().toISOString()
    });
    await setDoc(doc(db, 'friends', request.fromUid, 'list', myUid), {
      username: myProfile.username,
      displayName: myProfile.displayName,
      since: new Date().toISOString()
    });

    await createNotification(request.fromUid, 'friend_accepted', `@${myProfile.username} accepted your friend request`);
  }
}

/* Get the current user's full friends list */
export async function getFriendsList(){
  const myUid = auth.currentUser.uid;
  const snap = await getDocs(collection(db, 'friends', myUid, 'list'));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}
