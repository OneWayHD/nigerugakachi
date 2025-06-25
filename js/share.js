// share.js：共有ボタンを自動生成して #share-buttons に挿入
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("share-buttons");
  if (!container) return;

  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.title);

  container.innerHTML = `
    <div class="share-section">
      <p class="share-label">📤 この記事を共有する</p>
      <div class="share-icons">
        <a href="https://twitter.com/share?url=${url}&text=${title}" target="_blank" title="Twitterで共有"><i class="fab fa-x-twitter"></i></a>
        <a href="https://social-plugins.line.me/lineit/share?url=${url}" target="_blank" title="LINEで送信"><i class="fab fa-line"></i></a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank" title="Facebookで共有"><i class="fab fa-facebook"></i></a>
        <a href="mailto:?subject=${title}&body=${url}" title="メールで送信"><i class="fas fa-envelope"></i></a>
        <button id="share-copy" title="リンクをコピー"><i class="fas fa-link"></i></button>
      </div>
    </div>
  `;

  const copyBtn = document.getElementById("share-copy");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert("リンクをコピーしました！"))
        .catch(() => alert("コピーに失敗しました"));
    });
  }
});
