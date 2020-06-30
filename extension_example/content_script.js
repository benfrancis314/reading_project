function applyColor(color) {
	document.body.style.backgroundColor = color;
}
function updatePosition(update) {
	if (update === 'down') { position++ }
    else if (update === 'up') { position--}
    else { print("Error") }
}
function initContentScript() {
	document.addEventListener('keydown', function(evt) {
		if (!document.hasFocus()) {
		  return true;
		}
		switch (evt.keyCode) {
			// Left
			case 37:
                applyColor('red');
                break;
                // Up
			case 38:
                applyColor('pink');
				break;
			// Right
			case 39:
				applyColor('blue');
                break;
            // Down
			case 40:
                applyColor('orange');
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
        applyColor('white');
		return true;
	}, false);
}

var container = $("#Methods_and_thanks").next();
// var container = $("#readContainer").next();
var start = 0
var end = 0

$(function () {
    // $("div").click(function () {
	// 	$(this).addClass('readContainer');
	// 	// container = $(this);
	// 	// alert(container.text())
	// });
	$(document).on('click', function (event) {
		$target = $(event.target);   
			$target.addClass('readContainer');
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
	console.log("len"+len)
	console.log("end"+end)
	console.log("start"+start)
    if (end < 0) {
		console.log("end<0 did trigger")
		container = container.prev()
		console.log(container.text())
		len = container.text().length
		console.log("len"+len)
		end = len
		console.log("end"+end)
		rev = container.text().split("").reverse().join("")
		console.log("rev"+rev)
		if (rev.indexOf(" .", len-end) > 0) {
			start = len - rev.indexOf(" .", len-end)
		} else { 
			console.log("start<0 did trigger")
			start = 0 
		}
		console.log("start"+start)
    } 
    highlight(container, start, end)
}

function moveDown() {
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

// function highlight(container, start_off, end_off) {
// 	// TODO: Preserve original html
// 	$(".highlighted").removeClass("highlighted");
// 	let original_html = container.html();
// 	let original_text = container.text();
// 	let highlighted_text = original_text.substring(start_off, end_off);
// 	let new_html = original_text.substring(0, start_off) +
// 		'<span class="highlighted">' +
// 		highlighted_text +
// 		'</span>' +
// 		original_text.substring(end_off);
// 	container.html(new_html);
// }

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
				$(".highlighted").removeClass("highlighted");
                moveUp()
                break;
            // Down
			case 40:
				$(".highlighted").removeClass("highlighted");
                moveDown()
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
        applyColor('white');
		return true;
	}, false);
}




initContentScript();
readListener();
