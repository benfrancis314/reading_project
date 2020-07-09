"use strict";
(function(){
var namespace = "lib/display.js";
if (window[namespace] === true) {
    return;
} else {
    window[namespace] = true;
}

var avg_read_speed = 200; // WPM
var avg_letters_per_word = 6; // 4.79; just from Quora, add a space after each word
var avg_words_per_sentence = 25 // from http://www.hearle.nahoo.net/Academic/Maths/Sentence.html

class Display {
    /*
    Initialize a display that [ -- is not tracking anything -- ].

    Parameters:
    - readableDomIds: string[]. List of dom IDs that contain readable content.
    */


    constructor(readableDomIds, speed) {
        this.readableDomIds = readableDomIds; // Used to calc initial reading time
        this.html = null;
        this.time_remaining = this.initTimer(readableDomIds);
        this.reading_speed = this.initSpeed(speed);
        this.end = null; 

        this.defineHtml();
        this.createDisplay(readableDomIds);
    }

    defineHtml() { // One liner
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

    createDisplay(readableDomIds) {
        document.getElementById(readableDomIds[0]).innerHTML = this.html;
        document.getElementById("displayContainer").style.opacity = 1;
    }
    initTimer(readableDomIds) {
        let total_char = 0;
        for (var section in readableDomIds) {
            let elem = document.getElementById(readableDomIds[section]);
            let text_len = elem.innerText.length;
            total_char = total_char + text_len;
        }
        const avg_letters_per_word = 6; // 4.79; just from Quora, add a space after each word
        const avg_read_speed = 200; // wpm
        let total_words = total_char/avg_letters_per_word;
        let time_remaining = total_words/avg_read_speed; // in minutes
        return Math.ceil(time_remaining);
    }
    updateTimer(readableDomIds, containerId) { // Call everytime you get to new paragraph
        let total_char = 0;
        for (var section in readableDomIds.slice(containerId)) {
            let elem = document.getElementById(readableDomIds[section]);
            let text_len = elem.innerText.length;
            total_char = total_char + text_len;
        }
        let total_words = total_char/avg_letters_per_word;
        let time_remaining = total_words/avg_read_speed; // in minutes
        this.time_remaining = Math.ceil(time_remaining);
        document.getElementById("timerNumber").innerHTML = this.time_remaining;
    }

    getHtml() {
        return this.html;
    }
    getSpeed() {
        return this.reading_speed;
    }
    getTime() {
        return this.time_remaining;
    }
    calcTime() {
        // Put reading time calculation here
        // USE READABLE DOM IDS passed in as param
        this.time_remaining = 1;
    }
    initSpeed(speed) {
        console.log(speed);
        return speed * 20
            // Avg sentence has 25 words. -> 25 words/second -> 1500 WPM
            // speed_adj is usually 20*125 + 500 -> 3000. So 25 words/3s -> ~400 WPM. (Note this is rampant with estimations)
    }
    updateSpeed(speed) {
        // Put reading time calculation here
        this.reading_speed = 800 - (20*speed) // This is a completely fake equation; just for show for now
        document.getElementById("speedNumber").innerHTML = this.reading_speed;
    }
}

// Expose to global.
window.Display = Display;
})(); // End of namespace