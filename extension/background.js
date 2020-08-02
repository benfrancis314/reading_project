function toggleUI(tab) {
	chrome.tabs.sendMessage(tab.id, {command: "toggleUI"}, function(response) {});
}

chrome.browserAction.onClicked.addListener(toggleUI);

// For guide, see https://stackoverflow.com/a/61038472/4143394
chrome.runtime.onInstalled.addListener(function() {
	chrome.contextMenus.create({
	  "id": "sampleContextMenu",
	  "title": "ReaderEase",
      // For full list see
      // https://developer.chrome.com/extensions/contextMenus#types
	  "contexts": ["page", "selection"],
	});
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
	toggleUI(tab);
})