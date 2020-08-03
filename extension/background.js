function toggleUI(tab) {
	chrome.tabs.sendMessage(tab.id, {command: "toggleUI"}, function(response) {});
}
function startTutorial(tab) {
    chrome.tabs.sendMessage(tab.id, {command: "startTutorial"}, function(response) {});
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

chrome.runtime.onInstalled.addListener(toggleUI);
chrome.runtime.onInstalled.addListener(startTutorial);
chrome.runtime.onInstalled.addListener(function() {

    // Redirect user to a demo page, and auto-start the app there.
	let demoUrl = 'https://en.wikipedia.org/wiki/Reading';
	chrome.tabs.create({
	    url: demoUrl,
	    active: true
	}, function(tab) {
        alert("aa");
        // Have to wait for new tab to load; see: https://stackoverflow.com/questions/5816373/chrome-tab-create-and-tab-getselected
            // setInterval(addTutorial, 1000);
            // function addTutorial() {
            //     alert("xs");
            //     // alert(tab.status);
            //     if (tab.status === "complete") {
            //         alert("true");
            //         chrome.tabs.sendMessage(tab.id, {command: "toggleUI"}, function(response) {});
            //         chrome.tabs.sendMessage(tab.id, {command: "startTutorial"}, function(response) {});
            //         shouldRepeat = false;
            //         clearInterval();
            //     }
            //     return;
            // }
        // })
        
	});
});

// Take user to survey after uninstall
chrome.runtime.setUninstallURL("https://www.readerease.com/uninstall");