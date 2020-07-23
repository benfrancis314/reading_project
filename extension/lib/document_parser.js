"use strict";
(function(){
var namespace = "lib/document_parser.js";
if (window[namespace] === true) {
    return;
} else {
    window[namespace] = true;
}

// Expose to global the function parseDocument()


/*
Identify the readable HTML elements in the document.
How:
- Attach unique ids to all visible elements.
- Run Readability to filter for the good elements.
- Return back the leftover unique ids.
Returns:
- readableDomEls - jquery dom elements of readable content to initialize the tracker with.
*/
function parseDocument() {
	let hostname = $(location).attr('hostname');
	let hardcodedSiteSpecificReadables = getHardcodedSiteSpecificReadables(hostname);
	if (hardcodedSiteSpecificReadables !== null) {
		return hardcodedSiteSpecificReadables;
	}

	// Get all direct + indirect descendants of body that are visible.
	// Generate unique id for each one, if doesn't exist before.
	// This makes sure that after readability.js mutates the clone, we can
	// recover the pointers to the original elements.
	$("body *").filter(":visible").each(function() {
		$(this).uniqueId();
	});

	let readableDomEls = [];
	// Pass clone of document because readability mutates the document.
	let docClone = document.cloneNode(/* deep= */true);
	trimDocBasedOnSite(docClone, hostname);

	let article = new Readability(docClone).parse();
	if (article === null) {
		return [];
	}

	// Readability.js converts all readable elements into <p>
	$(article.content).find("p,h1,h2,h3,li").each(function() {
		let id = $(this).attr('id');
		// The unidentified ids seem to be images / iframe snippets that
		// are re-included as-is, but otherwise are not considered readable text.
		// Sometimes I see ads being re-included with undefined ids, so it's probably
		// a good thing to skip these. 
		let el = $(`#${id}`);
		if (id !== undefined && el.is(":visible") && el.text().length > 0) {
			readableDomEls.push(el);
		}
	});
	return readableDomEls;
	// Uncomment this if you want to see the readable partitions.
	/*
		let colors = ['yellow', 'blue'];
		for (let i = 0; i < readableDomEls.length; i++) {
			let el = readableDomEls[i];
			console.log((i + 1) + ". " + el.html());
			el.css({ "background-color": colors[i % colors.length], "opacity": ".20" });
		}
	*/
}

/*
Skip through readability parsing for special sites.
E.g. twitlonger only has 1 long container, and for some reason readability
  doesn't work on it.
Parameter
- hostname: string. E.g. www.wikipedia.org
Returns:
- $[] - jquery dom elements of readable content to initialize the tracker with.
  Or null if there is no hardcoded logic.
*/
function getHardcodedSiteSpecificReadables(hostname) {
	if (hostname.endsWith("twitlonger.com")) {
		return [$("#posttext")];
	}
	return null;
}

/*
Remove elements from doc that you don't want to include, based on site-specific logic.
Parameter:
- doc - document obj.
- hostname: string. E.g. www.wikipedia.org
*/
function trimDocBasedOnSite(doc, hostname) {
	if (hostname.endsWith("wikipedia.org")) {
		trimDocWikipedia(doc);
		return;
	}
}

/*
trimDocBasedOnSite() for wikipedia.
*/
function trimDocWikipedia(doc) {
	let jdoc = $(doc);
	// Remove everything including and after "See also".
	// This includes references, citations, and small notes.
	jdoc.find("#See_also").parent().prev().nextAll().remove();
	// Remove all infoboxes.
	jdoc.find("table.infobox").remove();
	// Remove vertical box often to the right of articles apart of series/major scientific topics
	jdoc.find("table.vertical-navbox").remove();
}

// Expose to global.
window.parseDocument = parseDocument;
})(); // End of namespace