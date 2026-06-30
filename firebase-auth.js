// Firebase Auth (Email/Password). Keeps UI in sync and stores mc_session in localStorage
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBP7APrRnd5oE61MfEQEYG-i1uU94cDrCc",
  authDomain: "motorbike-guard.firebaseapp.com",
  databaseURL: "https://motorbike-guard-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "motorbike-guard",
  storageBucket: "motorbike-guard.appspot.com",
  messagingSenderId: "623641364695",
  appId: "1:623641364695:web:7d81793ca689cfc4108892"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);

const $id = (id) => document.getElementById(id);
const setSessionEmail = (email)=>{ try{ localStorage.setItem('mc_session', JSON.stringify({ user: email })); }catch{} };
const clearSession = ()=>{ try{ localStorage.removeItem('mc_session'); }catch{} };

onAuthStateChanged(auth, async (user) => {
  const authBox=$id('authBox'), menuBox=$id('menuBox'), adminBtn=$id('adminBtn');
  const us=$id('userStatus'), welcome=$id('welcomeName'), logoutWrap=document.getElementById('logoutWrap');

  if (user) {
    let displayName = user.email;
    try {
      const snap = await get(child(ref(db), `users/${user.uid}`));
      if (snap.exists() && snap.val()?.username) displayName = snap.val().username;
    } catch {}

    if (us) us.textContent = `เข้าสู่ระบบเป็น: ${displayName}`;
    if (welcome) welcome.textContent = displayName;
    authBox?.classList.add('hidden');
    menuBox?.classList.remove('hidden');
    adminBtn?.classList.add('hidden');
    logoutWrap?.classList.remove('hidden');
    setSessionEmail(user.email);
  } else {
    if (us) us.textContent = '';
    if (welcome) welcome.textContent = 'Name User';
    authBox?.classList.remove('hidden');
    menuBox?.classList.add('hidden');
    adminBtn?.classList.remove('hidden');
    logoutWrap?.classList.add('hidden');
    clearSession();
  }
});

// signup step2 submit
$id('signup2')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $id('suEmail')?.value.trim();
  const tel   = $id('suTel')?.value.trim();
  const usern = $id('suUser')?.value.trim();
  const pass  = $id('suPass')?.value;
  const conf  = $id('suConfirm')?.value;
  if (!email) return alert('กรุณากรอกอีเมล');
  if (pass !== conf) return alert('รหัสผ่านไม่ตรงกัน');
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await set(ref(db, `users/${cred.user.uid}`), {
      uid: cred.user.uid, email, tel: tel || '', username: usern || email, createdAt: new Date().toISOString()
    });
    alert('สมัครสำเร็จ ✅');
  } catch (err) { console.error(err); alert(err.message || 'สมัครไม่สำเร็จ'); }
});

// login
$id('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $id('loginUser')?.value.trim();
  const pass  = $id('loginPass')?.value;
  if (!email || !pass) return;
  try { await signInWithEmailAndPassword(auth, email, pass); }
  catch (err) { console.error(err); alert('อีเมลหรือรหัสผ่านไม่ถูกต้อง'); }
});

// logout
$id('logoutMini')?.addEventListener('click', async () => {
  if (confirm('ออกจากระบบใช่หรือไม่?')) {
    try { await signOut(auth); } catch {}
    clearSession(); location.reload();
  }
});
