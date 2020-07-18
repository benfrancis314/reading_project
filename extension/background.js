// Async load multiple scripts on executeScript
// Taken from https://stackoverflow.com/a/34456163/4143394
(function() {
    function ScriptExecution(tabId) {
        this.tabId = tabId;
    }

    ScriptExecution.prototype.executeScripts = function(fileArray) {
        fileArray = Array.prototype.slice.call(arguments); // ES6: Array.from(arguments)
        return Promise.all(fileArray.map(file => exeScript(this.tabId, file))).then(() => this); // 'this' will be use at next chain
    };

    ScriptExecution.prototype.executeCodes = function(fileArray) {
        fileArray = Array.prototype.slice.call(arguments);
        return Promise.all(fileArray.map(code => exeCodes(this.tabId, code))).then(() => this);
    };

    ScriptExecution.prototype.injectCss = function(fileArray) {
        fileArray = Array.prototype.slice.call(arguments);
        return Promise.all(fileArray.map(file => exeCss(this.tabId, file))).then(() => this);
    };

    function promiseTo(fn, tabId, info) {
        return new Promise(resolve => {
            fn.call(chrome.tabs, tabId, info, x => resolve());
        });
    }


    function exeScript(tabId, path) {
        let info = { file : path, runAt: 'document_end' };
        return promiseTo(chrome.tabs.executeScript, tabId, info);
    }

    function exeCodes(tabId, code) {
        let info = { code : code, runAt: 'document_end' };
        return promiseTo(chrome.tabs.executeScript, tabId, info);
    }

    function exeCss(tabId, path) {
        let info = { file : path, runAt: 'document_end' };
        return promiseTo(chrome.tabs.insertCSS, tabId, info);
    }

    window.ScriptExecution = ScriptExecution;
})();

chrome.browserAction.onClicked.addListener(function (tab) {
    new ScriptExecution(tab.id)
        .executeScripts(
            "third_party/jquery-3.5.1.min.js",
            "third_party/jquery.mark-8.11.1.min.js",
            "third_party/jquery-ui.1.12.1.min.js",
            "third_party/readability-1.7.1.js",
            "lib/tracker.js",
            "lib/display.js",
            "lib/doc.js",
            "content_script.js"
        )
        .then(s => s.injectCss("content.css", "gear.svg"));
});
