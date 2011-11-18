var conf = require('./conf');
var request = require('request');
var models = require('./models');

var mongoose = require('mongoose')
	, Schema = mongoose.Schema
	, ObjectId = mongoose.SchemaTypes.ObjectId;


var app = {};


//http://www.emoteapi.appspot.com/api

models.defineModels(mongoose, function() {
	app.WebSearch = mongoose.model('websearch');
	app.WebSearchResult = mongoose.model('websearchresult');
	mongoose.connect('mongodb://' + conf.db.uri);
	mongoose.connection.on("open", function() {
	
	
		var apiUrl = "https://www.googleapis.com/customsearch/v1?key=" + conf.google.apiKey + "&cx=" + conf.google.cseId + "&alt=json";
		
		var searchTerm = encodeURIComponent("bababooey");
		apiUrl += "&q=" + searchTerm;
		
		request(apiUrl, function (error, response, body) {
		  if (!error && response.statusCode == 200) {
		  	var responseObject = JSON.parse(body);
		  	var terms = responseObject.queries.request.searchTerms;
		  	var items = responseObject.items;
		  	
		  	var ws = new app.WebSearch({query: terms});
		  	
		  	for (var i=0; i<items.length; i++) {
		  		var el = items[i];
		  		var wsr = new app.WebSearchResult({
		  			user: "SYSTEM"
		  			, title: el.title
					, url: el.link
					, briefDescription: el.snippet
		  		});
		  		//wsr.save(function(err, newObj) {
		  			ws.results.push(wsr);
		  		//});
		  	}
		  	
		  	/*
		  	items.forEach(function(el, idx ar) {
		  		var wsr = new app.WebSearchResult({
					title: el.title
					, url: el.link
					, briefDescription: el.snippet
		  		});
		  		wsr.save(function(err, newObj) {
		  			ws.results.push(newObj);
		  		});
		  	});
		  	*/
		  	
		  	ws.save(function(err, newObj) {
		  		//TODO: exit;
		  	});

		  }
		});
	
	});
});

