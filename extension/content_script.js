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
// This will be read once from persistent settings during initialization. 
let speed = null; // WPM, Base speed, not accounting for sentence length; adjustable w/ D/S
// Persistent settings.
let settings = window.settings;
var speed_bias = 500; // Minimum amount of speed spent on each sentence (in milliseconds)
// If the screen is currently scrolling. If it is, pause the tracker.
var isScrolling = false;

/*
Process of determining which style to use. 
TODO: Redo this using CSS variable or something. 
Problem is that highlighter and shadow need to be in the same ID;
not scalable right now to more customizable settings that effect the tracker. 
*/
var highlighterSetting = "Blue";
var shadowSetting = "Yellow";
var keywordSetting = "Green";
// // Expose to global (TODO: Refactor)
window.highlighterSetting = highlighterSetting;
window.shadowSetting = shadowSetting;
window.keywordSetting = keywordSetting;

let trackerStyle = "trackerHighlighter"+highlighterSetting+"Shadow"+shadowSetting; // TODO: Refactor this color selection process

// Classname for keyword highlights.

let keywordStyle = "keyWord"+keywordSetting;

// Possible reading directions.
const direction = {
    BACKWARD: 0,
    FORWARD: 1
}
/*
Handle click events for each readable item.
Params:
- tracker. The tracker to be updated when an item is clicked.
*/
// Handle click events for each readable item.
function setupClickListener(tracker) {
	for (let i = 0; i < tracker.readableDomIds.length; i++) {
		let container = tracker.getContainer(i);
		container.click(function () {
			tracker.pointToContainer(i);
			highlight(tracker);
		});
	}
}

/*
If a tracker is currently moving, stop it.
See startMove()
*/
function stopMove() {
	if (timer) {
		// Stop fading animation.
		$("mark").stop();
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

	let moveFn = null;
	if (dir == direction.BACKWARD) {
		moveFn = moveUpOne;
	} else if (dir == direction.FORWARD) {
		moveFn = moveDownOne;
	}

	// Schedule continuous movement, with the first move being run immediately.
	(function repeat() { // Allows speed to be updated WHILE moving
		// TODO: Consider returning boolean to see if there is any movement left
		// If false, stop moving.
		moveFn();
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
	const speed_bias_ms = 500; // Half of a second; is this too long?
	let containerId = tracker.getContainerId();
	// This is an array that has the number of sentences in each container. The 1st container has the 1st element in this array, and so on.  
	let container_sentences_map = doc.getContainerSentencesMap().slice(containerId); // Don't include containers before current container
	let sentences_remaining = 0; // This will be sentences remaining on page
	// Sum up sentences in array
	for (var i = 0; i < container_sentences_map.length; i++) {
		sentences_remaining += container_sentences_map[i]; 
	}
	let sentence_words = tracker.getTrackerLen() // Words in current sentence
	// TODO: This should be total_words_REMAINING
	let total_words = doc.getTotalWords(); // Total words on page
	let base_time_s = sentences_remaining * speed_bias_ms/1000; // Time from just speed_bias on each sentence. In seconds
	let desired_time_s = display.getTimeRemaining() * 60; // Time we need to finish in
	let distributable_time = desired_time_s - base_time_s; // Time left to distribute to sentences
	let word_ratio = sentence_words/total_words;
	let linger_time_ms = distributable_time*(word_ratio)*1000 + speed_bias_ms; // convert from s to ms
	return (linger_time_ms); 
	// TODO: Use Moment.js
}

// Move one sentence up
function moveUpOne() { // Sets start and end
	// Let scrolling finish before any movement.
	if (isScrolling) {
		return;
	}
	tracker.movePrevious();
	highlight(tracker);
	scrollUp();
}

// Move one sentence down
function moveDownOne() { // Sets start and end
	// Let scrolling finish before any movement.
	if (isScrolling) {
		return;
	}
	tracker.moveNext();
	let readableDomIds = tracker.getReadableDomIds();
	let containerId = tracker.getContainerId();
	display.updateTimer(readableDomIds, containerId);
	highlight(tracker);
	scrollDown();
}

// Scroll up when tracker is above page
function scrollUp() {
	let verticalMargin = 200;
	// Autoscroll if tracker is above top of page.
	// Number of pixels from top of window to top of current container.
	let markedTopAbsoluteOffset = $("."+trackerStyle).offset().top;
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
	let scrollThreshold = 500;
	let verticalMargin = 200;
	// Autoscroll if too far ahead.
	// Number of pixels from top of window to top of current container.
	let markedTopAbsoluteOffset = $("."+trackerStyle).offset().top;
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

/*
Highlight portion pointed to by tracker.
*/
function highlight(tracker) {
	let markEl = $("."+trackerStyle);
	markEl.unmark();
	markEl.removeClass(trackerStyle);
	// Append the "mark" class (?) to the html corresponding to the interval
	// The interval indices are w.r.t to the raw text.
	// mark.js is smart enough to preserve the original html, and even provide
	// multiple consecutive spans to cover embedded htmls
	let container = tracker.getCurrentContainer();
	let start = tracker.getStart();
	let end = tracker.getEnd();
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
	fadeElement($("mark"));
	fadeElement($("." + keywordStyle));
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

function readListener() {

	document.addEventListener('keydown', function(evt) {
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
			// case 'KeyU':	// Update display -> FOR TESTING
			// 	display.updateDisplay();
			// 	break;
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
	}, false);
	document.addEventListener('keyup', function(evt) {
		switch (evt.code) {
			case 'ArrowLeft':
			case 'ArrowRight':
				stopMove();
				break;
		}
    }, false);
    
};

/*
When button is clicked, 
*/
function updateSettings() {
	settings.getKeyword(function(settingsKeyword) {
		keywordSetting = settingsKeyword;
	})
	settings.getHighlighter(function(settingsHighlighter) {
		highlighterSetting = settingsHighlighter;
	})
	settings.getShadow(function(settingsShadow) {
		shadowSetting = settingsShadow;
	})
}

function init() {
	// TODO: Refactor using promise logic so this is more readable.
	// Load all the persistent settings, then render the UI.
	// settings.getKeyword(function(settingsKeyword) {
	// 	keywordSetting = settingsKeyword;
	// })
	// settings.getHighlighter(function(settingsHighlighter) {
	// 	highlighterSetting = settingsHighlighter;
	// })
	// settings.getShadow(function(settingsShadow) {
	// 	shadowSetting = settingsShadow;
	// })
	settings.getSpeed(function(settingsSpeed) {
		speed = settingsSpeed;
		let readableDomIds = window.parseDocument();
		doc = new Doc(readableDomIds);
		tracker = new Tracker(readableDomIds);
		display = new Display(readableDomIds, speed, doc.getTotalWords());

		setupClickListener(tracker);
		readListener();

		keywordSetting, highlighterSetting, shadowSetting = display.getSettings();
		console.log(keywordSetting, highlighterSetting, shadowSetting);

		startMove(direction.FORWARD); // Start reader on the first line
		stopMove(); // Prevent from continuing to go forward
	});
}

init();

// Uncomment this if you want to see the relative y offsets of current container
// so you can tweak the auto-scroll feature.
/*
$(window).scroll(function() {
	console.log(`Window container's top Y = ${getContainer(containerId).offset().top
		- $(window).scrollTop()}`);
});
*/




})(); // End of namespace