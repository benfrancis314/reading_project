// Prevent the usage of undeclared variables.
"use strict";

(function(){
var namespace = "lib/settings_wrapper.js";
if (window[namespace] === true) {
	return;
} else {
	window[namespace] = true;
}

// List of chrome storage keys.
const settingKey = {
	// WPM. If not set yet, default value of 260.
	SPEED: "speed", 

	// Tracker settings customize the appearance of the tracker.
	// It is represented by the dictionary {trackerSettingKey : trackerSettingValue}
	// All of the keys are mapped to a value.
	TRACKER_CUSTOM: "tracker_custom",

	// This is a map of all words user has ever read to the number of documents they have occured in. 
	// Every time they read a new document, it adds one to each word in the dict, or adds the word to the dict
	// initialized at 1.
	// TODO: After testing and erased Ben's local storage, change this key to "documentFreq"
	// to match rest of naming schema. 
	DOCUMENT_FREQ: "termDocumentFreq",

	// URLs that user has visited. set<String>
	VISITED_URLS: "urls"
};

const trackerSettingKey = {
	KEYWORD: "keyword"
}
const trackerSettingValue = {
	LIGHT: "light",
	BRIGHT: "bright",
	OFF: "off"
}

/*
Wrapper for persistent storage of user's settings.
Please see https://docs.google.com/document/d/122o4vYiK3RLmYCoT_tL3bzmPzPUb0Q8DMIu2BgaT07U/edit#
for the storage design.

This is already exported to window.
So, the client's usage is as follows:

[Initialization]
// There should only be one place where settings is initialized: content_script
// The other classes will just have to inject settings in constructor.
let settings = new window.Settings(your callback);

[Getting]
// All gets are synchronous. You will read off the in-memory version.
let speed = setting.getSpeed();

[Setting]
// All sets are also synchronous. It will update the in-memory version immediately.
// There will be a best-effort asynchronous writes to storage, but you don't have to worry about that.
setting.setSpeed(3);

[Documentation]
All the settings' values format are documented in the settingKey enums, and omitted from set()
and get() if there is no change.

*/
class Settings {
	// Load all settings from storage asynchronously, and call cb when done.
	constructor(cb) {
    	let that = this;
		chrome.storage.local.get(null, function(settings) {
			if (chrome.runtime.lastError) {
				// Don't bother calling the cb()
				console.log("Failed to load all settings: " + chrome.runtime.lastError);
				return;
			}
			if (settings === null) {
				settings = {};
			}
			that.settings = settings;
			cb();
		});
	}

	// See SPEED
	setSpeed(speed) {
		let key = settingKey.SPEED;
		this.settings[key] = speed;
		chrome.storage.local.set({[key]: speed}, function() {
			if (chrome.runtime.lastError) {
				console.log("Failed to save speed setting: " + chrome.runtime.lastError);
				return;
			}
		});
	}

	// See TRACKER_CUSTOM
	setCustomizations(trackerSettings) {
		let key = settingKey.TRACKER_CUSTOM;
		this.settings[key] = trackerSettings;
		chrome.storage.local.set({[key]: trackerSettings}, function() {
			if (chrome.runtime.lastError) {
				console.log("Failed to save customization setting: " + chrome.runtime.lastError);
				return;
			}
		});
	}

	// FOR DEV ONLY; REMOVE BEFORE PRODUCTION
	// resetDocumentFreq() {
	// 	let documentFreq = {};
	// 	chrome.storage.local.set({[settingKey.DOCUMENT_FREQ]: documentFreq}, function() {
	// 		if (chrome.runtime.lastError) {
	// 			console.log("Failed to save term document frequencies: " + chrome.runtime.lastError);
	// 			return;
	// 		}
	// 	});
	// }

	// FOR DEV ONLY; REMOVE BEFORE PRODUCTION
	// resetVisitedUrls() {
	// 	let visitedUrls = {};
	// 	chrome.storage.local.set({[settingKey.VISITED_URLS]: visitedUrls}, function() {
	// 		if (chrome.runtime.lastError) {
	// 			console.log("Failed to save term document frequencies: " + chrome.runtime.lastError);
	// 			return;
	// 		}
	// 	});
	// }

	// TODO: Track storage left, when nearing capacity do something
	// See DOCUMENT_FREQ
	setDocumentFreq(documentFreq) {
		let key = settingKey.DOCUMENT_FREQ;
		this.settings[key] = documentFreq;
		chrome.storage.local.set({[key]: documentFreq}, function() {
			if (chrome.runtime.lastError) {
				console.log("Failed to save term document frequencies: " + chrome.runtime.lastError);
				return;
			}
		});
	}

	// See VISITED_URLS
	setVisitedUrls(visitedUrls) {
		let key = settingKey.VISITED_URLS;
		this.settings[key] = visitedUrls;
		chrome.storage.local.set({[key]: visitedUrls}, function() {
			if (chrome.runtime.lastError) {
				console.log("Failed to save visited URLs list: " + chrome.runtime.lastError);
				return;
			}
		});
	}

	// See SPEED
	getSpeed(cb) {
		let key = settingKey.SPEED;
		if (!(key in this.settings)) {
			// Default speed.
			this.settings[key] = 260;
		}
		return this.settings[key];
	}

	// See TRACKER_CUSTOM
	getCustomizations() {
		let key = settingKey.TRACKER_CUSTOM;
		if (!(key in this.settings)) {
			// Default customization
			this.settings[key] = {
				[trackerSettingKey.KEYWORD] : trackerSettingValue.GREEN,
				[trackerSettingKey.HIGHLIGHTER]: trackerSettingValue.BLUE,
				[trackerSettingKey.SHADOW]: trackerSettingValue.BLUE
			};
		}
		return this.settings[key];
	}

	// TODO: Build in safeguard against exceeding storage limit
	// TODO: Handle case when document changes content 
	// See DOCUMENT_FREQ
	getDocumentFreq() {
		let key = settingKey.DOCUMENT_FREQ;
		if (!(key in this.settings)) {
			// Default document freq.
			this.settings[key] = {};
		}
		return this.settings[key];
	}

	/* 
	Get's list of URLs that have been used for the document freq dictionary. 
	Stored as dict for O(1) element search & bc can't store as Set()
	*/
	getVisitedUrls() {
		let key = settingKey.VISITED_URLS;

		if (!(key in this.settings)) {
			// Default visitedUrls
			this.settings[key] = {};
		}
		return this.settings[key];
	}
}

// Expose to global.
window.Settings = Settings;
window.trackerSettingKey = trackerSettingKey;
window.trackerSettingValue = trackerSettingValue;

})(); // End of namespace