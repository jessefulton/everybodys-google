//TODO: implement $.tmpl() - http://api.jquery.com/jquery.tmpl/    http://api.jquery.com/template-tag-tmpl/
$(function() {


	var cleanUrl = function(_url) {
		if (_url.indexOf("google.com/") != -1) {
			if (_url.indexOf("url?") != -1) {
				console.log("google url: " + _url);
				//TODO: SOMETHING!
				return _url;
			}
		}
		else {
			console.log("NON-GOOGLE! " + _url);
			//TODO: SOMETHING!
			return _url;
		}
	}

	var documentWidth = $(document).width();	
	var logClick = function(clickedAnchor) {
		window.setTimeout(function() {
			var query = $("#lst-ib").attr("value");
			var results = [];
			$("#search li").each(function() {
				//don't capture news (jQuery.each cannot "break" or "continue")
				if ($(this).id == "newsbox") { return true };
				var link = cleanUrl($(this).find("a:first").attr("href"));
				var title = $(this).find("h3:first").text();
				var snippet = $(this).find("span.st").text();
				results.push({"title": title, "link": link, "snippet": snippet, "rawHTML": $(this).html()});
			});
			
			var clicked = null;
			
			if (clickedAnchor) {
				var prnt = $(clickedAnchor).closest("li.g");
				var link = cleanUrl(prnt.find("a:first").attr("href"));
				var title = prnt.find("h3:first").text();
				var snippet = prnt.find("span.st").text();
				clicked = {"title": title, "link": link, "snippet": snippet, "rawHTML": $(this).html()};
				console.log(clicked);
			}
			
			//TODO: generate guid or remove all identifiers
			var clientId = "TEST";
			var data = {"query":query, "results":results, "clientId":clientId};
			
			console.log("Sending request...");
			chrome.extension.sendRequest({"type": "results", "data": data}, function(response) {
				var divWidth = (documentWidth - ($("#search").offset().left + $("#search").width())) + "px";
				var divLeft = documentWidth + "px";
				//or do left: 100%; margin-left: -100px;
				$("#everybodysgoogle").remove();
				$("#center_col").after('<div id="everybodysgoogle" style="width: ' + divWidth + ';left:' + divLeft + '"><div id="egopen"></div><div id="egclose"></div></div>');
				console.log("RESPONSE");
				for (var i=0; i< response.data.searches.length; i++) {
					console.log("found search " + i);
					var egrl = $("<div class='egresultlist'></div>");
					var search = response.data.searches[i];
					for (var j=0; j<search.results.length; j++) {
						var result = search.results[j];
						if (result.title && result.url && result.briefDescription) { //result.rawHTML ??
							egrl.append("<div class='egresult'><h3 class='r'><a href='" + result.url + "'>" + result.title + "</a></h3><div class='f kv'><cite>" + result.url + "</cite></div><div class='s'><span class='s'>" + result.briefDescription + "</span></div></div>");
						}
					}
					$("#everybodysgoogle").append(egrl);
				}
			});
		}, 300);
	};

	var logResults = function() { logClick(null); }


	
	$(document).on("click", "#search a", function() {
		logClick($(this));
		var _url = $(this).attr("href").toLowerCase();
		console.log('clicky ' + cleanUrl(_url));
		//if url LIKE google.com/url?
			//find "url" query param & unescape
		//else if NOT LIKE google.com
			//send url
	});

	$("#lst-ib").change(function() {
		logResults($(this).attr("value"));
	}).keyup(function(e) { 
		if(e.keyCode == 13) { 
			logResults($(this).attr("value"));
		} 
	}); 
	$("#main").next("table").click(function() {
		logResults($("#lst-ib").attr("value"));
	});
	
	$(document).on("click","#egopen", function() {
		var moveBy = "-=" + $("#everybodysgoogle").width() + "px";
		//var left = $("#center_col").css("margin-left");
		console.log('opening pane'); 
		$("#everybodysgoogle").animate({"left": moveBy});
	});
	$(document).on("click", "#egclose", function() { 
		console.log('closing pane'); 
		var moveBy = "+=" + $("#everybodysgoogle").width() + "px";
		$("#everybodysgoogle").animate({"left": moveBy});
	});	



	/*
	//monitor ajax requests
	(function(){
		if ($("#EGSEARCH").size() > 0){
			console.log("adding onchange");
			$("#EGSEARCH").change(function() {
				console.log("hidden input changed: " + $(this).val());
			});
		} else {
			console.log('setting timeout');
			window.setTimeout(arguments.callee,200);
		}
	})();
	*/
	//$("body").append("<script type='text/javascript' src='" + chrome.extension.getURL('ajax.js') + "'></script>");

});
