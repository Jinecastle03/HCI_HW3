
/***** 1) 전역 상태 *****/
let DATA = { classmates: [], teachers: [], places: [], memos: [] };
let COMMENTS_KEY = "iyb_hw3_comments_v1";
const NEWS_KEY = "iyb_hw3_news_v1";   // ← 추가!

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
function loadNews() {
  try {
    const raw = localStorage.getItem(NEWS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn("loadNews failed:", e);
    return [];
  }
}
function saveNews(list) {
  try {
    localStorage.setItem(NEWS_KEY, JSON.stringify(list || []));
  } catch (e) {
    console.warn("saveNews failed:", e);
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
  const out = { classmates: [], teachers: [], places: [], memos: [] };

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
    } else if (type === "memo") {
      out.memos.push({
        id: r.id || "",
        // 카테고리(예: Textbook/Bag/Uniform/Lunchbox/Trend/FieldTrip)
        category: (r.clubs || "").trim(),
        // 제목: name 칼럼 사용
        title: (r.name || "").trim(),
        // 연도(선택): birth 칼럼 사용
        year: (r.birth || "").trim(),
        // 설명: address 칼럼 사용
        desc: (r.address || "").trim(),
        // 대표 이미지: picture 칼럼 사용
        photo: r.picture ? `pics/${r.picture}` : ""
      })
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
    <button class="but" onclick="go('share')">Share News</button>
    <button class="but" onclick="go('zoom')">Zoom Gathering</button>
    <button class="but" onclick="go('exp3d')">3D Reenactment</button>
    <button class="but" onclick="openSettings()">Settings</button>
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

function renderMemorabilia() {
  const menu = document.getElementById('menu');

  // 카테고리 후보(없으면 "All")
  const CATS = ["All", "Textbook", "Bag", "Uniform", "Lunchbox", "Trend", "FieldTrip"];
  const chips = CATS.map(c => `<button class="chip" data-cat="${c}">${c}</button>`).join("");

  menu.innerHTML = `
    <div class="mem-header">
      <button class="home-but" onclick="go('home')">Home</button>
      <h3>Memorabilia</h3>
      <div class="mem-chips">${chips}</div>

      <div class="mem-search">
        <input id="memq" class="search-input" placeholder="Search title/desc..." />
        <button class="but" id="memSearchBtn">Search</button>
      </div>
    </div>
    <div id="memGrid" class="mem-grid"></div>
    <div id="memEmpty" class="muted" style="display:none">No items.</div>

    <!-- 상세 모달 -->
    <dialog id="memDlg" class="mem-dialog">
      <div class="mem-dialog-body">
        <img id="memDlgImg" class="mem-dlg-img" alt="">
        <div class="mem-dlg-text">
          <div id="memDlgTitle" class="mem-dlg-title"></div>
          <div id="memDlgMeta" class="mem-dlg-meta"></div>
          <div id="memDlgDesc" class="mem-dlg-desc"></div>
        </div>
      </div>
      <div class="mem-dialog-actions">
        <button class="but hollow" id="memDlgClose">Close</button>
      </div>
    </dialog>
  `;

  const chipBtns = Array.from(document.querySelectorAll('.chip'));
  let selected = "All";

  function applyFilter() {
    const q = (document.getElementById('memq').value || "").toLowerCase().trim();
    const list = DATA.memos.filter(m => {
      const catOk = (selected === "All") || ((m.category || "").toLowerCase() === selected.toLowerCase());
      const txt = (m.title || "") + " " + (m.desc || "");
      const qOk = !q || txt.toLowerCase().includes(q);
      return catOk && qOk;
    });

    const grid = document.getElementById('memGrid');
    const empty = document.getElementById('memEmpty');

    if (!list.length) {
      grid.innerHTML = "";
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    grid.innerHTML = list.map((m, i) => `
      <figure class="mem-card" data-idx="${i}">
        <div class="mem-thumb-wrap">
          <img class="mem-thumb" src="${m.photo}" alt="${m.title}">
        </div>
        <figcaption class="mem-caption">
          <div class="mem-title">${m.title || "(Untitled)"}</div>
          <div class="mem-meta">${m.category || ""}${m.year ? " • " + m.year : ""}</div>
        </figcaption>
      </figure>
    `).join("");

    // 카드 클릭 → 모달
    Array.from(document.querySelectorAll('.mem-card')).forEach(card => {
      card.addEventListener('click', () => {
        const idx = Number(card.dataset.idx);
        const item = list[idx];
        const dlg = document.getElementById('memDlg');
        document.getElementById('memDlgImg').src = item.photo || "";
        document.getElementById('memDlgImg').alt = item.title || "";
        document.getElementById('memDlgTitle').textContent = item.title || "";
        document.getElementById('memDlgMeta').textContent = `${item.category || ""}${item.year ? " • " + item.year : ""}`;
        document.getElementById('memDlgDesc').textContent = item.desc || "";
        dlg.showModal();
      });
    });
  }

  // 카테고리 토글
  function select(cat) {
    selected = cat;
    chipBtns.forEach(b => b.classList.toggle('chip-selected', b.dataset.cat === cat));
    applyFilter();
  }
  chipBtns.forEach(b => b.addEventListener('click', () => select(b.dataset.cat)));
  select("All");

  // 검색
  document.getElementById('memSearchBtn').addEventListener('click', applyFilter);
  document.getElementById('memq').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') applyFilter();
  });

  // 모달 닫기
  document.getElementById('memDlgClose').addEventListener('click', () => {
    document.getElementById('memDlg').close();
  });
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
function renderShare() {
  const menu = document.getElementById('menu');
  const news = loadNews();
  let items = news.map(n => `
    <div class="news-item">
      <div class="news-meta">${n.author} • ${new Date(n.ts).toLocaleString()}</div>
      <div class="news-title">${n.title}</div>
      <div class="news-text">${n.text}</div>
    </div>
  `).join("");
  if (!items) items = `<p class="muted">아직 소식이 없습니다.</p>`;

  menu.innerHTML = `
    <button class="home-but" onclick="go('home')">Home</button>
    <h3>Share News</h3>
    <div class="news-form">
      <input id="newsTitle" class="search-input" placeholder="제목" />
      <textarea id="newsBody" class="comment-text" placeholder="내용을 입력하세요"></textarea>
      <input id="newsAuthor" class="search-input" placeholder="작성자 (선택)" />
      <button class="but" onclick="addNews()">Post</button>
    </div>
    <div id="news-list">${items}</div>
  `;
}
function addNews() {
  const title = (document.getElementById('newsTitle').value || "").trim();
  const text = (document.getElementById('newsBody').value || "").trim();
  const author = (document.getElementById('newsAuthor').value || "Anonymous").trim();
  if (!title || !text) return alert("제목과 내용을 모두 입력하세요.");
  const list = loadNews();
  list.unshift({ title, text, author, ts: Date.now() });
  saveNews(list);
  renderShare();
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
  } else if (page === 'memorabilia') {
    renderMemorabilia();
  } else if (page === 'search') {
    renderSearch();
  } else if (page === 'post') {
    renderPost();
  } else if (page === 'update') {
    renderUpdate();
  } else if (page === 'share') {
    renderShare();
  } else if (page === 'zoom') {
    renderZoom();
  } else if (page === 'exp3d') {
    render3D();
  }
}

/***** 10) 페이지 로드시 자동 실행 *****/
window.addEventListener("DOMContentLoaded", () => {
  autoLoadResource();
  renderMainMenu();
});


/* ========= Settings (Theme & BGM) ========= */
const THEME_KEY = "iyb_hw3_theme_v1";
const BGM_KEY = "iyb_hw3_bgm_v1";

function openSettings() {
  const menu = document.getElementById('menu');
  const theme = JSON.parse(localStorage.getItem(THEME_KEY) || '{"bg":"","opacity":1}');
  const bgm = JSON.parse(localStorage.getItem(BGM_KEY) || '{"url":"","title":""}');
  menu.innerHTML = `
    <button class="home-but" onclick="go('home')">Home</button>
    <h3>Settings</h3>
    <div class="set-row">
      <label style="min-width:120px">Wallpaper URL</label>
      <input id="wallUrl" placeholder="e.g., pics/wallpaper.jpg" value="${theme.bg || ""}">
      <button class="but" onclick="applyTheme()">Apply</button>
    </div>
    <div class="set-row">
      <label style="min-width:120px">Background Opacity</label>
      <input id="wallOpacity" type="number" step="0.1" min="0" max="1" value="${theme.opacity ?? 1}">
    </div>
    <div class="set-row">
      <label style="min-width:120px">BGM URL</label>
      <input id="bgmUrl" placeholder="e.g., music/bgm.mp3" value="${bgm.url || ""}">
      <input id="bgmTitle" placeholder="title (optional)" value="${bgm.title || ""}">
      <button class="but" onclick="applyBGM()">Save</button>
    </div>
  `;
}

function applyTheme() {
  const url = (document.getElementById('wallUrl').value || "").trim();
  const opacity = Number(document.getElementById('wallOpacity').value || "1");
  localStorage.setItem(THEME_KEY, JSON.stringify({ bg: url, opacity: isNaN(opacity) ? 1 : opacity }));
  syncTheme();
  alert("Theme updated");
}

function syncTheme() {
  const theme = JSON.parse(localStorage.getItem(THEME_KEY) || '{"bg":"","opacity":1}');
  const bg = document.getElementById('app-bg');
  if (bg) {
    bg.style.setProperty('--bg', theme.bg ? `url('${theme.bg}')` : '#f7fbff');
    bg.style.setProperty('--bgOpacity', theme.opacity ?? 1);
  }
}

function applyBGM() {
  const url = (document.getElementById('bgmUrl').value || "").trim();
  const title = (document.getElementById('bgmTitle').value || "").trim();
  localStorage.setItem(BGM_KEY, JSON.stringify({ url, title }));
  alert("BGM saved. Use ▶︎ BGM in the toolbar.");
  syncBGMLabel();
}

function toggleBGM() {
  const au = document.getElementById('bgm');
  const conf = JSON.parse(localStorage.getItem(BGM_KEY) || '{"url":""}');
  if (!conf.url) { alert("Set BGM URL in Settings first."); return; }
  if (au.src !== conf.url) au.src = conf.url;
  if (au.paused) { au.play(); } else { au.pause(); }
  syncBGMLabel();
}

function syncBGMLabel() {
  const au = document.getElementById('bgm');
  const label = document.getElementById('bgmNow');
  const conf = JSON.parse(localStorage.getItem(BGM_KEY) || '{"url":"","title":""}');
  if (!label) return;
  label.textContent = conf.title ? `${au.paused ? '⏸' : '♪'} ${conf.title}` : (au.paused ? '⏸' : '♪');
}

/* Wire toolbar & theme on load */
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('bgmToggle')?.addEventListener('click', toggleBGM);
  syncTheme();
  syncBGMLabel();
});


