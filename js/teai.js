let allSheetData = [];

async function loadSheetData() {
  const gasUrl = "https://script.google.com/macros/s/AKfycbzct9JkpXhLXtRFRxve535FJl1tUG512w4V3-FCmh7DKclTcPrCrIrH54hEFo4UCzHOrg/exec";
  try {
    const response = await fetch(gasUrl);
    allSheetData = await response.json();
    
    // 1〜3のすべてのプルダウンに名前をセット
    for (let i = 1; i <= 3; i++) {
      const selA = document.getElementById(`name-a${i}`);
      const selB = document.getElementById(`name-b${i}`);
      allSheetData.slice(1).forEach(row => {
        selA.add(new Option(row[0], row[0]));
        selB.add(new Option(row[0], row[0]));
      });
    }
    document.getElementById('loader').style.display = "none";
    document.getElementById('search-area').style.display = "flex";
  } catch (e) { console.error(e); }
}

function compareRates(num) {
  const nameA = document.getElementById(`name-a${num}`).value;
  const nameB = document.getElementById(`name-b${num}`).value;
  const res = document.getElementById(`compare-result${num}`);

  if (!nameA || !nameB) { res.innerHTML = ""; return; }
  if (nameA === nameB) { res.innerHTML = "同一人物です"; return; }

  const rA = Number(allSheetData.find(r => r[0] === nameA)[1]);
  const rB = Number(allSheetData.find(r => r[0] === nameB)[1]);
  const diff = Math.abs(rA - rB);

  // ハンデ判定
  let h = "";
  if (diff <= 199) h = "平手";
  else if (diff <= 399) h = "後手番";
  else if (diff <= 599) h = "角落ち";
  else if (diff <= 799) h = "飛車落ち";
  else if (diff <= 999) h = "飛車香落ち";
  else if (diff <= 1199) h = "2枚落ち";
  else h = "4枚落ち";

  // compareRates関数の結果出力部分
  res.innerHTML = `
    <div class="res-line">
        <span>▲ ${nameA} <small style="font-size:0.8em;">(${rA})</small></span>
        ${rA > rB && h !== "平手" ? `<span class="handicap-text">${h}</span>` : ""}
    </div>
    <div class="res-line">
        <span>△ ${nameB} <small style="font-size:0.8em;">(${rB})</small></span>
        ${rB > rA && h !== "平手" ? `<span class="handicap-text">${h}</span>` : ""}
    </div>
    <div class="diff-info">差: ${diff} ／ 判定: <strong>${h}</strong></div>
  `;

}

document.addEventListener('DOMContentLoaded', loadSheetData);