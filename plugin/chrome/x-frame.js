		//via: http://code.google.com/p/chrome-page-compare/source/browse/trunk/x-frame-options-workaround.js?r=2

		/*
		  This file provides a workaround for the X-Frame-Options HTTP header 
		  that prevents pages from being displayed in frames.
		*/
		
		function InitializeXFrameOptionsWorkaround(tabId)
		{
				var webRequest = chrome.webRequest || chrome.experimental.webRequest;
				if(webRequest && webRequest.onHeadersReceived) //Older Chrome does not support webRequest API or supports it but response headers cannot be modified
				{
						webRequest.onHeadersReceived.addListener((function(details)
						{
								var headers = details.responseHeaders;
								console.log(details);
								for(var i = 0; headers && i < headers.length; ++i)
										if(headers[i].name.toLowerCase() == "x-frame-options")
										{
												headers.splice(i, 1);
												break;
										}
								return {responseHeaders: headers};
						}), {urls: ["<all_urls>"], types: ["sub_frame"], "tabId": tabId}, 
								["blocking", "responseHeaders"]);
						return true;
				}
				else
						return false;
		}
