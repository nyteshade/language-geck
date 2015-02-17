"use 6to5";

var language = require('./geck-language');

module.exports = {
  // The basic regular expression string used to find GECK functions
  geckFnRegEx: '\\b[\\w_\\-]+\\b/',

  // The base URL used for documentation reference for GECK functions
  urlBase: 'http://geck.bethsoft.com/index.php?title=',

  // Base functions page
  fnBase: 'http://geck.bethsoft.com/index.php?title=Category:Functions',

  // Language syntax
  syntax: language,

  // Grammars Added
  grammarsAdded: false,

  // Configuration
  config: {
    highlightVegas: {
      type: 'boolean',
      'default': true
    },
    highlightNVSE: {
      "type": "boolean",
      "default": true
    },
    highlightFOSE: {
      "type": "boolean",
      "default": true
    },
    highlightNX: {
      "type": "boolean",
      "default": true
    }
  },

  /**
   * This is the primary required function for an exported module. This
   * function invokes _getSelectedText with a regular expression string
   * used to determine the name of the function in question and then
   * takes that matching text and opens a web browser to that page if
   * Mark Hahn's web-browser package is installed.
   */
  activate: function(state) {
    atom.commands.add(
      'atom-text-editor',
      'language-geck:lookup',
      this.lookupSelected.bind(this)
    );

    atom.commands.add(
      'atom-text-editor',
      'language-geck:toggleFOSE',
      this.toggleConfig.bind(this, 'language-geck.highlightFOSE')
    );

    atom.commands.add(
      'atom-text-editor',
      'language-geck:toggleVegas',
      this.toggleConfig.bind(this, 'language-geck.highlightVegas')
    );

    atom.commands.add(
      'atom-text-editor',
      'language-geck:toggleNVSE',
      this.toggleConfig.bind(this, 'language-geck.highlightNVSE')
    );

    atom.commands.add(
      'atom-text-editor',
      'language-geck:toggleNX',
      this.toggleConfig.bind(this, 'language-geck.highlightNX')
    );

    atom.packages.once('activated', this.updateGrammars.bind(this));
  },

  /**
   * Command: language-geck:lookup
   *
   * This function is invoked in a manner of ways (menu, context-menu, and
   * keymap); it's purpose is to either open the selected text, hopefully
   * a function known to GECK, in a web browser or the root functions page
   * if the rest is unavailable.
   */
  lookupSelected: function() {
    console.log("[language-geck] lookup invoked!");
    this._getSelectedText(this.geckFnRegEx, (function(text) {
      var browser;

      browser = atom.packages.getActivePackage('web-browser');
      if (browser) {
        if (text.length) {
          console.log('[language-geck] Selected function -> %o', text);
          atom.workspace.open([this.urlBase, text].join(''));
        }
        else {
          console.log('[language-geck] Opening functions root');
          atom.workspace.open(this.fnBase);
        }
      }
      else {
        console.error("[language-geck] web-browser is a required package.");
      }
    }).bind(this));
  },

  toggleConfig: function(config, event) {
    var value = atom.config.get(config);
    atom.config.set(config, !value);
    this.updateGrammars();
  },

  updateGrammars: function() {
    // Obtain the highlight flags
    var cfg = atom.config.get('language-geck');

    // Supplement grammer
    var grammar = atom.grammars.grammarsByScopeName['source.geck'];

    // Remove dynamic grammars
    for (let a = grammar.rawPatterns, i = 0; i < a.length; i++) {
      if (a[i].___type && a[i].___type === 'dynamic') {
        a.splice(i, 1);
        i--;
      }
    }

    var patterns = [
      [true, 'keyword.geck-keyword', [language.keywords]],
      [true, 'keyword.control.geck.blocktype', [language.blocktypes, true]],
      [true, 'keyword.geck.baseFns', [language.geckFns]],
      [cfg.highlightFOSE, 'keyword.geck.foseFns', [language.foseFns]],
      [cfg.highlightVegas, 'keyword.geck.vegasFns', [language.vegasFns]],
      [cfg.highlightNVSE, 'keyword.geck.nvseFns', [language.nvseFns]],
      [cfg.highlightNX, 'keyword.geck.nxFns', [language.nxFns]]
    ];

    for (let set of patterns) {
      let [condition, name, getSetParams] = set;
      if (condition) {
        this.addPattern(grammar.rawPatterns, name, getSetParams);
      }
    }

    // Update everything
    if (grammar.includedGrammarScopes.indexOf(grammar.scopeName) === -1) {
      grammar.includedGrammarScopes.push(grammar.scopeName);
    }
    grammar.grammarUpdated(grammar.scopeName);
  },

  /**
   * Adds a pattern to make the grammar a bit more dynamic. The patterns
   * added by this function can be determined by the unique triple underscore
   * type property. This makes it easier to find these properties as well
   * as manage them as situations arise.
   *
   * @param patterns a reference to the grammar.rawPatterns array
   * @param name a set of class names that will be applied to the span denoting
   * any matches found by the pattern.
   * @param getSetParams an array of arguments used with the geck-language
   * getSet() function.
   * @return the same array that was passed into the function as patterns
   */
  addPattern: function(patterns, name, getSetParams) {
    patterns[patterns.length] = {
      match: language.getSet(...getSetParams),
      name: name,
      ___type: 'dynamic'
    };

    return patterns;
  },

  /**
   * The purpose of this method is to seek out the selected text,
   * determined by the regex string supplied and invoke the supplied
   * callback, executeOn, for each match. The value of the selected
   * text will be supplied as the only parameter to executeOn.
   *
   * @param regex a regular expression in string format
   * @param executeOn a function receiving a single parameter which
   * denotes the selected text in the editor.
   */
  _getSelectedText: function(regex, executeOn) {
    var body, col, cursor, editor, end, filePattern;
    var line, m, opts, range, selection, start, text, _i, _len, _ref;

    editor = atom.workspace.getActiveEditor();

    filePattern = new RegExp(regex, 'g');

    _ref = editor.getSelections();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      selection = _ref[_i];
      range = selection.getBufferRange();

      if (range.isEmpty()) {
        cursor = selection.cursor;
        line = cursor.getCurrentBufferLine();
        col = cursor.getBufferColumn();
        opts = {
          wordRegex: new RegExp(regex)
        };
        start = cursor.getBeginningOfCurrentWordBufferPosition(opts);
        end = cursor.getEndOfCurrentWordBufferPosition(opts);
        range = new Range(start, end);
      }

      text = editor.getTextInBufferRange(range);
      if (text.match(/\s/)) {
        text = "";
      }

      executeOn(text);
    }
  }
};
