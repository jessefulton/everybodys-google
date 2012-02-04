/***
 *
 *
 *
 *
 *
 */
var conf = require('./config');
var models = require('./models');
var request = require('request')
	, express = require('express')
	, stylus = require('stylus')
	, nib = require('nib')
	//, jquery = require('jquery')
	//, jsdom = require('jsdom')
	, async = require('async');

var config = conf.init();
	
var mongoose = require('mongoose')
	, Schema = mongoose.Schema
	, ObjectId = mongoose.SchemaTypes.ObjectId;

var app = express.createServer();


models.defineModels(mongoose, function() {
	app.WebSearch = mongoose.model('websearch');
	app.WebSearchResult = mongoose.model('websearchresult');
	app.ClientWebSearch = mongoose.model('clientwebsearch');
	app.WebSearchQueryQueue = mongoose.model('websearchqueryqueue');
	mongoose.connect('mongodb://' + config.MONGODB_URI);
    mongoose.connection.on("open", function() {
        console.log("opened connection to database!");
    });
});




/**
 * App configuration.
 */
app.configure(function () {
	app.use(stylus.middleware({ src: __dirname + '/public', compile: compile }))
	app.use(express.static(__dirname + '/public'));
	app.use(express.bodyParser());
	app.use(express.favicon());

	// "app.router" positions our routes 
	// above the middleware defined below,
	// this means that Express will attempt
	// to match & call routes _before_ continuing
	// on, at which point we assume it's a 404 because
	// no route has handled the request.
	
	app.use(app.router);

	app.set('views', __dirname+"/views");

	app.set('view engine', 'jade');
	app.set('view options', { pretty: true });

	function compile (str, path) {
		return stylus(str)
			.set('filename', path)
			.use(nib());
	};
});




