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
        this.readableDomIds = readableDomIds; // List of all container IDs
        this.containerId = null; // ID of current container
        this.dict = null; // { str : int } , Set in calcTotalWords function
        this.total_words = this.calcTotalWords(readableDomIds); // int; Total number of words in document;
        this.keywords = this.setKeyWords(this.dict); // string[]
    };

    getContainer(containerId) {
        if (containerId === null || containerId < 0 || containerId >= this.readableDomIds.length) {
            throw `Invalid ${containerId}, should be [0, ${this.readableDomIds.length})`;
        }
        return $("#" + this.readableDomIds[containerId]);
    }
    calcTotalWords(readableDomIds) {
        var dict = {};
        var total_words = 0;
        for (var section in readableDomIds) {
            let text = this.getContainer(section).text();
            let wordRegex = /\b\w+\b/g;
            let wordList = text.match(wordRegex);
            for (var i in wordList) {
                if (dict[wordList[i]]) { // Word is in dictionary
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
    getTotalWords() {
        return this.total_words;
    }

    getContainerWords(containerId) {
        text = this.getContainer(containerId).text();
        let wordRegex = /\b\w+\b/g;
        let wordList = text.match(wordRegex);
        return wordList;
    }

    setKeyWords(dict) { 
        // 1. Determine keywords
        let keywords = [];
        let keywordFilter = 0.023; // Any word below this frequency is a keyword
        for (var word in dict) {
            dict[word] /= this.total_words; // Divide frequency by total words
            if (dict[word] < keywordFilter) {
                keywords.push(word);
            };
        };
        console.log(keywords);
        console.log(keywords.length);
        return keywords;
    };
    highlightKeyWord(container, start, end) {
        let keywordStyle = "keyWord";
        // $("."+keywordStyle).unmark();
        // $("."+keywordStyle).removeClass(keywordStyle);
        // Append the keyword class to the html corresponding to the keywords
        // 1. Get list of words in interval

        let containerText = container.text();
        let trackerText = containerText.slice(start,end);
        let wordRegex = /\b\w+\b/g;
        let wordList = trackerText.match(wordRegex);
        let keywords = this.keywords;
        for (var i in wordList) {
            if (keywords.includes(wordList[i])) {
                let word = wordList[i]
                var word_start = containerText.search(word);
                var word_len = word.length;
            };
            container.markRanges([{
                start: word_start,
                length: word_len
            }], {
                className: keywordStyle
            });
        }

        // Match each word to word in 
    };
};


// Expose to global.
window.Doc = Doc;
})(); // End of namespace