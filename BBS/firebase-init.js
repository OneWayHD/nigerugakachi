// Firebaseモジュールをインポート（CDN対応）
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js";

// Firebase構成情報（修正済み）
const firebaseConfig = {
  apiKey: "AIzaSyC6yt0JKbXQhQICiU3skCQYV3yBe7TrLNc",
  authDomain: "nigerugakachi-d39ed.firebaseapp.com",
  projectId: "nigerugakachi-d39ed",
  storageBucket: "nigerugakachi-d39ed.appspot.com", // ← ✅ 修正ポイント
  messagingSenderId: "61546555762",
  appId: "1:61546555762:web:e950e83c5608c0ef5455eb"
};

// Firebase 初期化
const app = initializeApp(firebaseConfig);

// FirestoreとStorageをグローバルにセット
window.db = getFirestore(app);
window.storage = getStorage(app);
