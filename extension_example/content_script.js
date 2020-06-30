var container = $("p:first")
var start = 0
var end = 0
var velocity = 1
var timer = 0
var speed = 10
var init = 0
var scrollType = "velocity"

$(function () {
    $("p").click(function () {
		container = $(this);
		start = 0
		end = container.text().indexOf(". ", start)
		highlight(container, start, end)
		init = 1
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
		// console.log("start<0 did trigger")
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
		// console.log("start"+start)
    } 
    highlight(container, start, end)
}

// function sleep(milliseconds) {
// 	console.log("sleep started");
// 	const date = Date.now();
// 	let currentDate = null;
// 	do {
// 	  currentDate = Date.now();
// 	} while (currentDate - date < milliseconds);
// 	console.log("sleep ended")
// }
// function sleep(ms) {
// 	return new Promise(resolve => setTimeout(resolve, ms));
// }

function moveDown() {
	velocity = 1
	if (scrollType == "manual") {
		moveDownManual()
	} else {
		// timer_speed = speed * 50
		// while (velocity) {
		// for (i=0;i<3;i++) {
		// 	console.log("start")
		if (!timer) {timer = setInterval(moveDownManual, 500)}
			// timer = setInterval(moveDownManual, 500)
		// }
		// 	moveDownManual()
		// 	sleep(timer_speed)
		// 	console.log("stop")
		// 	// moveDownManual()
		// }
		// // for (i = 0; i < 2; i++) {
			
		// // }
		// moveDownManual()
		// sleep(1000)
		// moveDownManual()
		// sleep(2000).then(() => { moveDownManual(); });
	}
}

function moveDownManual() {
	console.log("moveDownManual")
	if (init == 0) { 
		container = $("p:first")
		end = container.text().indexOf(". ", start)
		highlight(container, start, end)
		init = 1
	}
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
	// $(".marked").animate({color: '#c9daf8 !important'});
}

function readListener() {
	document.addEventListener('keydown', function(evt) {
		if (!document.hasFocus()) {
		  return true;
		}
		switch (evt.keyCode) {
            // Up
			case 37:
				console.log("up")
                moveUp()
                break;
            // Down
			case 39:
				// sleep(500).then(() => { setTimeout(moveDownManual(),0) });
                moveDown()
				break;
			// D (Increase velocity)
			case 68:
				// alert(speed)
				// if (speed >= 0) { speed -= 2 }s
				speed -= 2
				// alert(speed)
			// S (Slow velocity)
			case 83: 
			// T (toggle scroll type)
				// alert(speed)
				// console.log(speed)
				speed += 2
			case 84:
				if (scrollType == "velocity") { scrollType == "manual" }
				else if (scrollType == "manual") { scrollType == "velocity" }
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
			// velocity = 0
			clearInterval(timer)
		}
    }, false);
}




// initContentScript();
readListener();
