/**
 * npm install jsdom
 * npm install jquery
 */

var html = "<!doctype html><html><body><h1>Hello world!</h1></body></html>";

/* parse the html and create a dom window */
var window = require('jsdom').jsdom(html, null, {
        // standard options:  disable loading other assets
        // or executing script tags
        FetchExternalResources: false,
        ProcessExternalResources: false,
        MutationEvents: false,
        QuerySelector: false
}).createWindow();

/* apply jquery to the window */
var $ = require('jquery').create(window);

/* modify html using jquery */
$('h1').text('World hello!');
$('body').append('<p>Lorem ipsum...</p>');

/* output the modified html with doctype */
console.log( window.document.doctype + window.document.innerHTML );