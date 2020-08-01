// // Async load multiple scripts on executeScript
// // Taken from https://stackoverflow.com/a/34456163/4143394
// (function() {
//     function ScriptExecution(tabId) {
//         this.tabId = tabId;
//     }

//     ScriptExecution.prototype.executeScripts = function(fileArray) {
//         fileArray = Array.prototype.slice.call(arguments); // ES6: Array.from(arguments)
//         return Promise.all(fileArray.map(file => exeScript(this.tabId, file))).then(() => this); // 'this' will be use at next chain
//     };

//     ScriptExecution.prototype.executeCodes = function(fileArray) {
//         fileArray = Array.prototype.slice.call(arguments);
//         return Promise.all(fileArray.map(code => exeCodes(this.tabId, code))).then(() => this);
//     };

//     ScriptExecution.prototype.injectCss = function(fileArray) {
//         fileArray = Array.prototype.slice.call(arguments);
//         return Promise.all(fileArray.map(file => exeCss(this.tabId, file))).then(() => this);
//     };

//     function promiseTo(fn, tabId, info) {
//         return new Promise(resolve => {
//             fn.call(chrome.tabs, tabId, info, x => resolve());
//         });
//     }

//     function exeScript(tabId, path) {
//         let info = { file : path, runAt: 'document_end' };
//         return promiseTo(chrome.tabs.executeScript, tabId, info);
//     }

//     function exeCodes(tabId, code) {
//         let info = { code : code, runAt: 'document_end' };
//         return promiseTo(chrome.tabs.executeScript, tabId, info);
//     }

//     function exeCss(tabId, path) {
//         let info = { file : path, runAt: 'document_end' };
//         return promiseTo(chrome.tabs.insertCSS, tabId, info);
//     }

//     window.ScriptExecution = ScriptExecution;
// })();

// chrome.browserAction.onClicked.addListener(function (tab) {
//     // This gets triggered when user invokes browser action either by
//     // 1. Clicking the extension.
//     // 2. Pressing key sequences defined in manifest.json to invoke browser action.

//     // All the scripts below have IFNDEF protection patterns to ensure
//     // they only run once per page. 
//     new ScriptExecution(tab.id)
//         .executeScripts(
//             "third_party/lodash-4.17.15.js",
//             "third_party/jquery-3.5.1.min.js",
//             "third_party/jquery.mark-8.11.1.min.js",
//             "third_party/jquery-ui.1.12.1.min.js",
//             "third_party/readability-1.7.1.js",
//             "third_party/tokenize-text.js",
//             "third_party/tokenize-english.js",
//             "lib/settings_wrapper.js",
//             "lib/document_parser.js",
//             "lib/tracker.js",
//             "lib/time_tracker_view.js",
//             "lib/doc.js",
//             "lib/settings_view.js",
//             "content_script.js"
//         )
//         .then(s => s.injectCss("content.css"))
//         .then(s => {
//             // Send a message which will get handled by content_script.js
//             // This ensures that the same isolated world which has the first and only 
//             // script execution can handle the event.
//             // The alternative approach of executeScripts and rerunning content_script.js
//             // does not work because it will execute in a different isolated world,
//             // and will have lost access to the previous javascript vars and event handlers.
//             // See https://stackoverflow.com/a/8916706/4143394
//             chrome.tabs.sendMessage(tab.id, {command: "toggleUI"}, function(response) {});
//         });
// });
