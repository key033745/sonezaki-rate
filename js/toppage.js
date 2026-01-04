//管理者項目にパスワードを設定//
async function authAndGo(event) {
    // 1. リンクをクリックした時の「すぐ移動する」動きを止める
    event.preventDefault();

    // 2. パスワードを入力してもらう
    const password = prompt("パスワードを入力してください");
    if (!password) return; // キャンセルされたら何もしない

    const gasUrl = "https://script.google.com/macros/s/AKfycbzct9JkpXhLXtRFRxve535FJl1tUG512w4V3-FCmh7DKclTcPrCrIrH54hEFo4UCzHOrg/exec";
    const targetUrl = event.currentTarget.href; // 本来の移動先URLを取得

    try {
        // 3. GASにパスワードをチェックしに行く
        const response = await fetch(gasUrl, {
            method: "POST",
            body: JSON.stringify({ password: password })// 入力されたパスワードを箱に入れて送る
        });
        const data = await response.json();

        if (data.result === "success") {
            // 4. 認証成功なら、本来の目的地へジャンプ！
            window.location.href = targetUrl;
        } else {
            alert("パスワードが正しくありません");
        }
    } catch (error) {
        alert("エラーが発生しました");
        console.error(error);
    }
}