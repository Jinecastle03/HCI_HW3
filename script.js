
/***** 1) 전역 상태 *****/
let DATA = { classmates: [], teachers: [], places: [] };
let COMMENTS_KEY = "iyb_hw3_comments_v1";

/***** 유틸: 로컬 스토리지 댓글 불러오기/저장 *****/
function loadComments() {
  try {
    const raw = localStorage.getItem(COMMENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn("loadComments failed:", e);
    return [];
  }
}
function saveComments(list) {
  try {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(list || []));
  } catch (e) {
    console.warn("saveComments failed:", e);
  }
}

/***** 2) CSV 파서 (따옴표/콤마 대응, BOM 제거) *****/
function parseCSV(text) {
  text = String(text || "").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
  const lines = text.split("\n").filter(s => s.trim().length > 0);
  if (!lines.length) return { header: [], rows: [] };

  const splitLine = (line) => {
    const out = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === "," && !inQ) {
        out.push(cur);
        cur = "";
      } else cur += ch;
    }
    out.push(cur);
    return out.map(s => s.trim().replace(/^"(.*)"$/, "$1"));
  };

  const header = splitLine(lines[0]).map(h => h.toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    const obj = {};
    header.forEach((h, j) => (obj[h] = cols[j] ?? ""));
    rows.push(obj);
  }
  return { header, rows };
}

/***** 3) rows → 내부 구조(DATA) 빌드 *****/
function buildDataStructures({ header, rows }) {
  const hasType = header.includes("type");
  const out = { classmates: [], teachers: [], places: [] };

  rows.forEach(r => {
    const type = hasType ? (r.type || "").toLowerCase() : "class";
    if (type === "class") {
      out.classmates.push({
        id: r.id || "",
        name: r.name || "",
        birth: r.birth || "",
        clubs: r.clubs || "",
        address: r.address || "",
        whereto: r.whereto || "",
        photo: r.picture ? `pics/${r.picture}` : ""
      });
    } else if (type === "teacher") {
      out.teachers.push({
        id: r.id || "",
        name: r.name || "",
        dept: r.dept || "",
        room: r.room || "",
        photo: r.picture ? `pics/${r.picture}` : ""
      });
    } else if (type === "place") {
      out.places.push({
        id: r.id || "",
        place: r.place || "",
        then: r.then ? `pics/${r.then}` : "",
        now: r.now ? `pics/${r.now}` : ""
      });
    }
  });
  DATA = out;
}

