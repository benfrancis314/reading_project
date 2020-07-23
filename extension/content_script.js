// Prevent the usage of undeclared variables.
"use strict";

(function(){
var namespace = "content_script.js";
if (window[namespace] === true) {
	return;
} else {
	window[namespace] = true;
}

// If true, all debugging statements would show.
// TODO: Use a proper logging library.
window.DEBUG = false;
window.debug = function(str) {
	if (DEBUG) {
		console.log("DEBUG: " + str);
	}
}

const keywordClass = "keywordClass" // Name of class for FINDING keywords (no styling)
const sentenceClass = "sentenceClass" // Name of class for FINDING the tracker (no styling)
const SCROLL_DURATION_MS = 500;

// Keeps track of the pointed text. Initialized by end of script load.
var tracker = null;
// UI to see time remaining and reading speed. Initialized by end of script load.
var timeTrackerView = null;
// UI to see instructions & customize settings
var settingsView = null;
// Current styles of tracker
var trackerStyle = null;
// Represents document the user is reading. Stores data about page, like keywords, total words, etc.
var doc = null;
// Whether or not there is a timer that triggers movement of tracker.
// There are only two movement-related states.
// 1. null means tracker is static.
// 2. Non-null means there is a scheduled timer that keeps moving the tracker around.
var timer = null;
// This will be read once from persistent settings during initialization. 
let speed = null; // WPM, Base speed, not accounting for sentence length; adjustable w/ D/S
// Persistent settings.
let settings = window.settings;
// If the screen is currently scrolling. If it is, pause the tracker.
var isScrolling = false;

// Need the same $ reference for on and off of event handlers to be detectable.
// Re-doing $(document) in an async context for some reason doesn't allow you 
// to detect previously attached event handlers.
// Not sure why, but found this through experimentation.
let jdoc = $(document);

/*
Process of determining which style to use. 
TODO: Redo this using CSS variable or something. 
Problem is that highlighter and shadow need to be in the same ID;
not scalable right now to more customizable settings that effect the tracker. 
*/

// Possible reading directions.
const direction = {
    BACKWARD: 0,
    FORWARD: 1
}
/*
Handle click events for each readable item.
*/
function setupClickListeners() {
	for (let containerId = 0; containerId < doc.getNumContainers(); containerId++) {
		let container = doc.getContainer(containerId);
		container.on("click", function () {
			tracker.pointToContainer(containerId);
			highlight(tracker);
			timeTrackerView.updateTimer(tracker.getSentenceId());
		});
	}
}

/*
Undo setupClickListeners()
*/
function removeClickListeners() {
	for (let containerId = 0; containerId < doc.getNumContainers(); containerId++) {
		doc.getContainer(containerId).off("click");
	}
}

/*
If a tracker is currently moving, stop it.
See startMove()
*/
function stopMove() {
	if (timer) {
		// Stop fading animation.
		stopFadeTracker();
		clearInterval(timer);
		timer = null;
	}	
	timeTrackerView.updateAutoMode(false);
}

/*
Make the tracker continuously move in the specified direction.
If there is currently no movement, a move is immediately made, followed
by a continuous movement.
This keeps on gooing until stopMove() is called.
If we are in a moving state and startMove is called, nothing happens.

Parameters:
- dir. See direction enum.
*/

// TODO: Maybe refactor so it doesn't [____?] when turn on automode?
function startMove(dir) { // Note: I have combined the "moveUp" and "moveDown" functions here
	if (timer) {
		return;
	}

	// Schedule continuous movement, with the first move being run immediately.
	(function repeat() { // Allows speed to be updated WHILE moving
		// Let scrolling finish before any movement.
		if (isScrolling) {
			timer = setTimeout(repeat, SCROLL_DURATION_MS);
			return;
		}
		// If there is no more movement to be made, stop autoscroll.
		let hasMoved = moveOne(dir);
		if (!hasMoved) {
			stopMove();
			return;
		}
		let trackerLifeMs = calculateTrackerLifeMs();
		timer = setTimeout(repeat, trackerLifeMs);
		// Immediately fade current tracker.
		fadeTracker(trackerLifeMs);
	})();
	timeTrackerView.updateAutoMode(true);
}

// Calculate lingering time for current tracker in ms.
function calculateTrackerLifeMs() {
	/* Methodology of calculating tracker life: 
		Each sentence has a minimum amount of time to stay on; i.e., a bias. 
		The user specifies the WPM they want, and this calculates a time remaining. 
		This function then distributes the remaining time to each sentence according
		to ratio of the sentence_words:total_words. 
	*/
	const speed_bias_ms = 200; // Half of a second; is this too long?

	let sentenceId = tracker.getSentenceId();
	let sentences_remaining = doc.getNumSentencesFromSentenceTilEnd(sentenceId);
	let sentence_words = doc.getNumWordsInSentence(sentenceId); // Words in current sentence
	let total_words_remaining = doc.getNumWordsFromSentenceTilEnd(sentenceId);
	let base_time_ms = sentences_remaining * speed_bias_ms; // Time from just speed_bias on each sentence. In seconds
	let desired_time_ms = timeTrackerView.getTimeRemainingMs(); // Time we need to finish in
	let distributable_time_ms = desired_time_ms - base_time_ms; // Time left to distribute to sentences
	if (distributable_time_ms < 0) {
		// Possible because base time per sentence sets a lower bound.
		// https://github.com/benfrancis314/reading_project/issues/104
		distributable_time_ms = 0;
	}
	let word_ratio = sentence_words/total_words_remaining;
	let linger_time_ms = distributable_time_ms*(word_ratio) + speed_bias_ms;
	debug("calculateTrackerLifeMs = " + linger_time_ms);
	return (linger_time_ms); 
	// TODO: Use Moment.js
}

/*
Move one sentence in the given direction.
Return:
- Boolean: True iff tracker successfully moved. False if there is no more element to move to.
*/
function moveOne(dir) { // Sets start and end
	let hasMoved = false;

	if (dir == direction.BACKWARD) {
		hasMoved = tracker.movePrevious();
	} else if (dir == direction.FORWARD) {
		hasMoved = tracker.moveNext();
	}
	if (!hasMoved) {
		return false;
	}

	timeTrackerView.updateTimer(tracker.getSentenceId());
	console.log(doc.getSentence(tracker.getSentenceId()));
	highlight(tracker);
 
	if (dir == direction.BACKWARD) {
		scrollUp();
	} else if (dir == direction.FORWARD) {
		scrollDown();
	}
	return true;
}

// Scroll up when tracker is above page
function scrollUp() {
	let verticalMargin = 200;
	// Autoscroll if tracker is above top of page.
	// Number of pixels from top of window to top of current container.
	let markedTopAbsoluteOffset = $("."+sentenceClass).offset().top;
	let markedTopRelativeOffset = markedTopAbsoluteOffset - $(window).scrollTop();
	if (markedTopRelativeOffset < 0) {
		isScrolling = true;
		$('html, body').animate(
			// Leave some vertical margin before the container.
			{scrollTop: (markedTopAbsoluteOffset - verticalMargin)},
			SCROLL_DURATION_MS,
			function() {
				isScrolling = false;
			}
		);
	} 
}

// Scroll down when tracker is below a certain point
function scrollDown() {
	let scrollThreshold = 500;
	let verticalMargin = 200;
	// Autoscroll if too far ahead.
	// Number of pixels from top of window to top of current container.

	let markedTopAbsoluteOffset = $("."+sentenceClass).offset().top;
	let markedTopRelativeOffset = markedTopAbsoluteOffset - $(window).scrollTop();
	if (markedTopRelativeOffset > scrollThreshold) {
		isScrolling = true;
		$('html, body').animate(
			// Leave some vertical margin before the container.
			{scrollTop: (markedTopAbsoluteOffset - verticalMargin)},
			SCROLL_DURATION_MS,
			function() {
				isScrolling = false;
			}
		);
	}
}
// Uncomment this if you want to see the relative y offsets of current container
// so you can tweak the auto-scroll feature.
/*
$(window).scroll(function() {
	console.log(`Window container's top Y = ${getContainer(containerId).offset().top
		- $(window).scrollTop()}`);
});

/*
Undo all actions by highlight() and highlightKeyWords().
*/
function unhighlightEverything() {
	$("." + sentenceClass).unmark(); 
	$("." + keywordClass).unmark();
}

/*
Highlight portion pointed to by tracker.
*/
function highlight(tracker) {
	// Notice sentenceStyle here is NOT immediately updated when user changes settings;
	// We need the old sentenceStyle name to be able to find and remove the styling, 
	// since the next sentence will get a new style. 
	let sentenceStyle = trackerStyle.getSentenceStyle();
	let markEl = $("."+sentenceClass);
	markEl.unmark();
	markEl.removeClass(sentenceClass);
	markEl.removeClass(sentenceStyle);
	// Append the "mark" class (?) to the html corresponding to the interval
	// The interval indices are w.r.t to the raw text.
	// mark.js is smart enough to preserve the original html, and even provide
	// multiple consecutive spans to cover embedded htmls
	let sentenceId = tracker.getSentenceId();
	let sentencePtr = doc.getSentence(sentenceId);
	let container = doc.getContainer(sentencePtr.containerId);
	let start = sentencePtr.start;
	let end = sentencePtr.end;
	container.markRanges([{
    	start: start,
    	length: end - start
	}], {
		// "trackerClass" is for finding current tracker
		className: sentenceClass+" "+sentenceStyle
	});
	// Find element with class "trackerClass", add on sentenceStyle class:
	highlightKeyWords(container, start, end);
};

	/*
    Params: Current container, start and end of tracker (jQuery element, int, int)
    Highlights the keywords within the tracked sentence. 
    */
function highlightKeyWords(container, start, end) {
	let keywordStyle = trackerStyle.getKeywordStyle(); 
	$("."+keywordClass).unmark(); // Remove previous sentence keyword styling
	$("."+keywordClass).removeClass(keywordStyle);
	$("."+keywordStyle).removeClass(keywordStyle);
	// Get list of words in interval
	let containerText = container.text();
	let sentenceText = containerText.slice(start,end);
	let wordRegex = /\b\w+\b/g;
	let wordList = sentenceText.match(wordRegex);
	let keywords = doc.getKeyWords();
	for (var i in wordList) { // Accentuate keywords
		// TODO: This only gets the first occurence of each word in the sentence; should get all
		let word = wordList[i];
		if (keywords.has(word.toLowerCase())) { // See if each word is a keyword
			var word_start = containerText.indexOf(word, start);
			var word_len = word.length;
		};
		// Normal mark.js procedure
		container.markRanges([{ 
			start: word_start,
			length: word_len
		}], {
			className: keywordClass+" "+keywordStyle
		});
	}
};

/*
Fade the current tracker indicator according to the calculated speed.
Parameters:
- fadeMs (int) ms for the fade animation speed.
*/
function fadeTracker(fadeMs) {
	fadeElement($("."+sentenceClass), fadeMs);
	fadeElement($("."+keywordClass), fadeMs);
}

/*
Stop all animations related to fading.
*/
function stopFadeTracker() {
	let sentenceStyle = trackerStyle.getSentenceStyle();
	let keywordStyle = trackerStyle.getKeywordStyle(); 

	let sentence_el = $("."+sentenceStyle)
	let keywords_el = $("."+keywordStyle)
	let sentence_color = sentence_el.css('backgroundColor');
	let keywords_color = keywords_el.css('backgroundColor');
	// TODO: Look into this
	sentence_el.stop().animate({'background-color': sentence_color},
		{	duration: 300,
			complete: function() { 
				sentence_el.removeAttr('style');
		}
		});
	keywords_el.stop().animate({'background-color': keywords_color},
		{	duration: 300,
			complete: function() { 
				keywords_el.removeAttr('style');
		}
		});
}


/*
Fade jquery element el over fadeMs ms.
*/
function fadeElement(el, fadeMs) {
	// Some async issue. If marker already gets deleted but not initialized.
	if (!el) {
		return;
	}
	let rgb = jQuery.Color(el.css('backgroundColor'));
	// Set alpha to 0, and animate towards this, to simulate bg fade of same color.
	let newRgba = `rgba(${rgb.red()}, ${rgb.green()}, ${rgb.blue()}, 0)`
	el.animate(
		{ 'background-color': newRgba },
		fadeMs,
		// The fade outs are barely noticeable until the last .1 period
		// So, used higher powers of ease out to extend the close-to-fade
		// period so user has enough heads up that a movement will happen soon.
		// See this for the full list
		// https://www.tutorialspoint.com/jqueryui/jqueryui_easings.htm
		'easeOutQuint');
}

/*
Adjust current speed by speedDelta, and persist the setting.
*/
const MIN_SPEED_WPM = 100;
const MAX_SPEED_WPM = 2000;
function adjustSpeed(speedDelta) {
	let newSpeed = speed + speedDelta;
	if (newSpeed < MIN_SPEED_WPM) {
		newSpeed = MIN_SPEED_WPM;
	} else if (newSpeed > MAX_SPEED_WPM) {
		newSpeed = MAX_SPEED_WPM;
	}
	if (speed === newSpeed) {
		return;
	}
	speed = newSpeed;
	settings.setSpeed(speed);
	let sentence_id = tracker.getSentenceId()
	timeTrackerView.updateSpeed(speed,sentence_id);
}

function setupKeyListeners() {
	jdoc.on("keydown", function(evt) {
		if (!document.hasFocus()) {
		  return true;
		}

		// Disable browser's default behavior of page-downing on space.
		if (evt.code == 'Space' && evt.target == document.body) {
		    evt.preventDefault();
		}

		switch (evt.code) {
			case 'ArrowLeft': // Move back
				stopFadeTracker();
                startMove(direction.BACKWARD);
                break;
			case 'ArrowRight': // Move forward
				stopFadeTracker();
                startMove(direction.FORWARD);
				break;
			case 'KeyD':	// Increase velocity
				adjustSpeed(40);
				break;
			case 'KeyS':	// Slow velocity
				adjustSpeed(-40);
				break;
			case 'Space': // Switch to auto mode
				if (timer) {
					stopFadeTracker();
					stopMove();
				} else {
					startMove(direction.FORWARD);
				}
			default:
                break;
		}
		return true;
	});
	jdoc.on("keyup", function(evt) {
		switch (evt.code) {
			case 'ArrowLeft':
			case 'ArrowRight':
				stopMove();
				break;
		}
		return true;
    });
};

// Classname for keyword highlights.

function initializeTracker() {
	startMove(direction.FORWARD); // Start reader on the first line
	stopMove(); // Prevent from continuing to go forward
}

function updateDisplaySettings() {
	settings.getCustomizations(function(settingsCustomizations) {
		initializeTracker(settingsCustomizations)
	});
}

  
/*
Undo setupKeyListeners()
*/
function removeKeyListeners() {
	jdoc.off('keydown');
	jdoc.off('keyup');
}

/********************************************************************
Page setup / teardown flow
1. oneTimeSetup() gets called exactly ONCE per tab, to do the heavy document parsing
   but does NOT result in any UI change (no listeners, no visible UI drawing)
2. toggleExtensionVisibility() gets called EVERY TIME browser action is invoked.
   This toggle the UI state between one of the two [ACTIVE, INACTIVE]

In the ACTIVE state, the extension widgets are visible, and event handlers are attached.
In the INACTIVE state, the widgets are not visible, and no event handlers are attached.
   It's as if the user has not opened the extension yet.
   We might have tweaked the dom a bit though, but in a non-visible way.
   E.g. unique ids to all els.
********************************************************************/

// One time setup per page.
function oneTimeSetup() {
	let readableDomEls = window.parseDocument();
	doc = new Doc(readableDomEls);
	// If page is not readable, stop setting up the rest of the app.
	if (doc.sentences.length === 0) {
		debug("Stopping app init because page is not readable");
		return;
	}
	tracker = new Tracker(doc);
	// TODO: Refactor using promise logic so this is more readable.
	// Load all the persistent settings, then render the UI.
	settings.getSpeed(function(settingsSpeed) {
		speed = settingsSpeed;
		// Listen for background.js toggle pings.
		chrome.runtime.onMessage.addListener(
			function(request, sender, sendResponse) {
			    if (request.command === "toggleUI") {
			    	toggleExtensionVisibility();
			    }
			}
		);
	});
}
/*
Render all the UI elements.
*/
function setupUI() {
	timeTrackerView = new TimeTrackerView(doc, speed);
	trackerStyle = new TrackerStyle(); // 
	window.trackerStyle = trackerStyle; // Expose to global
	settingsView = new SettingsView();
	
	updateDisplaySettings();
  
	setupClickListeners();
	setupKeyListeners();
  
}
/*
Turn down all the UI elements.
Undo setupUI()
*/
function removeUI() {
	removeKeyListeners();
	removeClickListeners();
	stopMove();
	unhighlightEverything();
	tracker.reset();
	timeTrackerView.turnDownUI();
	timeTrackerView = null;
	settingsView = null;
}

function toggleExtensionVisibility() {
	if (timeTrackerView === null) {
		setupUI();
	} else {
		removeUI();
	}
}

oneTimeSetup();
})(); // End of namespace