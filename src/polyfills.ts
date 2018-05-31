/* tslint:disable */
if (typeof Array.prototype.reduceRight !== "function") {
	Array.prototype.reduceRight = function (callback /*, initialValue*/) {
		"use strict";
		if (null === this || "undefined" === typeof this) {
			throw new TypeError("Array.prototype.reduce called on null or undefined");
		}
		if ("function" !== typeof callback) {
			throw new TypeError(callback + " is not a function");
		}
		let t = Object(this), len = t.length >>> 0, k = len - 1, value;
		if (arguments.length >= 2) {
			value = arguments[1];
		} else {
			while (k >= 0 && !(k in t)) {
				k--;
			}
			if (k < 0) {
				throw new TypeError("Reduce of empty array with no initial value");
			}
			value = t[k--];
		}
		for (; k >= 0; k--) {
			if (k in t) {
				value = callback(value, t[k], k, t);
			}
		}
		return value;
	};
}