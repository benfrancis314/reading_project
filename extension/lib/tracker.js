"use strict";
(function(){
var namespace = "lib/tracker.js";
if (window[namespace] === true) {
    return;
} else {
    window[namespace] = true;
}

/*
Keeps track of the currently tracked sentence id.
The only two valid states are:
  1. isTracking. E.g. when user clicks on a paragraph.
  2. Not tracking. E.g. when user first loads the page.
*/
class Tracker {
    /*
    Initialize a tracker that is not tracking anything.

    Parameters:
    - doc: Document. The parsed document.
    */
    constructor(doc) {
        this.doc = doc;
        this.reset();
    }

    /*
    Reset tracker position to not be tracking anything.
    */
    reset() {
        // Int. Pointer to an element in readableDomEls. The current container the tracker is in.
        // If there is no tracker yet, this value is null.
        // Otherwise, it will be in [0, doc.getNumSentences())
        this.sentenceId = null;
    }

    /*
    Return: Boolean. Whether or not the tracker is pointing to anything.
    */
    isTracking() {
        return this.sentenceId !== null;
    }

    getSentenceId() {
        return this.sentenceId;
    }

    /*
    Point to the first sentence within the given container.
    */
    pointToContainer(containerId) {
        this.sentenceId = this.doc.getFirstSentenceIdInContainer(containerId);
    }

    /*
    Point to a sentence given its ID. 
    */
   pointToSentence(sentenceId) {
        this.sentenceId = sentenceId;
   }
    
    /*
    Move tracker to the next readable portion, moving across containers if necessary.
    If not currently tracking, will point to the first sentence.
    If already at the end of the document, tracker will not be updated.
    Return:
    - Boolean: True iff tracker successfully moved. False if there is no more element to move to.
    */
    moveNext() {
        if (!this.isTracking()) {
            this.pointToContainer(0);
            return true;
        }
        if (this.sentenceId === this.doc.getNumSentences() - 1) {
            return false;
        }
        this.sentenceId++;
        return true;
    }

    /*
    Move tracker to the previous readable portion, moving across containers if necessary.
    If not currently tracking, will not do anything.
    If already at the beginning of the document, tracker will not be updated.
    Return:
    - Boolean: True iff tracker successfully moved. False if there is no more element to move to.
    */
    movePrevious() {
        if (!this.isTracking()) {
            return false;
        }
        if (this.sentenceId === 0) {
            return false;
        }
        this.sentenceId--;
        return true;
    }
}

// Expose to global.
window.Tracker = Tracker;
})(); // End of namespace