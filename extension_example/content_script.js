// Prevent the usage of undeclared variables.
"use strict";
var start = 0;
var end = 0;

// Whether or not there is a timer that triggers movement of tracker.
// null means tracker is static. Non-null means there is a scheduled timer that
// keeps moving the tracker around.
var timer = null;
var speed = 10;
var init = 0;
var scrollType = "velocity_mode";

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
		});
	}
}

function moveUp() {
	if (!timer) {
		moveUpOne();
		timer = setInterval(moveUpOne, speed*50);
	}
}

function moveUpOne() {
	let container = getContainer(containerId);
	let text = container.text();
	let len = text.length;
	end = start -2;
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
    highlight(container, start, end);
}

function moveDown() {
	if (!timer) {
		moveDownOne();
		timer = setInterval(moveDownOne, speed*50);
	}
}

function findEndChunk(containerText, start) {
	let possibleEnds = [0,0,0];
	let min = containerText.toString().length;
	possibleEnds[0] = containerText.toString().indexOf(". ", start);
	possibleEnds[1] = containerText.toString().indexOf("; ", start);
	possibleEnds[2] = containerText.toString().indexOf(".[", start);
	for (let i in possibleEnds) { 
		if ((possibleEnds[i] < min) & (possibleEnds[i] > 0)) { 
			min = possibleEnds[i];
		};
	};
	return min;
}

function moveDownOne() {
	// Wait for scrolling to finish before moving down.
	if (isScrolling) {
		return;
	}
	if (init == 0) { 
		containerId = 0;
		let container = getContainer(containerId);
        start = 0;
		end = findEndChunk(container, start);
		highlight(container, start, end);
		init = 1;
		return;
	};

	let container = getContainer(containerId);
	let containerText = container.text();
	let len = containerText.length;
	start = end + 2;
	end = findEndChunk(containerText, start +2);
	if (end < 0) { end = len };
    if (start >= len) {
    	if (containerId >= readableDomIds.length - 1) {
    		// Reached the end, no more container.
    		return;
    	}
    	containerId++;
		container = getContainer(containerId);
		containerText = container.text();
		start = 0;
		end = findEndChunk(containerText, start+2);
		if (end < 0) { end = containerText.length};
	};
    highlight(container, start, end);


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
};

/**
Highlight a portion container.text(), from start_off to end_off (exclusive).
*/
function highlight(container, start_off, end_off) {
	$(".marked").unmark();
	$(".marked").removeClass("marked");
	// Append the class "highlighted" to the html corresponding to the interval
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
                moveUp();
                break;
			case 'ArrowRight': // Move forward
                moveDown();
				break;
			case 'KeyD':	// Increase velocity
				speed -= 2;
				break;
			case 'KeyS':	// Slow velocity
				speed += 2;
				break;
                moveDown();
				break;
			case 'AltLeft':
				if (timer) {
					stopTracker();
				} else {
					moveDown();
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
	})

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

// Uncomment this if you want to see the relative y offsets of current container
// so you can tweak the auto-scroll feature.
/*
$(window).scroll(function() {
	console.log(`Window container's top Y = ${getContainer(containerId).offset().top
		- $(window).scrollTop()}`);
});
*/

parseDocument();
setupClickListener();
readListener();
