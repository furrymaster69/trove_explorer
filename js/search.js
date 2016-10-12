// Changes: Lines 2-5, 86, 96, 114-148, 163-165, 172-176, 184, 191-213, 237, 243-247, 250, 252-257, 264, 267-273, 291, 391-392
// Trove API - http://help.nla.gov.au/trove/building-with-trove/api
// Related Terms API - http://www.datamuse.com/api/
// Random Word API - http://developer.wordnik.com/
// Flickr API - https://www.flickr.com/services/api/

$(document).ready(function(){

	// Dummy form submit to fix issue with Trove. Note: This sends Internet Explorer crazy, but it is what the tutor had... 
	$("form#searchTrove").submit();
		
	// On search submit, get search term and search Trove.
	$("form#searchTrove").submit(function() {
		var searchTerm = $("#searchTerm").val();
		if (searchTerm === "") {
			randomSearch("empty"); 
		}
		else {
			troveSearch(searchTerm, 0);
		}
		
	});
	
	// Generate a random term, then search for it. 
	$("#random").click(function() {
		randomSearch("button");
		document.getElementById("searchTrove").reset();
	});
});


function randomSearch(source){
	var randapikey = "18fd9e6383d50d520550108d7640fc727dccb1d07254b6807"; // Not mine, need to replace. Waiting on email. 
	var randwordurl = "http://api.wordnik.com/v4/words.json/randomWord?includePartOfSpeech=noun&hasDictionaryDef=true&minCorpusCount=80000&api_key=" + randapikey;
	var randword = []; // Can't make this global or it will mess up. 
	
	$.getJSON(randwordurl, function(data) {
		if (data.word.length > 0){
			randword.push(data.word);
		} else { // Backup only
			randword.push("llama");
		}
	});
	
	var k = 0;
	var interval3 = setInterval(function() { 
		if (randword.length > 0) {
			clearInterval(interval3);
			troveSearch(randword[randword.length - 1], 0);
			if (source === "empty") {
				errorMessage("nosearch"); // Placed here to get past clear.  
			}
			$("#messages").append("<p class='msg'>Your random search term is: " + randword[randword.length - 1] + ".</p>");
		} else {
			k = k + 1;
			console.log("Waiting for Random Word API");
			if (k >= 100) {
				clearInterval(interval3);
				troveSearch("llama", 0);
			$("#messages").append("<p class='msg'>Your random term word is: llama.</p>");
			}
		}
	}, 100);  
}

