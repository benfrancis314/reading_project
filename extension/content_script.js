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
window.DEBUG = true;
window.debug = function(str) {
	if (DEBUG) {
		console.log("DEBUG: " + str);
	}
}


// Mutually exclusive current animation state.
const animationEnum = {
	// No animation right now. Everything is static
	NONE: "none",
	// Page is scrolling
	SCROLL: "scroll",
	// Intersentence transition
	// TODO: Use this when implementing sentence transition.
	TRANSITION: "transition"
}

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
// Current animation state, to ensure we are not doing multiple animations at once.
var animationState = animationEnum.NONE;

// Need the same $ reference for on and off of event handlers to be detectable.
// Re-doing $(document) in an async context for some reason doesn't allow you 
// to detect previously attached event handlers.
// Not sure why, but found this through experimentation.
let jdoc = $(document);
// Sentence Id that is being highlighted right now.
// Null if nothing is highlighted right now.
// Thix extra variable is so we don't have to do an extra jquery dom traversal
// based on css class name.
let highlightedSentenceId = null;
// Class for sentence tracker style, when ON
const sentenceStyleOn = "sentenceStyleOn";
// Class for sentence tracker style, when OFF
const sentenceStyleOff = "sentenceStyleOff";
// Class for persistent highlighter
const persistentHighlightClass = "persistentHighlight";

// Possible reading directions.
const direction = {
    BACKWARD: 0,
    FORWARD: 1
}
/*
Handle click events for each sentence.
*/
function setupSentenceClickListeners() {
	for (let sentenceId = 0; sentenceId < doc.sentences.length; sentenceId++) {
		doc.getSentenceEls(sentenceId).on("click", function(e) {          
			highlight(sentenceId);
			tracker.pointToSentence(sentenceId);
			timeTrackerView.updateTimer(sentenceId);
			scrollToTracker(function() {});
		});
	}
}

