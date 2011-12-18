//TODO: implement $.tmpl() - http://api.jquery.com/jquery.tmpl/    http://api.jquery.com/template-tag-tmpl/
$(function() {
	var documentWidth = $(document).width();
	var logChange = function(instr) {
		window.setTimeout(function() {
			var query = $("#lst-ib").attr("value");
			var results = [];
			$("#search li").each(function() {
				//don't capture news (jQuery.each cannot "break" or "continue")
				if ($(this).id == "newsbox") { return true };
				var link = $(this).find("a:first").attr("href");
				var title = $(this).find("h3:first").text();
				var snippet = $(this).find("span.st").text();
				results.push({"title": title, "link": link, "snippet": snippet, "rawHTML": $(this).html()});
			});
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

	$("body").append("<script type='text/javascript' src='" + chrome.extension.getURL('ajax.js') + "'></script>");

});



