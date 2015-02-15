module.exports = {
  // The basic regular expression string used to find GECK functions
  geckFnRegEx: '\\b[\\w_\\-]+\\b/',

  // The base URL used for documentation reference for GECK functions
  urlBase: 'http://geck.bethsoft.com/index.php?title=',

  // Base functions page
  fnBase: 'http://geck.bethsoft.com/index.php?title=Category:Functions',

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
