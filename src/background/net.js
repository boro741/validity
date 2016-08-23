/**
 * @namespace
 * @name validity.net
 */
var validity = (function(validity) {
	"use strict";
	/**
	 * @const
	 * @name DEFAULT_VALIDATOR
	 */
	var DEFAULT_VALIDATOR = 'https://html.validity.org.uk/check',
		net = {};

	/**
	 * @function
	 * @public
	 * @name getSource
	 */
	net.getSource = function(tab, callback) {
		var xhrSource = new XMLHttpRequest();
		//	Update page action icon
		validity.ui.setPageAction(tab.id, 'connecting', 'Contacting validator...');
		xhrSource.onreadystatechange = function() {
			if (xhrSource.readyState === 4) {
                callback(xhrSource.responseText);
                validity.stats.track('source', 'success', xhrSource.statusText);
			}
		};

        xhrSource.onerror = (e) => {
            validity.ui.setPageAction(tab.id, 'error', 'Could not retrieve source: ' + e.message);
            validity.stats.track('source', 'error', e.message);
        };

		xhrSource.open('GET', tab.url);
		xhrSource.send();
	};

	/**
	 * @function
	 * @public
	 * @name submitValidation
	 */
	net.submitValidation = function(tab, source, callback) {
		var validator,
			xhrValidator = new XMLHttpRequest();

		//	Set validator URL
		validator = validity.opts.option('validator') || DEFAULT_VALIDATOR;

		xhrValidator.onreadystatechange = function() {
			var response;
			if (xhrValidator.readyState === 4) {
				if (xhrValidator.status === 200) {
					response = validity.xml.parseResponse(xhrValidator.responseXML);
					if (response.errorCount > 0) {
						validity.ui.setPageAction(tab.id, 'invalid', response.errorCount + ' validation errors.');
					}
					else {
						validity.ui.setPageAction(tab.id, 'valid', 'Page is valid.');
					}

					if (typeof callback === 'function') {
						callback(tab, response);
					}

                    // Analytics.
					validity.stats.track('validate', 'success', response.statusText);
                    validity.stats.track('validate', 'doctype', response.doctype);
                    validity.stats.track('validate', 'default_validator', (validator === DEFAULT_VALIDATOR).toString());
				}
				else {
					validity.ui.setPageAction(tab.id, 'error', 'Could not contact validator: ' + xhrValidator.statusText);
					validity.stats.track('validate', 'error', response.statusText);
				}
			}
		};

		//	Open the XHR connection and send data
		xhrValidator.open('POST', validator);
		xhrValidator.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		xhrValidator.send('output=soap12&fragment='+encodeURIComponent(source));
	};

	validity.net = net;
	return validity;
})(validity || {});
