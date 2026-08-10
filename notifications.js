/* ==========================================================
   NOTIFICATIONS
   ----------------------------------------------------------
   Cross-device notifications stored in Firestore under
   notifications/{uid}/items/{notifId}. Right now these cover
   friend-request activity (received / accepted). Once posts
   move to Firestore, likes-on-your-post notifications can be
   added the same way — just call createNotification() from
   wherever that event happens.
   ========================================================== */
import { auth, db } from './auth.js';
import {
  collection, doc, addDoc, getDocs, query, orderBy, updateDoc, writeBatch
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

/* Create a notification for a specific user (toUid).
   type: 'friend_request' | 'friend_accepted' (more types later)  */
export async function createNotification(toUid, type, message){
  await addDoc(collection(db, 'notifications', toUid, 'items'), {
    type,
    message,
    read: false,
    createdAt: new Date().toISOString()
  });
}

/* Get all notifications for the current user, newest first */
export async function getNotifications(){
  const myUid = auth.currentUser.uid;
  const q = query(collection(db, 'notifications', myUid, 'items'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/* Count unread notifications (for the badge) */
export async function getUnreadCount(){
  const notifications = await getNotifications();
  return notifications.filter(n => !n.read).length;
}

/* Mark every notification as read (call when the user opens the tab) */
export async function markAllRead(){
  const myUid = auth.currentUser.uid;
  const notifications = await getNotifications();
  const unread = notifications.filter(n => !n.read);
  if(unread.length === 0) return;

  const batch = writeBatch(db);
  unread.forEach(n => {
    batch.update(doc(db, 'notifications', myUid, 'items', n.id), { read: true });
  });
  await batch.commit();
}
