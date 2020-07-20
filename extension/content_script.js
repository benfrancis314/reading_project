// Prevent the usage of undeclared variables.
"use strict";

(function(){
var namespace = "content_script.js";
if (window[namespace] === true) {
	return;
} else {
	window[namespace] = true;
}

// Keeps track of the pointed text. Initialized by end of script load.
var tracker = null;
// Creates display for time remaining and reading speed at top of page. Initialized by end of script load.
var display = null;
// Represents document the user is reading. Stores data about page, like keywords, total words, etc.
var doc = null;
// Whether or not there is a timer that triggers movement of tracker.
// There are only two movement-related states.
// 1. null means tracker is static.
// 2. Non-null means there is a scheduled timer that keeps moving the tracker around.
var timer = null;
<<<<<<< HEAD
// This will be read once from persistent settings during initialization. 
let speed = null; // WPM, Base speed, not accounting for sentence length; adjustable w/ D/S
// Persistent settings.
let settings = window.settings;
=======
var speed = 400; // WPM, Base speed, not accounting for sentence length; adjustable w/ D/S
>>>>>>> changed calculation of tracker life to be accurate, and to reflect whether on auto or not
var speed_bias = 500; // Minimum amount of speed spent on each sentence (in milliseconds)
// If the screen is currently scrolling. If it is, pause the tracker.
var isScrolling = false;

// Need the same $ reference for on and off of event handlers to be detectable.
// Re-doing $(document) in an async context for somre reason doesn't allow you 
// to detect previously attached event handlers.
// Not sure why, but found this through experimentation.
let jdoc = $(document);

/*
Process of determining which style to use. 
TODO: Redo this using CSS variable or something. 
Problem is that highlighter and shadow need to be in the same ID;
not scalable right now to more customizable settings that effect the tracker. 
*/
var keywordStyle = null; // will be CSS ID of keywords
var trackerStyle = null; // will be CSS ID of tracker
window.keywordStyle = keywordStyle;
window.trackerStyle = trackerStyle;

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
			display.updateTimer(tracker.getSentenceId());
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
	display.updateAutoMode(false);
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

// TODO: Maybe refactor so it doesn't when turn on automode?
function startMove(dir) { // Note: I have combined the "moveUp" and "moveDown" functions here
	if (timer) {
		return;
	}

	// Schedule continuous movement, with the first move being run immediately.
	(function repeat() { // Allows speed to be updated WHILE moving
		// If there is no more movement to be made, stop autoscroll.
		let hasMoved = moveOne(dir);
		if (!hasMoved) {
			stopMove();
			return;
		}

		timer = setTimeout(repeat, calculateTrackerLife());
		// Immediately fade current tracker.
		fadeTracker();
	})();
	display.updateAutoMode(true);
}

// Calculate lingering time for current tracker in ms.
// TODO: Why does this get called twice?
function calculateTrackerLife() {
	/* Methodology of calculating tracker life: 
		Each sentence has a minimum amount of time to stay on; i.e., a bias. 
		The user specifies the WPM they want, and this calculates a time remaining. 
		This function then distributes the remaining time to each sentence according
		to ratio of the sentence_words:total_words. 
	*/
<<<<<<< HEAD
	const speed_bias_ms = 500; // Half of a second; is this too long?

	let sentenceId = tracker.getSentenceId();
	let sentencePtr = doc.getSentence(sentenceId);

	let containerId = sentencePtr.containerId;
	let sentences_remaining = doc.getNumSentencesFromSentenceTilEnd(sentenceId);
	let sentence_words = doc.getNumWordsInSentence(sentenceId); // Words in current sentence
	let total_words_remaining = doc.getNumWordsFromSentenceTilEnd(sentenceId);
	let base_time_s = sentences_remaining * speed_bias_ms/1000; // Time from just speed_bias on each sentence. In seconds
	let desired_time_s = display.getTimeRemaining() * 60; // Time we need to finish in
	let distributable_time = desired_time_s - base_time_s; // Time left to distribute to sentences
	let word_ratio = sentence_words/total_words_remaining;
	let linger_time_ms = distributable_time*(word_ratio)*1000 + speed_bias_ms; // convert from s to ms

	return (linger_time_ms); 
	// TODO: Use Moment.js
=======
	const speed_bias = 500; // Half of a second; is this too long?
	let containerId = tracker.getContainerId();
	// This is an array that has the number of sentences in each container. The 1st container has the 1st element in this array, and so on.  
	let container_sentences_map = doc.getContainerSentencesMap().slice(containerId); // Don't include containers before current container
	let sentences_remaining = 0; // This will be sentences remaining on page
	// Sum up sentences in array
	for (var i = 0; i < container_sentences_map.length; i++) {
		sentences_remaining += container_sentences_map[i]; 
	}
	let sentence_words = tracker.getTrackerLen() // Words in current sentence
	let total_words = doc.getTotalWords(); // Total words on page
	let base_time = sentences_remaining * speed_bias /1000; // Time from just speed_bias on each sentence. In seconds
	let desired_time = display.getTimeRemaining() * 60; // Time we need to finish in
	let distributable_time = desired_time - base_time; // Time left to distribute to sentences
	let word_ratio = sentence_words/total_words;
	let linger_time = distributable_time*(word_ratio)*1000 + speed_bias; // convert from s to ms
	return (linger_time);
>>>>>>> changed calculation of tracker life to be accurate, and to reflect whether on auto or not
}

/*
Move one sentence in the given direction.
Return:
- Boolean: True iff tracker successfully moved. False if there is no more element to move to.
*/
function moveOne(dir) { // Sets start and end
	// Let scrolling finish before any movement.
	if (isScrolling) {
		return;
	}

	let hasMoved = false;

	if (dir == direction.BACKWARD) {
		hasMoved = tracker.movePrevious();
	} else if (dir == direction.FORWARD) {
		hasMoved = tracker.moveNext();
	}
	if (!hasMoved) {
		return false;
	}
	display.updateTimer(tracker.getSentenceId());
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
	// Check to see if we should use old style or look for new
	let tracker_style_current = null; // Depends on if style was just switched
	if ($("."+trackerStyle)) {
		tracker_style_current = trackerStyle
	} else { 
		let displaySettings = display.getSettings();
		tracker_style_current = "trackerHighlighter"+displaySettings[1]+"Shadow"+displaySettings[2]; 
	}

	let verticalMargin = 200;
	// Autoscroll if tracker is above top of page.
	// Number of pixels from top of window to top of current container.
	let markedTopAbsoluteOffset = $("."+tracker_style_current).offset().top;
	let markedTopRelativeOffset = markedTopAbsoluteOffset - $(window).scrollTop();
	if (markedTopRelativeOffset < 0) {
		isScrolling = true;
		$('html, body').animate(
			// Leave some vertical margin before the container.
			{scrollTop: (markedTopAbsoluteOffset - verticalMargin)},
			500, /* duration(ms) */
			function() {
				isScrolling = false;
			}
		);
	}
}

// Scroll down when tracker is below a certain point
function scrollDown() {
	// Check to see if we should use old style or look for new
	let tracker_style_current = null; // Depends on if style was just switched
	if ($("."+trackerStyle)) {
		tracker_style_current = trackerStyle
	} else { 
		let displaySettings = display.getSettings();
		tracker_style_current = "trackerHighlighter"+displaySettings[1]+"Shadow"+displaySettings[2]; 
	}
	
	let scrollThreshold = 500;
	let verticalMargin = 200;
	// Autoscroll if too far ahead.
	// Number of pixels from top of window to top of current container.

	let markedTopAbsoluteOffset = $("."+tracker_style_current).offset().top;
	let markedTopRelativeOffset = markedTopAbsoluteOffset - $(window).scrollTop();
	if (markedTopRelativeOffset > scrollThreshold) {
		isScrolling = true;
		$('html, body').animate(
			// Leave some vertical margin before the container.
			{scrollTop: (markedTopAbsoluteOffset - verticalMargin)},
			500, /* duration(ms) */
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
  // TODO: If this is broken, make a tracker class that never changes. Then use the ID for styling
	$("." + trackerStyle).unmark(); 
	$("." + keywordStyle).unmark();
}

/*
Highlight portion pointed to by tracker.
*/
function highlight(tracker) {
	// Notice trackerStyle here is NOT immediately updated when user changes settings;
	// We need the old trackerStyle name to be able to find and remove the styling, 
	// since the next sentence will get a new style. 
	let markEl = $("."+trackerStyle);
	markEl.unmark();
	markEl.removeClass(trackerStyle);
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
		className: trackerStyle
	});
	highlightKeyWords(container, start, end);
};

	/*
    Params: Current container, start and end of tracker (jQuery element, int, int)
    Highlights the keywords within the tracked sentence. 
    */
function highlightKeyWords(container, start, end) {
	// TODO: Refactor this; this should be reset whenever it is changed, not checked every sentence
	let displaySettings = display.getSettings();
	let keywordStyle = "keyWord"+displaySettings[0]; 
	// TODO: Mark.js is actually built to do this; migrate functionality to mark.js
	$("."+keywordStyle).unmark(); // Remove previous sentence keyword styling
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
			className: keywordStyle
		});
	}
};

