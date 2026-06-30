// Firebase Realtime Database (writes booking on confirm & renders admin table)
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBP7APrRnd5oE61MfEQEYG-i1uU94cDrCc",
  authDomain: "motorbike-guard.firebaseapp.com",
  databaseURL: "https://motorbike-guard-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "motorbike-guard",
  storageBucket: "motorbike-guard.appspot.com",
  messagingSenderId: "623641364695",
  appId: "1:623641364695:web:7d81793ca689cfc4108892"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db  = getDatabase(app);
const parkingRef = ref(db, "parking");

const $  = (s) => document.querySelector(s);
const THB = n => new Intl.NumberFormat('th-TH').format(n);
const dateTH = d => new Date(d).toLocaleDateString('th-TH', { year:'numeric', month:'short', day:'numeric' });

// write on confirm
document.getElementById("confirmPay")?.addEventListener("click", async () => {
  const x = JSON.parse(localStorage.getItem("mc_order") || "null");
  if (!x) return;
  const rec = {
    user: x.user, plate: x.plate, brand: x.brand, model: x.model,
    startDate: x.start, endDate: x.end, days: x.days, fee: x.total,
    note: x.note || "", status: "ACTIVE", createdAt: new Date().toISOString(), img: x.img || ""
  };
  try { await set(push(parkingRef), rec); } catch (err) { console.error(err); alert("บันทึกฐานข้อมูลไม่สำเร็จ"); }
});

// live admin table
const adminTableBody = document.querySelector("#adminTable tbody");
const mTotal = $("#mTotal"), mRevenue = $("#mRevenue"), mCustomers = $("#mCustomers"), mActive = $("#mActive");

function renderAdmin(snapshot){
  if (!adminTableBody) return;
  const data = snapshot.val() || {};
  adminTableBody.innerHTML = "";
  let total=0, revenue=0, active=0; const customers=new Set();

  Object.entries(data).forEach(([id, v]) => {
    total += 1;
    revenue += Number(v.fee || 0);
    if (v.status !== "CLOSED") active += 1;
    if (v.user) customers.add(v.user);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(v.createdAt || Date.now()).toLocaleString('th-TH')}</td>
      <td>${v.user || "-"}</td>
      <td>${v.plate || "-"}</td>
      <td>${(v.brand || "-")}/${(v.model || "-")}</td>
      <td>${dateTH(v.startDate)}</td>
      <td>${dateTH(v.endDate)}</td>
      <td class="col-num">${v.days ?? "-"}</td>
      <td class="col-num">${THB(v.fee ?? 0)}</td>
      <td>${v.note || ""}</td>
      <td class="col-del"><button class="btn-mini btn-red" data-del="${id}">ลบ</button></td>
    `;
    adminTableBody.appendChild(tr);
  });

  if (mTotal)     mTotal.textContent     = String(total);
  if (mRevenue)   mRevenue.textContent   = THB(revenue);
  if (mCustomers) mCustomers.textContent = String(customers.size);
  if (mActive)    mActive.textContent    = String(active);
}

if (adminTableBody) onValue(parkingRef, renderAdmin);

// delete
document.addEventListener("click", async (e) => {
  const btn = e.target.closest?.("[data-del]");
  if (!btn) return;
  const id = btn.getAttribute("data-del");
  if (confirm("ลบรายการนี้หรือไม่?")) {
    await remove(ref(db, `parking/${id}`));
  }
});

// export csv
$("#adminExport")?.addEventListener("click", () => {
  onValue(parkingRef, (snap) => {
    const data = snap.val() || {};
    const rows = [["createdAt","user","plate","brand","model","startDate","endDate","days","fee","note","status"]];
    Object.values(data).forEach(v => {
      rows.push([v.createdAt || "", v.user || "", v.plate || "", v.brand || "", v.model || "", v.startDate || "", v.endDate || "", v.days ?? "", v.fee ?? "", (v.note || "").replace(/\n/g," "), v.status || ""]);
    });
    const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `parking_export_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }, { onlyOnce: true });
});
