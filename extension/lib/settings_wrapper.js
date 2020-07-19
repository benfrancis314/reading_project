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
	// How long to stay on each character, in ms.
	// Because of this definition, unintuitively, the smaller speed value,
	// the faster the actual reading speed is. 
    SPEED: "speed"
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
}

// Expose to global.
window.settings = new Settings();

})(); // End of namespace