/**
 * This script runs the Google Custom Search queries as a cron task.
 * On the free tier, you're limited to 100 queries/day, so I've set
 * this up to run at 15 minute intervals.
 */

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';

var conf = require('./config');
var models = require('./models');

var request = require('request'),
	loggly = require('loggly');

var mongoose = require('mongoose')
	, Schema = mongoose.Schema
	, ObjectId = mongoose.SchemaTypes.ObjectId;

var app = {};


var config = conf.init();

var client = loggly.createClient({subdomain: config.LOGGLY_SUBDOMAIN, json: true});

//http://www.emoteapi.appspot.com/api

models.defineModels(mongoose, function() {
	app.WebSearch = mongoose.model('websearch');
	app.WebSearchResult = mongoose.model('websearchresult');
	app.ClientWebSearch = mongoose.model('clientwebsearch');
	app.WebSearchQueryQueue = mongoose.model('websearchqueryqueue');
	mongoose.connect('mongodb://' + config.MONGODB_URI);
	mongoose.connection.on("open", function() {
	
	
		var apiUrl = "https://www.googleapis.com/customsearch/v1?key=" + config.GOOGLE_API_KEY + "&cx=" + config.GOOGLE_CSE_ID + "&alt=json";
		
		
		app.WebSearchQueryQueue.findOne({}, function(err, queuedQuery) {
			console.log(queuedQuery);
			
			var searchTerm = queuedQuery.query;
	
			apiUrl += "&q=" + encodeURIComponent(searchTerm);
			
			request(apiUrl, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var responseObject = JSON.parse(body);
					var terms = searchTerm; //responseObject.queries.request.searchTerms;
					var items = responseObject.items;

					app.WebSearch.findOne({"query": terms}, function(err, ws) {
						if (!err && ws) {
							console.log("===found one!");
						}
						else {
							console.log("Couldn't find record for " + terms);
							ws = new app.WebSearch({"query": terms});
						}
			
						var cs = new app.ClientWebSearch({clientId: "SERVER"});
						
						for (var i=0; i<items.length; i++) {
							var el = items[i];
							var wsr = new app.WebSearchResult({
								user: "SYSTEM"
								, title: el.title
								, url: el.link
								, briefDescription: el.snippet
							});
							//wsr.save(function(err, newObj) {
								cs.results.push(wsr);
							//});
						}
						ws.searches.push(cs);
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
							queuedQuery.remove(function(err){
								console.log("Saved new search, removed old from queue");
								client.log(config.LOGGLY_INPUT_KEY, 'Machine search for term "' + newObj.query + '" successful.', function (err, result) {
								    if(err) {
								    	console.log(err);
								    }
									process.exit();
								});
							});
						});
						
					});
				}
				else {
					console.log("ERROR");
				}
			});

			
		});
	});
});

