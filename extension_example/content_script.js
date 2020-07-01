var container = $("p:first");
var start = 0;
var end = 0;
var timer = 0;
var speed = 10; // Base speed, not accounting for sentence length; adjustable w/ D/S
var speed_adjusted = 0;
var init = 0;
var firstMove = 1; // Is this the first time it has been moved?
var tracker_len = 0;
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


// Click on a paragraph to highlight its beginning sentence
$(function clickSection() {
    $("p").click(function () {
		container = $(this);
		start = 0; // Set to beginning of section
		// trackerLen();
		containerText = container.text();
		end = containerText.indexOf(". ", start);
		highlight(container, start, end);
		init = 1;
	});
});

function move(type) { // Note: I have combined the "moveUp" and "moveDown" functions here
	if (firstMove == 1) { // First time the button is clicked
		if (type == "up") { moveUpOne(); }
		else if (type == "down") { moveDownOne();}
		firstMove = 0;
	} else {  // If the button is held down
		if (!timer) {
			(function repeat() { // Allows speed to be updated WHILE moving
				if (type == "up") { moveUpOne(); }
				else if (type == "down") { moveDownOne();}
				timer = setTimeout(repeat, speed_adj);
			})();
		}
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
	speed_adj = speed * (tracker_len);
};
//// 

function trackerLen(type) {
	if (init == 0) { // If no section selected yet, selects first paragraph
		container = $("p:first");
		trackerLen();
		highlight(container, start, end);
		init = 1;
	};
	if (type == "down") { // Run for DOWN movement: Finds START and END
		containerText = container.text();
		len = containerText.length;
		start = end + 2; // Compensate for the ". " at the end of sentence
		end = containerText.indexOf(". ", start);
		if (end < 0) { end = len };
		if (start >= len) {
			container = container.next();
			containerText = container.text();
			start = 0;
			end = containerText.indexOf(". ", start);
			if (end < 0) { end = containerText.length};
		};
	}
	else if (type == "up") { // Run for UP movement: Find START and END
		len = container.text().length;
		end = start - 2; // Compensate for the ". " at the end of sentence
		rev = container.text().split("").reverse().join("");
		if (rev.indexOf(" .", len-end) > 0) {
			start = len - rev.indexOf(" .", len-end);
		} else { 
			start = 0;
		};
		if (start < 0) {start = 0};
		if (end < 0) {
			container = container.prev();
			len = container.text().length;
			end = len;
			rev = container.text().split("").reverse().join("");
			if (rev.indexOf(" .", len-end) > 0) {
				start = len - rev.indexOf(" .", len-end);
			} else { 
				start = 0;
			};
		};
	}
	return tracker_len = end - start;
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

function readListener() { // General listener for read project
	document.addEventListener('keydown', function(evt) {
		if (!document.hasFocus()) {
		  return true; // Ensure this is the doc you're looking at
		}
		switch (evt.keyCode) {
			case 37:	// Up
                move("up");
                break;
			case 39:	// Down
                move("down");
				break;
			case 68:	// D (Increase velocity)
				// speed = speed - 2;
				speed -= 2;
				break;
			case 83:	// S (Slow velocity)
				speed += 2;
				break;
			default:
                break;
		}
		return true;
	}, false);
	document.addEventListener('keyup', function(evt) {
		if (!document.hasFocus()) {
		  return true;
		}
		clearTimeout(timer); // If using interval in diff version, change to "clearInterval"
		timer = 0;
		firstMove = 1;
    }, false);
};



readListener(); // Listen

















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