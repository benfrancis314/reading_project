"use strict";
(function(){
var namespace = "lib/display.js";
if (window[namespace] === true) {
    return;
} else {
    window[namespace] = true;
}

const avg_read_speed = 200; // WPM
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
    - readableDomIds: string[]. List of dom IDs that contain readable content.
    - speed: int. Value proportional to the speed of auto-read mode, before adjustment by sentence length. 
    */
    constructor(readableDomIds, speed, total_words) {
        this.readableDomIds = readableDomIds; // Used to calc initial reading time
        this.html = null;
        this.time_remaining = this.initTimer(readableDomIds, total_words);
        this.reading_speed = this.initSpeed(speed);
        this.end = null; 

        this.defineHtml();
        this.createDisplay(readableDomIds);
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
    createDisplay(readableDomIds) {
        document.getElementById(readableDomIds[0]).innerHTML += this.html;
        document.getElementById("displayContainer").style.opacity = 1; // For smoother transition
    }

    /* 
    Params: 
    - List of container IDs on web page (string[])
    Return: 
    The total time remaining to read document, based on avg letters/word and lowball estimate of WPM (int)
    */
    initTimer(readableDomIds, total_words) {
        let avg_read_speed = 200; // Low ball estimate, from Rayner (in WPM)
        let time_remaining = total_words/avg_read_speed; // in minutes
        return Math.ceil(time_remaining);
    };
    
    /*
    Updates reading timer based on containers after current tracker. 
    */
    updateTimer(readableDomIds, containerId) { // Call everytime you get to new paragraph
        let total_char = 0; // TODO: REFACTOR TOTAL_CHAR CALCULATION
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

    /*
    Returns: 
    - Initial speed in WPM, based on speed parameter used by tracker (int)
    */
    initSpeed(speed) {
    // TODO: Create better estimate for initial reading speed
    /* REASONING: 
        Avg sentence has 25 words, avg word has 5 letters -> avg letters per sentence ~ 125
        speed_adj is usually 20*125 + 500 -> 3000 ms [base_speed * avg_letters_per_sentence + speed_bias]
        So 25 words/3s -> ~400 WPM. Since speed = 20, and we want it to be 400, so we multiply by 20. 
        Note this is rampant with estimations/is kinda bs. But good enough for hypothesis testing. 
        In part, trickiness comes from speed's dependcy on sentence length. 
        */
        return speed * 20
    }

    /* 
    Update display speed after speed is changed by user
    */
    updateSpeed(speed) {
        // TODO: Create real equation for updated reading speed
        this.reading_speed = 800 - (20*speed) // Completely made up eq, reasonable enough for testing though
        document.getElementById("speedNumber").innerHTML = this.reading_speed;
    }
}

// Expose to global.
window.Display = Display;
})(); // End of namespace