/* ===== Zoom Gathering (minimal) ===== */
const EVENTS_KEY = "iyb_hw3_events_v1";
function loadEvents() { try { return JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]"); } catch (e) { return []; } }
function saveEvents(v) { localStorage.setItem(EVENTS_KEY, JSON.stringify(v || [])); }

function renderZoom() {
  const menu = document.getElementById('menu');
  const list = loadEvents().sort((a, b) => a.when.localeCompare(b.when));
  const items = list.map((e, i) => `
    <div class="ev-item">
      <div class="ev-title">${e.title}</div>
      <div class="ev-meta">${new Date(e.when).toLocaleString()} • ${e.host || 'host'} • <a href="${e.link}" target="_blank">Join</a></div>
      <div class="ev-note">${e.note || ''}</div>
      <div class="ev-actions">
        <button class="but hollow" onclick="copyText('${e.link.replace(/'/g, '&#39;')}')">Copy Link</button>
        <button class="but hollow" onclick="delEvent(${i})">Delete</button>
      </div>
    </div>
  `).join("") || `<p class="muted" style="text-align:center">No events yet.</p>`;

  menu.innerHTML = `
    <button class="home-but" onclick="go('home')">Home</button>
    <h3>Zoom Gathering</h3>
    <div class="ev-form">
      <input class="search-input" id="evTitle" placeholder="Title">
      <input class="search-input" id="evWhen" type="datetime-local">
      <input class="search-input" id="evLink" placeholder="Zoom/Meet link">
      <input class="search-input" id="evHost" placeholder="Host (optional)">
      <textarea class="comment-text" id="evNote" placeholder="Notes (optional)"></textarea>
      <button class="but" onclick="addEvent()">Add Event</button>
    </div>
    <h4 style="margin-top:12px">Upcoming</h4>
    <div class="ev-list">${items}</div>
  `;
}
function addEvent() {
  const title = (document.getElementById('evTitle').value || "").trim();
  const when = (document.getElementById('evWhen').value || "").trim();
  const link = (document.getElementById('evLink').value || "").trim();
  const host = (document.getElementById('evHost').value || "").trim();
  const note = (document.getElementById('evNote').value || "").trim();
  if (!title || !when || !link) return alert("Title, time, and link are required.");
  const list = loadEvents(); list.push({ title, when, link, host, note }); saveEvents(list); renderZoom();
}
function delEvent(i) {
  const list = loadEvents(); list.splice(i, 1); saveEvents(list); renderZoom();
}
function copyText(t) {
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t);
  alert("Copied!");
}


