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
    constructor(readableDomEls) {
        this.readableDomEls = readableDomEls; // $[]; List of all jquery readable containers.
        this.containerId = null; // str; ID of current container
        this.termFreq = null; // { str : int } , Frequency of terms in document. Set in calcTotalWords function
        this.total_words = this.calcTotalWords(readableDomEls); // int; Total number of words in document;
        this.keywords = this.setKeyWords(this.termFreq); // string[] keywords of document
        this.container_sentences_map = null; // int[], Index[i] is # of sentneces in ith container, This is set by calcTotalSentences()
        this.total_sentences = this.calcTotalSentences(readableDomEls);
    };

    // Returns: Total words in doc (int)
    getTotalWords() {
        return this.total_words;
    }

    // Returns: List of keywords (str[])
    getKeyWords() {
        return this.keywords;
    }

    // Returns: Container-sentences map; tells how many sentences are in each container
    getContainerSentencesMap() {
        return this.container_sentences_map;
    }
    
    /*
    Returns: Total words in document (int)
    Calculates total words in the document
    */
    calcTotalWords(readableDomEls) {
        var termFreq = {};
        var total_words = 0;
        var stop_words = new Set(["succeeded", "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot ", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself ", "him", "himself", "his", "how", "however", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off ", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan’t", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"]);
        for (var section in readableDomEls) {
            let text = readableDomEls[section].text();
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
    Params: Current container ID
    Returns: # of sentences in document, starting from current container
    */
    calcTotalSentences(readableDomEls) {
        let total_sentences = 0;
        let container_sentences_map = []; // For each container, add # of sentences in it
        for (var section in readableDomEls) {
            let text = readableDomEls[section].text();
            let start = 0;
            let end = 0;
            var container_sentences = 0;
            while (end > -1) { 
                end = text.indexOf(". ", start); // TODO: Refactor sentence boundary with tracker.js
                total_sentences++;
                container_sentences++;
                start = end+2;
            };
            container_sentences_map.push(container_sentences);
        };
        this.container_sentences_map = container_sentences_map;
        return total_sentences;
    };

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