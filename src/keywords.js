(function(window) {

	window.Keywords = (function() {

		/***************************************/
		/************* INITIALIZE **************/
		/***************************************/

		var Class = function( params ) {

			// STORE this AS self, SO THAT IT IS ACCESSIBLE IN SUB-FUNCTIONS AND TIMEOUTS.

			var self = this;

			// CHECK FOR REQUIRED SELECTOR

			if ( ! 'selector' in params ) {

				return false;

			}

			// SET UP KEYWORD COLORS

			self.colors = {};

			if ( 'colors' in params ) {

				self.colors.default = 'default' in params.colors ? params.colors.default : {};
				self.colors.highlight = 'highlight' in params.colors ? params.colors.highlight : {};

				if ( 'color' in self.colors.default ) {
					self.colors.default.fill = self.colors.default.color;
				}

				if ( 'color' in self.colors.highlight ) {
					self.colors.highlight.fill = self.colors.highlight.color;
				}

			}

			// SET UP DELIMITER

			self.delimiter = 'delimiter' in params ? params.delimiter : ' ';

			// SET UP CHOICES

			var choices = 'choices' in params ? params.choices : [];

			// SET UP ELEMENT REFERENCES CONTAINER

			self.el = {};

			// SET UP ELEMENT REFERENCES

			self.el.input = document.querySelector( params.selector );
			self.el.hidden = self.el.input.cloneNode();
			self.el.hidden.type = 'hidden';
			self.el.input.name = '';
			self.el.input.id = '';
			self.el.input.value = '';

			// CREATE ELEMENTS

			self.el.outerWrap = document.createElement('div');
			self.el.keywordWrap = document.createElement('div');
			self.el.template = document.createElement('div');
			self.el.choicesWrap = document.createElement('ul');
			self.el.highlighted = null;

			// ASSIGN CLASSES TO ELEMENTS

			self.el.outerWrap.className = 'kwjs-outerwrap';
			self.el.keywordWrap.className = 'kwjs-keywordwrap';
			self.el.template.className = 'kwjs-keyword';
			self.el.choicesWrap.className = 'kwjs-choiceswrap';

			// ASSIGN HARDCODED STYLES TO ELEMENTS

			var inputStyles = window.getComputedStyle(self.el.input, null);

			addStyles( self.el.outerWrap, {
				'position' : 'relative',
				'display' : ( inputStyles.getPropertyValue('display') == 'inline' ? 'inline-block' : inputStyles.getPropertyValue('display') )
			});

			addStyles( self.el.keywordWrap, {
				'pointer-events' : 'none',
				'position' : 'absolute',
				'top' : inputStyles.getPropertyValue('border-top-width'),
				'left' : inputStyles.getPropertyValue('border-left-width'),
				'padding' : '4px 0 4px 4px'
			});			

			addStyles( self.el.template, {
				'padding-left' : (parseInt(inputStyles.getPropertyValue('padding-left'))-2)+'px',
				'padding-right' : (parseInt(inputStyles.getPropertyValue('padding-right'))-2+20)+'px', // PLUS 20 HERE TO MAKE ROOM FOR THE "x"
				'font-size' : inputStyles.getPropertyValue('font-size'),
				'font-weight' : inputStyles.getPropertyValue('font-weight'),
				'font-style' : inputStyles.getPropertyValue('font-style'),
				'font-family' : inputStyles.getPropertyValue('font-family'),
				'display' : 'inline-block',
				'pointer-events' : 'auto',
				'position' : 'relative',
				'border-radius' : '2px',
				'box-sizing' : 'border-box',
				'margin-right' : '4px',
				'line-height' : (parseInt(inputStyles.getPropertyValue('height'))-8)+'px',
			});

			addStyles( self.el.choicesWrap, {
				'position' : 'absolute',
				'top' : '100%',
				'left' : '0',
				'right' : '0',
				'list-style' : 'none',
			});

			addStyles( self.el.template, self.colors.default );

			// MOVE ELEMENTS AROUND

			self.el.input.parentNode.insertBefore(self.el.outerWrap, self.el.input.nextSibling);

			self.el.outerWrap.appendChild(self.el.hidden);
			self.el.outerWrap.appendChild(self.el.input);
			self.el.outerWrap.appendChild(self.el.keywordWrap);
			self.el.outerWrap.appendChild(self.el.choicesWrap);

			// RUN INITIAL PARSING IN CASE THERE ARE PRE-FILLED IN VALUES

			self.updateKeywordsFromRealString( self.el.hidden.value );

			// ADD EVENT LISTENERS

			self.el.keywordWrap.addEventListener('click', function(event) {

				if ( event.target.nodeName.toLowerCase() == 'button' ) {

					self.removeKeyword( event.target.parentNode );

					self.el.input.focus();

				}

			});

			self.el.outerWrap.addEventListener('focusin', function(event) {

				if ( self.el.highlighted ) {

					self.unhighlightKeyword( self.el.highlighted );

				}

			});

			self.el.outerWrap.addEventListener('focusout', function(event) {

				if ( self.el.input.value ) {

					window.setTimeout( function(event){

						var keyword = self.el.input.value.replace(self.delimiter, '');

						self.addKeyword( keyword );

					}, 10 );

				}

			});

			self.el.outerWrap.addEventListener('keypress', function(event) { console.log(event.which)

				if ( event.which == self.delimiter.charCodeAt(0) ) { // console.log('Delimitor Key');

					if ( self.el.input.value ) {

						window.setTimeout( function(event){

							var keyword = self.el.input.value.replace(self.delimiter, '');

							self.addKeyword( keyword );

						}, 10 );

					}

				}

			});

			self.el.outerWrap.addEventListener('keydown', function(event) { console.log(event.which)

				if ( event.which == 13 ) { // console.log('Enter Key');

					if ( self.el.input.value ) {

						event.preventDefault();

						window.setTimeout( function(event){

							var keyword = self.el.input.value.replace(self.delimiter, '');

							self.addKeyword( keyword );

						}, 10 );

					}

				} else if ( event.which == 8 ) { // console.log('Backspace Key');

					if ( ! self.el.input.value && self.el.keywordWrap.children.length > 0 ) {

						event.preventDefault();

						if ( self.el.highlighted ) {

							var current = self.el.highlighted;

							if ( current.previousElementSibling ) {

								self.highlightKeyword( current.previousElementSibling );

							} else {

								self.el.input.focus();

							}

							self.removeKeyword( current );

						} else {

							self.highlightKeyword( self.el.keywordWrap.lastChild );

						}

					}

				} else if ( event.which == 46 ) { // console.log('Delete Key');

					if ( ! self.el.input.value && self.el.keywordWrap.children.length > 0 ) {

						if ( self.el.highlighted ) {

							var current = self.el.highlighted;

							if ( current.nextElementSibling ) {

								self.highlightKeyword( current.nextElementSibling );

							} else {

								self.el.input.focus();

							}

							self.removeKeyword( current );

						}

					}

				} else if ( event.which == 37 ) { // console.log('Arrow Left Key');

					if ( ! self.el.input.value && self.el.keywordWrap.children.length > 0 ) {

						if ( self.el.highlighted ) {

							var current = self.el.highlighted;

							if ( current.previousElementSibling ) {

								self.unhighlightKeyword( current );

								self.highlightKeyword( current.previousElementSibling );
							}

						} else {

							self.highlightKeyword( self.el.keywordWrap.lastChild );

						}

					}

				} else if ( event.which == 39 ) { // console.log('Arrow Right Key');

					if ( ! self.el.input.value && self.el.keywordWrap.children.length > 0 ) {

						if ( self.el.highlighted ) {

							var current = self.el.highlighted;

							self.unhighlightKeyword( current );

							if ( current.nextElementSibling ) {

								self.highlightKeyword( current.nextElementSibling );

							} else {

								self.el.input.focus();

							}

						}

					}

				}

			});

		};

		/***************************************/
		/********** PUBLIC FUNCTIONS ***********/
		/***************************************/

		Class.prototype.addKeyword = function( keyword ) { // console.log('Running: self.addKeyword');

			// STORE this AS self, SO THAT IT IS ACCESSIBLE IN SUB-FUNCTIONS AND TIMEOUTS.

			var self = this;

			// IF THE KEYWORD STRING IS NOT EMPTY

			if ( keyword ) {

				// CREATE NEW KEYWORD ELEMENT

				var keywordEl = self.el.template.cloneNode()

				var closeIcon = '<svg style="pointer-events:none;height:14px;width:14px;" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 16 16"><polygon points="15,3 13,1 8,6 3,1 1,3 6,8 1,13 3,15 8,10 13,15 15,13 10,8 "/></svg>';

				var buttonStyles = 'appearance:none; fill:inherit; color:inherit; font-size:0; background:transparent; border:none; box-shadow:none; cursor:pointer; position:absolute; top:calc(50% - 10px); right:2px; padding:4px; height:auto; width:auto;';

				keywordEl.innerHTML = keyword + '<button type="button" style="' + buttonStyles + '">' + closeIcon + '</button>';

				// ADD IT TO KEYWORD WRAP

				self.el.keywordWrap.appendChild( keywordEl );

				// REMOVE TEXT FROM INPUT

				self.el.input.value = '';

				// UPDATE PADDING ON INPUT

				self.el.input.style['padding-left'] = ( self.el.keywordWrap.offsetWidth + 6 ) + 'px';

				// UPDATE HIDDEN SPACE DELIMITED VALUE

				self.el.hidden.value = self.buildRealStringFromKeywords();

			}

		};

		Class.prototype.removeKeyword = function( keywordEl ) { // console.log('Running: self.removeKeyword');

			// STORE this AS self, SO THAT IT IS ACCESSIBLE IN SUB-FUNCTIONS AND TIMEOUTS.

			var self = this;

			// REMOVE KEYWORD

			self.el.keywordWrap.removeChild( keywordEl );

			// UPDATE PADDING ON INPUT

			self.el.input.style['padding-left'] = ( self.el.keywordWrap.offsetWidth + 6 ) + 'px';

			// UPDATE HIDDEN SPACE DELIMITED VALUE

			self.el.hidden.value = self.buildRealStringFromKeywords();

		};

		Class.prototype.highlightKeyword = function( keywordEl ) { // console.log('Running: self.highlightKeyword');

			// STORE this AS self, SO THAT IT IS ACCESSIBLE IN SUB-FUNCTIONS AND TIMEOUTS.

			var self = this;

			// APPLY HIGHLIGHT STYLES

			addStyles( keywordEl, self.colors.highlight );

			self.el.input.blur();

			keywordEl.firstElementChild.focus();

			// STORE REFERENCES

			self.el.highlighted = keywordEl;

		};

		Class.prototype.unhighlightKeyword = function( keywordEl ) { // console.log('Running: self.unhighlightKeyword');

			// STORE this AS self, SO THAT IT IS ACCESSIBLE IN SUB-FUNCTIONS AND TIMEOUTS.

			var self = this;

			// APPLY HIGHLIGHT STYLES

			addStyles( keywordEl, self.colors.default );

			// STORE REFERENCES

			self.el.highlighted = null;

		};

		Class.prototype.buildRealStringFromKeywords = function() { // console.log('Running: self.buildRealStringFromKeywords');

			// STORE this AS self, SO THAT IT IS ACCESSIBLE IN SUB-FUNCTIONS AND TIMEOUTS.

			var self = this;

			// CREATE TEMP VARIABLE TO HOLD STRING

			var delimitedString = '';

			var keywordEls = self.el.keywordWrap.children;

			for ( var i = 0, l = keywordEls.length; i < l; i++ ) {

				delimitedString += keywordEls[i].textContent + self.delimiter;

			}

			return delimitedString;

		};

		Class.prototype.updateKeywordsFromRealString = function( delimitedString ) { // console.log('Running: self.updateKeywordsFromRealString');

			// STORE this AS self, SO THAT IT IS ACCESSIBLE IN SUB-FUNCTIONS AND TIMEOUTS.

			var self = this;

			// REMOVE ALL CURRENT KEYWORDS

			self.el.keywordWrap.innerHTML = '';

			// IF THE STRING CONTAINS ANY ACTUAL TEXT

			if ( delimitedString.trim() ) {

				// SPLIT THE STRING BASED ON THE DELIMITED

				var keywords = delimitedString.trim().split(self.delimiter);

				// LOOP THROUGH AND CREATE VISIBLE KEYWORD ELEMENTS

				for ( var i = 0, l = keywords.length; i < l; i++ ) {

					self.addKeyword( keywords[i] );

				}

			}

		};

		/***************************************/
		/********** PRIVATE FUNCTIONS **********/
		/***************************************/

		function addStyles( element, styles ) {

			for ( var name in styles ) {

				element.style[name] = styles[name];

			}

		}

		return Class;

	}());

}(window));