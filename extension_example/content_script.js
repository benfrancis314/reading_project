var container = $("p:first")
var start = 0
var end = 0
init = 0

$(function () {
    $("p").click(function () {
		container = $(this);
		start = 0
		end = container.text().indexOf(". ", start)
		highlight(container, start, end)
	});
});

function initContentScript() {
	// innerHTML of this container will be changing
    // let container = $("#Methods_and_thanks").next();
    end = container.text().indexOf(". ", start)
	highlight(container, start, end)
}
function moveUp() {
	// This is actually more non-trivial than I thought
	len = container.text().length
	end = start -2
	rev = container.text().split("").reverse().join("")
	if (rev.indexOf(" .", len-end) > 0) {
		start = len - rev.indexOf(" .", len-end)
	} else { 
		console.log("start<0 did trigger")
		start = 0 
	}
	if (start < 0) {start = 0}
	// console.log("len"+len)
	// console.log("end"+end)
	// console.log("start"+start)
    if (end < 0) {
		// console.log("end<0 did trigger")
		container = container.prev()
		// console.log(container.text())
		len = container.text().length
		// console.log("len"+len)
		end = len
		// console.log("end"+end)
		rev = container.text().split("").reverse().join("")
		// console.log("rev"+rev)
		if (rev.indexOf(" .", len-end) > 0) {
			start = len - rev.indexOf(" .", len-end)
		} else { 
			// console.log("start<0 did trigger")
			start = 0 
		}
		console.log("start"+start)
    } 
    highlight(container, start, end)
}

function moveDown() {
	if (init == 0) { initContentScript }
	len = container.text().length
    start = end + 2
    end = container.text().indexOf(". ", start+2)
	if (end < 0) { end = len }
    if (start >= len) {
		container = container.next()
        start = 0
		end = container.text().indexOf(". ", start+2)
		if (end < 0) { end = container.text().length}
    } 
    highlight(container, start, end)
}

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
}

function readListener() {
	document.addEventListener('keydown', function(evt) {
		if (!document.hasFocus()) {
		  return true;
		}
		switch (evt.keyCode) {
            // Up
			case 38:
                moveUp()
                break;
            // Down
			case 40:
                moveDown()
				break;
			default:
                break;
		}
		return true;
    }, false);
}




// initContentScript();
readListener();
