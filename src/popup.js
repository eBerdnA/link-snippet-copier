const api = globalThis.browser ?? globalThis.chrome;

async function trigger(action) {
  try {
    const response = await api.runtime.sendMessage({ type: action });
    if (!response?.ok) {
      alert(response?.error || "Action failed.");
    }
  } catch (error) {
    alert(error?.message || "Action failed");
  } finally {
    window.close();
  }
}

document.querySelectorAll("button[data-action]").forEach((button) => {
  button.addEventListener("click", () => {
    trigger(button.dataset.action);
  });
});
