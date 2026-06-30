// ===== Helper =====
const $id = (id) => document.getElementById(id);
const THB = n => new Intl.NumberFormat('th-TH').format(n);
const dateTH = d => new Date(d).toLocaleDateString('th-TH', { year:'numeric', month:'short', day:'numeric' });
const daysBetween = (a,b) => Math.max(1, Math.ceil((new Date(b)-new Date(a)) / (1000*60*60*24)));
function fallbackExt(img){ if(!img?.src) return; if(!img.dataset.tried){ img.dataset.tried=1; img.src = img.src.replace(/\.png$/i, '.jpg'); } }

// ===== Model Map =====
const ModelMap = {
  HONDA: {
    'Wave 110i': 'Moto/H 110-NB.png',
    'Wave 125i': 'Moto/H 125-NB.png',
    'Click 160': 'Moto/H Crilick-NB.png',
    'Forza 350': 'Moto/H forza-NB.png',
    'PCX 160': 'Moto/H pcx-NB.png',
    'Scoopy i': 'Moto/H scoopy-NB.png',
    'ทรงเชง' : 'Moto/H ทรงเชง.jpg'
  },
  YAMAHA: {
    'Aerox': 'Moto/Y aerox-NB.png',
    'FAZZIO': 'Moto/Y FAZZIO-NB.png',
    'Finn': 'Moto/Y fin-NB.png',
    'Fino': 'Moto/Y fino-NB.png',
    'Grand Filano': 'Moto/Y GRAND FILANO-NB.png',
    'NMAX': 'Moto/Y nmax-NB.png',
    'XMAX': 'Moto/Y xmax-NB.png'
  }
};

// ===== Views =====
const VIEWS = ['homeSection','depositSection','reviewSection','successSection','historySection','adminSection'];
function showView(id){ VIEWS.forEach(v => $id(v)?.classList.add('hidden')); $id(id)?.classList.remove('hidden'); }

// ===== Auth box toggles (UI only; real auth handled in firebase-auth.js) =====
const loginForm=$id('loginForm'), signup1=$id('signup1'), signup2=$id('signup2'), authTitle=$id('authTitle');
$id('gotoSignup')?.addEventListener('click', (e)=>{ e.preventDefault(); authTitle.textContent='Sign in'; loginForm.classList.add('hidden'); signup2.classList.add('hidden'); signup1.classList.remove('hidden'); });
$id('backToLogin1')?.addEventListener('click', ()=>{ authTitle.textContent='Login'; signup1.classList.add('hidden'); signup2.classList.add('hidden'); loginForm.classList.remove('hidden'); });
$id('backToLogin2')?.addEventListener('click', ()=>{ authTitle.textContent='Login'; signup1.classList.add('hidden'); signup2.classList.add('hidden'); loginForm.classList.remove('hidden'); });
signup1?.addEventListener('submit', (e)=>{ e.preventDefault(); signup1.classList.add('hidden'); signup2.classList.remove('hidden'); });

// ===== Menu actions =====
$id('goDeposit')?.addEventListener('click', ()=> showView('depositSection'));
$id('goHistory')?.addEventListener('click', ()=> { renderHistory(); showView('historySection'); });
$id('backHome')?.addEventListener('click', ()=> showView('homeSection'));

// ===== Deposit form =====
const brand=$id('brand'), model=$id('model'), modelPreview=$id('modelPreview');
brand?.addEventListener('change', ()=>{
  model.innerHTML = '<option value="">— เลือก —</option>';
  const m = ModelMap[brand.value] || {};
  Object.keys(m).forEach(name=>{
    const o = document.createElement('option'); o.value=name; o.textContent=name; model.appendChild(o);
  });
  model.value=''; modelPreview.src='';
});
model?.addEventListener('change', ()=>{
  const src = (ModelMap[brand.value]||{})[model.value];
  if(src){ modelPreview.src = src; modelPreview.onerror = function(){ fallbackExt(this); }; }
});

// default dates
const todayISO = new Date().toISOString().split('T')[0];
$id('startDate')?.setAttribute('min', todayISO);
$id('endDate')?.setAttribute('min', todayISO);
if ($id('startDate')) $id('startDate').value = todayISO;
if ($id('endDate')) $id('endDate').value   = todayISO;

