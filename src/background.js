const api = globalThis.browser ?? globalThis.chrome;
const isFirefoxStyleApi = typeof globalThis.browser !== "undefined";

const MENU_IDS = {
  markdown: "copy-markdown",
  org: "copy-org-link",
  frontmatter: "copy-frontmatter"
};

const ACTION_BY_MENU = {
  [MENU_IDS.markdown]: "copy-markdown",
  [MENU_IDS.org]: "copy-org",
  [MENU_IDS.frontmatter]: "copy-frontmatter"
};

async function removeAllMenus() {
  if (isFirefoxStyleApi) {
    await api.contextMenus.removeAll();
    return;
  }

  await new Promise((resolve) => {
    api.contextMenus.removeAll(() => resolve());
  });
}

async function createMenu(definition) {
  if (isFirefoxStyleApi) {
    await api.contextMenus.create(definition);
    return;
  }

  await new Promise((resolve) => {
    api.contextMenus.create(definition, () => resolve());
  });
}

async function createContextMenus() {
  await removeAllMenus();

  await createMenu({
    id: MENU_IDS.markdown,
    title: "Copy Markdown Link",
    contexts: ["page", "selection", "link"]
  });

  await createMenu({
    id: MENU_IDS.org,
    title: "Copy Org-mode Link",
    contexts: ["page", "selection", "link"]
  });

  await createMenu({
    id: MENU_IDS.frontmatter,
    title: "Copy Frontmatter Block",
    contexts: ["page", "selection", "link"]
  });
}

async function queryActiveTab() {
  if (isFirefoxStyleApi) {
    const tabs = await api.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
  }

  const tabs = await new Promise((resolve) => {
    api.tabs.query({ active: true, currentWindow: true }, resolve);
  });
  return tabs[0];
}

async function sendTabMessage(tabId, messageType, payload = {}) {
  const message = { type: messageType, ...payload };

  if (isFirefoxStyleApi) {
    return api.tabs.sendMessage(tabId, message);
  }

  return new Promise((resolve, reject) => {
    api.tabs.sendMessage(tabId, message, (response) => {
      if (api.runtime.lastError) {
        reject(new Error(api.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

async function runOnTab(tabId, actionType) {
  if (typeof tabId !== "number") {
    return { ok: false, error: "No active tab" };
  }

  try {
    const result = await sendTabMessage(tabId, actionType);
    return result || { ok: true };
  } catch (error) {
    const rawMessage = error?.message || "";
    const couldNotReachContentScript =
      rawMessage.includes("Receiving end does not exist") ||
      rawMessage.includes("message port closed before a response was received");

    if (couldNotReachContentScript) {
      return {
        ok: false,
        error: "This tab is not ready yet. Reload the page and try again."
      };
    }

    return { ok: false, error: rawMessage || "Failed to execute action" };
  }
}

async function showTabError(tabId, errorMessage) {
  if (typeof tabId !== "number") {
    return;
  }

  try {
    await sendTabMessage(tabId, "show-error", { error: errorMessage });
  } catch {
    // Nothing else to do if the tab cannot receive messages.
  }
}

api.runtime.onInstalled.addListener(() => {
  createContextMenus().catch(() => {});
});
api.runtime.onStartup?.addListener(() => {
  createContextMenus().catch(() => {});
});

api.contextMenus.onClicked.addListener((info, tab) => {
  const action = ACTION_BY_MENU[info.menuItemId];
  if (!action || !tab || typeof tab.id !== "number") {
    return;
  }

  runOnTab(tab.id, action)
    .then((result) => {
      if (!result?.ok) {
        return showTabError(tab.id, result?.error || "Action failed.");
      }
      return undefined;
    })
    .catch((error) => {
      showTabError(tab.id, error?.message || "Action failed.");
    });
});

api.commands.onCommand.addListener(async (command) => {
  const commandMap = {
    copy_markdown: "copy-markdown",
    copy_org_link: "copy-org",
    copy_frontmatter: "copy-frontmatter"
  };

  const action = commandMap[command];
  if (!action) {
    return;
  }

  const activeTab = await queryActiveTab();
  if (!activeTab || typeof activeTab.id !== "number") {
    return;
  }

  const result = await runOnTab(activeTab.id, action);
  if (!result?.ok) {
    await showTabError(activeTab.id, result?.error || "Action failed.");
  }
});

if (isFirefoxStyleApi) {
  api.runtime.onMessage.addListener(async (message) => {
    if (!message || !message.type) {
      return { ok: false };
    }

    const map = {
      "popup-copy-markdown": "build-markdown",
      "popup-copy-org": "build-org",
      "popup-copy-frontmatter": "build-frontmatter"
    };

    const action = map[message.type];
    if (!action) {
      return { ok: false };
    }

    const activeTab = await queryActiveTab();
    if (!activeTab || typeof activeTab.id !== "number") {
      return { ok: false, error: "No active tab" };
    }

    return runOnTab(activeTab.id, action);
  });
} else {
  api.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) {
      sendResponse({ ok: false });
      return;
    }

    const map = {
      "popup-copy-markdown": "build-markdown",
      "popup-copy-org": "build-org",
      "popup-copy-frontmatter": "build-frontmatter"
    };

    const action = map[message.type];
    if (!action) {
      sendResponse({ ok: false });
      return;
    }

    queryActiveTab()
      .then((activeTab) => {
        if (!activeTab || typeof activeTab.id !== "number") {
          sendResponse({ ok: false, error: "No active tab" });
          return;
        }

        runOnTab(activeTab.id, action)
          .then((result) => sendResponse(result))
          .catch((error) => sendResponse({ ok: false, error: error?.message }));
      })
      .catch((error) => sendResponse({ ok: false, error: error?.message }));

    return true;
  });
}
