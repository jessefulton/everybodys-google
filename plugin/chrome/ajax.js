(function() {
	var hijackAjax = function(str) {
		console.log(str);
	}
	
	var myOpen = function(method, url, async, user, password) {
		hijackAjax("url="+url);
		//if (url.beginsWith("/s")) { }
		this.originalOpen(method, url, async, user, password);
	}
	
	//Store the reference to the original open function of XMLHttpRequest object.
	XMLHttpRequest.prototype.originalOpen = XMLHttpRequest.prototype.open;
	
	//Assign the newly created myOpen function to the original open function of XMLHttpRequest. Now whenever a call to open function is made, it will invoke myOpen function first and from within myOpen the original open function is invoked to let XMLHttpRequest perform its function.
	XMLHttpRequest.prototype.open = myOpen;
	
	
	var xhr = new XMLHttpRequest();
	alert(xhr.open);
	
	
	var mySend = function(a) {
		var xhr = this;
		
		hijackAjax("SENDING: " + a);
		
		/* This function would get called when the onload event is called. */ 
		var onload = function() {
			hijackAjax("RECEIVED: " + xhr.responseText);
		};
		
		/* This function is called if there is an error when the onerror event is called. */ 
		var onerror = function() { 
			hijackAjax("ERROR! " + xhr.status); 
		};
		
		/* Add the load and error events to this function. */ 
		xhr.addEventListener("load", onload, false);
		xhr.addEventListener("error", onerror, false);
		
		/* Call the original send function. */ 
		xhr.originalSend(a);
	}
	
	/* Store the original function in another variable and call it from within the overriding function. */ 
	XMLHttpRequest.prototype.originalSend = XMLHttpRequest.prototype.send;
	XMLHttpRequest.prototype.send = mySend;
})();