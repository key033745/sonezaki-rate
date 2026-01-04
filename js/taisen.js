let allSheetData = [];
let globalPassword = ""; 
const gasUrl = "https://script.google.com/macros/s/AKfycbzct9JkpXhLXtRFRxve535FJl1tUG512w4V3-FCmh7DKclTcPrCrIrH54hEFo4UCzHOrg/exec";
const AUTH_EXPIRY = 6 * 60 * 60 * 1000;
const MAX_GAMES = 5;

document.addEventListener('DOMContentLoaded', async () => {
    // 認証処理（前回と同じ）
    const now = new Date().getTime();
    const savedAuth = localStorage.getItem('sonezaki_auth');
    if (savedAuth) {
        const authData = JSON.parse(savedAuth);
        if (now - authData.time < AUTH_EXPIRY) {
            globalPassword = authData.password;
            loadTaisenData();
            return;
        }
    }
    await authenticateByGas();
});

async function loadTaisenData() {
    const loader = document.getElementById('loader');
    const inputArea = document.getElementById('input-area');
    try {
        const response = await fetch(gasUrl);
        allSheetData = await response.json();
        
        createGameInputs(); // 5行分の入力欄を作成
        loader.style.display = "none";
        inputArea.style.display = "block";
    } catch (e) {
        loader.textContent = "データの読み込みに失敗しました。";
    }
}

// 5行分の入力UIを生成
function createGameInputs() {
    const container = document.getElementById('games-container');
    container.innerHTML = "";
    for (let i = 0; i < MAX_GAMES; i++) {
        const row = document.createElement('div');
        row.className = "game-row";
        row.style = "display: flex; gap: 5px; align-items: center; margin-bottom: 4px; background: #fdfaf0; border-radius: 4px; padding: 2px 5px; border: 1px solid #dcd7c0;";
        
        row.innerHTML = `
            <span style="font-size: 10px; color: #8b4513; width: 12px;">${i+1}</span>
            <select class="win-sel" onchange="calculateNewRates()" style="flex: 1; min-width: 0; border: 1px solid blue;">
                <option value="">勝者</option>
            </select>
            <span style="font-size: 10px;">vs</span>
            <select class="lose-sel" onchange="calculateNewRates()" style="flex: 1; min-width: 0; border: 1px solid red;">
                <option value="">敗者</option>
            </select>
        `;
        container.appendChild(row);

        // プルダウンの生成（中身は以前と同じ）
        const winSel = row.querySelector('.win-sel');
        const loseSel = row.querySelector('.lose-sel');
        allSheetData.slice(1).forEach(r => {
            if(r[0]) {
                winSel.add(new Option(r[0], r[0]));
                loseSel.add(new Option(r[0], r[0]));
            }
        });
    }
}

function calculateNewRates() {
    const winSels = document.querySelectorAll('.win-sel');
    const loseSels = document.querySelectorAll('.lose-sel');
    const preview = document.getElementById('update-preview');
    let games = [];
    let playersInvolved = new Set();
    let hasDuplicate = false;

    for (let i = 0; i < MAX_GAMES; i++) {
        const w = winSels[i].value;
        const l = loseSels[i].value;
        if (!w && !l) continue;
        if (w === l || playersInvolved.has(w) || playersInvolved.has(l)) {
            hasDuplicate = true;
        }
        if (w) playersInvolved.add(w);
        if (l) playersInvolved.add(l);
        if (w && l) {
            games.push({ winner: w, loser: l });
        }
    }

    if (hasDuplicate) {
        preview.innerHTML = `<div style="color:red; text-align:center; font-weight:bold; font-size:12px;">警告：重複があります</div>`;
        window.pendingGames = null;
        return;
    }

    if (games.length === 0) {
        preview.innerHTML = `<div style="color:#888; text-align:center; font-size:11px;">対局者を選択してください</div>`;
        window.pendingGames = null;
        return;
    }

    let html = `<div style="font-size:11px; line-height:1.4;">`;
    let pendingResults = [];

    games.forEach((game, idx) => {
        const winData = allSheetData.find(r => r[0] === game.winner);
        const loseData = allSheetData.find(r => r[0] === game.loser);
        const rWin = Number(winData[1]);
        const rLose = Number(loseData[1]);

        // --- ハンデキャップ計算ロジック ---
        let diff = Math.abs(rWin - rLose);
        let handicap = 0;

        if (diff >= 200 && diff <= 399) handicap = 100;
        else if (diff >= 400 && diff <= 599) handicap = 300;
        else if (diff >= 600 && diff <= 799) handicap = 500;
        else if (diff >= 800 && diff <= 999) handicap = 700;
        else if (diff >= 1000 && diff <= 1199) handicap = 900;
        else if (diff >= 1200) handicap = 1100;

        // レートが低い方にハンデを加算
        let adjWin = rWin;
        let adjLose = rLose;
        if (rWin < rLose) adjWin += handicap;
        else if (rLose < rWin) adjLose += handicap;

        // 補正後のレート差をチェック
        let adjDiff = Math.abs(adjWin - adjLose);
        let move = 0;

        if (adjDiff < 400) {
            const K = 24;
            const expected = 1 / (1 + Math.pow(10, (adjLose - adjWin) / 400));
            move = Math.round(K * (1 - expected));
        } else {
            // 補正後も差が400以上の場合は変動なし
            move = 0;
        }

        const winColor = move === 0 ? "#666" : "blue";
        const loseColor = move === 0 ? "#666" : "red";
        const statusNote = move === 0 ? " <span style='color:orange;'>(差400超/無効)</span>" : "";

        html += `<div style="border-bottom:1px solid #eee; padding:2px 0;">
            [${idx+1}] <b>${game.winner}</b>(${rWin}) ➔ <span style="color:${winColor}; font-weight:bold;">${rWin+move}</span><br>
            　 <b>${game.loser}</b>(${rLose}) ➔ <span style="color:${loseColor}; font-weight:bold;">${rLose-move}</span>${statusNote}
        </div>`;
        
        pendingResults.push({
            winner: game.winner,
            loser: game.loser,
            newWinRate: rWin + move,
            newLoseRate: rLose - move,
            move: move
        });
    });

    html += `</div>`;
    preview.innerHTML = html;
    window.pendingGames = pendingResults;
}

async function sendToSheet() {
    if (!window.pendingGames || window.pendingGames.length === 0) return;
    if (!confirm(`${window.pendingGames.length}件の対局結果を更新しますか？`)) return;

    const btn = document.getElementById('submit-btn');
    const msg = document.getElementById('status-msg');
    btn.disabled = true;
    msg.textContent = "一括更新中...";

    try {
        const response = await fetch(gasUrl, {
            method: "POST",
            body: JSON.stringify({
                type: "bulk_update",
                password: globalPassword,
                games: window.pendingGames
            })
        });
        const result = await response.json();

        if (result.status === "success") {
            msg.style.color = "blue";
            msg.textContent = "全件更新完了しました。";
            setTimeout(() => location.reload(), 1500);
        } else {
            alert(result.message);
            btn.disabled = false;
        }
    } catch (e) {
        msg.textContent = "通信エラーが発生しました。";
        btn.disabled = false;
    }
}