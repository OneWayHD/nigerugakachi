import {
  getFirestore,
  collectionGroup,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// ✅ Firebase接続
const db = window.db;

// ✅ 管理者チェック（将来Auth連携可）
const isAdmin = true;

if (!isAdmin) {
  alert("アクセスが拒否されました（管理者専用ページ）");
  document.body.innerHTML = "<h2 style='text-align:center;color:#ef4444;'>アクセス拒否</h2>";
  throw new Error("管理者以外のアクセスは禁止されています。");
}

const container = document.getElementById("reported-posts");

async function loadReportedPosts() {
  try {
    const snapshot = await getDocs(collectionGroup(db, "posts"));
    let found = 0;

    console.log("🔍 投稿総数:", snapshot.size);

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const parentPath = docSnap.ref.parent.parent.path; // threads/{threadId}
      const postId = docSnap.id;

      // ✅ 通報済み && 未削除の投稿のみ表示
      if (data.reported === true && data.deleted !== true) {
        found++;

        const card = document.createElement("div");
        card.className = "card";

        const name = data.name || "匿名";
        const time = data.createdAt?.toDate().toLocaleString("ja-JP") || "日時不明";
        const content = data.content || "";

        card.innerHTML = `
          <div class="card-header">🧑 ${name}</div>
          <div class="card-time">📅 ${time}</div>
          <div class="card-content">📝 ${content}</div>
          <button data-thread="${parentPath}" data-post="${postId}">🗑 投稿を削除する</button>
        `;

        card.querySelector("button").addEventListener("click", async () => {
          const confirmDelete = confirm("この投稿を削除してもよろしいですか？");
          if (!confirmDelete) return;

          try {
            await updateDoc(doc(db, `${parentPath}/posts`, postId), {
              deleted: true
            });
            alert("投稿を削除しました。");
            card.remove();
          } catch (err) {
            console.error("削除失敗:", err);
            alert("削除に失敗しました。時間をおいて再試行してください。");
          }
        });

        container.appendChild(card);
      }
    });

    if (found === 0) {
      container.innerHTML = "<p style='text-align:center; color:#64748b;'>通報された投稿は見つかりませんでした。</p>";
    }

  } catch (err) {
    console.error("通報投稿の読み込み失敗:", err);
    container.innerHTML = "<p style='color:red;'>投稿の読み込み中にエラーが発生しました。</p>";
  }
}

loadReportedPosts();
