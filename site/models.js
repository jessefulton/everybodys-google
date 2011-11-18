var WebSearchResult, WebSearch;


function defineModels(mongoose, fn) {
	var Schema = mongoose.Schema,
		ObjectId = Schema.ObjectId;

	
	var WebSearchScore = new Schema({
		//this is where we add liberal/conservative, happy/sad, etc...
	});
	
	var WebSearchResult = new Schema({
		title: String
		, url: String
		, briefDescription: String
		, pageContent: String
		, scores: [WebSearchScore]
	});
	WebSearchResult.virtual('id')
		.get(function() { return this._id.toHexString(); });
	
	var WebSearch = new Schema({
		created: {type: Date, default: Date.now}
		, clientId: String
		, query: String
		, results: [WebSearchResult]
	});

	WebSearch.virtual('id')
		.get(function() { return this._id.toHexString(); });


  mongoose.model('websearchresult', WebSearchResult);
  mongoose.model('websearch', WebSearch);

  fn();
}




exports.defineModels = defineModels; 