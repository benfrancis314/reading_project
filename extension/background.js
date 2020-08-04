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
	let demoUrl = 'https://en.wikipedia.org/wiki/Reading';
	chrome.tabs.create({
	    url: demoUrl,
	    active: true
	}, function(tab) {
        // Have to wait for new tab to load; see: https://stackoverflow.com/questions/5816373/chrome-tab-create-and-tab-getselected
        /* TODO: Change this from this obv super hacky strategy. 
        Problem is: Only want to sendMessage once, AFTER the new tab is loaded. If do nothing, it sends the message to old page, 
        which isn't very helpful. How to see if on new page? "tab" has some information for this, but not enough to be useful. 
        It can show you the:            (from https://developer.chrome.com/extensions/tabs#type-Tab)
        - tab.status ("unloaded", "loading", "completed"), but it never changes from loading to completed, even after it has completed. 
            Presumably this is bc it just gives us the tab variable instantiated to "loading" once, and it does not update when the page is completed, 
            which makes sense. So we cannot have our sendMessage condition based on this variable. 
        - tab.url will give an empty string, since the tab has not yet committed. 
        - tab.pendingUrl is always equal to the demoUrl, so we cannot use it to see if we are succesfully at that tab yet. 
        The stack overflow recommends using onUpdated, but this results in a listener that gets called for every tab update. 
        You have to build a condition in there, except we cannot look for the URL, bc then it would happen every time we visit that url. 
        And so on. This works for now, though it incurs an unwanted delay:
        - Other options: (1) end a message back from content script to background to see when loaded (maybe works; good avenue to try)
                         (2) create a tutorial architecture in the settings to keep track of current place in tutorial
        */
        setTimeout(function() {
                chrome.tabs.sendMessage(tab.id, {command: "startTutorial"}, function(response) {
                    chrome.tabs.sendMessage(tab.id, {command: "toggleUITutorial"}, function(response) {})
                });
        }, 3000);      
    
	});
});

// Take user to survey after uninstall
chrome.runtime.setUninstallURL("https://www.readerease.com/uninstall");