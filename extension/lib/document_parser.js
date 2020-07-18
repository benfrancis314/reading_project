"use strict";
(function(){
var namespace = "lib/document_parser.js";
if (window[namespace] === true) {
    return;
} else {
    window[namespace] = true;
}

/*
Attach IDs to all elements in document.
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
// Expose to global.
window.parseDocument = parseDocument;
})(); // End of namespace