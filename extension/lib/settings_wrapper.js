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
	CUSTOMS: "customs"
	// KEYWORD: "green", // Keywords color/active: "green", "yellow", "off"
	// HIGHLIGHTER: "blue", // Highlighter color: "blue", "yellow", "green"
	// SHADOW: "blue" // Shadow color: "blue", "yellow", "green"
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
	// I AM USING A COPY OF THIS IN DISPLAY.JS JUST FOR NOW FOR POC;
	// TODO: MOVE CALLBACK FLOW TO GO BACK THROUGH HERE
	/* Stored as array bc I need all 3 to proceed in content_script.js. 
	So instead of waiting for three async calls, merging them into an array back here
	*/
	setCustomizations(customs,cb) { // string[] -> 1. Keyword 2. Highlighter 3. Shadow
		chrome.storage.local.set({[settingKey.CUSTOMS]: customs}, function() {
			if (chrome.runtime.lastError) {
				console.log("Failed to save customization setting: " + chrome.runtime.lastError);
				return;
			}
			cb();
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
	See setCustomizations().
	If not set yet, return default value of ["Green", "Blue", "Blue"].
	Parameters;
	- cb: func(int). A callback function which accepts the retrieved customizations status.
	*/
	getCustomizations(cb) {
		let key = settingKey.CUSTOMS;
		let val = chrome.storage.local.get(key, function(settingsDict) {
			if (chrome.runtime.lastError) {
				console.log("Failed to retrieve customization setting: " + chrome.runtime.lastError);
				return;
			}
			// Default keyword color.
			let customs = ["Green", "Blue", "Blue"]
			if (key in settingsDict) {
				customs = settingsDict[key];
			} 
			cb(customs);
		});
	}
}

// Expose to global.
window.settings = new Settings();

})(); // End of namespace