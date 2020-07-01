var container = $("p:first");
var start = 0;
var end = 0;
// var velocity = 1;
var timer = 0;
var speed = 10;
var init = 0;
var scrollType = "velocity_mode";
var firstMove = 1;

// List of dom IDs that contain readable content.
// Sorted in order of reading progression. 
// E.g. $("#" + readableDomIds[0]) gets you the jQuery element to the first readable content.
// Populated by parseDocument()
var readableDomIds = []

// Each readable item
// Assumes that readableDomId is already populated
function setupClickListener() {
	for (const domId of readableDomIds) {
		$("#" + domId).click(function () {
			container = $(this);
			start = 0;
			end = container.text().indexOf(". ", start);
			highlight(container, start, end);
			init = 1;
		});
	}
}

function moveUp() {
	// velocity = 1;
	if (firstMove == 1) {
		moveUpOne();
		firstMove = 0;
	} else {
		if (!timer) {
			timer = setInterval(moveUpOne, speed*50);
		}
	};
}

function moveUpOne() {
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
	velocity = 1;
	if (firstMove == 1) {
		moveDownOne();
		firstMove = 0;
	} else {
		if (!timer) {
			timer = setInterval(moveDownOne, speed*50);
		}
	};
}

function findEndChunk(containerText, start) {
	possibleEnds = [0,0,0];
	min = containerText.toString().length;
	possibleEnds[0] = containerText.toString().indexOf(". ", start);
	possibleEnds[1] = containerText.toString().indexOf("; ", start);
	possibleEnds[2] = containerText.toString().indexOf(".[", start);
	for (i in possibleEnds) { 
		if ((possibleEnds[i] < min) & (possibleEnds[i] > 0)) { 
			min = possibleEnds[i];
		};
	};
	return min;
}

function moveDownOne() {
	if (init == 0) { 
		container = $("p:first");
		end = findEndChunk(container, start);
		highlight(container, start, end);
		init = 1;
	};
	containerText = container.text();
	len = containerText.length;
	start = end + 2;
	end = findEndChunk(containerText, start +2);
	if (end < 0) { end = len };
    if (start >= len) {
		container = container.next();
		conatinerText = container.text();
        start = 0;
		end = findEndChunk(containerText, start+2);
		if (end < 0) { end = containerText.length};
	};
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
		if (velocity == 1) { 
			clearInterval(timer);
			timer = 0;
			firstMove = 1;
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
	let article = new Readability(docClone).parse();
	// Readability.js converts all readable elements into <p>
	$(article.content).find("p").each(function() {
		let id = $(this).attr('id');
		// The unidentified ids seem to be images / iframe snippets that
		// are re-included as-is, but otherwise are not considered readable text.
		// Sometimes I see ads being re-included with undefined ids, so it's probably
		// a good thing to skip these. 
		if (id !== undefined) {
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

parseDocument();
setupClickListener();
readListener();
