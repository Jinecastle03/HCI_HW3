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



function go(page) {
  if (page === 'look') {
    const menu = document.getElementById('menu');
    menu.innerHTML = `
      <button class="but">Classmates</button>
      <button class="but">Teachers</button>
      <button class="but">Then and Now</button>
      <button class="home-but">Home</button>
    `;
  }
}