window.twttr = (function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0],
        t = window.twttr || {};
    if (d.getElementById(id)) return;
    js = d.createElement(s);
    js.id = id;
    js.src = "https://platform.twitter.com/widgets.js";
    fjs.parentNode.insertBefore(js, fjs);

    t._e = [];
    t.ready = function (f) {
        t._e.push(f);
    };

    return t;
}(document, "script", "twitter-wjs"));

// Wait for the asynchronous resources to load
twttr.ready(function (twttr) {
    // Now bind our custom intent events
    //twttr.events.bind('click', clickEventToAnalytics);
    twttr.events.bind('tweet', function (event) {
        // retrieve user profile and check if it already has the properties we're interested in

        var baseURL = window.digitalData.contextServerPublicUrl + '/cxs';

        var defaultErrorCallback = function () {
            alert('There was an error making the request.');
        };

        function createCORSRequest(method, url) {
            var xhr = new XMLHttpRequest();
            if ("withCredentials" in xhr) {
                xhr.open(method, url);

            } else if (typeof XDomainRequest != "undefined") {

                // Otherwise, check if XDomainRequest.
                // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
                xhr = new XDomainRequest();
                xhr.open(method, url);

            } else {

                // Otherwise, CORS is not supported by the browser.
                xhr = null;

            }
            return xhr;
        }

        function performXHRRequest(url, successCallback, errorCallback, data) {
            var method = data ? 'POST' : 'GET';
            var xhr = createCORSRequest(method, baseURL + url);
            if (!xhr) {
                alert('CORS not supported');
                return;
            }

            xhr.onerror = errorCallback || defaultErrorCallback;
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    successCallback(JSON.parse(xhr.responseText));
                }
            };

            xhr.setRequestHeader("Authorization", CXSAuthorizationHeader); // authenticate with context server
            if (!data) {
                xhr.setRequestHeader("Content-Type", "text/plain;charset=UTF-8"); // Use text/plain to avoid CORS preflight
                xhr.send();
            } else {
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.send(JSON.stringify(data));
            }
        }

        // check if we already have defined the property type we're interested in
        performXHRRequest('/profiles/properties/tags/social', function (data) {
            for (var i in data) {
                if (data[i].itemId === 'tweetNb' && data[i].itemId === 'tweetedFrom') {
                    // we found it so abort search
                    return;
                }
            }

            // we haven't found the property types, so create them
            var propertyType = {
                itemId: 'tweetNb',
                itemType: 'propertyType',
                metadata: {
                    id: 'tweetNb',
                    name: 'tweetNb'
                },
                tags: ['social'],
                target: 'profiles',
                type: 'integer'
            };

            performXHRRequest('/profiles/properties', function (data) {
                console.log("Property type tweetNb successfully added!");
            }, defaultErrorCallback, propertyType, false);

            propertyType = {
                itemId: 'tweetedFrom',
                itemType: 'propertyType',
                metadata: {
                    id: 'tweetedFrom',
                    name: 'tweetedFrom'
                },
                tags: ['social'],
                target: 'profiles',
                type: 'string',
                multivalued: true
            };

            performXHRRequest('/profiles/properties', function (data) {
                console.log("Property type tweetedFrom successfully added!");
            }, defaultErrorCallback, propertyType, false);

        }, defaultErrorCallback, null, false);

        // retrieve profile
        performXHRRequest('/profiles/' + cxs.profileId, function (profile) {
            var properties = profile.properties;
            var tweetNb = properties.tweetNb || 0;
            var tweetedFrom = properties.tweetedFrom || [];
            profile.properties.tweetNb = tweetNb + 1;
            var pageInfo = window.digitalData.page.pageInfo;
            if (pageInfo) {
                var url = pageInfo.destinationURL;
                if (url) {
                    tweetedFrom.push(url);
                    profile.properties.tweetedFrom = tweetedFrom;
                }
            }

            // and update it with the new value for tweetNb
            performXHRRequest('/profiles', function (profile) {
                console.log("Profile successfully updated with tweetNB = " + profile.properties.tweetNb);
                console.log("Profile successfully updated with tweetedFrom = " + profile.properties.tweetedFrom);
            }, defaultErrorCallback, profile)
        });
    });
    //twttr.events.bind('retweet', retweetIntentToAnalytics);
    //twttr.events.bind('favorite', favIntentToAnalytics);
    //twttr.events.bind('follow', followIntentToAnalytics);
});