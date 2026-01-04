let allSheetData = []; 

document.addEventListener('DOMContentLoaded', loadSheetData);

async function loadSheetData() {
    const gasUrl = "https://script.google.com/macros/s/AKfycbzct9JkpXhLXtRFRxve535FJl1tUG512w4V3-FCmh7DKclTcPrCrIrH54hEFo4UCzHOrg/exec";
    
    const loader = document.getElementById('loader');
    const content = document.getElementById('content');

    try {
        const response = await fetch(gasUrl);
        const data = await response.json(); 
        allSheetData = data; 

        const headArea = document.getElementById('table-head');
        const bodyArea = document.getElementById('table-body');

        if (headArea && bodyArea) {
            headArea.innerHTML = "";
            bodyArea.innerHTML = "";

            // 1. 見出しの作成
            data[0].forEach(columnName => {
                const th = document.createElement('th');
                th.textContent = columnName;
                headArea.appendChild(th);
            });

            // --- 2. データの並び替え (ソート処理) ---
            // 見出し(0番目)を除いたコピーを作成し、レート(1番目)で降順ソート
            const sortedRows = data.slice(1).sort((a, b) => {
                const rateA = Number(a[1]) || 0;
                const rateB = Number(b[1]) || 0;
                return rateB - rateA; // 降順 (高い順)
            });

            // 3. ソート済みの中身作成
            sortedRows.forEach(row => {
                const tr = document.createElement('tr');
                row.forEach(cellValue => {
                    const td = document.createElement('td');
                    td.textContent = cellValue;
                    tr.appendChild(td);
                });
                bodyArea.appendChild(tr);
            });
        }

        if (loader) loader.style.display = "none";
        if (content) content.style.display = "block";

    } catch (error) {
        console.error("読み込みエラー:", error);
        if (loader) loader.innerHTML = "<p>エラーが発生しました。</p>";
    }
}