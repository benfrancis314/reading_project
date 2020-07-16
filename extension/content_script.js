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
var speed_adj = 0; // Speed after it has been adjusted by sentence length
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
		timer = setTimeout(repeat, speed_adj);
	})();
}

// Move one sentence up
function moveUpOne() { // Sets start and end
	tracker.movePrevious();
	highlight(tracker);
	speed_adj = (speed * tracker.getTrackerLen()) + speed_bias;
}

// Move one sentence down
function moveDownOne() { // Sets start and end
	// Let scrolling finish before any movement.
	if (isScrolling) {
		return;
	}
	tracker.moveNext();
	highlight(tracker);
	scroll();
	speed_adj = (speed * tracker.getTrackerLen()) + speed_bias;
}

function scroll() {
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
	$("."+currentStyle).unmark();
	$("."+currentStyle).removeClass(currentStyle);
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
	doc.highlightKeyWords(container, start, end);
};

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

/*
Attach IDs to all elements in document.
Returns:
- readableDomIds - Dom IDs of readable content to initialize the tracker with.
*/
function parseDocument() {
	// Get all direct + indirect descendants of body that are visible.
	// Generate unique id for each one, if doesn't exist before.
	// This makes sure that after readability.js mutates the clone, we can
	// recover the pointers to the original elements.
	$("body *").filter(":visible").each(function() {
		$(this).uniqueId();
	});

	let readableDomIds = [];
	// Pass clone of document because readability mutates the document.
	let docClone = document.cloneNode(/* deep= */true);
	// TODO: Handle readability failures.
	let article = new Readability(docClone).parse();
	// Readability.js converts all readable elements into <p>
	$(article.content).find("p").each(function() {
		let id = $(this).attr('id');
		// The unidentified ids seem to be images / iframe snippets that
		// are re-included as-is, but otherwise are not considered readable text.
		// Sometimes I see ads being re-included with undefined ids, so it's probably
		// a good thing to skip these. 
		if (id !== undefined && $(`#${id}`).is(":visible")) {
			readableDomIds.push(id);
		}
	});
	return readableDomIds;
	// Uncomment this if you want to see the readable partitions.
	/*
		let colors = ['yellow', 'blue'];
		for (let i = 0; i < readableDomIds.length; i++) {
			let el = $("#" + readableDomIds[i]);
			console.log((i + 1) + ". " + el.html());
			el.css({ "background-color": colors[i % colors.length], "opacity": ".20" });
		}
	*/
}

let readableDomIds = parseDocument();
doc = new Doc(readableDomIds);
tracker = new Tracker(readableDomIds);
window.tracker = tracker; 
display = new Display(readableDomIds, speed, doc.getTotalWords());
window.display = display;



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