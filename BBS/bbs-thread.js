import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js";

const db = window.db;
const storage = window.storage;

const titleEl = document.getElementById("thread-title");
const postList = document.getElementById("posts");
const replyForm = document.getElementById("reply-form");
const replyTextarea = replyForm?.content;
const imageInput = document.getElementById("imageInput");
const categoryLabel = document.getElementById("thread-category-label");

const params = new URLSearchParams(location.search);
const threadId = params.get("id");

function linkifyAnchors(content) {
  return content.replace(/&gt;&gt;(\d+)/g, (match, num) => {
    return `<a href="#post-${num}" class="anchor-link">&gt;&gt;${num}</a>`;
  });
}

async function loadThread(retry = 0) {
  if (!threadId) {
    titleEl.innerText = "❌ スレッドIDが指定されていません。";
    return;
  }

  try {
    const threadRef = doc(db, "threads", threadId);
    const threadSnap = await getDoc(threadRef);

    if (!threadSnap.exists()) {
      if (retry < 3) {
        return setTimeout(() => loadThread(retry + 1), 500);
      } else {
        titleEl.innerText = "❌ 該当スレッドが見つかりません。";
        return;
      }
    }

    const threadData = threadSnap.data();
    const category = threadData.category || "未分類";

    const classMap = {
      "上司・管理職": "category-上司・管理職",
      "先生・講師": "category-先生・講師",
      "コーチ・指導者": "category-コーチ・指導者"
    };
    const cssClass = classMap[category] || "";
    if (categoryLabel) {
      categoryLabel.innerHTML = `<span class="category-label ${cssClass}">${category}</span>`;
    }

    titleEl.innerText = threadData.title || "(タイトルなし)";

    const postsRef = collection(db, "threads", threadId, "posts");
    const q = query(postsRef, orderBy("createdAt", "asc"));
    const postSnap = await getDocs(q);

    if (postSnap.empty) {
      postList.innerHTML = "<li>まだ投稿がありません。</li>";
      return;
    }

    let html = "";
    let index = 1;

    postSnap.forEach(docSnap => {
      const data = docSnap.data();
      const postId = docSnap.id;
      if (data.deleted === true) return;

      const name = data.name || "匿名";
      const time = data.createdAt?.toDate().toLocaleString("ja-JP") ?? "不明な時間";
      const isReported = data.reported === true;
      const rawContent = data.content || "";
      const escapedContent = rawContent
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");
      const linkedContent = linkifyAnchors(escapedContent);

      const contentHtml = isReported
        ? `<div class="post-content" style="color:#9ca3af;">⚠ この投稿は通報されています。<br><span style="font-style: italic;">${linkedContent}</span></div>`
        : `<div class="post-content">${linkedContent}</div>`;

      const imageHtml = data.imageUrl
        ? `<img src="${data.imageUrl}" class="post-image" alt="添付画像" />`
        : "";

      const topRightButtons = `
        <div class="post-buttons-top-right">
          <button class="reply-btn" data-number="${index}">返信</button>
          <button class="delete-btn" data-id="${postId}">削除</button>
          <button class="report-btn" data-id="${postId}">通報</button>
        </div>
      `;

      const bottomLeftButtons = `
        <div class="post-buttons-bottom-left">
          <button class="like-btn" data-id="${postId}">👍 ${data.likes || 0}</button>
        </div>
      `;

      html += `
        <li class="post" id="post-${index}" data-id="${postId}">
          ${topRightButtons}
          <div class="post-header">
            <span class="poster-name">#${index} ${name}</span>
            <span class="post-date">${time}</span>
          </div>
          ${contentHtml}
          ${imageHtml}
          ${bottomLeftButtons}
        </li>
      `;
      index++;
    });

    postList.innerHTML = html;

    document.querySelectorAll(".report-btn").forEach(button => {
      button.addEventListener("click", async () => {
        const postId = button.dataset.id;
        const postRef = doc(db, "threads", threadId, "posts", postId);
        try {
          await updateDoc(postRef, { reported: true });
          alert("通報しました。ご協力ありがとうございます。");
          location.reload();
        } catch {
          alert("通報に失敗しました。しばらくして再試行してください。");
        }
      });
    });

    document.querySelectorAll(".delete-btn").forEach(button => {
      button.addEventListener("click", async () => {
        const postId = button.dataset.id;
        if (!confirm("この投稿を削除してもよろしいですか？")) return;
        const postRef = doc(db, "threads", threadId, "posts", postId);
        await updateDoc(postRef, { deleted: true });
        alert("投稿を削除しました。");
        location.reload();
      });
    });

    document.querySelectorAll(".reply-btn").forEach(button => {
      button.addEventListener("click", () => {
        const number = button.dataset.number;
        const current = replyTextarea.value;
        if (!current.includes(`>>${number}`)) {
          replyTextarea.value = `>>${number}\n` + current;
        }
        replyTextarea.focus();
      });
    });

    document.querySelectorAll(".like-btn").forEach(button => {
      button.addEventListener("click", async () => {
        const postId = button.dataset.id;
        const postRef = doc(db, "threads", threadId, "posts", postId);
        try {
          await updateDoc(postRef, { likes: increment(1) });
          location.reload();
        } catch {
          alert("いいねに失敗しました。再試行してください。");
        }
      });
    });

  } catch (err) {
    console.error("❌ スレッド読み込み失敗:", err);
    titleEl.innerText = "❌ スレッドの読み込み中にエラーが発生しました。";
  }
}

loadThread();

if (replyForm) {
  replyForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const last = localStorage.getItem("lastPostTime");
    const now = Date.now();
    if (last && now - parseInt(last, 10) < 30000) {
      alert("投稿間隔が短すぎます。30秒以上空けて再投稿してください。");
      return;
    }

    const name = replyForm.name.value.trim() || "匿名";
    const content = replyForm.content.value.trim();
    const imageFile = imageInput?.files?.[0];
    if (!content || content.length < 5) {
      alert("本文は5文字以上で入力してください。");
      return;
    }

    let imageUrl = null;
    try {
      if (imageFile) {
        const ref = storageRef(storage, `post_images/${Date.now()}_${imageFile.name}`);
        const snap = await uploadBytes(ref, imageFile);
        imageUrl = await getDownloadURL(snap.ref);
      }

      await addDoc(collection(db, "threads", threadId, "posts"), {
        name,
        content,
        imageUrl: imageUrl || null,
        createdAt: serverTimestamp(),
        deleted: false,
        reported: false,
        likes: 0
      });

      await updateDoc(doc(db, "threads", threadId), {
        latestReplyAt: serverTimestamp(),
        replyCount: increment(1)
      });

      localStorage.setItem("lastPostTime", now.toString());
      location.reload();
    } catch {
      alert("返信の投稿に失敗しました。再試行してください。");
    }
  });
}
