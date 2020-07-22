"use strict";
(function(){
var namespace = "lib/time_tracker_view.js";
if (window[namespace] === true) {
    return;
} else {
    window[namespace] = true;
}


// How granular you want time remaining to be
const timeRemainingGranularity = {
    // 3m remaining
    MINUTE: 0,
    // 3:00 remaining
    SECOND: 1
}

/*
Creates a display overlaid on current web page that displays
the estimated time remaining to read and the current speed of 
the auto-read mode in WPM. 
*/
class TimeTrackerView {
    
    /*
    Initialize a display with total time remaining and initial speed (~200 WPM).

    Parameters:
    - doc: Doc. The preprocessed document.
    - speed: int. Value proportional to the speed of auto-read mode, before adjustment by sentence length. 
    - total_words: int. Total number of words in readable containers on web page
    */
    constructor(doc, speed) {
        this.doc = doc;
        this.displayhHtml = null; // HTML for the reading info display
        this.time_remaining_ms = null;
        this.reading_speed = speed;
        this.end = null; 
        this.auto_mode = false; // Is the reading mode in AUTO mode? (if not, in MANUAL)
        this.time_remaining_granularity = timeRemainingGranularity.MINUTE;

        // this.setSettings();
        this.defineDisplayHtml();
        this.createDisplay();
        this.updateSpeed(speed);
        this.updateTimer(/*sentenceId=*/ 0);
    }  

    // Returns time remaining in milliseconds
    getTimeRemainingMs() {
        return this.time_remaining_ms;
    }

    /*
    Inserts display HTML into webpage. 
    */
    createDisplay() {
        $(this.displayHtml).insertBefore($("body").children().first());
        document.getElementById("readingDisplayContainer").style.opacity = 1; // For smoother transition
        document.getElementById("optionsButton").style.opacity = 1; // For smoother transition
    }

    // Is user in auto mode? (bool)
    updateAutoMode(bool) {
        this.auto_mode = bool;
    }
    
    /*
    Updates reading timer based on current sentence.
    */
    updateTimer(sentenceId) { // Call everytime the tracker moves.
        let total_words = this.doc.getNumWordsFromSentenceTilEnd(sentenceId);
        // if (this.auto_mode) { currentSpeed = this.reading_speed } else { currentSpeed = avg_read_speed };
        this.time_remaining_ms = total_words / this.reading_speed * 60 * 1000;
        document.getElementById("timerNumber").innerHTML = this.getTimeRemainingText();
    }

    /*
    Return: string. Time remaining text like "3m" or "3:00" depending on
    the chosen granularity.
    */
    getTimeRemainingText() {
        let time_remaining_m = this.time_remaining_ms / 1000 / 60;
        let m_floor = Math.floor(time_remaining_m);
        let s_remain = Math.round((time_remaining_m - m_floor) * 60);
        let s_str = (""+s_remain).padStart(2, "0");

        switch (this.time_remaining_granularity) {
            case timeRemainingGranularity.MINUTE:
                return `${Math.ceil(time_remaining_m)}m`;
            break;
            case timeRemainingGranularity.SECOND:
                return `${m_floor}:${s_str}`;
            break;
            default:
                 throw `Invalid granularity: ${time_remaining_granularity}`;
            break;
        }
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
    Defines html code for display to be inserted into web page. 
    Moved all html down here bc it is long, especially with svg files. 
    SVG files must be in html in order to be editable in live time. 
    */
    defineDisplayHtml() {
        this.displayHtml = `
            <div id="readingDisplayContainer">
                <div id="timerContainer">
                    <div id="timerInsideContainer">
                        <span id="timerNumber">Calculating...</span> remaining
                    </div>
                    
                </div>
                <div id="speedContainer">
                    <div id="speedInsideContainer">
                        <span id="speedNumber">${this.reading_speed}</span> WPM
                    </div>
                </div>
            </div>
            <div id="optionsButton">
                <svg width="0%" height="0%" viewBox="0 0 83 83" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
                    <g transform="matrix(1,0,0,1,-7.85366,-10.4515)">
                        <g transform="matrix(1,0,0,1,-1.08634,1.51154)">
                            <path id="gear" d="M76.86,63.64C77.03,63.3 77.18,62.96 77.34,62.64C77.5,62.32 77.61,62.08 77.73,61.8L77.81,61.61L77.81,61.5C77.94,61.18 78.05,60.86 78.17,60.5C78.29,60.14 78.42,59.85 78.54,59.5L78.54,59.35L78.54,59.28L91.06,57L91.06,43.49L78.73,40.93L78.66,40.73L78.66,40.65C78.54,40.29 78.41,39.94 78.28,39.59C78.15,39.24 78.08,39 77.96,38.71L77.88,38.52L77.88,38.41C77.75,38.09 77.6,37.79 77.46,37.48C77.32,37.17 77.18,36.84 77.02,36.48L76.96,36.37L76.96,36.3L84,25.93L74.43,16.36L63.91,23.27L63.72,23.18L63.65,23.18C63.31,23.01 62.97,22.86 62.65,22.7C62.33,22.54 62.09,22.43 61.81,22.31L61.62,22.23L61.51,22.23C61.19,22.1 60.87,21.99 60.51,21.87C60.15,21.75 59.87,21.62 59.51,21.51L59.36,21.51L59.29,21.51L57,8.94L43.49,8.94L40.93,21.27L40.73,21.34L40.65,21.34C40.29,21.46 39.94,21.59 39.59,21.72C39.24,21.85 39,21.92 38.71,22.04L38.52,22.12L38.41,22.12C38.09,22.25 37.79,22.4 37.48,22.54C37.17,22.68 36.84,22.82 36.48,22.98L36.35,23.05L36.28,23.05L25.93,16L16.36,25.57L23.27,36.09L23.18,36.28L23.18,36.35C23.01,36.69 22.86,37.03 22.7,37.35C22.54,37.67 22.43,37.91 22.3,38.2L22.22,38.39L22.22,38.5C22.09,38.82 21.98,39.14 21.86,39.5C21.74,39.86 21.61,40.15 21.49,40.5L21.49,40.72L8.94,43L8.94,56.51L21.27,59.06L21.34,59.26L21.34,59.34C21.46,59.7 21.59,60.05 21.72,60.4C21.85,60.75 21.92,60.99 22.04,61.28L22.12,61.47L22.12,61.58C22.25,61.9 22.4,62.2 22.54,62.52C22.68,62.84 22.82,63.16 22.97,63.52L23.05,63.66L23.05,63.73L16,74.07L25.57,83.64L36.09,76.73L36.28,76.82L36.35,76.82C36.69,76.99 37.03,77.14 37.35,77.3C37.67,77.46 37.91,77.57 38.2,77.7L38.39,77.78L38.5,77.78C38.82,77.91 39.14,78.02 39.5,78.14C39.86,78.26 40.15,78.39 40.5,78.51L40.72,78.51L43,91.06L56.51,91.06L59.06,78.73L59.26,78.66L59.34,78.66C59.7,78.54 60.05,78.41 60.4,78.28C60.75,78.15 60.99,78.08 61.28,77.96L61.47,77.88L61.58,77.88C61.9,77.75 62.2,77.6 62.51,77.46C62.82,77.32 63.15,77.18 63.51,77.02L63.62,76.96L63.69,76.96L74.07,84L83.64,74.43L76.73,63.91L76.82,63.72L76.86,63.64ZM50,67.66C40.312,67.66 32.34,59.688 32.34,50C32.34,40.312 40.312,32.34 50,32.34C59.688,32.34 67.66,40.312 67.66,50C67.66,59.688 59.688,67.66 50,67.66Z" style="fill:rgb(102,102,102);fill-rule:nonzero;"/>
                        </g>
                    </g>
                </svg>
            </div>
            `;    
    }

    // Remove the widget UI elements from DOM.

    turnDownUI() {
        $("#readingDisplayContainer").remove();
        $('#optionsButton').remove();
        $('#uiContainer').remove();
    }
}

// Expose to global.
window.TimeTrackerView = TimeTrackerView;
})(); // End of namespace