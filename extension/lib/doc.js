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
        this.termFreq = null; // { str : int } , Frequency of terms in document. Set in calcTotalWords function
        this.total_words = this.calcTotalWords(readableDomIds); // int; Total number of words in document;
        this.keywords = this.setKeyWords(this.termFreq); // string[] keywords of document
    };

    // Returns: Total words in doc (int)
    getTotalWords() {
        return this.total_words;
    }

    // Returns: List of keywords (str[])
    getKeyWords() {
        return this.keywords;
    }

    // TO DO: REFACTOR; redundant with an identical function in tracker.js
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
        var termFreq = {};
        var total_words = 0;
        var stop_words = new Set(["succeeded", "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot ", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself ", "him", "himself", "his", "how", "however", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off ", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan’t", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"]);
        for (var section in readableDomIds) {
            let text = this.getContainer(section).text();
            let wordRegex = /\b\w+\b/g;
            let wordList = text.match(wordRegex);
            for (var i in wordList) {
                let word = wordList[i];
                if (stop_words.has(wordList[i].toLowerCase())) { // TODO: REFACTOR AS SET; same for other instances like this in code
                    // Don't include stop words
                }
                else if (termFreq[wordList[i]]) { // Word is in termFrequency dict
                    termFreq[word]++;
                } else {
                    termFreq[word] = 1;
                }
            }
            total_words += wordList.length;
        }
        this.termFreq = termFreq; // Set class attribute "termFreq"
        return total_words // Set total words for use elsewhere (like Display)
    }

    /*
    Returns: string[], given 
    Determines the keywords of the document (using simple term frequency filter)
    */
    setKeyWords(termFreq) { 
        // 1. Determine keywords
        let keywords = new Set();
        let keywordFilter = 0.005; // Any word below this frequency is a keyword
        for (var word in termFreq) {
            termFreq[word] /= this.total_words; // Divide frequency by total words
            // console.log(termFreq[word]);
            if (termFreq[word] < keywordFilter) {
                keywords.add(word.toLowerCase());
            };
        };
        return keywords;
    };
};


// Expose to global.
window.Doc = Doc;
})(); // End of namespace