/***** 4) 자동 로더: index.html 로드 시 resource.txt 자동 fetch *****/
async function autoLoadResource() {
  try {
    const res = await fetch("resource.txt", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const parsed = parseCSV(text);
    buildDataStructures(parsed);
    console.log("resource.txt loaded ✔", DATA);
  } catch (err) {
    console.warn("autoLoadResource failed:", err);
    alert("resource.txt 자동 읽기에 실패했습니다.");
  }
}

/***** 5) 메인/Look 메뉴 렌더러 *****/
function renderMainMenu() {
  const menu = document.getElementById('menu');
  menu.innerHTML = `
    <button class="but" onclick="go('look')">Look Around</button>
    <button class="but" onclick="go('memorabilia')">Memorabilia</button>
    <button class="but" onclick="go('search')">Search</button>
    <button class="but" onclick="go('post')">Post Comment</button>
    <button class="but" onclick="go('update')">Update</button>
  `;
}

function renderLookMenu() {
  const menu = document.getElementById('menu');
  menu.innerHTML = `
    <button class="but" onclick="go('classmates')">Classmates</button>
    <button class="but" onclick="go('teachers')">Teachers</button>
    <button class="but" onclick="go('thenandnow')">Then and Now</button>
    <button class="home-but" onclick="go('home')">Home</button>
  `;
}

function renderThenAndNow() {
  const menu = document.getElementById('menu');
  let html = `<button class="home-but" onclick="go('home')">Home</button>`;
  DATA.places.forEach(place => {
    html += `
      <div class="place-row">
        <div class="place-photos">
          <figure><img src="${place.then}" alt="Then - ${place.place}"><figcaption>Then</figcaption></figure>
          <figure><img src="${place.now}" alt="Now - ${place.place}"><figcaption>Now</figcaption></figure>
        </div>
        <div class="place-name">${place.place}</div>
      </div>
    `;
  });
  menu.innerHTML = html;
}

function renderClassmates() {
  const menu = document.getElementById('menu');
  let html = `
    <button class="home-but" onclick="go('home')">Home</button>
    <h3>Classmates</h3>
    <div class="profile-list">
  `;
  DATA.classmates.forEach(c => {
    html += `
      <div class="profile-card">
        <img class="profile-img" src="${c.photo}" alt="${c.name}">
        <div class="profile-info">
          <div class="profile-name">${c.name}</div>
          <div class="profile-detail">Birth: ${c.birth}</div>
          <div class="profile-detail">Clubs: ${c.clubs}</div>
          <div class="profile-detail">Address: ${c.address}</div>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  menu.innerHTML = html;
}

function renderTeachers() {
  const menu = document.getElementById('menu');
  let html = `
    <button class="home-but" onclick="go('home')">Home</button>
    <h3>Teachers</h3>
  `;
  DATA.teachers.forEach(t => {
    html += `
      <div class="profile-card">
        <img class="profile-img" src="${t.photo}" alt="${t.name}">
        <div class="profile-info">
          <div class="profile-name">${t.name}</div>
          <div class="profile-detail">Dept: ${t.dept}</div>
          <div class="profile-detail">Room: ${t.room}</div>
        </div>
      </div>
    `;
  });
  menu.innerHTML = html;
}

/***** 6) Search (Who + Name + 썸네일 결과) *****/
// === 상세 보기(인물) ===
function renderPersonDetail(item, role) { // role: 'class' | 'teacher'
  const menu = document.getElementById('menu');
  const name = item?.name || '';
  const img = item?.photo || '';
  const body = role === 'class'
    ? `
      <div class="detail-row">Birth: ${item.birth || ''}</div>
      <div class="detail-row">Clubs: ${item.clubs || ''}</div>
      <div class="detail-row">Address: ${item.address || ''}</div>
    `
    : `
      <div class="detail-row">Dept: ${item.dept || ''}</div>
      <div class="detail-row">Room: ${item.room || ''}</div>
    `;

  menu.innerHTML = `
    <div class="search-header">
      <button class="home-but" onclick="go('home')">Home</button>
    </div>
    <div class="detail">
      <img class="detail-img" src="${img}" alt="${name}">
      <div class="detail-name">${name}</div>
      ${body}
      <button class="but" onclick="renderSearch()">Back</button>
    </div>
  `;
}

function renderPlaceDetail(p) {
  const menu = document.getElementById('menu');
  menu.innerHTML = `
    <div class="search-header">
      <button class="home-but" onclick="go('home')">Home</button>
    </div>
    <div class="place-row" style="margin-top:10px">
      <div class="place-name" style="margin-bottom:8px">${p.place || ''}</div>
      <div class="place-photos">
        <figure><img src="${p.then || ''}" alt="Then"><figcaption>Then</figcaption></figure>
        <figure><img src="${p.now || ''}"  alt="Now"><figcaption>Now</figcaption></figure>
      </div>
      <button class="but" style="margin-top:12px" onclick="renderSearch()">Back</button>
    </div>
  `;
}

function renderSearch() {
  const menu = document.getElementById('menu');
  menu.innerHTML = `
    <div class="search-header">
      <button class="home-but" onclick="go('home')">Home</button>
    </div>

    <div class="search-form">
      <label class="search-label">Who</label>
      <div class="who-group">
        <button class="seg" data-role="who" data-val="class">Classmate</button>
        <button class="seg" data-role="who" data-val="teacher">Teacher</button>
        <button class="seg" data-role="who" data-val="place">Place</button>
      </div>

      <label class="search-label">Name</label>
      <input id="nameq" class="search-input" placeholder="e.g., Donald" />

      <div class="search-actions">
        <button class="but" id="btnSearchGo">Search</button>
      </div>
    </div>

    <div id="search-results" class="grid-results"></div>
  `;

  // 기본 선택: classmate
  const segs = Array.from(document.querySelectorAll('.seg'));
  function select(val) {
    segs.forEach(b => {
      if (b.dataset.val === val) b.classList.add('seg-selected');
      else b.classList.remove('seg-selected');
    });
  }
  select('class');
  segs.forEach(b => b.addEventListener('click', () => select(b.dataset.val)));

  document.getElementById('btnSearchGo').addEventListener('click', () => {
    const who = document.querySelector('.seg.seg-selected')?.dataset.val || 'class';
    const q = (document.getElementById('nameq').value || '').trim().toLowerCase();
    runSearch(who, q);
  });
}
function openDetailFromSearch(el) {
  const role = el.dataset.role;
  const idx = Number(el.dataset.idx);
  if (role === 'class') return renderPersonDetail(DATA.classmates[idx], 'class');
  if (role === 'teacher') return renderPersonDetail(DATA.teachers[idx], 'teacher');
  if (role === 'place') return renderPlaceDetail(DATA.places[idx]);
}
function runSearch(who, q) {
  const tgt = document.getElementById('search-results');
  const qq = (q || '').toLowerCase();

  let list = [];
  if (who === 'class') list = DATA.classmates.filter(c => !qq || (c.name || '').toLowerCase().includes(qq));
  else if (who === 'teacher') list = DATA.teachers.filter(t => !qq || (t.name || '').toLowerCase().includes(qq));
  else if (who === 'place') list = DATA.places.filter(p => !qq || (p.place || '').toLowerCase().includes(qq));

  const exact = list.filter(x => ((x.name || x.place || '').toLowerCase() === qq));
  if (exact.length === 1) {
    if (who === 'place') renderPlaceDetail(exact[0]); else renderPersonDetail(exact[0], who);
    return;
  }
  if (list.length === 1) {
    if (who === 'place') renderPlaceDetail(list[0]); else renderPersonDetail(list[0], who);
    return;
  }

  if (!list.length) { tgt.innerHTML = `<p class="muted">No results.</p>`; return; }

  // 여러 결과 → 각 카드에 “View Details” 버튼 표시
  let html = '';
  list.forEach((item) => {
    const title = item.name || item.place || '';
    const img = item.photo || item.then || '';
    const base = (who === 'class') ? DATA.classmates
      : (who === 'teacher') ? DATA.teachers
        : DATA.places;
    const oid = base.indexOf(item);   // ← 원본 배열에서의 인덱스
    html += `
    <figure class="tile" data-role="${who}" data-idx="${oid}">
      <div class="tile-img-wrap">
        <img src="${img}" alt="${title}" />
        <button class="view-btn" onclick="openDetailFromSearch(this.parentElement.parentElement)">View Details</button>
      </div>
      <figcaption>${title}</figcaption>
    </figure>
  `;
  });
  tgt.innerHTML = html;
}




/***** 7) Post Comment *****/
function renderPost() {
  const menu = document.getElementById('menu');
  const comments = loadComments();
  let items = comments.map(c => `<div class="comment-item"><div class="comment-meta">${c.author} • ${new Date(c.ts).toLocaleString()}</div><div>${c.text}</div></div>`).join("");
  if (!items) items = `<p class="muted">아직 코멘트가 없습니다. 첫 코멘트를 남겨보세요!</p>`;
  menu.innerHTML = `
    <button class="home-but" onclick="go('home')">Home</button>
    <h3>Post Comment</h3>
    <div class="comment-form">
      <input id="nick" class="search-input" placeholder="닉네임 (선택)" />
      <textarea id="cmt" class="comment-text" placeholder="메시지를 입력하세요"></textarea>
      <button class="but" onclick="addComment()">Post</button>
    </div>
    <div id="comment-list">${items}</div>
  `;
}
function addComment() {
  const nick = (document.getElementById('nick').value || "Anonymous").trim();
  const txt = (document.getElementById('cmt').value || "").trim();
  if (!txt) return alert("내용을 입력하세요.");
  const comments = loadComments();
  comments.unshift({ author: nick || "Anonymous", text: txt, ts: Date.now() });
  saveComments(comments);
  renderPost();
}

/***** 8) Update + CSV 다운로드 *****/
/***** UPDATE FLOW *****/
// 이름 분해/합치기 유틸
function splitName(full) {
  const s = (full || "").trim();
  if (!s) return { first: "", last: "" };
  const parts = s.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  const last = parts.pop();
  return { first: parts.join(" "), last };
}
function joinName(first, last) {
  const f = (first || "").trim(), l = (last || "").trim();
  return l ? `${f} ${l}`.trim() : f;
}

// 0) Update 진입 화면 (What 선택)
function renderUpdate() {
  const menu = document.getElementById('menu');
  menu.innerHTML = `
    <div class="update-header">
      <button class="home-but" onclick="go('home')">Home</button>
    </div>

    <div class="update-what">
      <div class="update-label">What</div>
      <div class="who-group">
        <button class="seg" onclick="renderUpdatePick('class')">Classmate</button>
        <button class="seg" onclick="renderUpdatePick('teacher')">Teacher</button>
      </div>
    </div>
  `;
}

// 1) 대상(사람) 선택 화면
function renderUpdatePick(role) {
  const list = role === 'class' ? DATA.classmates : DATA.teachers;
  const menu = document.getElementById('menu');
  const options = list.map((p, i) => `<option value="${i}">${p.name || '(no name)'}</option>`).join('');
  menu.innerHTML = `
    <button class="home-but" onclick="go('home')">Home</button>

    <div class="update-pick">
      <label class="update-label">${role === 'class' ? 'Classmate' : 'Teacher'}</label>
      <select id="upd_target" class="upd-select">${options}</select>
      <div class="update-actions">
        <button class="but" onclick="renderUpdateForm('${role}', Number(document.getElementById('upd_target').value))">Next</button>
        <button class="but hollow" onclick="renderUpdate()">Back</button>
      </div>
    </div>
  `;
}

// 2) 상세 폼 화면 (First/Last/Address/Picture)
function renderUpdateForm(role, idx) {
  const list = role === 'class' ? DATA.classmates : DATA.teachers;
  const p = list[idx] || {};
  const { first, last } = splitName(p.name || "");

  const menu = document.getElementById('menu');
  menu.innerHTML = `
    <div class="update-header">
      <button class="home-but" onclick="go('home')">Home</button>
    </div>
    <div class="upd-form big">
      <label>First name <input id="fn" value="${first}"></label>
      <label>Last name  <input id="ln" value="${last}"></label>

      ${role === 'class' ? `
        <label>Address <textarea id="addr" rows="4">${p.address || ""}</textarea></label>
      ` : `
        <label>Room <input id="room" value="${p.room || ""}"></label>
        <label>Dept <input id="dept" value="${p.dept || ""}"></label>
      `}

      <label>Picture file <input id="pic" placeholder="e.g., 2.jpg" value="${(p.photo || '').replace(/^pics\//, '')}"></label>

      <div class="update-actions two">
        <button class="but" onclick="applyUpdateForm('${role}', ${idx})">Update</button>
        <button class="but hollow" onclick="renderUpdatePick('${role}')">Cancel</button>
      </div>

      <div class="update-download">
        <button class="but hollow" onclick="downloadResource()">Download resource.txt</button>
        <div class="muted">* 브라우저 보안 정책상 파일 직접 저장은 불가 → 다운받아 기존 resource.txt 교체</div>
      </div>
    </div>
  `;
}

// 3) 적용
function applyUpdateForm(role, idx) {
  const list = role === 'class' ? DATA.classmates : DATA.teachers;
  const p = list[idx]; if (!p) return;

  const name = joinName(
    document.getElementById('fn').value,
    document.getElementById('ln').value
  );
  p.name = name;

  if (role === 'class') {
    p.address = document.getElementById('addr').value || "";
  } else {
    p.room = document.getElementById('room').value || "";
    p.dept = document.getElementById('dept').value || "";
  }

  const pic = (document.getElementById('pic').value || "").trim();
  p.photo = pic ? `pics/${pic}` : "";

  alert('Updated in memory. Use "Download resource.txt" to save this change.\n(You will stay on this page.)');

}

function downloadResource() {
  // header는 기존 형식을 유지
  const header = [
    "type", "id", "name", "birth", "clubs", "address", "whereto", "picture", "dept", "room", "place", "then", "now"
  ];
  const rows = [];

  DATA.classmates.forEach(c => {
    rows.push([
      "class", c.id || "", c.name || "", c.birth || "", c.clubs || "", c.address || "",
      c.whereto || "", (c.photo || "").replace(/^pics\//, ""), "", "", "", "", ""
    ]);
  });
  DATA.teachers.forEach(t => {
    rows.push([
      "teacher", t.id || "", t.name || "", "", "", "", "",
      (t.photo || "").replace(/^pics\//, ""), t.dept || "", t.room || "", "", "", ""
    ]);
  });
  DATA.places.forEach(p => {
    rows.push([
      "place", p.id || "", "", "", "", "", "", "",
      "", "", p.place || "", (p.then || "").replace(/^pics\//, ""), (p.now || "").replace(/^pics\//, "")
    ]);
  });

  const csv = [header.join(","), ...rows.map(r => r.map(v => {
    const s = String(v ?? "");
    return (s.includes(",") || s.includes('"')) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(","))].join("\n");

  const a = document.createElement("a");
  a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(csv);
  a.download = "resource.txt";
  a.click();
}

/***** 9) 라우터 *****/
function go(page) {
  if (page === 'home') {
    renderMainMenu();
  } else if (page === 'look') {
    renderLookMenu();
  } else if (page === 'thenandnow') {
    renderThenAndNow();
  } else if (page === 'classmates') {
    renderClassmates();
  } else if (page === 'teachers') {
    renderTeachers();
  } else if (page === 'search') {
    renderSearch();
  } else if (page === 'post') {
    renderPost();
  } else if (page === 'update') {
    renderUpdate();
  }
}

/***** 10) 페이지 로드시 자동 실행 *****/
window.addEventListener("DOMContentLoaded", () => {
  autoLoadResource();
  renderMainMenu();
});
