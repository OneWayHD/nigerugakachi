import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// ✅ Firestoreインスタンス
const db = window.db;

// ✅ DOM取得
const threadList = document.getElementById("thread-list");
const categoryTabs = document.querySelectorAll(".category-tab");

// ✅ 選択中カテゴリ（初期値：上司・管理職）
let selectedCategory = "上司・管理職";

// ✅ スレッド読み込み処理（カテゴリ別）
async function loadThreadsByCategory(category) {
  threadList.innerHTML = "<p style='color:#64748b;'>スレッドを読み込んでいます...</p>";

  const threadsRef = collection(db, "threads");
  const q = query(
    threadsRef,
    where("category", "==", category),
    orderBy("latestReplyAt", "desc")
  );

  try {
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      threadList.innerHTML = "<p style='color:#64748b;'>このカテゴリにはまだスレッドがありません。</p>";
      return;
    }

    let html = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const id = doc.id;

      const title = data.title || "(タイトルなし)";
      const replyCount = data.replyCount ?? 0;
      const updatedAt = data.latestReplyAt?.toDate().toLocaleDateString("ja-JP") ?? "日付不明";

      html += `
        <li class="thread-item">
          <a href="bbs-thread.html?id=${id}">${title}</a>
          <div class="thread-meta">投稿数：${replyCount}　｜　最終更新：${updatedAt}</div>
        </li>
      `;
    });

    threadList.innerHTML = html;
  } catch (err) {
    console.error("🔥 スレッドの読み込みに失敗しました:", err);
    threadList.innerHTML = "<p style='color:red;'>スレッドの取得中にエラーが発生しました。</p>";
  }
}

// ✅ カテゴリタブ切り替えイベント
categoryTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    categoryTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    selectedCategory = tab.dataset.category;
    loadThreadsByCategory(selectedCategory);
  });
});

// ✅ 初期ロード（上司・管理職）
loadThreadsByCategory(selectedCategory);
