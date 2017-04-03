/**
 *
 * storage engine 
 *
 * description: abstraction layer for storing data
 *
 * version: 201207
 *
 * engines: localStorage
 *
 */
var codeandcreateStorage = {
	 
	storageToUse	: "localStorage",
	
	setStorage		: function (storageType) {
		if (!isNaN(storageType)) {
			switch (storageType) {
				default:
				case 0:
					codeandcreateStorage.storageToUse = "localStorage";
					break;
			}
		}
	},
	
	setValue		: function (key, value) {
		if (typeof key != "undefined" && typeof value != "undefined") {
			switch (codeandcreateStorage.storageToUse) {
				case "localStorage":
					localStorage.setItem(key, value);
					return true;
					break;
			}
		}
		return false;
	},
	
	getValue		: function (key) {
		if (typeof key != "undefined") {
			switch (codeandcreateStorage.storageToUse) {
				case "localStorage":
					return localStorage.getItem(key);
					break;
			}
		}
		return false;
	},
	
	deleteValue		: function (key) {
		if (typeof key != "undefined") {
			switch (codeandcreateStorage.storageToUse) {
				case "localStorage":
					return localStorage.removeItem(key);
					break;
			}
		}
		return false;
	}
}