/***** 1) 전역 상태 *****/
let DATA = { classmates: [], teachers: [], places: [] };

/***** 2) CSV 파서 (따옴표/콤마 대응, BOM 제거) *****/
function parseCSV(text) {
  // UTF-8 BOM 제거 + 개행 정리
  text = String(text || "").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
  const lines = text.split("\n").filter(s => s.trim().length > 0);
  if (!lines.length) return [];

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
  // 통합 스키마(type 컬럼)도 되고, 단일 classmates CSV도 되게 처리
  const hasType = header.includes("type");
  const norm = (k) => k in header ? k : null;

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
        now:  r.now  ? `pics/${r.now}`  : ""
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
    console.log("resource.txt 내용:", text); // 1. 파일 내용 확인

    const parsed = parseCSV(text);
    console.log("parseCSV 결과:", parsed); // 2. 파싱 결과 확인

    buildDataStructures(parsed);
    console.log("DATA 구조:", DATA); // 3. 내부 구조 확인
    
    console.log("resource.txt loaded ✔");
  } catch (err) {
    console.warn("autoLoadResource failed:", err);
    alert("resource.txt 자동 읽기에 실패했습니다.");
  }
}

/***** 5) 페이지 로드시 자동 실행 *****/
window.addEventListener("DOMContentLoaded", autoLoadResource);



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
  let html = `
    <button class="home-but" onclick="go('home')">Home</button>
  `;
  DATA.places.forEach(place => {
    html += `
      <div style="margin:20px 0;">
        <div style="display:flex; gap:10px; justify-content:center;">
          <img src="${place.then}" alt="Then" style="width:180px; height:120px; object-fit:cover; border:1px solid #ccc;">
          <img src="${place.now}" alt="Now" style="width:180px; height:120px; object-fit:cover; border:1px solid #ccc;">
        </div>
        <div style="text-align:center; font-size:22px; margin-top:8px;">${place.place}</div>
      </div>
    `;
  });
  menu.innerHTML = html;
}

function renderClassmates() {
  const menu = document.getElementById('menu');
  let html = `
    <button class="home-but" style="float:right;" onclick="go('home')">Home</button>
    <h3 style="text-align:center; margin-top:40px;">Classmates</h3>
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
  menu.innerHTML = html;
}

function renderTeachers() {
  const menu = document.getElementById('menu');
  let html = `
    <button class="home-but" style="float:right;" onclick="go('home')">Home</button>
    <h3 style="text-align:center; margin-top:40px;">Teachers</h3>
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
  } else {
    // 필요시 다른 메뉴 구현
  }
}

// 최초 로드시 메인 메뉴 보이게
window.addEventListener("DOMContentLoaded", () => {
  autoLoadResource();
  renderMainMenu();
});