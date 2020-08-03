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

chrome.runtime.onInstalled.addListener(function() {

	// Redirect user to a demo page, and auto-start the app there.
	// TODO: Is this a good page for users to play around w/ the app?
	let demoUrl = 'https://en.wikipedia.org/wiki/Language';
	chrome.tabs.create({
	    url: demoUrl,
	    active: true
	}, function(tab) {
		chrome.tabs.sendMessage(tab.id, {command: "toggleUI"}, function(response) {});
	});

	// Creates a new window tutorial window.
	// TODO: Fill welcome_popup.html with pretty content. 
	chrome.tabs.create({
        url: chrome.extension.getURL('welcome_popup.html'),
        active: false
    }, function(tab) {
        // After the tab has been created, open a window to inject the tab
        // For options documentation, please see
        // https://developer.chrome.com/extensions/windows#method-create
        chrome.windows.create({
            tabId: tab.id,
            type: 'popup',
            focused: true,
            left: 1000,
            top: 100,
            width: 400,
            height: 300,
            type: "popup"
        });
    });
});