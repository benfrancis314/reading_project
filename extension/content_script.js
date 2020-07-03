// Prevent the usage of undeclared variables.
"use strict";

var container = null;
var start = 0;
var end = 0;
// Whether or not there is a timer that triggers movement of tracker.
// null means tracker is static. Non-null means there is a scheduled timer that
// keeps moving the tracker around.
var timer = null;
var speed = 10; // Base speed, not accounting for sentence length; adjustable w/ D/S
var speed_bias = 500; // Minimum amount of speed (Set to half of a second)
var speed_adj = 0;
var init = 0;
var firstMove = 1; // Is this the first time it has been moved?
var tracker_len = 0;
var startReading = 1;
// List of dom IDs that contain readable content.
// Sorted in order of reading progression. 
// E.g. $("#" + readableDomIds[0]) gets you the jQuery element to the first readable content.
// Populated by parseDocument()
var readableDomIds = [];
// Pointer to an element in readableDomIds. The current container the tracker is in.
// Will always be in [0, readableDomIds.length)
var containerId = 0;
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

// Get the jquery container from readableDomIds corresponding to containerId.
function getContainer(containerId) {
	if (containerId < 0 || containerId >= readableDomIds.length) {
		throw `Invalid ${containerId}, should be [0, ${readableDomIds.length})`;
	}
	return $("#" + readableDomIds[containerId]);
}

// Each readable item
// Assumes that readableDomId is already populated
function setupClickListener() {
	for (let i = 0; i < readableDomIds.length; i++) {
		getContainer(i).click(function () {
			containerId = i;
			let container = getContainer(containerId);
			start = 0;
			let txt = container.text();
			end = txt.indexOf(". ", start);
			if (end < 0) {
				end = txt.length;
			}
			highlight(container, start, end);
			init = 1;
			if (startReading) {startReading = 0};
		});
	}
}

function move(type) { // Note: I have combined the "moveUp" and "moveDown" functions here
	if (startReading) {
		console.log("startReading");
		let container = getContainer(0);
		start = 0;
		let txt = container.text();
		end = txt.indexOf(". ", start);
		if (end < 0) {
			end = txt.length;
		}
		highlight(container, start, end);
		init = 1;
		startReading = 0;
		return 0;
	}
	if (firstMove == 1) { // First time the button is clicked
		if (type == "up") { moveUpOne(); }
		else if (type == "down") { moveDownOne();}
		firstMove = 0;
	} else {  // If the button is held down
		if (!timer) {
			(function repeat() { // Allows speed to be updated WHILE moving
				timer = setTimeout(repeat, speed_adj);
				if (type == "up") { moveUpOne(); }
				else if (type == "down") { moveDownOne();}
				
			})();
		};
	};
}


// Will probably combine these two functions in future
function moveUpOne() { // Sets start and end
	tracker_len = trackerLen("up");
	highlight(container, start, end);
	speed_adj = speed * (tracker_len);
}

function moveDownOne() { // Sets start and end
	tracker_len = trackerLen("down");
	highlight(container, start, end);
	speed_adj = speed * (tracker_len) + speed_bias;
};
//// 

function trackerLen(type) {
	if (init == 0) { // If no section selected yet, selects first paragraph
		containerId = 0;
		let container = getContainer(containerId);
		start = 0;
		trackerLen();
		highlight(container, start, end);
		init = 1;
	};
	if (type == "down") { // Run for DOWN movement: Finds START and END
		// Wait for scrolling to finish before moving down.
		if (isScrolling) {
			return;
		}
		container = getContainer(containerId);
		let text = container.text();
		let len = text.length;
		start = end + 2; // Compensate for the ". " at the end of sentence
		end = text.indexOf(". ", start);
		if (end < 0) { end = len };
		if (start >= len) {
			if (containerId >=  readableDomIds.length - 1) {
				// Reached the end, no more container.
				return;
			}

			containerId++;
			container = getContainer(containerId);
			text = container.text();
			start = 0;
			end = text.indexOf(". ", start);
			if (end < 0) { end = text.length};
		};

		// Autoscroll if too far ahead.
		// Number of pixels from top of window to top of current container.
		let markedTopAbsoluteOffset = $(".marked").offset().top;
		let markedTopRelativeOffset = markedTopAbsoluteOffset - $(window).scrollTop();
		if (markedTopRelativeOffset > 500) {
			isScrolling = true;
			$('html, body').animate(
				// Leave some vertical margin before the container.
				{scrollTop: (markedTopAbsoluteOffset - 200)},
				500, /* duration(ms) */
				function() {
					isScrolling = false;
				}
			);
		}
	}
	else if (type == "up") { // Run for UP movement: Find START and END
		container = getContainer(containerId);
		let text = container.text();
		let len = text.length;
		end = start - 2; // Compensate for the ". " at the end of sentence
		let rev = text.split("").reverse().join("");
		if (rev.indexOf(" .", len-end) > 0) {
			start = len - rev.indexOf(" .", len-end);
		} else { 
			start = 0;
		};
		if (start < 0) {start = 0};
		if (end < 0) {
			if (containerId == 0) {
				// Can't go back anymore. 
				return;
			}
			containerId--;
			container = getContainer(containerId);
			text = container.text();
			len = text.length;
			end = len;
			rev = text.split("").reverse().join("");
			if (rev.indexOf(" .", len-end) > 0) {
				start = len - rev.indexOf(" .", len-end);
			} else { 
				start = 0;
			};
		};
	}
	let tracker_len = end - start;
	return tracker_len;
}

/**
Highlight a portion container.text(), from start_off to end_off (exclusive).
*/
function highlight(container, start_off, end_off) {
	$(".marked").unmark();
	$(".marked").removeClass("marked");
	// Append the "mark" class (?) to the html corresponding to the interval
	// The interval indices are w.r.t to the raw text.
	// mark.js is smart enough to preserve the original html, and even provide
	// multiple consecutive spans to cover embedded htmls
	container.markRanges([{
    	start: start_off,
    	length: end_off - start_off
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
			case 'AltLeft':
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

	readableDomIds = [];
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

parseDocument();
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