// Takes the search term and index number, returns output in #output and #output2
function troveSearch(keyword, number){
	$("#output3").toggle();
	$("#output2").toggle();
	$("#output").toggle();
	
	$("#messages").empty(); // Clear Messages
	if (number !== 0){
		$("#messages").append("<p class='msg'>This search was generated using the word: " + keyword + ".</p>");
		document.getElementById("searchTrove").reset();

	} else if (keyword === $("#searchTerm").val()){
		$("#messages").append("<p class='msg'>You searched for: " + keyword + ".</p>");	
	}

	// Setting up the API URL
	var apiKey = "lk45sgco41v1sjme";
	var searchZone = "newspaper";
	
	// Current search options - have 100-1000 words, full record, 30 results, include article text. 
	// Changes - datedesc, no word limit
	var searchOptions = "&sortby=datedesc&l-category=Article&reclevel=full&s=0&n=50&include=articletext&callback=?";
	var searchOptionsoriginal = "&l-word=1&reclevel=full&s=0&n=30&include=articletext&callback=?";

	// Replace spaces in search term with + 
	if (keyword.search(" ") !== -1) {
		var keywordsplit = keyword.split(" ");
		keyword = keywordsplit.join("+");
	}
	
	// Constructing API URLs
	var url = "http://api.trove.nla.gov.au/result?key=" + apiKey + "&encoding=json&zone=" + searchZone + "&q=title%3A(" + keyword + ")" + searchOptions;
	var relatedsearch = "https://api.datamuse.com/words?ml=" + keyword + "&max=10";
	console.log(url);

	// Setting up a list of other articles  
	var sidebarlist1 = [];
	var sidebarlist2 = [];
				
	// Take titles of search results and output them into a sidebarlist. 
	function sidebarArray(index, value, search, bar){
		var sidebararray = [];
		sidebararray.push("<a href='javascript:troveSearch(&quot;" + search + "&quot;, " + (index + 1) + ");' ><p>" + value + "</p></a>");	
		sidebararray.push(index+1);
		sidebararray.push(search);
		bar.push(sidebararray);
	}
	
	// Combining the 2 lots of search results by randomising each individually, then joining in a 1:1 ratio if possible. 
	function createList3(){
		var sidebarlist3 = [];
		sidebarlist1.sort(function(a, b){
			return 0.5 - Math.random();
		}); 
		sidebarlist2.sort(function(a, b){
			return 0.5 - Math.random();
		}); 
		if (sidebarlist1.length > 0 && sidebarlist2.length > 0){
			for (j = 0; j < Math.max(sidebarlist1.length, sidebarlist2.length); j++){
				if (j < Math.min(sidebarlist1.length, sidebarlist2.length)){
					sidebarlist3.push(sidebarlist1[j], sidebarlist2[j]);	
				} else if (j >= sidebarlist1.length && j < sidebarlist2.length){
					sidebarlist3.push(sidebarlist2[j])
				} else if (j < sidebarlist1.length && j >= sidebarlist2.length){
					sidebarlist3.push(sidebarlist1[j])	
				}
			} 
		} else if (sidebarlist1.length > 0 && sidebarlist2.length < 1){
			sidebarlist3 = sidebarlist3.concat(sidebarlist1);		
		} else if (sidebarlist1.length < 1 && sidebarlist2.length > 0){
			sidebarlist3 = sidebarlist3.concat(sidebarlist2);			
		}

		$("#output2").empty();
		if (sidebarlist3.length > 0) {
			for (i = 0; i < Math.min(10, sidebarlist3.length); i++){
				$("#output2").append(sidebarlist3[i][0]);
			}
		} 
		
		$("#output3").toggle();
		$("#output2").toggle();
		$("#output").toggle();
	}

	// Variable that will be used as a search term to generate related articles 
	var relterm = [];
	
	// Handles Datamuse API, picks a random term out of the results and adds it to relterm. 
	$.getJSON(relatedsearch, function(data) {
		if (data.length !== 0){
			var rand = Math.floor((Math.random() * data.length));
			relterm.push(data[rand].word);
		} else {
			relterm.push("Sorry"); 
		}
	});
	
	// Helps return errors faster
	var noresults = "False";
	var norelated = "False";
	
	// Handles Trove API
	$.getJSON(url, function(data) {
	
		// clear the HTML div that will display the results
		$("#output").empty();
		var maxprocess = data.response.zone[0].records.n;
		var failedresults = 0;
		if (maxprocess == 0){   // Can't use ===
			noresults = "True";
		}
		
		console.log(data.response.zone[0].records); // For debugging only
		
		// Filter Trove results - Only keep articles with no images
		// (value.lastCorrection == "[object Object]") to filter articles that have been edited once - May use later
		$.each(data.response.zone[0].records.article, function(index, value) {
		
			if (value.illustrated == "N" && value.title.value !== "Le Courrier Australien (Sydney, NSW : 1892 - 2011)") {
	
			// Run function to add to sidebarlist1
				sidebarArray(index, value.heading, keyword, sidebarlist1);
						
				// Pick the article to display - using either index number of first non-filtered result 
				if ((number == index + 1) || (number == 0 && sidebarlist1.length === 1)) { // === doesn't work here.
					// Fixing spaces that aren't needed in article text
					var articleText2 = (value.articleText).split('</span></p> <p><span>');
					for (i = 0; i < articleText2.length; i++){
						var firstletter = articleText2[i].charAt(2);
						if (firstletter === firstletter.toLowerCase() && firstletter !== firstletter.toUpperCase()){
							articleText2[i-1] = articleText2[i-1] + articleText2[i];
							articleText2.splice(i, 1);
							i--;
						}
						if (i === articleText2.length - 1){
							var articleText3 = (articleText2).join('</span></p> <p><span>');
							$("#output").append("<h3>" + value.heading + "</h3><p>" + articleText3 + "</br><a href='" + value.troveUrl + "' target='_blank' >View the original newspaper scan on Trove</p>");
							$("#tree").append("<a href='javascript:troveSearch(&quot;" + keyword + "&quot;, " + (index + 1) + ");' ><p>" + value.heading + "</p></a>");
							delete sidebarlist1[0];
						}
					}
				} 
			} else {
				failedresults++
			}
			if (failedresults == maxprocess){  // Can't use ===
				noresults = "True";
			}
		});
	});

	getImage(keyword, number);
	
	// Dealing with the Trove search for the related term 
	relatedSearch(); 
	function relatedSearch() {
		
		// setInterval is used to determine when the related term to search for is ready.  
		var i = 0;
		var interval = setInterval(function () { 
			if (relterm.length > 0) {
				clearInterval(interval);
				$("#messages").append("<p class='msg'>Your related search term is: " + relterm[relterm.length - 1] + ".</p>");
				// Replace spaces in search term with + 
				if (relterm[relterm.length - 1].search(" ") != -1) {
					var datasplit = relterm[relterm.length - 1].split(" ");
					var datajoin = datasplit.join("+");
					relterm.push(datajoin);
				}		
				
				// Constructing API URLs
				var relurl = "http://api.trove.nla.gov.au/result?key=" + apiKey + "&encoding=json&zone=" + searchZone + "&q=title%3A(" + relterm[relterm.length - 1] + ")" + searchOptions; 
				console.log(relurl);
				
				// Handles Trove API, see previous comments. 
				$.getJSON(relurl, function(data) {
					console.log(data.response.zone[0].records);
					var maxprocess = data.response.zone[0].records.n;
					var failedresults = 0;
					if (maxprocess == 0){   // Can't use ===
						norelated = "True";
					}

					$.each(data.response.zone[0].records.article, function(index, value) {
						if (value.illustrated == "N" && value.title.value !== "Le Courrier Australien (Sydney, NSW : 1892 - 2011)") {
							sidebarArray(index, value.heading, relterm[relterm.length - 1], sidebarlist2);
						} else {
							failedresults++
						}
						if (failedresults == maxprocess){ // Can't use ===
							norelated = "True";
						}
					});
				});
				
				// setInterval is used to deretmine when the results from both trove searches are done
				var j = 0;
				var interval2 = setInterval(function () { 
				if ((sidebarlist1.length > 0 && sidebarlist2.length > 0) || (sidebarlist2.length > 0  && noresults === "True") || (sidebarlist1.length > 0 && norelated === "True") || (noresults === "True" && norelated === "True")) { 		// If this doesn't run, doesn't get cleared.
					clearInterval(interval2);
					
					if (sidebarlist2.length > 0  && noresults === "True"){
						errorMessage("trovesearchconfirmed");
					} else if (sidebarlist1.length > 0 && norelated === "True"){
						errorMessage("troverelated");
					} else if (noresults === "True" && norelated === "True"){
						errorMessage("noresults");
					}

					// Run the function to combine and randomise the lists. 
					createList3();
					
					
					
				} else {
				j = j + 1;
				if (j >= 200) {
					clearInterval(interval2);
					if (sidebarlist1.length < 1){
						$("#output").empty();
					}
					
					// If the searches aren't ready after 20 seconds, run the function anyway. 
					createList3();
					
					// Error messages. Many are now redundant and need a clean up. 
					if (sidebarlist1.length < 1 && sidebarlist2.length > 0 && relterm[relterm.length - 1] !== "Sorry") {
						errorMessage("trovesearch");
					} else if (sidebarlist1.length > 0 && relterm[relterm.length - 1] === "Sorry" ) {
						errorMessage("troverelated"); 
					} else if (sidebarlist1.length > 0 && sidebarlist2.length < 1) { // sidebarlist2.length can't be < 1 unless the API didn't return anything in time. 
						errorMessage("trovehalftimeout");
					} else if (sidebarlist1.length < 1 && relterm[relterm.length - 1] === "Sorry") {
						errorMessage("noresults");
					} else if (sidebarlist1.length < 1 && sidebarlist2.length < 1 && relterm[relterm.length - 1] === "Sorry") {
						errorMessage("trovetimeout");					
					} else {
						errorMessage("trovetimeout");
					}
				}
				console.log("Waiting for APIs to load");
				}
				}, 100);  
			} else {
			i = i + 1;
			if (i >= 100) {
				clearInterval(interval);
				
				// If the related term isn't ready after 10 seconds, alert the user. 
				alert("Sorry, the search could not generate a related term");
			}
			console.log("Waiting for Related Term API");
			}
		}, 100);  
	}
}


