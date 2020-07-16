"use strict";
(function(){
var namespace = "lib/doc.js";
if (window[namespace] === true) {
    return;
} else {
    window[namespace] = true;
}
 
/*
Class dedicated to keeping track of model of document. 
Note: Called "Doc" because Document is already used in js. 
*/

class Doc {
    constructor(readableDomIds) {
        this.readableDomIds = readableDomIds; // string[]; List of all container IDs
        this.containerId = null; // str; ID of current container
        this.dict = null; // { str : int } , Set in calcTotalWords function
        this.total_words = this.calcTotalWords(readableDomIds); // int; Total number of words in document;
        this.keywords = this.setKeyWords(this.dict); // string[] keywords of document
    };

    // Returns: Total words in doc (int)
    getTotalWords() {
        return this.total_words;
    }

    // Returns: Container given container ID (jQuery element)
    getContainer(containerId) {
        if (containerId === null || containerId < 0 || containerId >= this.readableDomIds.length) {
            throw `Invalid ${containerId}, should be [0, ${this.readableDomIds.length})`;
        }
        return $("#" + this.readableDomIds[containerId]);
    }
    
    /*
    Returns: Total words in document (int)
    Calculates total words in the document
    */
    calcTotalWords(readableDomIds) {
        var dict = {};
        var total_words = 0;
        var stop_words = "succeeded a about above after again against all am an and any are aren't as at be because been before being below between both but by can't cannot could couldn't did didn't do does doesn't doing don't down during each few for from further had hadn't has hasn't have haven't having he he'd he'll he's her here here's hers herself him himself his how however how's i i'd i'll i'm i've if in into is isn't it it's its itself let's me more most mustn't my myself no nor not of off on once only or other ought our ours ourselves out over own same shan’t she she'd she'll she's should shouldn't so some such than that that's the their theirs them themselves then there there's these they they'd they'll they're they've this those through to too under until up very was wasn't we we'd we'll we're we've were weren't what what's when when's where where's which while who who's whom why why's with won't would wouldn't you you'd you'll you're you've your yours yourself yourselves";
        for (var section in readableDomIds) {
            let text = this.getContainer(section).text();
            let wordRegex = /\b\w+\b/g;
            let wordList = text.match(wordRegex);
            for (var i in wordList) {
                if (stop_words.includes(wordList[i].toLowerCase())) {
                    // Don't include stop words
                }
                else if (dict[wordList[i]]) { // Word is in dictionary
                    dict[wordList[i]]++;
                } else {
                    dict[wordList[i]] = 1;
                }
            }
            total_words += wordList.length;
        }
        this.dict = dict; // Set class attribute "dict"
        return total_words // Set total words for use elsewhere (like Display)
    }

    /*
    Returns: string[], given 
    Determines the keywords of the document (using simple term frequency filter)
    */
    setKeyWords(dict) { 
        // 1. Determine keywords
        let keywords = [];
        let keywordFilter = 0.005; // Any word below this frequency is a keyword
        for (var word in dict) {
            dict[word] /= this.total_words; // Divide frequency by total words
            // console.log(dict[word]);
            if (dict[word] < keywordFilter) {
                keywords.push(word.toLowerCase());
            };
        };
        return keywords;
    };

    /*
    Params: Current container, start and end of tracker (jQuery element, int, int)
    Highlights the keywords within the tracked sentence. 
    */
    highlightKeyWords(container, start, end) {
        // TODO: Mark.js is actually built to do this; migrate functionality to mark.js
        let keywordStyle = "keyWord";
        $("."+keywordStyle).unmark(); // Remove previous sentence keyword styling
        $("."+keywordStyle).removeClass(keywordStyle);
        // Get list of words in interval
        let containerText = container.text();
        let sentenceText = containerText.slice(start,end);
        let wordRegex = /\b\w+\b/g;
        let wordList = sentenceText.match(wordRegex);
        let keywords = this.keywords;
        for (var i in wordList) { // Accentuate keywords
            // TODO: This only gets the first occurence of each word in the sentence; should get all
            if (keywords.includes(wordList[i].toLowerCase())) { // See if each word is a keyword
                let word = wordList[i]
                var word_start = containerText.indexOf(word, start);
                var word_len = word.length;
            };
            // Normal mark.js procedure
            container.markRanges([{ 
                start: word_start,
                length: word_len
            }], {
                className: keywordStyle
            });
        }
    };
};


// Expose to global.
window.Doc = Doc;
})(); // End of namespace