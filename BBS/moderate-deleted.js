import {
  getFirestore,
  collectionGroup,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// ✅ Firestore インスタンス
const db = window.db;

// ✅ HTML表示先
const container = document.getElementById("deleted-posts");

// ✅ 削除済み投稿を読み込む
async function loadDeletedPosts() {
  try {
    const snapshot = await getDocs(collectionGroup(db, "posts"));
    let found = 0;

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const parentPath = docSnap.ref.parent.parent.path; // threads/{threadId}
      const postId = docSnap.id;

      if (data.deleted === true) {
        found++;

        const name = data.name || "匿名";
        const time = data.createdAt?.toDate().toLocaleString("ja-JP") || "日時不明";
        const content = data.content || "";

        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
          <div class="card-header">🧑 ${name}</div>
          <div class="card-time">🕓 ${time}</div>
          <div class="card-content">📝 ${content}</div>
          <div class="card-thread">📌 パス: <code>${parentPath}/posts/${postId}</code></div>
          <button class="restore-button" data-thread="${parentPath}" data-id="${postId}" style="
            margin-top: 10px;
            background-color: #22c55e;
            color: white;
            padding: 6px 12px;
            font-size: 14px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">🔁 投稿を復元する</button>
        `;

        container.appendChild(card);
      }
    });

    if (found === 0) {
      container.innerHTML = "<p style='text-align:center; color:#64748b;'>削除された投稿は見つかりませんでした。</p>";
    }

    // ✅ 投稿の復元ボタン処理
    const restoreButtons = document.querySelectorAll(".restore-button");
    restoreButtons.forEach(button => {
      button.addEventListener("click", async () => {
        const threadPath = button.dataset.thread;
        const postId = button.dataset.id;

        const confirmRestore = confirm("この投稿を復元しますか？");
        if (!confirmRestore) return;

        const postRef = doc(db, `${threadPath}/posts`, postId);
        try {
          await updateDoc(postRef, { deleted: false });
          alert("投稿を復元しました。");
          location.reload();
        } catch (err) {
          console.error("復元エラー:", err);
          alert("復元に失敗しました。時間をおいて再試行してください。");
        }
      });
    });

  } catch (err) {
    console.error("❌ 投稿の読み込みエラー:", err);
    container.innerHTML = "<p style='color:red;'>削除された投稿の読み込み中にエラーが発生しました。</p>";
  }
}

loadDeletedPosts();