function updateLivePrice(){
  const s=$id('startDate')?.value, e=$id('endDate')?.value, box=$id('priceLive');
  if(!box || !s || !e) return;
  const days = Math.max(1, Math.ceil((new Date(e)-new Date(s))/(1000*60*60*24)));
  box.textContent = `รวมค่าฝาก: ${THB(days*15)} บาท (${days} วัน)`;
}
['startDate','endDate'].forEach(id=>{ const el=$id(id); el?.addEventListener('change',updateLivePrice); el?.addEventListener('input',updateLivePrice); });
updateLivePrice();

$id('cancelDeposit')?.addEventListener('click', ()=>{
  $id('depositForm')?.reset();
  model.innerHTML = '<option value="">— เลือก —</option>';
  modelPreview.src='';
  updateLivePrice();
  showView('homeSection');
});

$id('depositForm')?.addEventListener('submit', (e)=>{
  e.preventDefault();
  if(!brand.value) return alert('กรุณาเลือกยี่ห้อ');
  if(!model.value) return alert('กรุณาเลือกรุ่น');

  const data = {
    user: JSON.parse(localStorage.getItem('mc_session')||'{}').user || 'guest',
    type: $id('type').value,
    brand: brand.value,
    model: model.value,
    plate: $id('plate').value.trim(),
    start: $id('startDate').value,
    end: $id('endDate').value,
    note: $id('note').value.trim(),
    img: (ModelMap[brand.value]||{})[model.value] || ''
  };
  if(new Date(data.end) < new Date(data.start)) return alert('วันที่รับต้องไม่น้อยกว่าวันที่ฝาก');

  data.days = daysBetween(data.start, data.end);
  data.rate = 15;
  data.total = data.days * data.rate;

  localStorage.setItem('mc_order', JSON.stringify(data));
  renderReview();
  showView('reviewSection');
});

function renderReview(){
  const x = JSON.parse(localStorage.getItem('mc_order') || 'null'); if(!x) return;
  const L = $id('reviewList'); L.innerHTML = '';
  [
    ['ชื่อผู้ใช้',x.user], ['ทะเบียนรถ',x.plate], ['ยี่ห้อ',x.brand], ['รุ่น',x.model],
    ['นำรถมาฝากวันที่',dateTH(x.start)], ['มารับรถวันที่',dateTH(x.end)],
    ['จำนวนวัน',THB(x.days)+' วัน'], ['อัตรา',THB(x.rate)+' บาท/วัน'],
    ['จำนวนเงินที่ต้องชำระ',THB(x.total)+' บาท'], ['หมายเหตุ',x.note||'-']
  ].forEach(([k,v])=>{ const b=document.createElement('b'); b.textContent=k; const d=document.createElement('div'); d.textContent=v; L.append(b,d); });
  $id('payTotal').textContent = THB(x.total);
}

$id('backToForm')?.addEventListener('click', ()=> showView('depositSection'));

$id('confirmPay')?.addEventListener('click', ()=>{
  const x = JSON.parse(localStorage.getItem('mc_order') || 'null'); if(!x) return;
  saveHistory(x);
  renderSuccess(x);
  showView('successSection');
});

function renderSuccess(x){
  $id('successImg').src = x.img || '';
  $id('successImg').onerror = function(){ fallbackExt(this); };
  const L = $id('successList');
  L.innerHTML = '';
  [
    ['ชื่อผู้ใช้', x.user],
    ['ทะเบียนรถ', x.plate],
    ['ยี่ห้อ/รุ่น', x.brand + ' / ' + x.model],
    ['นำรถมาฝาก', dateTH(x.start)],
    ['มารับรถ', dateTH(x.end)],
    ['ยอดที่ชำระ', THB(x.total) + ' บาท'],
    ['หมายเหตุ', x.note || '-']
  ].forEach(([k, v]) => { const b = document.createElement('b'); b.textContent = k; const d = document.createElement('div'); d.textContent = v; L.append(b, d); });
}

$id('finishBtn')?.addEventListener('click', ()=>{ localStorage.removeItem('mc_order'); showView('homeSection'); });

