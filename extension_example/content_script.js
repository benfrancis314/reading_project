var container = $("p:first");
var start = 0;
var end = 0;
// var velocity = 1;
var timer = 0;
var speed = 10;
var init = 0;
var scrollType = "velocity_mode";

// Click on a paragraph to higlight its beginning sentence
$(function () {
    $("p").click(function () {
		container = $(this);
		start = 0;
		end = container.text().indexOf(". ", start);
		highlight(container, start, end);
		init = 1;
	});
});

// This should be used elsewhere
function initContentScript() {
    end = container.text().indexOf(". ", start);
	highlight(container, start, end);
};
function moveUp() {
	len = container.text().length;
	end = start -2;
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
    highlight(container, start, end);
}

function moveDown() {
	// velocity = 1;
	if (scrollType == "manual_mode") {
		moveDownManual();
	} else {
		if (!timer) {
			timer = setInterval(moveDownManual, 500);
		}
	};
}

function moveDownManual() {
	if (init == 0) { 
		container = $("p:first");
		end = container.text().indexOf(". ", start);
		highlight(container, start, end);
		init = 1;
	};
	len = container.text().length;
    start = end + 2;
    end = container.text().indexOf(". ", start+2);
	if (end < 0) { end = len };
    if (start >= len) {
		container = container.next()
        start = 0
		end = container.text().indexOf(". ", start+2)
		if (end < 0) { end = container.text().length}
    } ;
    highlight(container, start, end);
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

function readListener() {
	document.addEventListener('keydown', function(evt) {
		if (!document.hasFocus()) {
		  return true;
		}
		switch (evt.keyCode) {
            
			case 37:	// Up
                moveUp();
                break;
			case 39:	// Down
                moveDown();
				break;
			case 68:	// D (Increase velocity)
				speed -= 2;
			case 83:	// S (Slow velocity)
				speed += 2;
			case 84:	// T (toggle scroll type)
				if (scrollType == "velocity_mode") { scrollType = "manual_mode" }
				else if (scrollType == "manual_mode") { scrollType = "velocity_mode" };
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
		// if (velocity == 1) { 
		clearInterval(timer);
		timer = 0;
		// }
    }, false);
};

readListener();
