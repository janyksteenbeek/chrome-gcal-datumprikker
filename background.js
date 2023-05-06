chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "getAuthToken") {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        sendResponse(token);
      });
      return true; // Need to return true to indicate that we're sending a response asynchronously
    }
  });
  