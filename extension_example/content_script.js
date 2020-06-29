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
                // updatePosition()
                break;
                // Left
			case 38:
                applyColor('pink');
                // updatePosition()
				break;
			// Right
			case 39:
				applyColor('blue');
                break;
            // Left
			case 40:
                applyColor('orange');
                // updatePosition()
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

