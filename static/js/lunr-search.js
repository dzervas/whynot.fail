window.addEventListener("DOMContentLoaded", function (event) {
	var index = null;
	var lookup = null;
	var queuedTerm = null;

	var input = document.getElementById("search-input");

	input.addEventListener("change", function (event) {
		event.preventDefault();

		var term = input.value.trim();
		console.log(term);
		if (!term)
			return;

		startSearch(term);
	}, false);

	function startSearch(term) {
		// Start icon animation.
		input.setAttribute("data-running", "true");

		if (index) {
			// Index already present, search directly.
			search(term);
		}
		else if (queuedTerm) {
			// Index is being loaded, replace the term we want to search for.
			queuedTerm = term;
		}
		else {
			// Start loading index, perform the search when done.
			queuedTerm = term;
			initIndex();
		}
	}

	function searchDone() {
		// Stop icon animation.
		input.removeAttribute("data-running");

		queuedTerm = null;
	}

	function initIndex() {
		var request = new XMLHttpRequest();
		request.open("GET", "/search.json");
		request.responseType = "json";
		request.addEventListener("load", function (event) {
			lookup = {};
			index = lunr(function () {
				// Uncomment the following line and replace de by the right language
				// code to use a lunr language pack.

				// this.use(lunr.de);

				this.ref("uri");

				// If you added more searchable fields to the search index, list them here.
				this.field("title");
				this.field("content");
				this.field("description");
				this.field("categories");

				for (var doc of request.response) {
					this.add(doc);
					lookup[doc.uri] = doc;
				}
			});

			// Search index is ready, perform the search now
			search(queuedTerm);
		}, false);
		request.addEventListener("error", searchDone, false);
		request.send(null);
	}

	function search(term) {
		var results = index.search(term);

		// The element where search results should be displayed, adjust as needed.
		var target = document.getElementById("search-results");

		while (target.firstChild)
			target.removeChild(target.firstChild);

		var title = document.createElement("p");
		title.id = "search-result-text";
		title.className = "list-title";

		if (results.length == 0)
			title.textContent = `No results found for “${term}”`;
		else if (results.length == 1)
			title.textContent = `Found one result for “${term}”`;
		else
			title.textContent = `Found ${results.length} results for “${term}”`;
		target.appendChild(title);
		document.title = title.textContent;

		var template = document.getElementById("search-result-template");
		for (var result of results) {
			var doc = lookup[result.ref];

			// Fill out search result template, adjust as needed.
			var element = template.content.cloneNode(true);
			element.querySelector(".summary-title-link").href = doc.uri;
			element.querySelector(".summary-title-link").textContent = doc.title;
			var termIndex = doc.content.search(term);
			element.querySelector(".summary").textContent = doc.content.substring(termIndex - 16, termIndex + 16) + '...';
			element.querySelector(".tags").textContent = doc.tags.join(", ");
			target.appendChild(element);
		}

		searchDone();
	}

	// This matches Hugo's own summary logic:
	// https://github.com/gohugoio/hugo/blob/b5f39d23b8/helpers/content.go#L543
	function truncate(text, minWords) {
		var match;
		var result = "";
		var wordCount = 0;
		var regexp = /(\S+)(\s*)/g;
		while (match = regexp.exec(text)) {
			wordCount++;
			if (wordCount <= minWords)
				result += match[0];
			else {
				var char1 = match[1][match[1].length - 1];
				var char2 = match[2][0];
				if (/[.?!"]/.test(char1) || char2 == "\n") {
					result += match[1];
					break;
				}
				else
					result += match[0];
			}
		}
		return result;
	}
}, false);