/*
Fade the current tracker indicator according to the calculated speed.
*/
function fadeTracker() {
	let displaySettings = display.getSettings();
	let keywordStyle = "keyWord"+displaySettings[0];
	fadeElement($("mark"));
	fadeElement($("." + keywordStyle));
}

/*
Stop all animations related to fading.
*/
function stopFadeTracker() {
	$("mark").stop();
	$("." + keywordStyle).stop();
}


function fadeElement(el) {
	// Some async issue. If marker already gets deleted but not initialized.
	if (!el) {
		return;
	}
	let rgb = jQuery.Color(el.css('backgroundColor'));
	// Set alpha to 0, and animate towards this, to simulate bg fade of same color.
	let newRgba = `rgba(${rgb.red()}, ${rgb.green()}, ${rgb.blue()}, 0)`
	el.animate({ 'background-color': newRgba }, calculateTrackerLife());
}

/*
Adjust current speed by speedDelta, and persist the setting.
*/
function adjustSpeed(speedDelta) {
	speed += speedDelta;
	settings.setSpeed(speed);
	display.updateSpeed(speed);
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
                startMove(direction.BACKWARD);
                break;
			case 'ArrowRight': // Move forward
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
					stopMove();
					display.updateTimer(readableDomIds, tracker.getContainerId());
				} else {
					startMove(direction.FORWARD);
					display.updateTimer(readableDomIds, tracker.getContainerId());
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



/*
Process of determining which style to use. 
TODO: Redo this using CSS variable or something. 
Problem is that highlighter and shadow need to be in the same ID;
not scalable right now to more customizable settings that effect the tracker. 
*/

// var trackerStyle = "trackerHighlighter"+highlighterSetting+"Shadow"+shadowSetting; // TODO: Refactor this color selection process

// Classname for keyword highlights.

function initializeTracker(settingsCustomizations) {
	keywordStyle = "keyWord"+settingsCustomizations[0]; // 0th element is the keyword type
	// TODO: Refactor this color selection process; won't scale
	trackerStyle = "trackerHighlighter"+settingsCustomizations[1]+"Shadow"+settingsCustomizations[2]; // 1st element is highlighter type, 2nd element is shadow type
	// console.log(keywordStyle);
	// console.log(trackerStyle);
	startMove(direction.FORWARD); // Start reader on the first line
	stopMove(); // Prevent from continuing to go forward
}



/*
REMOVE THIS
*/
function updateDisplaySettings() {
	let displaySettings = []; // Settings: 1: Keyword 2: Highlighter 3: Shadow
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
	display = new Display(doc, speed);
  
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
	display.turnDownUI();
	display = null;
}

function toggleExtensionVisibility() {
	if (display === null) {
		setupUI();
	} else {
		removeUI();
	}
}

oneTimeSetup();
})(); // End of namespace