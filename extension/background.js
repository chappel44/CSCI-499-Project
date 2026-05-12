const API_BASE = "http://localhost:3001";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "VERIFIND_SEARCH") {
    return false;
  }

  const params = new URLSearchParams({
    keyword: message.keyword || "",
    engines: message.engines || "",
  });

  fetch(`${API_BASE}/api/search?${params.toString()}`)
    .then(async (response) => {
      const data = await response.json().catch(() => ({}));
      sendResponse({
        ok: response.ok,
        status: response.status,
        data,
      });
    })
    .catch((error) => {
      sendResponse({
        ok: false,
        status: 0,
        error: error.message,
      });
    });

  return true;
});
