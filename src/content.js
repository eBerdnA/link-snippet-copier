const api = globalThis.browser ?? globalThis.chrome;

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(() => true);
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return Promise.resolve(document.execCommand("copy"));
  } catch {
    return Promise.resolve(false);
  } finally {
    document.body.removeChild(textarea);
  }
}

function snippetMarkdown() {
  const titleEl = document.getElementsByTagName("title")[0];
  const title = titleEl ? titleEl.innerHTML : document.title;
  const copyTextValue = `[${title}](${location.href})`;
  return copyText(copyTextValue).then((ok) => {
    if (!ok) {
      return { ok: false, error: "Could not copy Markdown link to clipboard." };
    }
    return { ok: true };
  });
}

function snippetOrgLink() {
  const pickText = (selector) => {
    const el = document.querySelector(selector);
    return ((el && (el.content || el.textContent)) || "").trim();
  };

  const url = location.href;
  let docTitle =
    (document.title || "").trim() ||
    pickText('meta[property="og:title"]') ||
    pickText("h1") ||
    location.hostname;

  docTitle = docTitle.replace(/\s+/g, " ").trim();
  const orgText = `[[${url}][${docTitle}]]`;

  return copyText(orgText).then((ok) => {
    if (!ok) {
      return { ok: false, error: "Could not copy Org-mode link to clipboard." };
    }
    return { ok: true };
  });
}

function snippetFrontmatter() {
  const pad = (n) => String(n).padStart(2, "0");
  const formatDate = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

  const title = document.title || "";
  const url = location.href;
  const now = new Date();
  const stamp = formatDate(now);
  const output = `:Title: ${title}\n:Created: ${stamp}\n:Date: ${stamp}\n:Type: link\n:Language: en\n:Published: true\n:Tags: \n:Original_url: ${url}`;

  return copyText(output).then((ok) => {
    if (!ok) {
      return { ok: false, error: "Could not copy frontmatter block to clipboard." };
    }
    return { ok: true };
  });
}

api.runtime.onMessage.addListener((message) => {
  if (!message || !message.type) {
    return Promise.resolve({ ok: false });
  }

  if (message.type === "copy-markdown") {
    return snippetMarkdown();
  }

  if (message.type === "copy-org") {
    return snippetOrgLink();
  }

  if (message.type === "copy-frontmatter") {
    return snippetFrontmatter();
  }

  if (message.type === "show-error") {
    const errorMessage = message.error || "Action failed.";
    alert(`Link Snippet Copier: ${errorMessage}`);
    return Promise.resolve({ ok: true });
  }

  return Promise.resolve({ ok: false });
});
