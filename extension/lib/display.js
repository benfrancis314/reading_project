"use strict";
(function(){
var namespace = "lib/display.js";
if (window[namespace] === true) {
    return;
} else {
    window[namespace] = true;
}

const avg_read_speed = 260; // WPM
const avg_letters_per_word = 6; // 4.79; just from Quora, add a space after each word

/*
Creates a display overlaid on current web page that displays
the estimated time remaining to read and the current speed of 
the auto-read mode in WPM. 
*/
class Display {
    /*
    Initialize a display with total time remaining and initial speed (~200 WPM).

    Parameters:
    - readableDomEls: $[]. List of jquery dom elements that contain readable content.
    - speed: int. Value proportional to the speed of auto-read mode, before adjustment by sentence length. 
    - total_words: int. Total number of words in readable containers on web page
    */
    constructor(readableDomEls, speed, total_words) {
        this.readableDomEls = readableDomEls; // Used to calc initial reading time
        this.html = null;
        this.time_remaining = null;
        this.reading_speed = speed;
        this.end = null; 
        this.auto_mode = false;

        this.defineHtml();
        this.createDisplay(readableDomEls);
        this.updateSpeed(speed);
    }

    // Returns time remaining
    getTimeRemaining() {
        return this.time_remaining;
    }

    /*
    Defines html code for display to be inserted into web page. 
    */
    defineHtml() {
        this.html = `
            <div id="displayContainer">
                <div id="timerContainer">
                    <div id="timerInsideContainer">
                        <span id="timerNumber">${this.time_remaining}</span> min remaining
                    </div>
                </div>
                <div id="speedContainer">
                    <div id="speedInsideContainer">
                        <span id="speedNumber">${this.reading_speed}</span> WPM
                    </div>
                </div>
            </div>
            `;      
    }

    /*
    Inserts display HTML into webpage. 
    */
    createDisplay(readableDomEls) {
        readableDomEls[0].prepend(this.html);
        document.getElementById("displayContainer").style.opacity = 1; // For smoother transition
    }

    // Is user in auto mode? (bool)
    updateAutoMode(bool) {
        this.auto_mode = bool;
    }
    
    /*
    Updates reading timer based on containers after current tracker. 
    */
    updateTimer(readableDomEls, containerId) { // Call everytime you get to new paragraph
        // TODO: Should also update timer if a user is using the autoread mode. 
        let total_words = 0;
        let currentSpeed = this.reading_speed;
        let remainingContainers = readableDomEls.slice(containerId); // Need to store as own new list, so for loop indexes through this, not old list
        for (var section in remainingContainers) {    // Calc total words
            let text = remainingContainers[section].text();
            // Regex that will not include numbers: /\b[^\d\W]+\b/g
            let wordRegex = /\b\w+\b/g; // Checks for words
            let wordList = text.match(wordRegex);
            if (wordList) { total_words += wordList.length; }
        };
        // if (this.auto_mode) { currentSpeed = this.reading_speed } else { currentSpeed = avg_read_speed };
        let time_remaining = total_words/currentSpeed; // in minutes
        this.time_remaining = Math.ceil(time_remaining);
        document.getElementById("timerNumber").innerHTML = this.time_remaining;
    }

    /* 
    Update display speed after speed is changed by user
    */
    updateSpeed(speed) {
        // TODO: There should be an upper limit to this; because we have a speed bias, it cannot get infinitely fast. 
        this.reading_speed = speed // Completely made up eq, reasonable enough for testing though
        document.getElementById("speedNumber").innerHTML = this.reading_speed;
    }

    /*
    Remove the widget UI elements from DOM.
    */
    turnDownUI() {
        $("#displayContainer").remove();
    }
}

// Expose to global.
window.Display = Display;
})(); // End of namespace