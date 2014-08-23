/*
 * ImpactJS Plugin that makes URL "GET" variables easily accessible.
 * @author   Jonathan Commins
 * @created  April 4, 2013
 */
ig.module('plugins.joncom.url-variables.url-variables')
.requires()
.defines(function() {"use strict";

    // Returns an object of variables keyed by the name of the variable.
    var getUrlVariables = function() {
        // An object that will hold the value of each variable, keyed by name of that variable.
        var data = {};
        // Get the string that follows the "?" in the window's location.
        var search = window.location.search;
        if(search) {
            search = search.substr(1); // Drop the leading "?"
            var varPairs = search.split("&"); // Extract pairs in the form "foo=bar".
            // Extract variable name and value from each pair.
            for(var i=0; i<varPairs.length; i++) {
                var varNameAndValue = varPairs[i].split("=");
                var varName = varNameAndValue[0];
                var varValue = varNameAndValue[1];
                data[varName] = varValue; // Store variable.
            }
        }
        return data;
    };

    ig.urlVariables = getUrlVariables();

});