/* ==== Ensure extra buttons exist on Home menu ==== */
function ensureExtraButtons() {
  const menu = document.getElementById('menu');
  if (!menu) return;
  const txt = menu.innerHTML;
  // Only add when we're on the Home menu (Look/Memorabilia/Search/Post/Update/Share are present)
  const isHome = txt.includes("Look Around") && txt.includes("Share News");
  const hasZoom = txt.includes("Zoom Gathering");
  if (isHome && !hasZoom) {
    // 1. onclick 속성 값(')을 이스케이프 처리합니다.
    // 2. 닫는 태그의 슬래시(/)를 이스케이프 처리합니다.
    // 3. \s* (공백)을 올바르게 사용합니다.
    const regexPattern = /<button class="but" onclick="go\('share'\)">Share News<\/button>\s*<\/div>/;

    // 교체될 HTML
    const replacementHTML = `<button class="but" onclick="go('share')">Share News</button>
      <button class="but" onclick="renderZoom()">Zoom Gathering</button>
      <button class="but" onclick="go('exp3d')">3D Reenactment</button>
      <button class="but" onclick="openSettings()">Settings</button>
    </div>`;

    menu.innerHTML = txt.replace(regexPattern, replacementHTML);
  }
}

(function hookHome() {
  // If a global go() exists, wrap it so that after rendering 'home' we ensure buttons.
  const tryHook = () => {
    if (typeof window.go === 'function' && !window.go.__patched) {
      const _go = window.go;
      const wrapped = function (page) {
        const r = _go.apply(this, arguments);
        if (page === 'home') {
          // after the existing render flushes, fix buttons
          setTimeout(ensureExtraButtons, 0);
        }
        return r;
      };
      wrapped.__patched = true;
      window.go = wrapped;
      // also run once on load
      ensureExtraButtons();
    } else {
      // try again shortly; some apps define go later
      setTimeout(tryHook, 50);
    }
  };
  tryHook();
})();

