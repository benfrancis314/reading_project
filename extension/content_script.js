// Prevent the usage of undeclared variables.
"use strict";

// Keeps track of pointed text. 
var tracker = null;
// Whether or not there is a timer that triggers movement of tracker.
// null means tracker is static. Non-null means there is a scheduled timer that
// keeps moving the tracker around.
var timer = null;
var speed = 10; // Base speed, not accounting for sentence length; adjustable w/ D/S
var speed_bias = 500; // Minimum amount of speed spent on each sentence (in milliseconds)
var speed_adj = 0; // Speed after it has been adjusted by sentence length
var firstMove = true; // Is this the first time it has been moved? True until after first movement. 
// If the screen is currently scrolling. If it is, pause the tracker.
var isScrolling = false;

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

// Each readable item
// Assumes that readableDomId is already populated
function setupClickListener() {
	for (let i = 0; i < tracker.readableDomIds.length; i++) {
		let container = tracker.getContainer(i);
		container.click(function () {
			tracker.pointToContainer(i);
			highlight(tracker);
		});
	}
}

// Move tracker
function move(type) { // Note: I have combined the "moveUp" and "moveDown" functions here
	if (firstMove) { // When button is first clicked
		if (type == "up") { moveUpOne(); }
		else if (type == "down") { moveDownOne();}
		firstMove = false;
	} else {  // When the button is held down
		if (!timer) {
			(function repeat() { // Allows speed to be updated WHILE moving
				if (type == "up") { moveUpOne(); }
				else if (type == "down") { moveDownOne(); };
				timer = setTimeout(repeat, speed_adj);
			})();
		};
	};
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
	let markedTopAbsoluteOffset = $(".marked").offset().top;
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
	$(".marked").unmark();
	$(".marked").removeClass("marked");
	// Append the "mark" class (?) to the html corresponding to the interval
	// The interval indices are w.r.t to the raw text.
	// mark.js is smart enough to preserve the original html, and even provide
	// multiple consecutive spans to cover embedded htmls
	tracker.getCurrentContainer().markRanges([{
    	start: tracker.getStart(),
    	length: tracker.getEnd() - tracker.getStart()
	}], {
		className: 'marked'
	});
};

// If a tracker is currently moving, turn it off.
function stopTracker() {
	if (!document.hasFocus()) {
	  return true;
	}
	if (timer) { 
		clearInterval(timer);
		timer = null;
	}
}

function readListener() {
	document.addEventListener('keydown', function(evt) {
		if (!document.hasFocus()) {
		  return true;
		}
		switch (evt.code) {
			case 'ArrowLeft': // Move back
                move("up");
                break;
			case 'ArrowRight': // Move forward
                move("down");
				break;
			case 'KeyD':	// Increase velocity
				speed -= 2;
				break;
			case 'KeyS':	// Slow velocity
				speed += 2;
				break;
			case 'AltLeft': // Switch to auto mode
				if (timer) {
					stopTracker();
				} else {
					move("down");
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
				stopTracker();
				break;
		}
    }, false);
};

/*
Attach IDs to all elements in document.
Populate the global variable readableDomIds.
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
tracker = new Tracker(readableDomIds);
setupClickListener();
readListener();
// Uncomment this if you want to see the relative y offsets of current container
// so you can tweak the auto-scroll feature.
/*
$(window).scroll(function() {
	console.log(`Window container's top Y = ${getContainer(containerId).offset().top
		- $(window).scrollTop()}`);
});
*/

// ==================================================

// IN-PROGRESS FUNCTIONS: 

// ==================================================









// FIND END OF CHUNK ******************************************


/* NOT USING YET; saving code for implementation. 
	Used to identify end points other than periods. */

// function findEndChunk(containerText, start) {
// 	possibleEnds = [0,0,0];
// 	min = containerText.toString().length;
// 	possibleEnds[0] = containerText.toString().indexOf(". ", start);
// 	possibleEnds[1] = containerText.toString().indexOf("; ", start);
// 	possibleEnds[2] = containerText.toString().indexOf(".[", start);
// 	for (i in possibleEnds) { 
// 		if ((possibleEnds[i] < min) & (possibleEnds[i] > 0)) { 
// 			min = possibleEnds[i];
// 		};
// 	};
// 	return min;
// }

// ************************************************************
