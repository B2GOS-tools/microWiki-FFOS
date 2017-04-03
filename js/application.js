var sdcard 					= navigator.getDeviceStorage('sdcard');

var setting_content_theme 	= false;

var setting_theme 			= false;
	
var use_engine 				= false;	

var base_storage_path 		= "microWiki/"

var active_file_name 		= "index";

var last_file_name 			= "";

var file_suffix 			= "txt";

var editorContent_edited 	= false;

var wikiCodeParser			= false;


//helper for binding wikistuff:
var forEach = Array.prototype.forEach,
$$ = document.querySelectorAll.bind(document);


var codeandcreateMicroWiki = {

	/*
		File I/O:
		
	*/

	saveAmWikiEntry:		function(content, filename) {
		
		// all html needs to stripped out... we only want bbcode :)
		content = content.replace(/(<([^>]+)>)/ig,"");
		// sorry no "going back"...
		content = content.replace("../","");
		
		var file   = new Blob([content], {type: "text/plain"});

		var request = sdcard.addNamed(file, base_storage_path + filename + "." + file_suffix);
		
		request.onsuccess = function () {
		
			codeandcreateMicroWiki.displayAnEntry(content);
		}
		
		// An error typically occur if a file with the same name already exist
		request.onerror = function () {
		  
			/* if you can't write it, delete it first... */
			codeandcreateMicroWiki.dropAmWikiEntry(filename, function() { codeandcreateMicroWiki.saveAmWikiEntry(content,filename); });
		}

	},
	loadAmWikiEntry:		function(filename, editmode, justrefresh) {
	
		if (justrefresh != true) {
			last_file_name = active_file_name;
			active_file_name = filename;
		}
		
		var request = sdcard.get(base_storage_path + filename + "." + file_suffix);

		request.onsuccess = function () {
		  	
		  	var reader = new FileReader();
		  	
		  	reader.onload = function(e) {
			  	if (editmode) {
				  	codeandcreateMicroWiki.loadEntryIntoEditor(e.target.result );
			  	} else {
				  	codeandcreateMicroWiki.displayAnEntry(e.target.result );
			  	}
		  	}
		  	reader.readAsText(this.result);
		  	
		}
		
		request.onerror = function () {
			/* no file? just write the default one (only output for the user! no writing to filesys if isn't necessary) */
			if (filename == "index") {
				
				if (editmode) {
				  	codeandcreateMicroWiki.loadEntryIntoEditor(navigator.mozL10n.get("coc_mwiki_welcomeWikiText_" + use_engine));
			  	} else {
					codeandcreateMicroWiki.displayAnEntry(navigator.mozL10n.get("coc_mwiki_welcomeWikiText_" + use_engine));
				}
			} else if (filename == "help") {
			  	if (editmode) {
				  	codeandcreateMicroWiki.loadEntryIntoEditor(navigator.mozL10n.get("coc_mwiki_defaultHelpText_" + use_engine));
			  	} else {
					codeandcreateMicroWiki.displayAnEntry(navigator.mozL10n.get("coc_mwiki_defaultHelpText_" + use_engine));
				}
			} else {
			  	if (editmode) {
				  	codeandcreateMicroWiki.loadEntryIntoEditor("");
			  	} else {
					codeandcreateMicroWiki.displayAnEntry(navigator.mozL10n.get("coc_mwiki_defaultWikiText_" + use_engine));
				}
			}
		}
	},
	loadEntryIntoEditor:	function(content) {
		editorContent_edited = false;
		document.querySelector('#editorContent').value = content;
	},
	dropAmWikiEntry:		function(filename, callback) {
		var request = sdcard.delete(base_storage_path + filename + "." + file_suffix);

		request.onsuccess = function () {
		  callback();
		}
		
		request.onerror = function () {
		  //console.log("Unable to delete the file: " + this.error);
		}
	},
	
	/*
		
		Rendering:
		
	*/
	
	displayAnEntry:			function(content) {
		
		
		switch (use_engine) {
			case 'wikiCode':
				document.querySelector('#wikiContent').innerHTML = "";
				
				wikiCodeParser.parse(document.querySelector('#wikiContent'), content);
				
				forEach.call($$('#wikiContent a'), function(v) {
				  var link = v.getAttribute('href');
				  v.setAttribute("href", "#");
				  v.className = "internal";
				  v.addEventListener('click', function(e) {
					  if (link.indexOf("http://") == -1 && link.indexOf("https://") == -1) {
				    	  codeandcreateMicroWiki.loadAmWikiEntry(link);  
					  } else {
						  window.open(link);
					  }  
				  }, false);
				});
				break;
			case 'bbCode':
				content = BBC2HTML(content)
		
				document.querySelector('#wikiContent').innerHTML = content;
		
				forEach.call($$('a.internal'), function(v) {
				  v.addEventListener('click', function(e) {
				    codeandcreateMicroWiki.loadAmWikiEntry(this.getAttribute('data-href'));    
				  }, false);
				});
				break;
			default:
				document.querySelector('#wikiContent').innerHTML = content;
		}
	
		if (active_file_name == "index") {
			document.querySelector("#btn-back-to-start").style.display = "none";
			document.querySelector("#btn-delete-entry").style.display = "none";
		} else {
			document.querySelector("#btn-back-to-start").style.display = "inline-block";
			document.querySelector("#btn-delete-entry").style.display = "inline-block";
		}
	},
	
	getSelectedThemeName:	function() {
		if (setting_theme != "normal") {
			return "skin-" + setting_theme;
		}
		return "";
	},
	
	setTheme:				function() {
		document.querySelector("#index").className = codeandcreateMicroWiki.getSelectedThemeName();
		document.querySelector("#editor").className = codeandcreateMicroWiki.getSelectedThemeName();
		document.querySelector("#settings").className = codeandcreateMicroWiki.getSelectedThemeName();
		
		if (setting_content_theme == "normal") {
			document.querySelector("body").className = "";
		} else {
			document.querySelector("body").className = setting_content_theme;
		}
	},
	
	/*
		
		INIT:
		
	*/
	
	init:					function() {
	
		//THEME / SETTINGS INIT:
		
		setting_content_theme 	= codeandcreateStorage.getValue("selected_content_theme");
		setting_theme 			= codeandcreateStorage.getValue("selected_theme");	
		use_engine 				= codeandcreateStorage.getValue("use_engine");	

		if (!setting_content_theme) {
			setting_content_theme = "normal";
			codeandcreateStorage.setValue("selected_content_theme", setting_content_theme);
		}
		if (!setting_theme) {
			setting_theme = "normal";
			codeandcreateStorage.setValue("selected_theme", setting_theme);	
		}
		if (!use_engine) {
			use_engine = "wikiCode";
			codeandcreateStorage.setValue("use_engine", use_engine);	
		}
		codeandcreateMicroWiki.setTheme();
	
		//syntax for wikicode:
		var options = {};
		wikiCodeParser = new Parse.Simple.Creole(options);
		
		codeandcreateMicroWiki.loadAmWikiEntry(active_file_name);
		
		// UI INIT:
		
		document.querySelector('#editorContent').setAttribute("placeholder", navigator.mozL10n.get("coc_mwiki_defaultWikiText_" + use_engine));
		
		//Delete-Button
		document.querySelector('#btn-delete-entry').addEventListener ('click', function () {
		  document.querySelector('#delete-confirm').className = 'fade-in';
		});
		document.querySelector('#btn-cancel-delete').addEventListener ('click', function () {
		  document.querySelector('#delete-confirm').className = 'fade-out';
		});
		document.querySelector('#btn-confirm-delete').addEventListener ('click', function () {
			codeandcreateMicroWiki.dropAmWikiEntry(active_file_name, function(){
				codeandcreateMicroWiki.loadAmWikiEntry(last_file_name);
			});
		  document.querySelector('#delete-confirm').className = 'fade-out';
		});
		//Editor
		document.querySelector('#btn-editor-open').addEventListener ('click', function () {
			codeandcreateMicroWiki.loadAmWikiEntry(active_file_name,true, true);
		
		  document.querySelector('#editor').className = 'current ' + codeandcreateMicroWiki.getSelectedThemeName();
		  document.querySelector('[data-position="current"]').className = 'left ' + codeandcreateMicroWiki.getSelectedThemeName();
		});
		
		document.querySelector('#btn-editor-back').addEventListener ('click', function () {
			if (editorContent_edited) {
				document.querySelector('#save-confirm').className = 'fade-in';
			} else {
				document.querySelector('#editor').className = 'right ' + codeandcreateMicroWiki.getSelectedThemeName();
				document.querySelector('[data-position="current"]').className = 'current ' + codeandcreateMicroWiki.getSelectedThemeName();
			}
		});
		
		
		document.querySelector('#btn-cancel-save').addEventListener ('click', function () {
		  document.querySelector('#save-confirm').className = 'fade-out';
		  document.querySelector('#editor').className = 'right ' + codeandcreateMicroWiki.getSelectedThemeName();
		  document.querySelector('[data-position="current"]').className = 'current ' + codeandcreateMicroWiki.getSelectedThemeName();
		});
		
		
		document.querySelector('#btn-save-it').addEventListener ('click', function () {
			codeandcreateMicroWiki.saveAmWikiEntry(document.querySelector('#editorContent').value,active_file_name);
			editorContent_edited = false;
		});
		
		document.querySelector('#btn-do-the-saving').addEventListener ('click', function () {
			codeandcreateMicroWiki.saveAmWikiEntry(document.querySelector('#editorContent').value,active_file_name);
			
			document.querySelector('#save-confirm').className = 'fade-out';
			document.querySelector('#editor').className = 'right ' + codeandcreateMicroWiki.getSelectedThemeName();
			document.querySelector('[data-position="current"]').className = 'current ' + codeandcreateMicroWiki.getSelectedThemeName();
		});
		
		document.querySelector('#editorContent').addEventListener ('change', function() {
			editorContent_edited = true;
		});
		
		//Settings
		document.querySelector('#btn-settings-open').addEventListener ('click', function () {

			document.querySelector('#selected_theme_' + setting_theme).checked = true;
			document.querySelector('#selected_content_theme_' + setting_content_theme).checked = true;
			document.querySelector('#selected_syntax_' + use_engine).checked = true;
		
		  document.querySelector('#settings').className = 'current ' + codeandcreateMicroWiki.getSelectedThemeName();
		  document.querySelector('[data-position="current"]').className = 'left ' + codeandcreateMicroWiki.getSelectedThemeName();
		});
		
		document.querySelector('#btn-settings-back').addEventListener ('click', function () {
		
			setting_content_theme 	= codeandcreateStorage.getValue("selected_content_theme");
			setting_theme 			= codeandcreateStorage.getValue("selected_theme");
			use_engine 				= codeandcreateStorage.getValue("use_engine");
			codeandcreateMicroWiki.setTheme();
			
			document.querySelector('#settings').className = 'right ' + codeandcreateMicroWiki.getSelectedThemeName();
			document.querySelector('[data-position="current"]').className = 'current ' + codeandcreateMicroWiki.getSelectedThemeName();
		});
		
		
		forEach.call($$('input[name="selected_content_theme"]'), function(v) {
		  v.addEventListener('click', function(e) {
		  	codeandcreateStorage.setValue("selected_content_theme", this.getAttribute('value'));  
		  }, false);
		});
				
		
		forEach.call($$('input[name="selected_theme"]'), function(v) {
		  v.addEventListener('click', function(e) {
		  	codeandcreateStorage.setValue("selected_theme", this.getAttribute('value'));
		  }, false);
		});
		
		forEach.call($$('input[name="selected_syntax"]'), function(v) {
		  v.addEventListener('click', function(e) {
		  	codeandcreateStorage.setValue("use_engine", this.getAttribute('value'));  
		  }, false);
		});
		
		//help button:
		document.querySelector('#btn-help-open').addEventListener ('click', function () {
			codeandcreateMicroWiki.loadAmWikiEntry("help");
		});


		//Back-Button:
		document.querySelector('#btn-back-to-start').addEventListener ('click', function () {
			codeandcreateMicroWiki.loadAmWikiEntry("index");
		});
		
	}
}

//wait till mozL10n is ready...
navigator.mozL10n.ready( function() {
	codeandcreateMicroWiki.init();
});