/*
Undo setupClickListeners()
*/
function removeClickListeners() {
	for (let sentenceId = 0; sentenceId < doc.sentences.length; sentenceId++) {
		doc.getSentenceEls(sentenceId).off("click");
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

function startMove(dir) { // Note: I have combined the "moveUp" and "moveDown" functions here
	if (timer) {
		return;
	}

	// Schedule continuous movement, with the first move being run immediately.
	(function repeat() { // Allows speed to be updated WHILE moving
		// When there is animation ongoing, wait for it to finish before doing any movement.
		if (animationState !== animationEnum.NONE) {
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
	// Please see the writeup for more details on the parameter values.
	// https://docs.google.com/document/d/14ub4PZGhGHOMvDLFr1nVkBIWFzQyujJHkuK_HB1fDM8/edit#
	// To account for saccade and fixation time to new sentence.
	// Argument for 500: Any sentence with less than 500 is hard to read, no matter the length
	const speed_bias_ms = 500;

	let sentenceId = tracker.getSentenceId();
	let sentences_remaining = doc.getNumSentencesFromSentenceTilEnd(sentenceId);
	let sentence_score = doc.getSentenceScore(sentenceId); // Words in current sentence
	let total_score_remaining = doc.getTotalScoreFromSentenceTilEnd(sentenceId);
	let base_time_ms = sentences_remaining * speed_bias_ms; // Time from just speed_bias on each sentence. In seconds
	let desired_time_ms = timeTrackerView.getTimeRemainingMs(); // Time we need to finish in
	let distributable_time_ms = desired_time_ms - base_time_ms; // Time left to distribute to sentences
	if (distributable_time_ms < 0) {
		// Possible because base time per sentence sets a lower bound.
		// https://github.com/benfrancis314/reading_project/issues/104
		distributable_time_ms = 0;
	}
	let word_ratio = sentence_score/total_score_remaining;
	let linger_time_ms = distributable_time_ms*(word_ratio) + speed_bias_ms;
	// To see sentence score; set all score values to 1 to get total # of words
	debug("Sentence score: "+sentence_score);
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
	highlight(tracker.getSentenceId());
	scrollToTracker(function() {
		highlight(tracker.getSentenceId());
	});

	return true;
}

// Manual movement is limited to once 200ms, or else if user taps arrow keys really quickly,
// or presses down on them, there will be
// too many UI events (e.g. highlighting, etc.) happening at once, making things very slow.
// Debounce note: Will execute only after this function is uncalled for that amount of time.
// The inactivity timer gets reset when function gets called while it is 'recovering'.
let moveOneDebounced = _.debounce(moveOne, 50, {
  // This is so that the function is immediately invoked, as opposed to waiting for debounce
  // wait period before executing.
  'leading': true,
  'trailing': false
});

// Scroll page so tracker is in view.
// cb called when scrolling is complete
function scrollToTracker(cb) {
	// One animation at a time.
	if (animationState !== animationEnum.NONE) {
		cb();
		return;
	}
	let verticalMargin = 100;
	// The viewing band is from top of the page (0) down to scrollThreshold away
	let scrollThreshold = 200;
	// Autoscroll if tracker is above top of page.
	// Number of pixels from top of window to top of current container.
	let markedTopAbsoluteOffset = doc.getSentenceEls(tracker.getSentenceId()).offset().top;
	let markedTopRelativeOffset = markedTopAbsoluteOffset - $(window).scrollTop();
	if (markedTopRelativeOffset < 0
		|| markedTopRelativeOffset > scrollThreshold) {
		animationState = animationEnum.SCROLL;
		$('html, body').animate(
			// Leave some vertical margin before the container.
			{scrollTop: (markedTopAbsoluteOffset - verticalMargin)},
			SCROLL_DURATION_MS,
			function() {
				animationState = animationEnum.NONE;
				cb();
			}
		);
	} else {
		cb();
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
	if (tracker.isTracking()) {
		let sentenceId = tracker.getSentenceId();
		doc.getSentenceEls(sentenceId).removeClass(sentenceStyleOn);
		doc.getSentenceKeywordsEls(sentenceId).removeClass(trackerStyle.getKeywordStyle());
	}
	highlightedSentenceId = null;
	$("."+persistentHighlightClass).removeClass(persistentHighlightClass);
}

/*
Highlight portion pointed to by tracker, and unhighlight previous sentence (if not null).
*/
function highlight(sentenceId) {
	let keywordStyle = trackerStyle.getKeywordStyle(); 

	// Unhighlight if previous highlight already exists.
	if (highlightedSentenceId !== null) {
		doc.getSentenceEls(highlightedSentenceId).removeClass(sentenceStyleOn);
		let prevEls = doc.getSentenceEls(highlightedSentenceId);
		prevEls.removeClass(sentenceStyleOn);
		prevEls.addClass(sentenceStyleOff);
		doc.getSentenceKeywordsEls(highlightedSentenceId).removeClass(keywordStyle)
	}
	// Highlight the sentence.
	doc.getSentenceEls(sentenceId)
		.removeClass(sentenceStyleOff)
		.addClass(sentenceStyleOn);
	// Highlight the keywords. 
	doc.getSentenceKeywordsEls(sentenceId).addClass(keywordStyle);
	highlightedSentenceId = sentenceId;
};

// Toggles the persistent highlight on the currently tracked sentence
function persistentHighlight() {
	if (!tracker.isTracking()) { return; }
	let sentenceId = tracker.getSentenceId();
	var el = doc.getSentenceEls(sentenceId);
	el.toggleClass(persistentHighlightClass)
}

/*
Fade the current tracker indicator according to the calculated speed.
Parameters:
- fadeMs (int) ms for the fade animation speed.
*/
function fadeTracker(fadeMs) {
	fadeElement(doc.getSentenceEls(tracker.getSentenceId()), fadeMs);
}

/*
Stop all animations related to fading.
*/
function stopFadeTracker() {
	// TODO: Fix transition animations.
	let sentence_els = doc.getSentenceEls(tracker.getSentenceId());
	sentence_els.stop();

	let keywordStyle = trackerStyle.getKeywordStyle(); 
	let keywords_el = $("."+keywordStyle)
	let keywords_color = keywords_el.css('backgroundColor');
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
function adjustSpeed(speedDelta, wpmDisplay) {
	if (!timer) { wpmDisplay.stop(true).fadeIn(250).delay(750).fadeOut(1000); };
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
	let sentence_id = tracker.getSentenceId();
	timeTrackerView.updateSpeed(speed,sentence_id);
}

/*
Used to cycle keywords through the three different keyword setting options. 
*/
function toggleKeywordSettings() {
	let currentKeywordStyle = settingsView.trackerSetting['keyword'];
	if (currentKeywordStyle == 'off') { 
		settingsView.changeSetting('keyword', 'light'); 
	}
	else if (currentKeywordStyle == 'light') { 
		settingsView.changeSetting('keyword', 'bright'); 
	}
	else if (currentKeywordStyle == 'bright') { 
		settingsView.changeSetting('keyword', 'off'); 
	}
}

function setupKeyListeners() {
	let wpmDisplay = $("#speedContainer");
	/* This creates an event namespace so that only these events
		are removed when off() is called in removeUI. 
		See: https://api.jquery.com/on/ , section "Event names and namespaces" */
	jdoc.on("keydown.running", function(evt) {
		if (!document.hasFocus()) {
		  return true;
		}

		// Disable browser's default behavior of page-downing on space.
		if (evt.code == 'Space' && evt.target == document.body) {
		    evt.preventDefault();
		}

		let startTime = new Date();
		switch (evt.code) {
			case 'ArrowLeft': // Move back
				stopMove();
                moveOneDebounced(direction.BACKWARD);
                break;
			case 'ArrowRight': // Move forward
				stopMove();
                moveOneDebounced(direction.FORWARD);
				break;
			case 'KeyD':	// Increase velocity
				adjustSpeed(40, wpmDisplay);			
				break;
			case 'KeyS':	// Slow velocity
				adjustSpeed(-40, wpmDisplay);			
				break;
			case 'Space': // Switch to auto mode
				if (timer) {
					// TODO: Make more robut for possible race conditions w animations in adjustSpeed;
					// see: https://github.com/benfrancis314/reading_project/pull/135#discussion_r461689438
					wpmDisplay.fadeOut(500);
					stopMove();
				} else {
					wpmDisplay.fadeIn(500);
					startMove(direction.FORWARD);
				}
				break;
			case 'ShiftRight':
				persistentHighlight();
				break;
			case 'Slash':
				toggleKeywordSettings();
				break;
			default:
                break;
		}

        let endTime = new Date();
        let elapsedTimeMs = endTime - startTime;
        debug(`Took ${elapsedTimeMs} ms to respond to event ${evt.code}`);
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
	// Remove all keydown events in namespace "running"
	jdoc.off('keydown.running');
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
function oneTimeSetup(cb) {
	let readableDomEls = window.parseDocument();
	doc = new Doc(readableDomEls);
	// TODO: Refactor/move this, it currently can't run bc doc isn't ready
	// If page is not readable, stop setting up the rest of the app.
	// if (doc.sentences.length === 0) {
	// 	debug("Stopping app init because page is not readable");
	// 	return;
	// }
	tracker = new Tracker(doc);
	// TODO: Refactor using promise logic so this is more readable.
	// Load all the persistent settings, then render the UI.
	settings.getSpeed(function(settingsSpeed) {
		speed = settingsSpeed;
	});
	// This is used to call setupKeyListenerForOnOff() after making sure everything is setup
	cb();
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
  
	setupSentenceClickListeners();
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

function setupKeyListenerForOnOff() {
	jdoc.on("keydown", function(evt) {
		if (!document.hasFocus()) {
		  return true;
		}
		// Make sure the user isn't trying to type anything
		// If there are exceptions to this it should hopefully come up during testing
		// There probably will be exceptions, so the key is WHAT are the exceptions
		let focuses = $(":focus");
		if (focuses.is("input") || focuses.is("form") || focuses.is("textarea")) { console.log("input"); return }

		if (evt.code == 'KeyR') { 
			toggleExtensionVisibility();
			return true;
		}
	})
};

oneTimeSetup(function() {setupKeyListenerForOnOff()});
})(); // End of namespace