"use strict";
(function(){
var namespace = "lib/tracker.js";
if (window[namespace] === true) {
    return;
} else {
    window[namespace] = true;
}

/*
Keeps track of the start and end position of the tracked text,
along with the HTML element that houses the text.
The only two valid states are:
  1. isTracking. E.g. when user clicks on a paragraph.
  2. Not tracking. E.g. when user first loads the page.
This class also handles 1-time updates of the tracker position.
*/
class Tracker {
    /*
    Initialize a tracker that is not tracking anything.

    Parameters:
    - readableDomIds: string[]. List of dom IDs that contain readable content.
    */
    constructor(readableDomIds) {
        // List of dom IDs that contain readable content.
        // Sorted in order of reading progression. 
        // E.g. $("#" + readableDomIds[0]) gets you the jQuery element to the first readable content.
        // Populated by parseDocument()
        this.readableDomIds = readableDomIds;
        // Int. Pointer to an element in readableDomIds. The current container the tracker is in.
        // If there is no tracker yet, this value is null.
        // Otherwise, it will be in [0, readableDomIds.length)
        this.containerId = null;
        // jQuery element. Must be kept in sync with containerId.
        // This is a performance optimization to address the fact that jQuery lookups are not cached.
        this.container = null;
        // Start of currently tracked sentence, relative to container; 0 <= start < len(container.text())
        this.start = null;
        // End of currently tracked sentence, relative to container; 0 <= end < len(container.text())
        this.end = null; 
    }

    /*
    Return: Boolean. Whether or not the tracker is pointing to anything.
    */
    isTracking() {
        return this.containerId !== null;
    }

    /*
    Point to the first sentence within the given container.
    */
    pointToContainer(containerId) {
        this.container = this.getContainer(containerId);
        this.containerId = containerId;
        this.start = 0;
        // TODO: Does jquery cache the container text?
        this.end = this.getSentenceEnd(this.container.text(), this.start);
    }

    /*
    Returns:
    jQuery element - the currently pointed to container, or null if not tracking.
    */
    getCurrentContainer() {
        return this.container;
    }

    getStart() {
        return this.start;
    }

    getEnd() {
        return this.end;
    }

    /*
    Returns:
    If isTracking, the number of characters in the tracked portion. Otherwise, 0.
    */
    getTrackerLen() {
        if (!this.isTracking()) {
            return 0;
        }
        return this.end - this.start;
    }
    
    /*
    Get the jquery container from readableDomIds corresponding to containerId.
    Note that this invokes jQuery lookup, and so caller should try to cache the result.

    Throws exception on invalid container id.
    */
    getContainer(containerId) {
        if (containerId === null || containerId < 0 || containerId >= this.readableDomIds.length) {
            throw `Invalid ${containerId}, should be [0, ${this.readableDomIds.length})`;
        }
        return $("#" + this.readableDomIds[containerId]);
    }

    /*
    Move tracker to the next readable portion, moving across containers if necessary.
    If not currently tracking, will point to the first sentence.
    If already at the end of the document, tracker will not be updated.
    */
    moveNext() {
        if (!this.isTracking()) {
            this.pointToContainer(0);
            return;
        }
        let text = this.container.text();
        let len = text.length;
        let new_start = this.end + 2; // Compensate for the ". " at the end of sentence

        // "start" is past end of container.
        if (new_start >= len) {
            // Reached the end, no more container.
            // Don't update the tracker. Keep pointing to the last element.
            if (this.containerId >=  this.readableDomIds.length - 1) {
                return;
            }
            this.pointToContainer(this.containerId + 1); 
        } else {
            // Still within container
            let new_end = this.getSentenceEnd(text, new_start);
            this.start = new_start;
            this.end = new_end;
        }
    }

    /*
    Move tracker to the previous readable portion, moving across containers if necessary.
    If not currently tracking, will not do anything.
    If already at the beginning of the document, tracker will not be updated.
    */
    movePrevious() {
        if (!this.isTracking()) {
            return;
        }
        let text = this.container.text();
        let len = text.length;

        let new_end = this.start - 2; // Compensate for the ". " at the end of sentence

        if (new_end < 0) {
            // Need to change container.
            if (this.containerId == 0) { return; } // Can't go back anymore. 
            this.pointToContainer(this.containerId - 1);
            // Point to the end of the contanier.
            this.end = text.length;
            this.start = this.getSentenceStart(this.container.text(), this.end);
        } else {
            // Still same container.
            this.end = new_end;
            this.start = this.getSentenceStart(this.container.text(), this.end)
        }
    }

    ////////////////////
    // Helper methods
    /*
    Params:
    - text (string)
    - start (int)
    Return:
    - end (int). Exclusive index to the end of the sentence within text that starts at 'start' 
    */
    getSentenceEnd(text, start) {
        let end = text.indexOf(". ", start);
        if (end < 0) {
            end = text.length;
        }
        return end;
    }

    /*
    Params:
    - text (string)
    - end (int). Exclusive index to where the sentence should end.
    Return:
    - start (int). Inclusive index of where the sentence should start. 
    */
    getSentenceStart(text, end) {
        let len = text.length;
        let rev = text.split("").reverse().join("");
        let idx = rev.indexOf(" .", len-end);
        if (idx > 0) {
            return len - idx;
        } 
        return 0;
    }
}

// Expose to global.
window.Tracker = Tracker;
})(); // End of namespace