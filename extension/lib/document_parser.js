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
=======
/*
Attach IDs to all elements in document.
>>>>>>> 1da442be001743136055dc52575fd496a62a054c
Returns:
- readableDomIds - Dom IDs of readable content to initialize the tracker with.
*/
function parseDocument() {
	// Get all direct + indirect descendants of body that are visible.
	// Generate unique id for each one, if doesn't exist before.
	// This makes sure that after readability.js mutates the clone, we can
	// recover the pointers to the original elements.
	$("body *").filter(":visible").each(function() {
		$(this).uniqueId();
	});

	let readableDomIds = [];
	// Pass clone of document because readability mutates the document.
	let docClone = document.cloneNode(/* deep= */true);
	trimDocBasedOnSite(docClone);

	// TODO: Handle readability failures.
	let article = new Readability(docClone).parse();
	// Readability.js converts all readable elements into <p>
	$(article.content).find("p,h1,h2,h3,li").each(function() {
		let id = $(this).attr('id');
		// The unidentified ids seem to be images / iframe snippets that
		// are re-included as-is, but otherwise are not considered readable text.
		// Sometimes I see ads being re-included with undefined ids, so it's probably
		// a good thing to skip these. 
		let el = $(`#${id}`);
		if (id !== undefined && el.is(":visible") && el.text().length > 0) {
			readableDomIds.push(id);
		}
	});
	return readableDomIds;
	// Uncomment this if you want to see the readable partitions.
	/*
		let colors = ['yellow', 'blue'];
		for (let i = 0; i < readableDomIds.length; i++) {
			let el = $("#" + readableDomIds[i]);
			console.log((i + 1) + ". " + el.html());
			el.css({ "background-color": colors[i % colors.length], "opacity": ".20" });
		}
	*/
}

/*
Remove elements from doc that you don't want to include, based on site-specific logic.
Parameter:
- doc - document obj.
*/
function trimDocBasedOnSite(doc) {
	let hostname = $(location).attr('hostname');
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
}

// Expose to global.
window.parseDocument = parseDocument;
})(); // End of namespace