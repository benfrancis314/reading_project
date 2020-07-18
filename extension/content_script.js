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
var speed = 20; // Base speed, not accounting for sentence length; adjustable w/ D/S
var speed_bias = 500; // Minimum amount of speed spent on each sentence (in milliseconds)
// If the screen is currently scrolling. If it is, pause the tracker.
var isScrolling = false;
var currentStyle = "markedBoxShadow"; // TEMPORARY global variable, just for style experimentation. Will get rid of later

/*
To do:
1. Make necessary comments
2. Modularize where able

Functions: 
1. Click to highlight beginning of sentence
2. Move (up/down fed as argument)
3. Move up one sentence
5. Move down one sentence
6. Find end of one chunk (sentence OR semicolon OR ... )
7. Tracker length (also sets the boundary)
8. Read listener
*/ 

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
}

// Calculate lingering time for current tracker in ms.
function calculateTrackerLife() {
	return (speed * tracker.getTrackerLen()) + speed_bias;
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
	let markedTopAbsoluteOffset = $("."+currentStyle).offset().top;
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
	let markedTopAbsoluteOffset = $("."+currentStyle).offset().top;
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
	let markEl = $("."+currentStyle);
	markEl.unmark();
	markEl.removeClass(currentStyle);
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
		className: currentStyle
	});
	highlightKeyWords(container, start, end);
};

	/*
    Params: Current container, start and end of tracker (jQuery element, int, int)
    Highlights the keywords within the tracked sentence. 
    */
function highlightKeyWords(container, start, end) {
	// TODO: Mark.js is actually built to do this; migrate functionality to mark.js
	let keywordStyle = "keyWord";
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
	let markEl = $("mark");
	// Some async issue. If marker already gets deleted but not initialized.
	if (!markEl) {
		return;
	}
	let rgb = jQuery.Color(markEl.css('backgroundColor'));
	// Set alpha to 0, and animate towards this, to simulate bg fade of same color.
	let newRgba = `rgba(${rgb.red()}, ${rgb.green()}, ${rgb.blue()}, 0)`
	markEl.animate({ 'background-color': newRgba }, calculateTrackerLife());
}

function readListener() {
	document.addEventListener('keydown', function(evt) {
		if (!document.hasFocus()) {
		  return true;
		}
		switch (evt.code) {
			case 'ArrowLeft': // Move back
                startMove(direction.BACKWARD);
                break;
			case 'ArrowRight': // Move forward
                startMove(direction.FORWARD);
				break;
			case 'KeyD':	// Increase velocity
				speed -= 2;
				display.updateSpeed(speed);
				break;
			case 'KeyS':	// Slow velocity
				speed += 2;
				display.updateSpeed(speed);
				break;
			// case 'KeyU':	// Update display -> FOR TESTING
			// 	display.updateDisplay();
			// 	break;
			case 'AltLeft': // Switch to auto mode
				if (timer) {
					stopMove();
				} else {
					startMove(direction.FORWARD);
				}
				break;
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


let readableDomIds = window.parseDocument();
doc = new Doc(readableDomIds);
tracker = new Tracker(readableDomIds);
display = new Display(readableDomIds, speed, doc.getTotalWords());



setupClickListener(tracker);
readListener();

startMove(direction.FORWARD); // Start reader on the first line
stopMove(); // Prevent from continuing to go forward


// Uncomment this if you want to see the relative y offsets of current container
// so you can tweak the auto-scroll feature.
/*
$(window).scroll(function() {
	console.log(`Window container's top Y = ${getContainer(containerId).offset().top
		- $(window).scrollTop()}`);
});
*/




})(); // End of namespace