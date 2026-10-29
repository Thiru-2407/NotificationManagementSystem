(() => {
  const version = (document.body.dataset.version || "v3").toLowerCase();
  const form = document.getElementById("notification-form");
  const titleInput = document.getElementById("title");
  const messageInput = document.getElementById("message");
  const feedback = document.getElementById("form-feedback");
  const list = document.getElementById("notification-list");
  const toast = document.getElementById("toast");
  let toastTimer;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[ch]);
  }
  function formatDate(value) {
    try {
      const date = new Date(value);
      return new Intl.DateTimeFormat(undefined, {month:"short", day:"numeric", hour:"numeric", minute:"2-digit"}).format(date);
    } catch (_) { return "Just now"; }
  }
  function updateCounter(input, output, max) {
    if (input && output) output.textContent = `${input.value.length} / ${max}`;
  }
  titleInput?.addEventListener("input", () => updateCounter(titleInput, document.getElementById("title-counter"), 100));
  messageInput?.addEventListener("input", () => updateCounter(messageInput, document.getElementById("message-counter"), 2000));

  function renderItems(items) {
    if (!list) return;
    const count = items.length;
    const statCount = document.getElementById("stat-count");
    const sidebarCount = document.getElementById("sidebar-count");
    const listTotal = document.getElementById("list-total");
    if (statCount) statCount.textContent = count;
    if (sidebarCount) sidebarCount.textContent = count;
    if (listTotal) listTotal.textContent = `${count} ${count === 1 ? "item" : "items"}`;
    if (!count) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">✳</div><strong>No notifications yet</strong><p>Your notifications will appear here after you create one.</p></div>`;
      return;
    }
    list.innerHTML = items.map(item => {
      const category = String(item.category || "General");
      const catClass = category.toLowerCase();
      const deleteAction = version === "v3"
        ? `<button class="delete-button" type="button" data-delete="${Number(item.id)}" aria-label="Delete ${escapeHtml(item.title)}">Delete ×</button>` : "";
      return `<article class="notification-item">
        <div class="notification-item-top"><span class="category-dot ${escapeHtml(catClass)}"></span><h3>${escapeHtml(item.title)}</h3><time class="notification-time">${escapeHtml(formatDate(item.created_at))}</time></div>
        <p class="notification-message">${escapeHtml(item.message)}</p>
        <div class="notification-bottom"><span class="category-label">${escapeHtml(category)}</span>${deleteAction}</div>
      </article>`;
    }).join("");
  }
  async function loadItems() {
    if (!list) return;
    try {
      const response = await fetch("/api/notifications", {headers: {"Accept":"application/json"}});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load notifications.");
      renderItems(data);
    } catch (error) {
      list.innerHTML = `<div class="empty-state"><strong>Could not load notifications</strong><p>${escapeHtml(error.message)} Try refreshing the page.</p></div>`;
    }
  }
  if (list) {
    loadItems();
    document.getElementById("refresh-button")?.addEventListener("click", loadItems);
    list.addEventListener("click", async event => {
      const button = event.target.closest("[data-delete]");
      if (!button) return;
      const id = button.dataset.delete;
      const title = button.closest(".notification-item")?.querySelector("h3")?.textContent || "this notification";
      if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
      button.disabled = true;
      try {
        const response = await fetch(`/api/notifications/${encodeURIComponent(id)}`, {method:"DELETE"});
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Delete failed.");
        showToast("Notification deleted.");
        await loadItems();
      } catch (error) {
        showToast(error.message);
        button.disabled = false;
      }
    });
  }
  form?.addEventListener("submit", async event => {
    event.preventDefault();
    feedback.textContent = "";
    feedback.classList.remove("error");
    const button = form.querySelector("button[type=submit]");
    const original = button.innerHTML;
    button.disabled = true;
    button.innerHTML = "<span>Saving…</span>";
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {"Content-Type":"application/json", "Accept":"application/json"},
        body: JSON.stringify({
          title: titleInput.value.trim(),
          message: messageInput.value.trim(),
          category: document.getElementById("category").value
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save notification.");
      form.reset();
      updateCounter(titleInput, document.getElementById("title-counter"), 100);
      updateCounter(messageInput, document.getElementById("message-counter"), 2000);
      feedback.textContent = "✓ Notification saved successfully.";
      showToast("Your notification has been saved.");
      if (list) await loadItems();
    } catch (error) {
      feedback.textContent = error.message;
      feedback.classList.add("error");
    } finally {
      button.disabled = false;
      button.innerHTML = original;
    }
  });
})();