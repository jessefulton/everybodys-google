var conf = require('./conf');
var models = require('./models');
var request = require('request')
	, express = require('express')
	, stylus = require('stylus')
	, nib = require('nib')
	//, jquery = require('jquery')
	//, jsdom = require('jsdom')
	, async = require('async');

	
var mongoose = require('mongoose')
	, Schema = mongoose.Schema
	, ObjectId = mongoose.SchemaTypes.ObjectId;

var app = express.createServer();


models.defineModels(mongoose, function() {
	app.WebSearch = mongoose.model('websearch');
	app.WebSearchResult = mongoose.model('websearchresult');
	app.ClientWebSearch = mongoose.model('clientwebsearch');
	app.WebSearchQueryQueue = mongoose.model('websearchqueryqueue');
	mongoose.connect('mongodb://' + conf.db.uri);
});




/**
 * App configuration.
 */
app.configure(function () {
	app.use(stylus.middleware({ src: __dirname + '/public', compile: compile }))
	app.use(express.static(__dirname + '/public'));
	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.use(express.session({ secret: 'ggiHoalO'}));

	//app.set('views', __dirname);
	app.set('view engine', 'jade');

	function compile (str, path) {
		return stylus(str)
			.set('filename', path)
			.use(nib());
	};
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
	var pgNum = req.params.pageNumber;
	var query = {};
	var fields = {};
	var opts = {sort: [['date', "ascending"]], limit:100};
	app.WebSearch.find(query, fields).sort('time_start',-1).limit(100).execFind(function(err, results) {
		if (!err) {
			//TODO: if games empty, display message
			res.render('search-view-all', {
				layout: true
				, locals: { 
					"bodyClasses": "history"
					, "searches": results
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
		app.WebSearch.findOne({query: req.body.query}, function(err, ws) {
			if (err || !ws) {
				ws = new app.WebSearch({query: req.body.query});
				var q = new app.WebSearchQueryQueue({query: req.body.query});
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
			
			ws.searches.push(cws);
			
			ws.save(function(err, obj) {
				if (err) { throw Error(); }
				res.json({"status": "OK"});
			});
		});

	} catch(e) {
		console.log(e);
		console.log(e.message);
		res.json({"status": "error"}, 500);
	}

	/*
	async.waterfall({
	  	ws.save(function(err, newObj) {
	  		//TODO: exit;
	  	});
	}, function(err) {});
	
	res.json({"clientId" : req.body.clientId
		, "query": req.body.query
		, "results": req.body.results
	});
	*/
});





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
 * App listen.
 */
app.listen(conf.port, function () {
	var addr = app.address();
	console.log('	 app listening on http://' + addr.address + ':' + addr.port);
	console.log('	NODE_ENV = ' + process.env.NODE_ENV);
});

