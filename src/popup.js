const api = globalThis.browser ?? globalThis.chrome;

async function trigger(action) {
  try {
    const response = await api.runtime.sendMessage({ type: action });
    if (!response?.ok) {
      alert(response?.error || "Action failed.");
      return;
    }

    if (typeof response.text !== "string") {
      alert("No snippet was returned.");
      return;
    }

    await navigator.clipboard.writeText(response.text);
  } catch (error) {
    const message = error?.message || "Action failed";
    if (
      message.includes("Receiving end does not exist") ||
      message.includes("message port closed before a response was received")
    ) {
      alert("This tab is not ready yet. Reload the page and try again.");
      return;
    }
    alert(message);
  } finally {
    window.close();
  }
}

document.querySelectorAll("button[data-action]").forEach((button) => {
  button.addEventListener("click", () => {
    trigger(button.dataset.action);
  });
});
