/*
var xhr = new XMLHttpRequest();
xhr.onreadystatechange = handleStateChange; // Implemented elsewhere.
xhr.open("GET", chrome.extension.getURL('/config_resources/config.json'), true);
xhr.send();
*/

$(function() {

	var logChange = function(instr) {
		window.setTimeout(function() {
			var query = $("#lst-ib").attr("value");
			var results = [];
			$("#search li").each(function() {
				//link first anchor tag
				//title h3
				//description span.st
				var link = $(this).find("a:first").attr("href");
				var title = $(this).find("h3:first").text();
				var snippet = $(this).find("span.st").text();
				
				results.push({"title": title, "link": link, "snippet": snippet, "rawHTML": $(this).html()});
			});
			var clientId = "TEST";
			var data = {"query":query, "results":results, "clientId":clientId};
			
			console.log("Sending request...");
			chrome.extension.sendRequest({"type": "results", "data": data}, function(response) {
				console.log("RESPONSE STATUS: " + response.status);
			});
		}, 300);
	};

	$("#lst-ib").change(function() {
		logChange($(this).attr("value"));
	}).keyup(function(e) { 
		if(e.keyCode == 13) { 
			logChange($(this).attr("value"));
		} 
	}); 
	
	$("#main").next("table").click(function() {
		logChange($("#lst-ib").attr("value"));
	});
	

	/*
	
	
	if ($("#lst-ib").length > 0) {
		var INTERVAL_TIME = 5000;
	
		setInterval(function() {
			console.log("Search query: " + $("#lst-ib").attr("value"));
			$("#search li").each(function() {
				console.log($(this).html());
			});
		}, INTERVAL_TIME);
	}
	*/
});
