/*
Taken from https://github.com/GitbookIO/tokenize-english/blob/master/lib/index.js
Under Apache 2.0 license: https://github.com/GitbookIO/tokenize-english/blob/master/LICENSE
Changes:
- Removed require statements and just dumped all dependency files here.
- For behavioral changes, Search "EDIT:"
  - Handle citation cases like "abcd.[1][2]" for wikipedia.
- isBoundaryChar. Added chinese period 。

Exports a global function:
  tokenizeSentences(string text), that returns SentenceBoundary[]
  Each element has [int start, int offset, string value], indicating a sentence.
  offset is the sentence length.
  value is the actual sentence.

*/
/*
Sentence Boundary Detection (SBD)
Split text into sentences with a vanilla rule based approach (i.e working ~95% of the time).

Split a text based on period, question and exclamation marks.
Skips (most) abbreviations (Mr., Mrs., PhD.)
Skips numbers/currency
Skips urls, websites, email addresses, phone nr.
Counts ellipsis and ?! as single punctuation
*/

(function(){
var namespace = "third_party/tokenize-english.js";
if (window[namespace] === true) {
    return;
} else {
    window[namespace] = true;
}

function endsWithChar(word, c) {
    if (c.length > 1) {
        return c.indexOf(word.slice(-1)) > -1;
    }

    return word.slice(-1) === c;
}

function endsWith(word, end) {
    return word.slice(word.length - end.length) === end;
}

var abbreviations = [
    "ie",
    "eg",
    "ext", // + number?
    "Fig",
    "fig",
    "Figs",
    "figs",
    "et al",
    "Co",
    "Corp",
    "Ave",
    "Inc",
    "Ex",
    "Viz",
    "vs",
    "Vs",
    "repr",
    "Rep",
    "Dem",
    "trans",
    "Vol",
    "pp",
    "rev",
    "est",
    "Ref",
    "Refs",
    "Eq",
    "Eqs",
    "Ch",
    "Sec",
    "Secs",
    "mi",
    "Dept",

    "Univ",
    "Nos",
    "No",
    "Mol",
    "Cell",

    "Miss", "Mrs", "Mr", "Ms",
    "Prof", "Dr",
    "Sgt", "Col", "Gen", "Rep", "Sen",'Gov', "Lt", "Maj", "Capt","St",

    "Sr", "Jr", "jr", "Rev",
    "PhD", "MD", "BA", "MA", "MM",
    "BSc", "MSc",

    "Jan","Feb","Mar","Apr","Jun","Jul","Aug","Sep","Sept","Oct","Nov","Dec",
    "Sun","Mon","Tu","Tue","Tues","Wed","Th","Thu","Thur","Thurs","Fri","Sat"
];

function isCapitalized(str) {
    return /^[A-Z][a-z].*/.test(str) || isNumber(str);
}

// Start with opening quotes or capitalized letter
function isSentenceStarter(str) {
    return isCapitalized(str) || /``|"|'/.test(str.substring(0,2));
}

function isCommonAbbreviation(str) {
    return ~abbreviations.indexOf(str.replace(/\W+/g, ''));
}

// This is going towards too much rule based
function isTimeAbbreviation(word, next) {
    if (word === "a.m." || word === "p.m.") {
        var tmp = next.replace(/\W+/g, '').slice(-3).toLowerCase();

        if (tmp === "day") {
            return true;
        }
    }

    return false;
}

function isDottedAbbreviation(word) {
    var matches = word.replace(/[\(\)\[\]\{\}]/g, '').match(/(.\.)*/);
    return matches && matches[0].length > 0;
}

// TODO look for next words, if multiple capitalized -> not sentence ending
function isCustomAbbreviation(str) {
    if (str.length <= 3)
        return true;

    return isCapitalized(str);
}

// Uses current word count in sentence and next few words to check if it is
// more likely an abbreviation + name or new sentence.
function isNameAbbreviation(wordCount, words) {
    if (words.length > 0) {
        if (wordCount < 5 && words[0].length < 6 && isCapitalized(words[0])) {
            return true;
        }

        var capitalized = words.filter(function(str) {
            return /[A-Z]/.test(str.charAt(0));
        });

        return capitalized.length >= 3;
    }

    return false;
}

function isNumber(str, dotPos) {
    if (dotPos) {
        str = str.slice(dotPos-1, dotPos+2);
    }

    return !isNaN(Number(str));
}

// Phone number matching
// http://stackoverflow.com/a/123666/951517
function isPhoneNr(str) {
    return str.match(/^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/);
}

// Match urls / emails
// http://stackoverflow.com/a/3809435/951517
function isURL(str) {
    return str.match(/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/);
}

// Starting a new sentence if beginning with capital letter
// Exception: The word is enclosed in brackets
function isConcatenated(word) {
    var i = 0;

    if ((i = word.indexOf(".")) > -1 ||
        (i = word.indexOf("!")) > -1 ||
        (i = word.indexOf("?")) > -1)
    {
        var c = word.charAt(i + 1);

        // Check if the next word starts with a letter
        if (c.match(/[a-zA-Z].*/)) {
            return [word.slice(0, i), word.charAt(i), word.slice(i+1)];
        }
    }

    return false;
}

function isBoundaryChar(word) {
    return word === "." ||
           word === "!" ||
           word === "?" ||
           // Chinese boundary characters
           word === "。" ||
           word === "！" ||
           word === "？";
}

// http://tech.grammarly.com/blog/posts/How-to-Split-Sentences.html
function tokenizeSentences(tokenize, opts) {
    opts = _.defaults(opts || {}, {
        newlineBoundary: true
    });

    var splitRe = /[\s。！？]/;

    return tokenize.serie(
        // Split into words
        tokenize.re(splitRe, { split: true }),

        // Merge words as sentences
        tokenize.splitAndMerge(function(word, token, prev, next, i, tokens) {
            var tmp;
            var endOfSentence = [word, null];
            var sentenceNotOver = word;

            // Find the next word
            var nextWord = _.find(tokens.slice(i+1), function(tok) {
                return !splitRe.test(tok.value)
            });

            // Newline boundaries
            if (word === '\n' && opts.newlineBoundary) return endOfSentence;

            let citationEndRegex =  /\.[\[\d+\]]*$/;
            if (isBoundaryChar(word) ||
                endsWithChar(word, "?!") ||
                // EDIT:
                // When checking for newline boundary, remove the citations at the end.
                // That is, from "abcd.[1][2]" to "abcd."
                citationEndRegex.test(word))
            {
                return endOfSentence;
            }

            // A dot might indicate the end sentences
            // Exception: The next sentence starts with a word (non abbreviation)
            //            that has a capital letter.
            if (endsWithChar(word, '.') || endsWithChar(word, '。')) {
                // Check if there is a next word
                if (nextWord) {
                    // This should be improved with machine learning

                    // Single character abbr.
                    if (word.length === 2 && isNaN(word.charAt(0)) && word.match(/[a-zA-Z]/)) {
                        return sentenceNotOver;
                    }

                    // Common abbr. that often do not end sentences
                    if (isCommonAbbreviation(word)) {
                        return sentenceNotOver;
                    }

                    // Next word starts with capital word, but current sentence is
                    // quite short
                    if (isSentenceStarter(nextWord.value)) {
                        if (isTimeAbbreviation(word, nextWord.value)) {
                            return sentenceNotOver;
                        }

                        // Dealing with names at the start of sentences
                        /*if (isNameAbbreviation(wordCount, words.slice(i, 6))) {
                            return word;
                        }*/

                        if (isNumber(nextWord.value) && isCustomAbbreviation(word)) {
                            return sentenceNotOver;
                        }
                    }
                    else {
                        // Skip ellipsis
                        if (endsWith(word, "..")) {
                            return sentenceNotOver;
                        }

                        //// Skip abbreviations
                        // Short words + dot or a dot after each letter
                        if (isDottedAbbreviation(word) || isCustomAbbreviation(word)) {
                            return sentenceNotOver;
                        }
                    }
                }

                return endOfSentence;
            }

            // Check if the word has a dot in it
            if ((index = word.indexOf(".")) > -1) {
                if (isNumber(word, index)) {
                    return sentenceNotOver;
                }

                // Custom dotted abbreviations (like K.L.M or I.C.T)
                if (isDottedAbbreviation(word)) {
                    return sentenceNotOver;
                }

                // Skip urls / emails and the like
                if (isURL(word) || isPhoneNr(word)) {
                    return sentenceNotOver;
                }
            }

            if (tmp = isConcatenated(word)) {
                return [
                    tmp[0]+tmp[1], null, tmp[2]
                ];
            }

            return sentenceNotOver;
        }),

        // Filter empty sentences
        tokenize.filter(function(sentence) {
            if (sentence.trim() == '') return false;
            return true;
        })
    );
};

let tokenize = new Tokenizer();
// Export to global 
window.tokenizeSentences = _.partial(tokenizeSentences, tokenize)();
})(); // End of namespace
