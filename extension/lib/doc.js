"use strict";
(function(){
var namespace = "lib/doc.js";
if (window[namespace] === true) {
    return;
} else {
    window[namespace] = true;
}

var settings = window.settings;

// If the number of sentences in the doc exceeds this, mark the document as unreadable.
const MAX_NUM_SENTENCE = 1000;

/*
All NLP <-> DOM preprocessing logic should reside in this file.
There are two main core concepts, each concept having an NLP meaning, along with DOM binding.
1. Container. Sentences are grouped into containers. The reason why we care about containers
   is because this is the most granular DOM element, and so we need pointers to them in order
   to do anything DOM related. 
2. Sentence. A single sentence housed inside a container. 

More general notes about these concepts:
- Ordered ids. Each concept element has an ordered ID that goes from 0 to
    <num sentence / num container> - 1
- Interacting with the API.
  - If the logic does not require any UI, you should only be communicating with IDs.
    E.g. tracker.js should just be storing sentence ids, not any DOM pointers.
  - If you need to do UI changes, then you can convert the ID back to DOM pointers
    E.g. getSentencePointer(sentenceId), getContainer(containerId)
*/

/*
Pointers to a sentence within a container.
*/
class SentencePointer {
    constructor(containerId, start, end) {
        this.containerId = containerId;
        // Marks the sentence offset within the container. start is inclusive, end exlusive.
        this.start = start;
        this.end = end;
    }
}

/*
Parameters:
- int[] arr. Assumed to have at least one element.
Return:
- int[] suffix_sum, where suffix_sum[i] = arr[i] + arr[i+1] + ... + arr[end]
*/
function suffix_sum(arr) {
    let suffix_sum = new Array(arr.length);
    suffix_sum[arr.length - 1] = arr[arr.length - 1];
    for (let i = arr.length - 2; i >= 0; i--) {
        suffix_sum[i] = suffix_sum[i+1] + arr[i];
    }
    return suffix_sum;
}

/*
Class dedicated to keeping track of model of document. 
Note: Called "Doc" because Document is already used in js. 
*/
class Doc {
    constructor(readableDomEls) {
        this.containers = readableDomEls; // $[]; List of all jquery readable containers.
        // Set up these instance variables:
        // - SentencePointer[] sentences. All the sentences in the document.
        // - int[] containerIdToFirstSentenceId. Given a container id, what is the sentence id of the
        //   first sentence?
        this.detectSentenceBoundaries(this.containers);
        this.termFreq = null; // { str : int } , Frequency of terms in document. Set in calcTotalWords function
        this.total_words = this.calcTotalWords(readableDomEls); // int; Total number of words in document;
        this.keywords = this.setKeyWords(this.termFreq); // string[] keywords of document
        // int[], Index[i] is # of words in the ith sentence.
        this.num_words_per_sentence = this.calcNumWordsPerSentence(this.sentences);
        // int[], Index[i] is the total # of words from ith sentence til the end of document.
        this.num_words_per_sentence_suffix_sum = suffix_sum(this.num_words_per_sentence);
    };

    // Returns: Total words in doc (int)
    getTotalWords() {
        return this.total_words;
    }

    // Returns: List of keywords (str[])
    getKeyWords() {
        return this.keywords;
    }

    /*
    Find all sentence boundaries within containers.
    Initializes [sentences, containerIdToFirstSentenceId]
    If document is not readable, sentences will be empty array.
    */
    detectSentenceBoundaries() {
        debug("Detecting sentence boundaries");
        let startTime = new Date();
        this.sentences = [];
        this.containerIdToFirstSentenceId = [];
        for(let container_id = 0; container_id < this.getNumContainers(); container_id++) {
            this.containerIdToFirstSentenceId.push(this.sentences.length);
            let container = this.getContainer(container_id);
            let text = container.text();
            let sentenceBoundaries = tokenizeSentences(text);
            for (let i = 0; i < sentenceBoundaries.length; i++) {
                let sentenceBoundary = sentenceBoundaries[i];
                let start = sentenceBoundary.index;
                let end = start + sentenceBoundary.offset;
                this.sentences.push(new SentencePointer(container_id, start, end));
            }
            if (this.sentences.length > MAX_NUM_SENTENCE) {
                alert("Sorry, we don't support big documents yet :(");
                this.containers = [];
                this.sentences = [];
                this.containerIdToFirstSentenceId = [];
                break;
            }
        }
        debug("Number of sentences = " + this.sentences.length);
        let endTime = new Date();
        let elapsedTimeS =  (endTime - startTime ) / 1000;
        debug(`Detecting sentence boundaries done in ${elapsedTimeS} s`);
    }

    /*
    Get the sentence id of the first sentence in container.
    */
    getFirstSentenceIdInContainer(containerId) {
        return this.containerIdToFirstSentenceId[containerId];
    }

    getNumWordsInSentence(sentenceId) {
        return this.num_words_per_sentence[sentenceId];
    }

    /*
    Get total number of words from sentenceId, sentenceId+1, ... til end of document.
    */
    getNumWordsFromSentenceTilEnd(sentenceId) {
        return this.num_words_per_sentence_suffix_sum[sentenceId];
    }

    getNumSentencesFromSentenceTilEnd(sentenceId) {
        return this.getNumSentences() - sentenceId;
    }

    /*
    Returns: Total words in document (int)
    Calculates total words in the document
    */
    calcTotalWords(readableDomEls) {
        var self = this;
        var termFreq = {};
        var total_words = 0;
        var stop_words = new Set(["succeeded", "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot ", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself ", "him", "himself", "his", "how", "however", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off ", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan’t", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"]);
        var termDocumentFreq = null;
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
            };
            if ( wordList) { total_words += wordList.length; };
        }
        // Update term document frequency object: 
        settings.getTermDocumentFreq(function(settingsTermDocumentFreq) {
            termDocumentFreq = settingsTermDocumentFreq;
            self.updateTermDocumentFreq(termFreq, termDocumentFreq, settings.setTermDocumentFreq);
        });

        this.termFreq = termFreq; // Set class attribute "termFreq"
        return total_words // Set total words for use elsewhere (like Display)
    }

    updateTermDocumentFreq(termFreq, termDocumentFreq, cb) {
        // For each unique word in doc; add to termDocumentFreq dict or add one to its frequency
        for (const word in termFreq) {
            if (word in termDocumentFreq) {
                termDocumentFreq[word]++
            } else {
                termDocumentFreq[word] = 1;
            }
        }
        cb(termDocumentFreq);
        return;
    }

    /*
    Params: Sentence[]
    Returns: int[], Index[i] is # of words in the ith sentence.
    */
    calcNumWordsPerSentence(sentences) {
        let num_words_per_sentence = [];
        for (let sentence_id = 0; sentence_id < this.getNumSentences(); sentence_id++) {
            let sentencePtr = sentences[sentence_id];
            let container = this.getContainer(sentencePtr.containerId);
            let text = container.text().slice(sentencePtr.start, sentencePtr.end);
            let wordRegex = /\b\w+\b/g; // Checks for words
            let wordList = text.match(wordRegex);
            let num_words = 0;
            if (wordList) {
                num_words = wordList.length;
            }
            num_words_per_sentence.push(num_words);
        }
        return num_words_per_sentence;
    }

    /*
    Params: Sentence[]
    Returns: int[] container_sentences_map. container_sentences_map[i] = number of sentences in container id i.
    */
    calcSentencePerContainer(sentences) {
        let container_sentences_map = []; // For each container, add # of sentences in it
        for (let container_id = 0; container_id < this.getNumContainers(); container_id++) {
            let first_sentence_id = this.containerIdToFirstSentenceId[container_id];
            let end_sentence_id_exclusive = null;
            if (container_id == this.getNumContainers() - 1) {
                end_sentence_id_exclusive = this.getNumSentences();
            } else {
                end_sentence_id_exclusive = this.containerIdToFirstSentenceId[container_id + 1];
            }

            let num_sentences = end_sentence_id_exclusive - first_sentence_id;
            container_sentences_map.push(num_sentences);
        }
        return container_sentences_map;
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

    getNumContainers() {
        return this.containers.length;
    }

    getNumSentences() {
        return this.sentences.length;
    }

    /*
    Get the jquery container corresponding to containerId.

    Throws exception on invalid container id.
    */
    getContainer(containerId) {
        if (containerId === null || containerId < 0 || containerId >= this.getNumContainers()) {
            throw `Invalid ${containerId}, should be [0, ${this.getNumContainers()})`;
        }
        return this.containers[containerId];
    }

    /*
    Get the SentencePointer corresponding to sentenceId.

    Throws exception on invalid sentence id.
    */
    getSentence(sentenceId) {
        if (sentenceId === null || sentenceId < 0 || sentenceId >= this.getNumSentences()) {
            throw `Invalid ${sentenceId}, should be [0, ${this.getNumSentences()})`;
        }
        return this.sentences[sentenceId];
    }
};


// Expose to global.
window.Doc = Doc;
})(); // End of namespace