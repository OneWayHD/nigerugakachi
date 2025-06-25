import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// ✅ Firestore インスタンス
const db = window.db;

// ✅ DOM要素取得
const form = document.querySelector("form");
const categorySelect = form.querySelector('select[name="category"]');
const titleInput = form.querySelector('input[name="title"]');
const nameInput = form.querySelector('input[name="name"]');
const bodyInput = form.querySelector('textarea[name="body"]');

// ✅ スレッド作成イベント
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // ✅ 投稿間隔制限（30秒ルール）
  const lastPostTime = localStorage.getItem("lastPostTime");
  const now = Date.now();
  if (lastPostTime && now - parseInt(lastPostTime, 10) < 30000) {
    alert("投稿の間隔が短すぎます。30秒以上空けてから投稿してください。");
    return;
  }

  const category = categorySelect.value;
  const title = titleInput.value.trim();
  const name = nameInput.value.trim() || "匿名";
  const body = bodyInput.value.trim();

  if (!category || !title || !body) {
    alert("カテゴリ、タイトル、本文はすべて入力してください。");
    return;
  }

  if (body.length < 5) {
    alert("本文は5文字以上で入力してください。");
    return;
  }

  try {
    // ✅ スレッド本体を作成
    const threadRef = await addDoc(collection(db, "threads"), {
      category,
      title,
      createdAt: serverTimestamp(),
      latestReplyAt: serverTimestamp(),
      replyCount: 1
    });

    // ✅ 初回投稿（本文）を登録
    await addDoc(collection(db, "threads", threadRef.id, "posts"), {
      name,
      content: body,
      createdAt: serverTimestamp(),
      deleted: false
    });

    // ✅ 投稿間隔を保存（ローカル）
    localStorage.setItem("lastPostTime", now.toString());

    // ✅ 投稿完了後、自動でそのスレッドへ遷移
    window.location.href = `bbs-thread.html?id=${threadRef.id}`;
  } catch (err) {
    console.error("スレッドの作成に失敗しました:", err);
    alert("スレッドの作成に失敗しました。時間をおいて再度お試しください。");
  }
});