// ===== Local History (for user's view) =====
function saveHistory(x){ const h = JSON.parse(localStorage.getItem('mc_history') || '[]'); h.unshift({...x, time: Date.now()}); localStorage.setItem('mc_history', JSON.stringify(h)); }
function deleteHistoryById(id){ const h = JSON.parse(localStorage.getItem('mc_history') || '[]'); const next = h.filter(it => it.time !== id); localStorage.setItem('mc_history', JSON.stringify(next)); }
function renderHistory(){
  const h = JSON.parse(localStorage.getItem('mc_history') || '[]');
  const box = $id('historyList');
  box.classList.add('hist-list');
  box.innerHTML = '';
  if(!h.length){ box.innerHTML = '<div class="muted">ยังไม่มีรายการ</div>'; return; }
  h.forEach(item=>{
    const card = document.createElement('div'); card.className = 'hist-card'; card.dataset.id = item.time;
    const thumb = document.createElement('div'); thumb.className = 'hist-thumb'; const img = document.createElement('img'); img.src = item.img || ''; img.onerror = function(){ fallbackExt(this); }; thumb.appendChild(img);
    const meta = document.createElement('div'); meta.className = 'hist-meta';
    meta.innerHTML = `<b>${item.brand} / ${item.model}</b><div class="muted">${item.plate} • ${new Date(item.time).toLocaleString('th-TH')}</div><div class="muted">${dateTH(item.start)} → ${dateTH(item.end)} (${item.days} วัน) • ${THB(item.total)} บาท</div>`;
    const actions = document.createElement('div'); actions.className = 'hist-actions';
    const btnView = document.createElement('button'); btnView.className='btn-small'; btnView.textContent='ดูรายละเอียด';
    const btnDel  = document.createElement('button'); btnDel.className='btn-small red'; btnDel.textContent='ลบรายการ';
    actions.append(btnView, btnDel);
    const details = document.createElement('div'); details.className = 'hist-details';
    details.innerHTML = `<div class="list"><b>ผู้ใช้</b><div>${item.user}</div><b>ทะเบียน</b><div>${item.plate}</div><b>ยี่ห้อ/รุ่น</b><div>${item.brand} / ${item.model}</div><b>นำรถมาฝาก</b><div>${dateTH(item.start)}</div><b>มารับรถ</b><div>${dateTH(item.end)}</div><b>จำนวนวัน</b><div>${item.days} วัน</div><b>ยอดรวม</b><div>${THB(item.total)} บาท</div><b>หมายเหตุ</b><div>${item.note || '-'}</div></div>`;
    btnView.onclick = ()=>{ card.classList.toggle('open'); btnView.textContent = card.classList.contains('open') ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'; };
    [thumb, meta].forEach(el=>{ el.style.cursor='pointer'; el.onclick = btnView.onclick; });
    btnDel.onclick = ()=>{ if(confirm('ต้องการลบรายการนี้ใช่หรือไม่?')){ deleteHistoryById(item.time); renderHistory(); } };
    card.append(thumb, meta, actions, details); box.append(card);
  });
}

// ===== Local Admin (username/password ภายใน) =====
const ADMINS = [
  { user: 'admin-Natarpha', pass: '1234' },
  { user: 'admin-Q', pass: '4105' },
  { user: 'admin-OIL', pass: '4070' },
  { user: 'admin-BOOKBIG', pass: '4085' },
  { user: 'admin-NUT', pass: '4094' },
  { user: 'admin-GIG', pass: '4077' },
];
$id('adminBtn')?.addEventListener('click', ()=>{ showView('adminSection'); updateStatusBar(); });
$id('adminBackHome')?.addEventListener('click', ()=> showView('homeSection'));
$id('adminLoginBtn')?.addEventListener('click', ()=>{
  const u = $id('adminUser').value.trim(); const p = $id('adminPass').value;
  const ok = ADMINS.some(a => a.user === u && a.pass === p);
  if (ok){ localStorage.setItem('mc_admin', JSON.stringify({ user: u, at: Date.now() })); refreshAdminView(); }
  else alert('รหัสผ่านแอดมินไม่ถูกต้อง');
});
$id('adminLogout')?.addEventListener('click', ()=>{ localStorage.removeItem('mc_admin'); refreshAdminView(); });

function refreshAdminView(){
  const logged = !!JSON.parse(localStorage.getItem('mc_admin') || 'null');
  $id('adminAuth')?.classList.toggle('hidden', logged);
  $id('adminDash')?.classList.toggle('hidden', !logged);
  updateStatusBar();
}

function updateStatusBar(){
  const as = JSON.parse(localStorage.getItem('mc_admin')||'null');
  const us = $id('userStatus'); if (!us) return;
  if (as && as.user){ us.textContent = '👑 กำลังใช้งานในโหมดแอดมิน : ' + as.user; }
}

refreshAdminView();
