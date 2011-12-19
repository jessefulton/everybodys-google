//http://myappsecurity.blogspot.com/2007/01/ajax-sniffer-prrof-of-concept.html

(function() {


	var decodeHex = function(str) {
		return str.replace(/\\x([0-9A-Fa-f]{2})/g, function() {
			return String.fromCharCode(parseInt(arguments[1], 16));
		});
	};

	var egInput = document.createElement("input");
	egInput.id = "EGSEARCH";
	egInput.setAttribute("name", "EGSEARCH");
	egInput.setAttribute("type", "text");
	document.body.appendChild(egInput);

	var dispatchSimpleEvent = function(target, type, canBubble, cancelable) {
	  var e = document.createEvent("Event");
	  e.initEvent.apply(e, Array.prototype.slice.call(arguments, 1));
	  target.dispatchEvent(e);
	};


	var hijackAjax = function(str) {
		egInput.value = str;
		dispatchSimpleEvent(egInput, "change", false, false);
	}
	var myOpen = function(method, url, async, user, password) {
		hijackAjax("");
		// url "/s" = predictive text (search term autocomplete)
		// url "/search" = search
		//pq = previous query
		//q = query
		//if (url.beginsWith("/search?")) { }
		this.originalOpen(method, url, async, user, password);
	}
	
	//Store the reference to the original open function of XMLHttpRequest object.
	XMLHttpRequest.prototype.originalOpen = XMLHttpRequest.prototype.open;
	//Assign the newly created myOpen function to the original open function of XMLHttpRequest. Now whenever a call to open function is made, it will invoke myOpen function first and from within myOpen the original open function is invoked to let XMLHttpRequest perform its function.
	XMLHttpRequest.prototype.open = myOpen;
	
	var mySend = function(a) {
		var xhr = this;
		
		//hijackAjax("SENDING: " + a);
		
		/* This function would get called when the onload event is called. */ 
		var onload = function() {
			//console.log(this.responseText);
			try {
				var decoded = decodeHex(this.responseText);
				console.log(decoded);
				var obj = eval(decoded);
				console.log(obj);
			} catch(e) { console.log(e); }
			//TODO: actually check for this in the right position - either JSONify, or use RegEx
			if (this.responseText.indexOf('u:"https://www.google.com/search?') != -1) {
				hijackAjax("RECEIVED DATA"); // + xhr.responseText);
			}
		};
		
		/* This function is called if there is an error when the onerror event is called. */ 
		var onerror = function() { 
			hijackAjax(""); 
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