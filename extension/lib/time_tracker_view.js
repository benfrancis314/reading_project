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
        $("#uiContainer").draggable();
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
                return `${Math.ceil(time_remaining_m)}`;
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
    updateSpeed(speed, sentence_id) {
        this.reading_speed = speed // Completely made up eq, reasonable enough for testing though
        document.getElementById("speedNumber").innerHTML = this.reading_speed;
        this.updateTimer(sentence_id);
    }

    /*
    Defines html code for display to be inserted into web page. 
    Moved all html down here bc it is long, especially with svg files. 
    SVG files must be in html in order to be editable in live time. 
    */
    defineDisplayHtml() {
        this.displayHtml = `
            <div id="bottomOfPageUI"></div>
            <div id="persistentUIDisplay">
                <div id="readingDisplayContainer">
                    <div id="speedContainer">
                        <div id="speedInsideContainer">
                            <span id="speedNumber">${this.reading_speed}</span> WPM
                        </div>
                    </div>
                    <div id="timerContainer">
                        <div id="timerInsideContainer">
                            <span id="timerNumber">Calculating...</span> min
                        </div>
                    </div>
                </div>
                <div id="optionsButton">
                    ${window.gearLogo}
                </div>
            </div>
            
            `;    
    }

    // Remove the widget UI elements from DOM.

    turnDownUI() {
        $("#bottomOfPageUI").remove();
        $("#persistentUIDisplay").remove();
        $('#optionsButton').remove();
        $('#uiContainer').remove();
    }
}

// Expose to global.
window.TimeTrackerView = TimeTrackerView;
})(); // End of namespace