app.configure('development', function(){
    app.use(express.static(__dirname + '/public'));
	app.use(express.logger('dev'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  var oneYear = 31557600000;
  app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
  app.use(express.errorHandler());
});



/**
 * App routes.
 */
app.get('/', function (req, res) {
	if (!req.loggedIn) {
		res.render('index', { layout: true, locals: { "bodyClasses": "index", "hideNav": true} });
	}
	else {
		res.redirect('/lobby');
	}
});


app.get('/searches/:pageNumber?', function(req, res) {
	var pgNum = req.params.pageNumber ? req.params.pageNumber : 1;
	var nPerPage = 100;
	var query = {};
	var fields = {};
	var opts = {sort: [['date', "ascending"]], limit:100};
	console.log("looking for searches");

 	app.WebSearch.find(query, fields).sort('time_start',-1).skip((pgNum-1)*nPerPage).limit(nPerPage).execFind(function(err, results) {
		if (!err) {
			app.WebSearch.count(function(err2, cnt) {
				if (err2) {
					console.log(err2);
					res.send('error finding count', 500);
				} else {
					pageCount = Math.ceil(cnt / nPerPage);
					//TODO: if games empty, display message
					res.render('search-view-all', {
						layout: true
						, locals: { 
							"bodyClasses": "history"
							, "searches": results
							, "pageCount": pageCount
						}
					});

				}
			});
		}
		else {
			console.log(err);
			res.send('couldn\'t find anthying', 404);
		}
	});
});

app.get('/search/:id', function(req, res) {
	app.WebSearch.findById(req.params.id, function(err, result) {
		if (!err) {
			//TODO: if games empty, display message
			res.render('search-view', {
				layout: true
				, locals: { 
					"bodyClasses": "history"
					, "websearch": result
				}
			});
		}
		else {
			console.log(err);
			res.send('couldn\'t find anthying', 404);
		}
	});
});


/**
 * App routes.
 */
app.get('/about', function (req, res) {
	res.render('about', {
		layout: true
		, locals: {
			"bodyClasses": "about"
		}
	});
});


app.post('/api/results', function(req, res) {
	console.log("trying to post result for " + req.body.clientId);
	try {
		var queryTerm = req.body.query.toLowerCase();
		app.WebSearch.findOne({query: queryTerm}, function(err, ws) {
			if (err || !ws) {
				ws = new app.WebSearch({query: queryTerm});
				var q = new app.WebSearchQueryQueue({query: queryTerm});
				q.save(function(err,newObj){
					console.log("Added item to queue: " + newObj.query);
				});
			}
			var cws = new app.ClientWebSearch({clientId: req.body.clientId});
			var items = req.body.results;
	
			for (var i=0; i<items.length; i++) {
				var el = items[i];
				cws.results.push(new app.WebSearchResult({
					title: el.title
					, url: el.link
					, briefDescription: el.snippet
				}));
			}
			//TODO: if "clicked" add "clicked" WebSearchResult to cws

			//results may change on based on user, geography, time, etc.
			//we just want to see if the same results have been stored, regardless
			
			//this looks at Google News results, so that may inflate number of "differences" in search results
			
			var existingResult = false;

			var foundIndex = -1;

			for (var i=0; i < ws.searches.length; i++) {
				var existingResults = ws.searches[i].results;
				var newResults = cws.results;
				var match = true;
				console.log("CHECKING RESULT SETS");
				for (var j=0; j < Math.min(existingResults.length, newResults.length); j++) {
					console.log("\tchecking urls:\n\t\t" + existingResults[j].url.toLowerCase() + "\n\t\t" + newResults[j].url.toLowerCase());
					if (existingResults[j].url.toLowerCase() == newResults[j].url.toLowerCase()) {
						match = false;
						break;
					}
				}
				
				if (match) { 
					foundIndex = i;
					existingResult = true; 
					break;
				}
			}
			
			
			if (!existingResult) {
				ws.searches.push(cws);
				//we don't car about saving synchronously here...
				ws.save(function(err, obj) {
					if (err) { throw Error(); }
				});				
			}
			else {
				ws.searches.splice(foundIndex, 1);
				console.log("These search results were found before!");
			}
			console.log("SENDING STATUS OK");
			console.log(ws);
			res.json({"status": "OK", "data": ws});
		});

	} catch(e) {
		console.log(e);
		console.log(e.message);
		res.json({"status": "error"}, 500);
	}

});


//=== ERROR HANDLING
function NotFound(msg){
  this.name = 'NotFound';
  Error.call(this, msg);
  Error.captureStackTrace(this, arguments.callee);
}

NotFound.prototype.__proto__ = Error.prototype;

app.get('/404', function(req, res){
  throw new NotFound;
});

app.get('/500', function(req, res){
  throw new Error('keyboard cat!');
});

app.error(function(err, req, res, next){
    if (err instanceof NotFound) {
        res.render('404.jade');
    } else {
    	res.render('500.jade');
        //next(err);
    }
});


//=== APPLICATION HELPERS
app.helpers({
		dateFormat: function(dateObj){ 
			return dateObj.getMonth() + "/" + dateObj.getDate() + "/" + dateObj.getFullYear();
		}
		, dateTimeFormat: function(dateObj){ 
			//TODO: clean up time to 12 hour clock?
			return dateObj.getMonth() + "/" + dateObj.getDate() + "/" + dateObj.getFullYear() + " " + dateObj.getHours() + ":" + dateObj.getMinutes();
		}
		, percentage: function(num) {
			return Math.round(num * 100) + "%";
		}
		, isNumber: function(num) {
			return (typeof(num) == "number") && !isNaN(num);
		}
		, siteName: "Everybody's Google"
		, hideNav: false
});



/**
 * Start it.
 */
var port = process.env.PORT || 3000;
app.listen(port, function () {
    var addr = app.address();
	console.log('	 app listening on http://' + addr.address + ':' + addr.port);
    console.log('	NODE_ENV = ' + process.env.NODE_ENV);
});


