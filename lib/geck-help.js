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
      'geck-help:lookup',
      this.lookupSelected.bind(this)
    );

    atom.commands.add(
      'atom-text-editor',
      'geck-help:toggleVegas',
      this.toggleVegasConfig.bind(this)
    );

    atom.commands.add(
      'atom-text-editor',
      'geck-help:toggleFOSE',
      this.toggleFOSEConfig.bind(this)
    );

    atom.commands.add(
      'atom-text-editor',
      'geck-help:toggleNVSE',
      this.toggleNVSEConfig.bind(this)
    );

    atom.commands.add(
      'atom-text-editor',
      'geck-help:toggleNX',
      this.toggleNXConfig.bind(this)
    );

    this.updateGrammars();
  },

  /**
   * Command: geck-help:lookup
   *
   * This function is invoked in a manner of ways (menu, context-menu, and
   * keymap); it's purpose is to either open the selected text, hopefully
   * a function known to GECK, in a web browser or the root functions page
   * if the rest is unavailable.
   */
  lookupSelected: function() {
    console.log("[geck-help] lookup invoked!");
    this._getSelectedText(this.geckFnRegEx, (function(text) {
      var browser;

      browser = atom.packages.getActivePackage('web-browser');
      if (browser) {
        if (text.length) {
          console.log('[geck-help] Selected function -> %o', text);
          atom.workspace.open([this.urlBase, text].join(''));
        }
        else {
          console.log('[geck-help] Opening functions root');
          atom.workspace.open(this.fnBase);
        }
      }
      else {
        console.error("[geck-help] web-browser is a required package.");
      }
    }).bind(this));
  },

  toggleVegasConfig: function() {
    var config = atom.config.get('language-geck.highlightVegas');
    atom.config.set('language-geck.highlightVegas', !config);
    this.updateGrammars();
  },

  toggleFOSEConfig: function() {
    var config = atom.config.get('language-geck.highlightFOSE');
    atom.config.set('language-geck.highlightFOSE', !config);
    this.updateGrammars();
  },

  toggleNVSEConfig: function() {
    var config = atom.config.get('language-geck.highlightNVSE');
    atom.config.set('language-geck.highlightNVSE', !config);
    this.updateGrammars();
  },

  toggleNXConfig: function() {
    var config = atom.config.get('language-geck.highlightNX');
    atom.config.set('language-geck.highlightNX', !config);
    this.updateGrammars();
  },

  updateGrammars: function() {
    // Obtain the highlight flags
    var highlight = {
      vegas: atom.config.get('language-geck.highlightVegas'),
      fose: atom.config.get('language-geck.highlightFOSE'),
      nvse: atom.config.get('language-geck.highlightNVSE'),
      nx: atom.config.get('language-geck.highlightNX')
    };

    // Supplement grammer
    var grammar = atom.grammars.grammarsByScopeName['source.geck'];
    var patterns = grammar.rawPatterns;

    patterns
      .map((o,i,a) => {return o.id === 'language-geck' ? i : -1;})
      .filter((o) => {return o != -1;})
      .forEach((i) => patterns.splice(i, 1));

    // Add Blocktypes
    patterns[patterns.length] = {
      match: language.getSet(language.keywords),
      name: 'keyword.geck-keyword',
      id: 'language-geck'
    };

    patterns[patterns.length] = {
      match: language.getSet(language.blocktypes, true),
      name: 'keyword.control.geck.blocktype',
      id: 'language-geck'
    };

    this.addPattern(patterns, 'keyword.geck.baseFns', language.geckFns);

    if (highlight.fose) {
      this.addPattern(patterns, 'keyword.geck.foseFns', language.foseFns);
    }

    if (highlight.vegas) {
      if (highlight.nvse && highlight.nx) {
        this.addPattern(patterns, 'keyword.geck.vegasFns', language.vegasFns);
        this.addPattern(patterns, 'keyword.geck.nvseFns', language.nvseFns);
        this.addPattern(patterns, 'keyword.geck.nxFns', language.nxFns);
      }
      else if (highlight.nvse) {
        this.addPattern(patterns, 'keyword.geck.vegasFns', language.vegasFns);
        this.addPattern(patterns, 'keyword.geck.nvseFns', language.nvseFns);
      }
      else {
        this.addPattern(patterns, 'keyword.geck.vegasFns', language.vegasFns);
      }
    }

    // Update everything
    grammar.clearRules();
    grammar.registry.grammarUpdated(grammar.scopeName);
    grammar.emit('grammar-updated');
    grammar.emitter.emit('did-update');
  },

  addPattern: function(patterns, name, ...getSetParams) {
    patterns[patterns.length] = {
      match: language.getSet(...getSetParams),
      name: name,
      id: 'language-geck'
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
