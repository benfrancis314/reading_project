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
const MAX_NUM_SENTENCE = 4000;
// Any word with a TF-IDF score above this frequency is a keyword
// 0.001-0.005 give reasonable values; high filter, less keywords
const keywordFilter = 0.001; 
// Storing as global variable bc need to access it in two different functions
const stop_words = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot ", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself ", "him", "himself", "his", "how", "however", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off ", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan’t", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"]);


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
        // - $list [] sentenceEls. See getSentenceEls().
        // - $list [] sentenceKeywordsEls. See getSentenceKeywordsEls(). 
        // Note: processSentences (previously called detectSentenceBoundaries) is now called within processDocument. This is bc processSentences
        //   needs the keywords, so an async chain is needed/used (TODO: refactor w promises). 
        this.processDocument(readableDomEls);

        this.termFreq = null; // { str : int } , Frequency of terms in document. Set in processDocument function
        this.total_words = null; // int; Total number of words in document;
        this.keywords = null; // string[] keywords of document
        // int[], Index[i] is # of words in the ith sentence.
        this.num_words_per_sentence = null; // Set as side effect of processSentences
        // int[], Index[i] is the total # of words from ith sentence til the end of document.
        this.num_words_per_sentence_suffix_sum = null; // Set as side effect of processSentences
        // SentencePointer[], a pointer for each sentence (see above defined class)
        this.sentences = []; // Set as side effect of processDocument
        // float[], assigns difficulty measure to each sentence
        this.sentenceScores = [];
        // jQueryEls[], jQuery elements for each sentence
        this.sentenceEls = []; // Set as side effect of processSentences
        // jQueryEls[], jQuery elements for each sentence's keywords
        this.sentenceKeywordsEls = []; // Set as side effect of setSentenceKeywordsAndScore
    };



    /*
    - The current setup loops through each container; within each container loop, 
    it loops through each containers sentences. Within each sentence, it loops through 
    each word. 
    - TODO: increase the efficiency of this process in general.
    - TODO: Add new comment to account for new functionality, when stable code, before push
    Find all sentence boundaries within containers.
    Initializes [sentences, containerIdToFirstSentenceId, sentenceEls]
    If document is not readable, sentences will be empty array.
    */
    processSentences() {
        let startTime = new Date();
        this.sentences = [];
        this.sentenceEls = [];
        this.containerIdToFirstSentenceId = [];
        for(let container_id = 0; container_id < this.getNumContainers(); container_id++) {
            let container = this.getContainer(container_id);
            let containerText = container.text();
            let sentenceBoundaries = tokenizeSentences(containerText);
            for (let i = 0; i < sentenceBoundaries.length; i++) {
                let sentenceBoundary = sentenceBoundaries[i];
                let start = sentenceBoundary.index;
                let end = start + sentenceBoundary.offset;
                this.sentences.push(new SentencePointer(container_id, start, end));
                let sentenceId = this.sentences.length - 1;
                let sentenceClassName = "sentence"+sentenceId;
                // Give each sentence a unique class
                container.markRanges([{ 
                    start: start,
                    length: sentenceBoundary.offset
                }], {
                    className: sentenceClassName,
                    element: "readerease-sentence"
                });
                this.sentenceEls.push($("." + sentenceClassName));
                // Set keywords and score for each sentence
                // Note: Putting this outside setSentenceKeywordsAndScore so it doesn't have to carry over as much text 
                this.setSentenceKeywordsAndScore(container, containerText, start, end, sentenceId);
            }
            this.num_words_per_sentence = this.calcNumWordsPerSentence(this.sentences);
            this.num_words_per_sentence_suffix_sum = suffix_sum(this.num_words_per_sentence);
            if (this.sentences.length > MAX_NUM_SENTENCE) {
                alert("Sorry, we don't support big documents yet :(");
                this.containers = [];
                this.sentences = [];
                this.containerIdToFirstSentenceId = [];
                break;
            }
            this.containerIdToFirstSentenceId.push(this.sentences.length);
        }
        let endTime = new Date();
        let elapsedTimeS =  (endTime - startTime ) / 1000;
        debug(`Process Sentences done in ${elapsedTimeS} s`);
    }

    
    setSentenceKeywordsAndScore(container, containerText, start, end, sentenceId) {
        // Each score represents how many "words" each type is counted as. 
        const stopwordScore = 0.5; // Stop words count as half of a word
        const normalwordScore = 1; // Normal words count as one word
        const keywordScore = 1.5; // Key words count as 1.5 words

        // Note: This is similar code to what was in "highlightKeywords", now deleted
        let sentenceText = containerText.slice(start,end);
        let sentenceKeywordsClassName = "sentenceKeywords"+sentenceId;
        let wordRegex = /\b\w+\b/g;
        let wordList = sentenceText.match(wordRegex);
        let keywords = this.keywords;
        // Look where keyword is in sentence AFTER last search. Guaranteed to be after. Init to start. 
        let keyword_search_start_pointer = start; 
        // Cycle through words in each sentence
        let sentenceScore = 0; // Used for determining tracker lifetime
        for (var i in wordList) { 
            let word = wordList[i];
            if (keywords.has(word.toLowerCase())) { // See if each word is a keyword
                let word_start = containerText.indexOf(word, keyword_search_start_pointer);
                keyword_search_start_pointer = word_start + word.length;
                // Give the set of keywords in each sentence a unique class
                container.markRanges([{ 
                    start: word_start,
                    length: word.length
                }], {
                    className: sentenceKeywordsClassName,
                    element: "readerease-keyword"
                });
                sentenceScore += keywordScore;
            }
            else if (stop_words.has(word)) { 
                sentenceScore += stopwordScore;
            }
            else {
                sentenceScore += normalwordScore;
            }
        }
        this.sentenceScores.push(sentenceScore);
        this.sentenceKeywordsEls.push($("." + sentenceKeywordsClassName));
    }

    // Returns: Total words in doc (int)
    getTotalWords() {
        return this.total_words;
    }

    // Returns: List of keywords (str[])
    getKeyWords() {
        return this.keywords;
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

    getSentenceScore(sentenceId) {
        return this.sentenceScores[sentenceId];
    }

    // TODO: Make this function, integrate into calculateTrackerLifeMs
    // getTotalScoreFromSentenceTilEnd(sentenceId) {
    //     sentenceScoresLeft = this.sentenceScores.slice(sentenceId);
    // }

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
    Updates TF-IDF model, counts total words, calls processSentences and setKeyWords

    TODO: Refactor this, both in general and the async using promises. Too much tied to this one func.
    Also design is probably more related to historical development than necessary logical flow. 
    Currently like this to make sure the get from settings doesn't hold up sequence of actions
    to get keywords
    TODO: Hardcode in the DF dict before publishing, at least a baseline. 
    If improves speed dramatically, just use hardcoded version, don't keep growing DF. Can just grow one "dev" one and 
    swap out the baselines each version. 
    General proposal for rollout: 
    - Launch w/ hardcoded baseline
    - During dev a DF (probably Ben's) gets steadily improved
    - Next launch, use dev DF as new baseline. Should keep getting better.
    - After certain point, baseline may just be fine and user can build their own from there. 
        Even now, mine might be good enough for a relatively long term baseline (not forever, but a while)

        TODO: Move this to top of program in future CL; its order should mirror the async flow. 
        Just kept in old order now so the file comparison shows the changes (else shows EVERYTHING as changed)
    */
    processDocument(readableDomEls) {
        let self = this;
        let termFreq = {};
        let total_words = 0;
        // Calc term frequencies dict
        for (var section in readableDomEls) {
            let text = readableDomEls[section].text();
            let wordRegex = /\b\w+\b/g;
            let wordList = text.match(wordRegex);
            for (var i in wordList) {
                let word = wordList[i].toLowerCase();
                if (stop_words.has(word)) {
                    // Don't include stop words
                }
                else if (termFreq[word]) { // Word is in termFrequency dict
                    termFreq[word]++;
                } else {
                    termFreq[word] = 1;
                }
            }
            if ( wordList) { total_words += wordList.length; }
        }

        // Get & Update document frequency dict, visited URLS, call setKeyWords
        settings.getDocumentFreq(function(settingsDocumentFreq) {
            let documentFreq = settingsDocumentFreq;
            settings.getVisitedUrls(function(settingsVisitedUrls) {
                let visitedUrls = settingsVisitedUrls;
                let num_documents = Object.keys(visitedUrls).length;
                self.setKeyWords(termFreq, documentFreq, num_documents, function() {
                    // After keywords are set, proceed to processSentences. 
                    // If this is not done, setKeywordsAndScore will not be able to access keywords (must wait)
                    self.processSentences();
                });
                // Update document freq AFTER determining keywords -> save time, shouldn't affect result
                if (!visitedUrls[window.location]) {
                    self.updateDocumentFreq(termFreq, documentFreq);
                    settings.setDocumentFreq(documentFreq);
                    visitedUrls[window.location] = 1;
                    settings.setVisitedUrls(visitedUrls);
                }
                // This debug is for monitoring the total word count as I go, to see how it progresses
                debug("Number of words in document frequency dictionary: "+Object.keys(documentFreq).length);
            });     
        });
        this.termFreq = termFreq; // Set class attribute "termFreq"
        this.total_words = total_words; // Set total words for use elsewhere (like Display)  
    };
        

    /*
    Update document frequency dict; if haven't word seen before, add to dict. 
    If have, increase frequency + 1
    Params: 
    - Term frequency dictionary: { word: frequency }
    - Document frequency dictionary: { word: frequency }
    - cb: function()
    */    
   updateDocumentFreq(termFreq, documentFreq) {
        for (const word in termFreq) {
            let wordLowerCase = word.toLowerCase();
            if (word in documentFreq) {
                documentFreq[wordLowerCase]++;
            } else {
                documentFreq[wordLowerCase] = 1;
            }
        }
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
    calcSentencePerContainer() {
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
    Sets this.keywords
    Determines the keywords of the document (using simple term frequency filter)
    */
   setKeyWords(termFreq, documentFreq, num_documents, cb) { 
        let keywords = new Set();
        for (var word in termFreq) {
            let relTermFreqValue = termFreq[word] / this.total_words; // Get relative term frequency
            let documentFreqValue = documentFreq[word]
            if (!documentFreqValue) {
                keywords.add(word.toLowerCase()); // Word not encountered before -> Add to keywords
                continue;
            }
            let relDocumentFreqValue = documentFreqValue / num_documents // Get relative document frequency
            let tfIdfScore = relTermFreqValue / relDocumentFreqValue; // Score = TF/DF (hence TF-IDF)
            if (tfIdfScore > keywordFilter) { // Filter by score
                keywords.add(word.toLowerCase());
            };
        };
        this.keywords = keywords;
        cb();
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

    /*
    sentenceEls[sentenceId] gives you a jquerylist, where you can do things like
    jquerylist.on("click", ...)
    Each sentence ID may correspond to MULTIPLE DOM elements.
    E.g. <div> <S1> Hi my name is </S1><span> <S1> Arnold . </S1> Also, I go by Ar.</span>
    Note how there are multiple <S1> elements to account for the sentence boundary
    not aligning with HTML boundaries.
    */
    getSentenceEls(sentenceId) {
        return this.sentenceEls[sentenceId];
    }
    // Returns list of jQuery elements, corresponding to keywords within the sentence of ID: sentenceID
    getSentenceKeywordsEls(sentenceId) {
        return this.sentenceKeywordsEls[sentenceId];
    }
};


// Expose to global.
window.Doc = Doc;
})(); // End of namespace