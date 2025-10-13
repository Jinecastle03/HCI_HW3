
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

function runSearch(who, q) {
  const tgt = document.getElementById('search-results');
  let list = [];
  if (who === 'class') {
    list = DATA.classmates.filter(c => !q || (c.name || '').toLowerCase().includes(q));
  } else {
    list = DATA.teachers.filter(t => !q || (t.name || '').toLowerCase().includes(q));
  }

  if (!list.length) {
    tgt.innerHTML = `<p class="muted">No results.</p>`;
    return;
  }

  // 큰 이미지 타일(와이어프레임 느낌)
  let html = '';
  list.forEach(item => {
    const name = item.name || '';
    const img = item.photo || '';
    html += `
      <figure class="tile">
        <img src="${img}" alt="${name}" />
        <figcaption>${name}</figcaption>
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
function renderUpdate() {
  const menu = document.getElementById('menu');
  const c0 = DATA.classmates[0] || { name: "", birth: "", clubs: "", address: "", whereto: "", photo: "" };
  menu.innerHTML = `
    <button class="home-but" onclick="go('home')">Home</button>
    <h3>Update</h3>
    <div class="upd-form">
      <label>이름 <input id="u_name" value="${c0.name}"></label>
      <label>생일 <input id="u_birth" value="${c0.birth}" placeholder="YYYY-MM-DD"></label>
      <label>동아리 <input id="u_clubs" value="${c0.clubs}"></label>
      <label>주소 <input id="u_addr" value="${c0.address}"></label>
      <label>진로 <input id="u_where" value="${c0.whereto}"></label>
      <button class="but" onclick="applyUpdate()">Apply</button>
      <button class="but hollow" onclick="downloadResource()">Download resource.txt</button>
    </div>
    <p class="muted">* 과제 요건상 실제 파일 저장은 브라우저 보안정책으로 제한됩니다. 'Download resource.txt' 버튼으로 변경된 내용을 CSV로 저장하세요.</p>
  `;
}
function applyUpdate() {
  if (!DATA.classmates.length) { alert("수정할 classmate가 없습니다."); return; }
  DATA.classmates[0].name = document.getElementById('u_name').value || "";
  DATA.classmates[0].birth = document.getElementById('u_birth').value || "";
  DATA.classmates[0].clubs = document.getElementById('u_clubs').value || "";
  DATA.classmates[0].address = document.getElementById('u_addr').value || "";
  DATA.classmates[0].whereto = document.getElementById('u_where').value || "";
  alert("적용되었습니다. 다운로드하여 resource.txt를 교체하세요.");
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