// Run once at DOM ready as well
window.addEventListener('DOMContentLoaded', ensureExtraButtons);

/* === 3D Reenactment (Then/Now carousel) === */
let _angle3D = 0;
let _key3DHandler = null;

function _getRadius() {
  // 화면 폭의 32~35% 사이로 제한, 최소 140, 최대 320
  const w = Math.max(320, Math.min(window.innerWidth, 1200));
  return Math.max(140, Math.min(320, Math.floor(w * 0.34)));
}

function render3D() {
  const menu = document.getElementById('menu');

  // DATA.places에서 then/now 가진 항목만 사용
  const items = (DATA && DATA.places ? DATA.places : []).filter(p => p.then && p.now);
  if (!items.length) {
    menu.innerHTML = `
      <button class="home-but" onclick="go('home')">Home</button>
      <h3>3D Reenactment</h3>
      <p class="muted">then/now 이미지를 가진 place 항목이 없습니다. resource.txt에 추가해 주세요.</p>
    `;
    return;
  }

  const step = 360 / items.length;
  const R = _getRadius();                 // ← 고정값 대신 동적 반경
  const slides = items.map((p, idx) => `
  <div class="slide" style="transform: rotateY(${idx * step}deg) translateZ(${R}px)">
    <figure><img src="${p.then}" alt="${p.place || 'Then'} (then)"></figure>
    <figure><img src="${p.now}"  alt="${p.place || 'Now'} (now)"></figure>
  </div>
`).join("");

  menu.innerHTML = `
    <button class="home-but" onclick="go('home')">Home</button>
    <h3>3D Reenactment</h3>
    <div class="stage">
      <div id="carousel" class="carousel">${slides}</div>
    </div>
    <div class="ctrls">
      <button class="but" onclick="spin3D(-1)">⟵ Prev</button>
      <button class="but hollow" onclick="spin3D(1)">Next ⟶</button>
    </div>
    <p class="muted" style="text-align:center">Tip: ◀︎/▶︎ 키로 회전</p>
  `;

  _angle3D = 0;
  updateSpin3D(step);

  // 키보드 컨트롤
  _key3DHandler = (e) => {
    if (e.key === 'ArrowRight') spin3D(1, step);
    if (e.key === 'ArrowLeft') spin3D(-1, step);
  };
  document.addEventListener('keydown', _key3DHandler);
}

function spin3D(dir, step) {
  const items = (DATA && DATA.places ? DATA.places : []).filter(p => p.then && p.now);
  const st = step || (items.length ? 360 / items.length : 40);
  _angle3D += st * dir;
  updateSpin3D(st);
}

function updateSpin3D() {
  const car = document.getElementById('carousel');
  if (!car) return;
  const R = _getRadius();
  car.style.transform = `translateZ(-${R}px) rotateY(${_angle3D}deg)`;
}

// 페이지 전환 시 키보드 핸들러 정리
const __origGo = typeof go === 'function' ? go : null;
if (__origGo && !__origGo.__with3dcleanup) {
  const wrapped = function (page) {
    if (_key3DHandler && page !== 'exp3d') {
      document.removeEventListener('keydown', _key3DHandler);
      _key3DHandler = null;
    }
    return __origGo.apply(this, arguments);
  };
  wrapped.__with3dcleanup = true;
  go = wrapped;
}
window.addEventListener('resize', () => {
  if (document.getElementById('carousel')) {
    const keep = _angle3D;   // 현재 각도 유지
    render3D();
    _angle3D = keep;
    updateSpin3D();
  }
});