function getImage(term, index){ // Edited from http://deco1800.uqcloud.net/examples/webAppDemo/
	var flickr_key = "55e52837e8b6737934693e044b276841";
	var flickr_secret = "98fae6a1b7172e17";
	
	// Searches for the image that matches the Trove Index number. This randomises it over results, while keepign consistent. 
	if (index === 0) {
		var imgnum = 0;
	} else {
		var imgnum = index - 1; //Since the index here is one that is already + 1, and need it to start at 0. 
	}
	
	// If the search term has exactly 1 space, replace + with %2B for more accurate results (Mainly for names. 2+ spaces is risky as it can come up with nothing)  
	if (term.split("+").length === 2) {
		var termsplit = term.split("+");
		term = termsplit.join("%2B");
	}
	
	// 50 results per page, public only, relevance, json
	var flickr_search_url = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key="+flickr_key+"&format=json&nojsoncallback=1&sort=relevance&privacy_filter=1&per_page=50&text="+term;
			
	// Bug - Flickr seems to send lists that are not completely loaded, so loading the same search term a few seconds after will give different results. 
	$.getJSON(flickr_search_url, function(data) {
		// Log the data to the console so you can inspect it
		//Inspect response - check stat field is 'ok'
		if(data.stat == "ok" && data.photos.pages > 0){
			
			// If the number of search results is less than the index number, use the first result. 
			if (imgnum >= data.photos.total) {
				imgnum = 0;
			}
			
			//_m.jpg for medium, can be changed https://www.flickr.com/services/api/misc.urls.html
			var flickr_file_url = "http://farm"+data.photos.photo[imgnum].farm+".staticflickr.com/"+data.photos.photo[imgnum].server+"/"+data.photos.photo[imgnum].id+"_"+data.photos.photo[imgnum].secret+"_m.jpg";
			
			// Giving credit to Flickr uploader in alt tag. 
			var flickr_image_url = "https://api.flickr.com/services/rest/?method=flickr.photos.getInfo&api_key="+flickr_key+"&format=json&nojsoncallback=1&photo_id="+data.photos.photo[imgnum].id;
			var photo_url = "";
			
			$.getJSON(flickr_image_url, function(data) {
				if(data.stat == "ok"){
					$.each(data.photo.urls, function(index, url){
						// If the URL type is equal to photopage, grab the URL associated with it
						if(url[0].type == "photopage") photo_url = url[0]._content;
					});									
				}
				// Clear the output area - in case there is something in there
				$("#output3").empty();
				// Append a new img - assigning it the photo URL as the ALT text so we can use it later & the file URL from Flickr as the image source.
				// Add a link to save the combo
				$("#output3").append("<img class='thumb' alt='"+photo_url+"' src='"+flickr_file_url+"'>");
			});	
			
		}else{
			// If data.stat returns anything other than ok, let the user know that nothing was found
			if (data.photos.pages === 0){
				getImage("file not found", 0);
			} else {
				errorMessage("image");
			}
		}
	});
				
}

