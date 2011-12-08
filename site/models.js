var WebSearchResult, WebSearch;


function defineModels(mongoose, fn) {
	var Schema = mongoose.Schema,
		ObjectId = Schema.ObjectId;

	/**
	 * These are items which the server still needs to look up
	 */
	var WebSearchQueryQueue = new Schema({
		created: {type: Date, default: Date.now}
		, query: String
	});
	WebSearchQueryQueue.virtual('id')
		.get(function() { return this._id.toHexString(); });

	/**
	 * The actual search result items (web pages)
	 */
	var WebSearchResult = new Schema({
		title: String
		, url: String
		, briefDescription: String
		, pageContent: String
		, rawHTML: String
	});
	WebSearchResult.virtual('id')
		.get(function() { return this._id.toHexString(); });
	
	
	/**
	 * A search query result for a particular client (plugin, server, etc.)
	 */
	var ClientWebSearch = new Schema({
		created: {type: Date, default: Date.now}
		, url: String
		, clientId: String
		, results: [WebSearchResult]	
	});
	
	/**
	 * Search query and affiliated client searches
	 */
	var WebSearch = new Schema({
		created: {type: Date, default: Date.now}
		, query: String
		, searches: [ClientWebSearch]
	});

	WebSearch.virtual('id')
		.get(function() { return this._id.toHexString(); });


  mongoose.model('websearchresult', WebSearchResult);
  mongoose.model('websearch', WebSearch);
  mongoose.model('clientwebsearch', ClientWebSearch);
  mongoose.model('websearchqueryqueue', WebSearchQueryQueue);


  fn();
}




exports.defineModels = defineModels; 