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
	SPEED: "speed", // WPM
	TRACKER_CUSTOM: "tracker_custom",
	// TODO: After testing and erased Ben's local storage, change this key to "documentFreq"
	// to match rest of naming schema. 
	DOCUMENT_FREQ: "termDocumentFreq",
	VISITED_URLS: "urls"
};

// Tracker settings customize the appearance of the tracker.
// It is represented by the dictionary {trackerSettingKey : trackerSettingValue}
// All of the keys are mapped to a value.
const trackerSettingKey = {
	KEYWORD: "keyword",
	HIGHLIGHTER: "highlighter",
	SHADOW: "shadow"
}
const trackerSettingValue = {
	GREEN: "green",
	YELLOW: "yellow",
	BLUE: "blue",
	OFF: "off"
}


/*
Wrapper for persistent storage of user's settings.
Please see https://app.clickup.com/t/9rn1ck?comment=100937142 for more details on chrome sync.

This is already exported to window.
So, the client's usage is:
// Abbreviate
let settings = window.settings;
settings.setSpeed(3);
*/
class Settings {

	// TODO: Cache the options so getting and setting don't require expensive calls all the time?
	/*
	Note that this method is asynchronous.
	These settings are not that important, so it's fine to pretend like they are synchronous
	and drop the errors.
	Parameters:
	- speed: int. See settingKey.SPEED
	*/
	setSpeed(speed) {
		chrome.storage.local.set({[settingKey.SPEED]: speed}, function() {
			if (chrome.runtime.lastError) {
				console.log("Failed to save speed setting: " + chrome.runtime.lastError);
				return;
			}
		});
	}
	// TODO: MOVE CALLBACK FLOW TO GO BACK THROUGH HERE
	/*
	Save the tracker settings
	Parameters:
	- trackerSettings: {trackerSettingKey : trackerSettingValue}
	- cb. Callback fcn to be called when saving is complete.
	*/
	setCustomizations(trackerSettings, cb) {
		chrome.storage.local.set({[settingKey.TRACKER_CUSTOM]: trackerSettings}, function() {
			if (chrome.runtime.lastError) {
				console.log("Failed to save customization setting: " + chrome.runtime.lastError);
				return;
			}
			cb();
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
	setDocumentFreq(documentFreq) {
		chrome.storage.local.set({[settingKey.DOCUMENT_FREQ]: documentFreq}, function() {
			if (chrome.runtime.lastError) {
				console.log("Failed to save term document frequencies: " + chrome.runtime.lastError);
				return;
			}
		});
	}

	// Set the URLs that the user has visited
	setVisitedUrls(visitedUrls) {
		chrome.storage.local.set({[settingKey.VISITED_URLS]: visitedUrls}, function() {
			if (chrome.runtime.lastError) {
				console.log("Failed to save visited URLs list: " + chrome.runtime.lastError);
				return;
			}
		});
	}



	/*
	See setSpeed().
	If not set yet, return default value of 20.
	Parameters;
	- cb: func(int). A callback function which accepts the retrieved speed.
	*/
	getSpeed(cb) {
		let key = settingKey.SPEED;
		let val = chrome.storage.local.get(key, function(settingsDict) {
			if (chrome.runtime.lastError) {
				console.log("Failed to retrieve speed setting: " + chrome.runtime.lastError);
				return;
			}
			// Default speed.
			let speed = 260;
			if (key in settingsDict) {
				speed = settingsDict[key];
			} 
			cb(speed);
		})
	}
	// See setDefaultTrackerSettigns().
	getDefaultTrackerSettings() {
		return {
			[trackerSettingKey.KEYWORD] : trackerSettingValue.GREEN,
			[trackerSettingKey.HIGHLIGHTER]: trackerSettingValue.BLUE,
			[trackerSettingKey.SHADOW]: trackerSettingValue.BLUE
		};
	}	
	

	/*
	See setCustomizations().
	If not set yet, return getDefaultTrackerSettings()
	Parameters;
	- cb: func({trackerSettingKey : trackerSettingValue}).
	  A callback function which accepts the retrieved customizations status.
	*/
	getCustomizations(cb) {
		let key = settingKey.TRACKER_CUSTOM;
		let that = this;
		let val = chrome.storage.local.get(key, function(settingsDict) {
			if (chrome.runtime.lastError) {
				console.log("Failed to retrieve customization setting: " + chrome.runtime.lastError);
				return;
			}
			let customs = that.getDefaultTrackerSettings();
			if (key in settingsDict) {
				customs = settingsDict[key];
			}
			cb(customs);
		});
	}

	/*
	Save the term document frequencies. 
	This is a map of all words user has ever read to the number of documents they have occured in. 
	Every time they read a new document, it adds one to each word in the dict, or adds the word to the dict
	initialized at 1. 
	*/
		// TODO: Build in safeguard against exceeding storage limit
	getDocumentFreq(cb) {
		let key = settingKey.DOCUMENT_FREQ; // 
		chrome.storage.local.get(key, function(settingsDict) {
			if (chrome.runtime.lastError) {
				console.log("Failed to retrieve term document frequencies: " + chrome.runtime.lastError);
				return;
			}
			// Default documentFreq (empty map)
			let documentFreq = {};
			if (key in settingsDict) {
				documentFreq = settingsDict[key];
			} 
			cb(documentFreq);
		})
	}

	/* 
	Get's list of URLs that have been used for the document freq dictionary. 
	Stored as dict for O(1) element search & bc can't store as Set()
	*/
	getVisitedUrls(cb) {
		let key = settingKey.VISITED_URLS;
		chrome.storage.local.get(key, function(settingsDict) {
			if (chrome.runtime.lastError) {
				console.log("Failed to retrieve list of visited URLs: " + chrome.runtime.lastError);
				return;
			}
			// Default visitedUrls (dict)
			let visitedUrls = {}; 
			if (key in settingsDict) {
				visitedUrls = settingsDict[key];
			}
			cb(visitedUrls)
		});
	}
}

// Expose to global.
window.settings = new Settings();
window.trackerSettingKey = trackerSettingKey;
window.trackerSettingValue = trackerSettingValue;

})(); // End of namespace