function errorMessage(type){
	if (type === "trovesearch") {
		$("#messages").append("<p class='errormsg'>Sorry, your search either had 0 results or Trove partially timed out. Here's some related articles:</p>");
	} else if (type === "trovesearchconfirmed") {
		$("#messages").append("<p class='errormsg'>Sorry, your search had 0 results. Here's some other articles:</p>");		
	} else if (type === "troverelated") {
		$("#messages").append("<p class='errormsg'>Sorry, we couldn't generate any results for related terms. Here's your original search results:</p>");
	} else if (type === "trovehalftimeout") {
		$("#messages").append("<p class='errormsg'>Sorry, the Trove results for related terms didn't load in time. Here's your original results:</p>");
	} else if (type === "noresults") {
		$("#messages").append("<p class='errormsg'>Sorry, we couldn't generate any results for your search or related terms. Please try again.</p>");
	} else if (type === "trovetimeout") {
		$("#messages").append("<p class='errormsg'>Sorry, we didn't recieve a response from Trove in time. Please try again.</p>");
	} else if (type === "nosearch") {
		$("#messages").append("<p class='msg'>You entered nothing so we've done a random search for you instead.</p>");
	} else if (type === "image") {
		$("#messages").append("<p class='msg'>No Image Results Found</p>");
	}
}
