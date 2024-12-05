function toggleUI(tab) {
	chrome.tabs.sendMessage(tab.id, {command: "toggleUI"}, function(response) {});
}

chrome.action.onClicked.addListener(toggleUI);

// For guide, see https://stackoverflow.com/a/61038472/4143394
chrome.runtime.onInstalled.addListener(function() {
	chrome.contextMenus.create({
	  "id": "sampleContextMenu",
	  "title": "ReaderEase",
      // For full list see
      // https://developer.chrome.com/extensions/contextMenus#types
	  "contexts": ["page", "selection"],
	});


    // Redirect user to a demo page, and auto-start the app there.
	let demoUrl = 'https://en.wikipedia.org/wiki/Reading';
	chrome.tabs.create({
	    url: demoUrl,
	    active: true
	}, function(tab) {
        const tabId = tab.id;

        // Wait for the tab to fully load before starting the tutorial
        chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo) {
            if (updatedTabId === tabId && changeInfo.status === "complete") {
                // Remove the listener because otherwise this will get triggered for every page update.
                chrome.tabs.onUpdated.removeListener(listener);
                chrome.tabs.sendMessage(tabId, { command: "startTutorial" }, function() {
                    chrome.tabs.sendMessage(tabId, { command: "toggleUITutorial" }, function() {});
                });
            }
        });
	});
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
    toggleUI(tab);
})

// Take user to survey after uninstall
// Currently disabled because the website is no longer maintained.
// chrome.runtime.setUninstallURL("https://www.readerease.com/uninstall");