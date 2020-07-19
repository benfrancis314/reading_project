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
	KEYWORD: "green", // Keywords color/active: "green", "yellow", "off"
	HIGHLIGHTER: "blue", // Highlighter color: "blue", "yellow", "green"
	SHADOW: "blue" // Shadow color: "blue", "yellow", "green"

};

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
	setKeyword(color) {
		chrome.storage.local.set({[settingKey.KEYWORD]: color}, function() {
			if (chrome.runtime.lastError) {
				console.log("Failed to save keyword setting: " + chrome.runtime.lastError);
				return;
			}
		});
	}
	setHighlighter(color) {
		chrome.storage.local.set({[settingKey.HIGHLIGHTER]: color}, function() {
			if (chrome.runtime.lastError) {
				console.log("Failed to save highlighter setting: " + chrome.runtime.lastError);
				return;
			}
		});
	}
	setShadow(color) {
		chrome.storage.local.set({[settingKey.SHADOW]: color}, function() {
			if (chrome.runtime.lastError) {
				console.log("Failed to save shadow setting: " + chrome.runtime.lastError);
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
		});
	}
	/*
	See setKeyword().
	If not set yet, return default value of "green".
	Parameters;
	- cb: func(int). A callback function which accepts the retrieved keyword status.
	*/
	getKeyword(cb) {
		let key = settingKey.KEYWORD;
		let val = chrome.storage.local.get(key, function(settingsDict) {
			if (chrome.runtime.lastError) {
				console.log("Failed to retrieve keyword setting: " + chrome.runtime.lastError);
				return;
			}
			// Default keyword color.
			let keyword = "Green";
			if (key in settingsDict) {
				keyword = settingsDict[key];
			} 

			cb(keyword);
		});
	}
	/*
	See setHighlighter().
	If not set yet, return default value of "blue".
	Parameters;
	- cb: func(int). A callback function which accepts the retrieved highlighter.
	*/
	getHighlighter(cb) {
		let key = settingKey.HIGHLIGHTER;
		let val = chrome.storage.local.get(key, function(settingsDict) {
			if (chrome.runtime.lastError) {
				console.log("Failed to retrieve highlighter setting: " + chrome.runtime.lastError);
				return;
			}
			// Default highlighter color.
			let highlighter = "Blue";
			if (key in settingsDict) {
				highlighter = settingsDict[key];
			} 

			cb(highlighter);
		});
	}
	/*
	See setShadow().
	If not set yet, return default value of "blue".
	Parameters;
	- cb: func(int). A callback function which accepts the retrieved shadow.
	*/
	getShadow(cb) {
		let key = settingKey.SHADOW;
		let val = chrome.storage.local.get(key, function(settingsDict) {
			if (chrome.runtime.lastError) {
				console.log("Failed to retrieve shadow setting: " + chrome.runtime.lastError);
				return;
			}
			// Default shadow color.
			let shadow = "Blue";
			if (key in settingsDict) {
				shadow = settingsDict[key];
			} 

			cb(shadow);
		});
	}
}

// Expose to global.
window.settings = new Settings();

})(); // End of namespace