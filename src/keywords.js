(function(window) {

	window.Keywords = (function() {

		/***************************************/
		/************* INITIALIZE **************/
		/***************************************/

		var Class = function( params ) {

			// STORE this AS self, SO THAT IT IS ACCESSIBLE IN SUB-FUNCTIONS AND TIMEOUTS.

			var self = this;

			// CHECK FOR REQUIRED SELECTOR

			var hasSelector = 'selector' in params;

			if ( ! hasSelector ) {

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

			// SET UP FLAG FOR DRAGGING

			self.dragging = false;

			// SET UP CHOICES

			self.restrict = false;
			var choicesArray = 'choices' in params ? params.choices : [];
			var choicesString = '<li class="kwjs-filteredout" style="color:gray;font-style:italic;pointer-events:none">Unallowed</li>';
			for ( var i = 0, l = choicesArray.length; i < l; i++ ) {
				choicesString += '<li>' + choicesArray[i] + '</li>';
				self.restrict = true;
			}

			// SET UP CSS ELEMENT

			self.css = document.createElement('style');
			self.css.type = 'text/css';
			self.css.innerHTML += '.kwjs-outerwrap { position: relative; } ';
			self.css.innerHTML += '.kwjs-keywordwrap { pointer-events: none; position: absolute; z-index:1; padding: 4px 0 4px 4px; } ';
			self.css.innerHTML += '.kwjs-keyword { display: inline-block; font-size: inherit; font-weight: inherit; font-style: inherit; font-family: inherit; vertical-align:bottom; pointer-events: auto; position: relative; border-radius: 2px; box-sizing: border-box; margin-right: 4px; cursor: move } ';
			self.css.innerHTML += '.kwjs-choiceswrap { position: absolute; top: calc(100% + 2px); left: 0; right: 0; z-index:1; max-height:300px; overflow:auto; list-style: none; margin:0; padding:0; transform: scaleY(0); transform-origin:top; transition:transform 0.2s } ';
			self.css.innerHTML += '.kwjs-choiceswrap li { cursor:pointer; padding:5px } ';
			self.css.innerHTML += '.kwjs-choiceswrap li:hover, li.kwjs-highlighted { background:white; } ';
			self.css.innerHTML += 'li.kwjs-alreadychosen, li.kwjs-filteredout { display:none; } ';
			self.css.innerHTML += '.kwjs-focused .kwjs-choiceswrap { transform:none; } ';
			
			document.body.appendChild(self.css);

			// SET UP ELEMENT REFERENCES CONTAINER

			self.el = {};

			// SET UP ELEMENT REFERENCES

			self.el.input = document.querySelector( params.selector );

			self.el.fake = self.el.input.cloneNode();
			self.el.fake.name = '';
			self.el.fake.id = '';
			self.el.fake.value = '';

			var inputStyles = window.getComputedStyle(self.el.input, null);
			var displayStyle = inputStyles.getPropertyValue('display');

			self.el.input.type = 'hidden';

			// CREATE ELEMENTS

			self.el.outerWrap = document.createElement('div');
			self.el.keywordWrap = document.createElement('div');
			self.el.template = document.createElement('div');
			self.el.template.draggable = true;
			self.el.dropzone = document.createElement('div');
			self.el.choicesWrap = document.createElement('ul');
			self.el.choicesWrap.innerHTML = choicesString;
			self.el.choicesWrap.tabIndex = -1;
			self.el.unallowed = self.el.choicesWrap.firstElementChild;
			self.el.highlightedKeyword = null;
			self.el.highlightedChoice = null;
			self.el.beingDragged = null;

			// ASSIGN CLASSES TO ELEMENTS

			self.el.outerWrap.className = 'kwjs-outerwrap';
			self.el.keywordWrap.className = 'kwjs-keywordwrap';
			self.el.template.className = 'kwjs-keyword';
			self.el.choicesWrap.className = 'kwjs-choiceswrap';
			self.el.dropzone.className = 'kwjs-keyword kwjs-dropzone';

			// ASSIGN HARDCODED STYLES TO ELEMENTS. THESE ARE DEPENDENT ON THE
			// STYLES THAT ARE ASSIGNED TO THE INPUT BEING TARGETED, AND MIGHT
			// BE DIFFERENT FOR DIFFERENT INPUTS. THEREFORE THEY CANNOT BE
			// ASSIGNED USING CSS

			addStyles( self.el.outerWrap, {
				'display' : displayStyle == 'inline' ? 'inline-block' : displayStyle,
				'width' : inputStyles.getPropertyValue('width'),
			});

			addStyles( self.el.keywordWrap, {
				'top' : inputStyles.getPropertyValue('border-top-width'),
				'left' : inputStyles.getPropertyValue('border-left-width'),
			});			

			addStyles( self.el.template, {
				'padding-left' : (parseInt(inputStyles.getPropertyValue('padding-left'))-2)+'px',
				'padding-right' : (parseInt(inputStyles.getPropertyValue('padding-right'))-2+20)+'px', // PLUS 20 HERE TO MAKE ROOM FOR THE "x"
				'line-height' : (parseInt(inputStyles.getPropertyValue('height'))-8)+'px',
				'height' : (parseInt(inputStyles.getPropertyValue('height'))-8)+'px',
			});

			addStyles( self.el.choicesWrap, {
				'background' : inputStyles.getPropertyValue('background'),
				'background-color' : inputStyles.getPropertyValue('background-color'),
				'box-shadow' : inputStyles.getPropertyValue('box-shadow'),
			});

			addStyles( self.el.template, self.colors.default );

			addStyles(self.el.dropzone, {
				'padding-left' : '2px',
				'padding-right' : '2px',
				'height' : (parseInt(inputStyles.getPropertyValue('height'))-8)+'px',
				'background' : 'rgb(30,130,230)',
				'margin' : '0 0 0 -4px'
			});

			addStyles( self.el.dropzone, self.colors.highlight );

			// MOVE ELEMENTS AROUND

			self.el.input.parentNode.insertBefore(self.el.outerWrap, self.el.input.nextSibling);

			self.el.outerWrap.appendChild(self.el.input);
			self.el.outerWrap.appendChild(self.el.fake);
			self.el.outerWrap.appendChild(self.el.keywordWrap);
			if ( choicesArray.length > 0 ) {
				self.el.outerWrap.appendChild(self.el.choicesWrap);
			}

			// RUN INITIAL PARSING IN CASE THERE ARE PRE-FILLED IN VALUES

			self.updateKeywordsFromRealString( self.el.input.value );

			// ADD EVENT LISTENERS

			self.el.choicesWrap.addEventListener('mousedown', function(event) {

				if ( event.target.nodeName.toLowerCase() == 'li' ) {

					self.addKeyword({
						keyword: event.target.textContent,
						match: 'exact'
					});

				}

				window.setTimeout(function(event){

					self.el.fake.focus();

				}, 10);

			});

			self.el.outerWrap.addEventListener('focusin', function(event) {

				self.el.outerWrap.classList.add('kwjs-focused');

				if ( self.el.highlightedKeyword ) {

					self.unhighlightKeyword( self.el.highlightedKeyword );

				}

			});

			self.el.outerWrap.addEventListener('focusout', function(event) {

				window.setTimeout(function(event){

					if ( ! self.el.outerWrap.contains( document.activeElement ) ) {

						self.el.outerWrap.classList.remove('kwjs-focused');

					}

				}, 20);

				if ( self.el.fake.value ) {

					window.setTimeout( function(event){

						self.addKeyword({
							keyword: self.el.fake.value,
							match: 'begins-with'
						});

					}, 10 );

				}

			});

			self.el.outerWrap.addEventListener('keypress', function(event) {

				// CHECK TO MAKE SURE THAT THE ENTERED KEY IS A PRINTABLE, SINGLE CHARACTER. AND MAKE SURE THAT
				// CONTROL ISN'T BEING HELD DOWN. THIS AVOIDS FIRING THIS ON CONTROL-V PASTE, WHICH IS HANDLED
				// WITH THE PASTE EVENT. BASICALLY, THIS SHOULD JUST FIRE ON REGULAR KEYBOARD ENTRY OF LETTERS.

				if ( ( event.key.length === 1 ) && ( ! event.ctrlKey ) ) {

					// CHECK TO SEE IF THE KEYSTROKE WAS ACTUALLY THE DELIMITER.

					if ( event.key == self.delimiter ) { //console.log('keypress: Delimitor Key');

						event.preventDefault();

						if ( self.el.fake.value ) {

							window.setTimeout( function(event){

								self.addKeyword({
									keyword: self.el.fake.value,
									match: 'begins-with'
								});

							}, 10 );

						} else if ( self.el.highlightedChoice ) {

							event.preventDefault();

							self.addKeyword({
								keyword: self.el.highlightedChoice.textContent,
								match: 'exact'
							});

						}

					// IF THE KEYSTROKE WASN'T THE DELIMITOR, THEN USE IT OT UPDATE FILTERED CHOICES

					} else {

						self.updateFilteredChoicesFromInput( self.el.fake.value + event.key );

					}

				}

			});

			self.el.outerWrap.addEventListener('keydown', function(event) {

				var currentKeyword = null;

				if ( event.which == 13 ) { // console.log('Enter Key');

					if ( self.el.fake.value ) {

						event.preventDefault();

						window.setTimeout( function(event){

							self.addKeyword({
								keyword: self.el.fake.value,
								match: 'begins-with'
							});

						}, 10 );

					}

					if ( self.el.highlightedChoice ) {

						event.preventDefault();

						self.addKeyword({
							keyword: self.el.highlightedChoice.textContent,
							match: 'exact'
						});

					}

				} else if ( event.which == 8 ) { // console.log('Backspace Key');

					if ( ! self.el.fake.value && self.el.keywordWrap.children.length > 0 ) {

						event.preventDefault();

						if ( self.el.highlightedKeyword ) {

							currentKeyword = self.el.highlightedKeyword;

							if ( currentKeyword.previousElementSibling ) {

								self.highlightKeyword( currentKeyword.previousElementSibling );

							} else {

								self.el.fake.focus();

							}

							self.removeKeyword( currentKeyword );

						} else {

							self.highlightKeyword( self.el.keywordWrap.lastChild );

						}

					} else {

						window.setTimeout( function(event){

							self.updateFilteredChoicesFromInput( self.el.fake.value );

						}, 10 );

					}

				} else if ( event.which == 46 ) { // console.log('Delete Key');

					if ( ! self.el.fake.value && self.el.keywordWrap.children.length > 0 ) {

						if ( self.el.highlightedKeyword ) {

							currentKeyword = self.el.highlightedKeyword;

							if ( currentKeyword.nextElementSibling ) {

								self.highlightKeyword( currentKeyword.nextElementSibling );

							} else {

								self.el.fake.focus();

							}

							self.removeKeyword( currentKeyword );

						}

					} else {

						window.setTimeout( function(event){

							self.updateFilteredChoicesFromInput( self.el.fake.value );

						}, 10 );

					}

				} else if ( event.which == 37 ) { // console.log('Arrow Left Key');

					if ( ! self.el.fake.value && self.el.keywordWrap.children.length > 0 ) {

						if ( self.el.highlightedKeyword ) {

							currentKeyword = self.el.highlightedKeyword;

							if ( currentKeyword.previousElementSibling ) {

								self.unhighlightKeyword( currentKeyword );

								self.highlightKeyword( currentKeyword.previousElementSibling );
							}

						} else {

							self.highlightKeyword( self.el.keywordWrap.lastChild );

						}

					}

				} else if ( event.which == 39 ) { // console.log('Arrow Right Key');

					if ( ! self.el.fake.value && self.el.keywordWrap.children.length > 0 ) {

						if ( self.el.highlightedKeyword ) {

							currentKeyword = self.el.highlightedKeyword;

							self.unhighlightKeyword( currentKeyword );

							if ( currentKeyword.nextElementSibling ) {

								self.highlightKeyword( currentKeyword.nextElementSibling );

							} else {

								self.el.fake.focus();

							}

						}

					}

				} else if ( ( event.which == 38 ) || ( event.which == 40 ) ) { // console.log('Arrow Up Key or Down Key');

					event.preventDefault();

					var position, availableChoices = self.el.choicesWrap.querySelectorAll(':not(.kwjs-alreadychosen):not(.kwjs-filteredout)');

					if ( ! self.el.highlightedKeyword ) {

						if ( ! self.el.highlightedChoice ) {

							self.highlightChoice( event.which == 38 ? null : availableChoices[0] );

						} else {

							position = getPositionUnderParent( availableChoices, self.el.highlightedChoice );

							position = event.which == 38 ? ( position - 1 ) : ( position + 1 );

							if ( position < 0 ) {

								self.highlightChoice( null );

							} else if ( position < availableChoices.length ) {

								self.highlightChoice( availableChoices[position] );

							}						

						}

					}

				}

			});

			self.el.outerWrap.addEventListener('paste', function(event) {

				window.setTimeout(function(event){

					self.updateFilteredChoicesFromInput( self.el.fake.value );

				}, 10 );

			});

			self.el.keywordWrap.addEventListener('click', function(event) {

				if ( event.target.nodeName.toLowerCase() == 'button' ) {

					self.removeKeyword( event.target.parentNode );

					self.el.fake.focus();

				}

			});

			self.el.keywordWrap.addEventListener('dragstart', function(event) {

				var keywordEl = getKeywordElement( event.target );

				if ( keywordEl ) {

					event.dataTransfer.setData( 'text/html', keywordEl );

					self.el.beingDragged = keywordEl;

					self.dragging = true;

					if ( self.el.highlightedKeyword ) {

						self.unhighlightKeyword( self.el.highlightedKeyword );

					}

				}

			});

			document.addEventListener('dragover', function(event) {
				
				event.preventDefault();

				if ( self.dragging ) {

					var keywordEl = getKeywordElement( event.target );

					if ( keywordEl && ! keywordEl.classList.contains('kwjs-dropzone') ) {

						var bounding = keywordEl.getBoundingClientRect();
						var center = bounding.x + (bounding.width/2);

						if ( event.clientX - center > 0 ) {

							self.el.keywordWrap.insertBefore(self.el.dropzone, keywordEl.nextElementSibling);

						} else {

							self.el.keywordWrap.insertBefore(self.el.dropzone, keywordEl);

						}

					}

				}

			});

			document.addEventListener('drop', function(event) {

				event.preventDefault();

				if ( self.dragging ) {

					self.dragging = false;

					// INSERT THE DRAGGED KEYWORD AND REMOVE THE DROPZONE

					self.el.keywordWrap.insertBefore(self.el.beingDragged, self.el.dropzone);

					self.el.keywordWrap.removeChild(self.el.dropzone);

					// UPDATE HIDDEN SPACE DELIMITED VALUE

					self.el.input.value = self.buildRealStringFromKeywords();

				}

			});


			document.addEventListener('dragover', function( event ) {

				if ( self.dragging ) {

					event.preventDefault();

				}

			});


		};

		/***************************************/
		/********** PUBLIC FUNCTIONS ***********/
		/***************************************/

		Class.prototype.addKeyword = function( params ) { // console.log('Running: self.addKeyword');

			// STORE this AS self, SO THAT IT IS ACCESSIBLE IN SUB-FUNCTIONS AND TIMEOUTS.

			var self = this;

			// GET PARAMS

			var keyword = 'keyword' in params ? params.keyword : '';
			var match = 'match' in params ? params.match : 'exact';

			// CONFIRM THE KEYWORD STRING ISN'T EMPTY

			if ( keyword !== '' ) {

				// CORRECT KEYWORD AGAINST AVAILABLE CHOICES

				if ( self.restrict && match == 'begins-with' ) {

					keyword = self.autoCompleteKeyword( keyword );

				}

				// IF KEYWORD HAS BEEN CORRECTED TO BLANK

				if ( keyword === '' ) {

					self.el.fake.value = '';

					self.updateFilteredChoicesFromInput( self.el.fake.value );

				} else {

					// CREATE NEW KEYWORD ELEMENT

					var keywordEl = self.el.template.cloneNode();

					var closeIcon = '<svg style="pointer-events:none;height:14px;width:14px;" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 16 16"><polygon points="15,3 13,1 8,6 3,1 1,3 6,8 1,13 3,15 8,10 13,15 15,13 10,8 "/></svg>';

					var buttonStyles = 'appearance:none; fill:inherit; color:inherit; font-size:0; background:transparent; border:none; box-shadow:none; cursor:pointer; position:absolute; top:calc(50% - 10px); right:2px; padding:4px; height:auto; width:auto;';

					keywordEl.innerHTML = keyword + '<button type="button" tabindex="-1" style="' + buttonStyles + '">' + closeIcon + '</button>';

					// ADD IT TO KEYWORD WRAP

					self.el.keywordWrap.appendChild( keywordEl );

					// UPDATE PADDING ON INPUT

					self.el.fake.style['padding-left'] = ( self.el.keywordWrap.offsetWidth + 6 ) + 'px';

					// UPDATE HIDDEN SPACE DELIMITED VALUE

					self.el.input.value = self.buildRealStringFromKeywords();

					// REMOVE TEXT FROM INPUT

					self.el.fake.value = '';

					// UPDATE CHOICES

					if ( self.restrict ) {

						self.updateAlreadyChosenChoicesFromKeywords();

						self.updateFilteredChoicesFromInput( self.el.fake.value );

					}

				}

			}

		};

		Class.prototype.removeKeyword = function( keywordEl ) { // console.log('Running: self.removeKeyword');

			// STORE this AS self, SO THAT IT IS ACCESSIBLE IN SUB-FUNCTIONS AND TIMEOUTS.

			var self = this;

			// REMOVE KEYWORD

			self.el.keywordWrap.removeChild( keywordEl );

			// UPDATE PADDING ON INPUT

			self.el.fake.style['padding-left'] = ( self.el.keywordWrap.offsetWidth + 6 ) + 'px';

			// UPDATE HIDDEN SPACE DELIMITED VALUE

			self.el.input.value = self.buildRealStringFromKeywords();

			// UPDATE CHOICES

			if ( self.restrict ) {

				self.updateAlreadyChosenChoicesFromKeywords();

			}

		};

		Class.prototype.highlightKeyword = function( keywordEl ) { // console.log('Running: self.highlightKeyword');

			// STORE this AS self, SO THAT IT IS ACCESSIBLE IN SUB-FUNCTIONS AND TIMEOUTS.

			var self = this;

			// APPLY HIGHLIGHT STYLES

			addStyles( keywordEl, self.colors.highlight );

			self.el.fake.blur();

			keywordEl.firstElementChild.focus();

			// STORE REFERENCES

			self.el.highlightedKeyword = keywordEl;

		};

		Class.prototype.unhighlightKeyword = function( keywordEl ) { // console.log('Running: self.unhighlightKeyword');

			// STORE this AS self, SO THAT IT IS ACCESSIBLE IN SUB-FUNCTIONS AND TIMEOUTS.

			var self = this;

			// APPLY HIGHLIGHT STYLES

			addStyles( keywordEl, self.colors.default );

			// STORE REFERENCES

			self.el.highlightedKeyword = null;

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

					self.addKeyword({
						keyword: keywords[i],
						match: 'exact'
					});

				}

			}

		};

		Class.prototype.updateAlreadyChosenChoicesFromKeywords = function() { // console.log('Running: self.buildRealStringFromKeywords');

			// STORE this AS self, SO THAT IT IS ACCESSIBLE IN SUB-FUNCTIONS AND TIMEOUTS.

			var self = this;

			// LOOP THROUGH KEYWORDS AND DISABLE ANY CHOICES WHICH ARE ALREADY KEYWORDS

			var choicesEls = self.el.choicesWrap.children;

			for ( var i = 1, l = choicesEls.length; i < l; i++ ) {

				if ( self.el.input.value.indexOf(choicesEls[i].textContent) > -1 ) {

					choicesEls[i].classList.add('kwjs-alreadychosen');

				} else {

					choicesEls[i].classList.remove('kwjs-alreadychosen');

				}

			}

		};

		Class.prototype.updateFilteredChoicesFromInput = function( userInput ) { // console.log('Running: self.updateFilteredChoicesFromInput');

			// STORE this AS self, SO THAT IT IS ACCESSIBLE IN SUB-FUNCTIONS AND TIMEOUTS.

			var self = this;

			// CHECK TO SEE IF WE ARE RESTRICTING INPUT BASED ON A SET OF CHOICES

			if ( self.restrict ) {

				// SETUP LOCAL VARIABLES

				var availableChoices, availableChoice, isAllowed = false;

				// GRAB ALL AVAILABLE CHOICES

				availableChoices = self.el.choicesWrap.querySelectorAll(':not(.kwjs-alreadychosen)');

				// LOOP THROUGH, COMPARE STRINGS

				for ( var i = 1, l = availableChoices.length; i < l; i++ ) {

					availableChoice = availableChoices[i].textContent.toLowerCase();

					userInput = userInput.toLowerCase();

					if ( availableChoice.indexOf( userInput ) === 0 ) {

						availableChoices[i].classList.remove('kwjs-filteredout');

						isAllowed = true;

					} else {

						availableChoices[i].classList.add('kwjs-filteredout');

					}

				}

				// UN-HIGHLIGHT PREVIOUS CHOICE

				if ( self.el.highlightedChoice ) {

					self.el.highlightedChoice.classList.remove('kwjs-highlighted');

					self.el.highlightedChoice = null;

				}

				// SHOW OR HIDE THE ERROR MESSAGE

				if ( isAllowed ) {

					self.el.unallowed.classList.add('kwjs-filteredout');

				} else {

					self.el.unallowed.classList.remove('kwjs-filteredout');

				}

			}

		};

		Class.prototype.autoCompleteKeyword = function( userInput ) { //console.log('Running: self.inputIsAllowed');

			// STORE this AS self, SO THAT IT IS ACCESSIBLE IN SUB-FUNCTIONS AND TIMEOUTS.

			var self = this;

			// THIS ONLY NEEDS TO CHECK AGAINST CHOICES IF THERE ARE CHOICES

			if ( ! self.restrict ) {

				return true;

			}

			// SETUP LOCAL VARIABLES

			var availableChoices, position;

			// GRAB ALL AVAILABLE CHOICES

			availableChoices = self.el.choicesWrap.querySelectorAll(':not(:first-child):not(.kwjs-alreadychosen):not(.kwjs-filteredout)');

			// IF THERE ISN'T AN EXACT MATCH

			if ( availableChoices.length > 0 ) {

				if ( self.el.highlightedChoice ) {

					position = getPositionUnderParent( availableChoices, self.el.highlightedChoice );

				} else {

					position = 0;

				}

				return availableChoices[position].textContent;

			} else {

				return '';

			}

		};

		Class.prototype.highlightChoice = function( choiceEl ) { // console.log('Running: self.highlightKeyword');

			// STORE this AS self, SO THAT IT IS ACCESSIBLE IN SUB-FUNCTIONS AND TIMEOUTS.

			var self = this;

			// UN-HIGHLIGHT PREVIOUS CHOICE

			if ( self.el.highlightedChoice ) {

				self.el.highlightedChoice.classList.remove('kwjs-highlighted');

			}

			// HIGHLIGHT NEW CHOICE

			if ( choiceEl ) {

				choiceEl.classList.add('kwjs-highlighted');

			}

			// UPDATE REFERENCE

			self.el.highlightedChoice = choiceEl;

		};

		/***************************************/
		/********** PRIVATE FUNCTIONS **********/
		/***************************************/

		function addStyles( element, styles ) {

			for ( var name in styles ) {

				if ( styles.hasOwnProperty( name ) ) {

					element.style[name] = styles[name];

				}

			}

		}

		function getPositionUnderParent( parent, child ) {

			for ( var i = 0, l = parent.length; i < l; i++ ) {

				if ( child == parent[i] ) {

					return  i;

				}

			}

			return -1;

		}

		function getKeywordElement( target ) {

			if ( target.className == 'kwjs-keyword' ) {

				return target;

			} else {

				while ( target.className != 'kwjs-keyword' && target.nodeName.toLowerCase() != 'body' ) {

					target = target.parentNode;

				}

				if ( target.tagName.toLowerCase() == 'body' ) {

					return false;

				} else {

					return target;

				}

			}

		}

		return Class;

	}());

}(window));