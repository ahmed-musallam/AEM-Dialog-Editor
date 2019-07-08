/**
 * This works and I very much aknowledge that it needs refactoring. Maybe some day :) 
 */

$(function () {
  // constants
    SELECTOR = {
      container: '#dialog-editor',
      dialog: '#dialog',
      refreshButton: '#save-refresh',
      splitDirectionButton: '#split-direction',
      editorSplitPane: '#split-editor',
      dialogSplitPane: '#split-result',
      currentDialogPath: '#current-dialog-path'
    };

  window.dialogEditor = window.dialogEditor || {};
  var Util = window.dialogEditor.Util;
  window.dialogEditor.App = {
    config: {
      panelDirection: 'horizontal' // default direction
    },
    _containerEl: null, // the editor container element 
    _dialogContainerEl: null,  // the dialog preview container
    _dialogPath: null, // the current dialog path in JCR
    _docViewPath: null,
    codeEditor: null, // CodeMirror instance
    _split: null, // PanelSplit instance

    init: function (selector) {
      this._containerEl = $(SELECTOR.container);
      this._dialogContainerEl = this._containerEl.find(SELECTOR.dialog);
      this.setDialogPath(this._containerEl.data('dialog-path'));
      var localStorageState = JSON.parse(localStorage.getItem('dialogEditorState')) || {};
      this.config = Object.assign(this.config, localStorageState)

      if (!this._dialogPath) {
        this._renderError();
        return;
      }


      // initial refresh
      this._superTypeSelector = new window.dialogEditor.SuperTypeSelector(this._dialogPath);
      this._panelSplit = new window.dialogEditor.PanelSplit(SELECTOR.editorSplitPane, SELECTOR.dialogSplitPane);
      this._panelSplit.changeDirection(this.config.panelDirection);
      this.updatePanelDirectionButton(this.config.panelDirection)
      this._initCodeEditor();
      this.refresh();
      this._bindEvents();

    },
    _saveConfig() {
      localStorage.setItem('dialogEditorState', JSON.stringify(this.config));
    },
    _renderError: function () {
      this._containerEl.children().hide();
      this._containerEl.append("<h1>No dialog path provided in request suffix, it should be a path to a dialog path<h1>")

      console.warn("No dialog path provided in requets suffix")
    },
    /**
     * Bind event handlers
     */
    _bindEvents: function () {
      var that = this;

      $(SELECTOR.refreshButton)
        .click((function () {
          that.updateDialogNode()
        }));

      $(SELECTOR.splitDirectionButton)
        .click((function () {
          var newDirection = that.togglePanelDirection();
        }));
      
      // handle parent selector change
      that._superTypeSelector.addHandler(function(path) {
        var pathWithExtension = Util.addHtmlExtension(path)
        that.setDialogPath(pathWithExtension);
        that.refresh();
      })
        
    },
    _initCodeEditor: function () {
      this.codeEditor = CodeMirror.fromTextArea(document.getElementById("code"), {
        mode: "xml",
        lineNumbers: true,
        //lineWrapping: true,
      });
    },
    // changes panel direction
    togglePanelDirection: function () {
      this.config.panelDirection = this._panelSplit.toggleDirection()
      this.updatePanelDirectionButton(this.config.panelDirection)
      this._saveConfig();
    },
    updatePanelDirectionButton: function (newDirection) {
      var splitDirectionButton = $(SELECTOR.splitDirectionButton)
      splitDirectionButton.removeClass('vertical');
      splitDirectionButton.removeClass('horizontal');
      splitDirectionButton.addClass(newDirection);
    },
    /**
     * Set current dialog path being worked on. Shoul be followed with a call to refresh() for changes to take effect.
     */
    setDialogPath: function (dialogPath) {
      $(SELECTOR.currentDialogPath).html(dialogPath);
      this._dialogPath = dialogPath;
      this._dialogPath = Util.addHtmlExtension(this._dialogPath);
      this._docViewPath = Util.getDocumentViewPath(this._dialogPath);
    },

    /**
     * Pull the dialog code and html from JCR and update UI.
     */
    refresh: function () {
      this.refreshDialog();
      this.refreshCode();
    },

    /**
     * Get the dialog XML from JCR.
     */
    refreshCode: function () {
      var that = this;
      var scrollInfo = that.codeEditor.getScrollInfo();
      var docViewPath = Util.getDocumentViewPath(this._dialogPath)
      $.get(docViewPath)
        .then(function (result) {
          that.codeEditor.setValue(result);
          that.codeEditor.scrollTo(scrollInfo.left, scrollInfo.top);
        })
    },

    /**
     * Get dialog HTML and replace displayed dialog.
     */
    refreshDialog: function () {
      var that = this;
      var overridePath = Util.prefixWith(that._dialogPath, '/mnt/override')
      $.get(overridePath + '/')
        .then(function (data) {
          var parsedHtml = $.parseHTML(data);
          var dialogEl = parsedHtml.find(function (el) {
            return el.tagName && el.tagName === "CORAL-DIALOG"
          })
          var css = parsedHtml.filter(function (el) {
            return el.tagName && el.tagName === "LINK"
          });
          var js = parsedHtml.filter(function (el) {
            return el.tagName && el.tagName === "SCRIPT"
          });
          if (dialogEl) {
            // insert dialog as well as all JS/CSS scripts
            that._dialogContainerEl.empty().append(dialogEl)
            that._dialogContainerEl.append(css);
            that._dialogContainerEl.append(js);
          }
          // TODO: test if this actually works for custom code that depends on it.
          setTimeout(function () {
            $(document).trigger("dialog-loaded", {
              dialog: dialogEl
            })
          }, 1000);
        });
    },

    /**
     * Post changes from editor to the JCR.
     */
    updateDialogNode: function () {
      var that = this;
      $.ajax({
        url: that._docViewPath,
        data: that.codeEditor.getValue(),
        type: 'POST',
        contentType: "text/xml",
        dataType: "text"
      })
        .done(function () {
          that.refresh();
          $.toast({ heading: "Success!", text: "Code Saved and Dialog Refreshed!" })
        })
        .fail(function (response) {
          $.toast({ heading: "Failed!", text: "See console logs." })
          console.error(response);
        })
    }
  }

  window.dialogEditor.App.init();
})
