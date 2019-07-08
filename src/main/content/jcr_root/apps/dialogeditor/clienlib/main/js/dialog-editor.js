/**
 * This works and I very much aknowledge that it needs refactoring. Maybe some day :) 
 */

$(function () {
  // constants
  var VERTICAL = 'vertical',
    HORIZONTAL = 'horizontal',
    SELECTOR = {
      container: '#dialog-editor',
      dialog: '#dialog',
      refreshButton: '#save-refresh',
      splitDirectionButton: '#split-direction',
      componentParentsButton: '#component-parents',
      editorSplitPane: '#split-editor',
      dialogSplitPane: '#split-result',
      parentsOverlay: '#parents-overlay',
      currentDialogPath: '#current-dialog-path'
    };

  window.dialogEditor = window.dialogEditor || {};
  var Util = window.dialogEditor.Util;
  window.dialogEditor.App = {
    config: {
      panelDirection: VERTICAL
    },
    codeEditor: null,
    _containerEl: null, // the editor container element 
    _dialogContainerEl: null,  // the dialog preview container
    _dialogPath: null, // the current dialog path in JCR
    _docViewPath: null,
    _split: null,

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
      this._initParentSelector();
      this._panelSplit = new window.dialogEditor.PanelSplit(SELECTOR.editorSplitPane, SELECTOR.dialogSplitPane)
      this._initCodeEditor();
      this.refresh();
      this._bindEvents();

    },
    _saveConfig() {
      localStorage.setItem('dialogEditorState', JSON.stringify(this.config));
    },
    _initParentSelector: function () {
      var that = this;
      var overlay = new Coral.Overlay().set({
        alignAt: Coral.Overlay.align.CENTER_BOTTOM,
        alignMy: Coral.Overlay.align.CENTER_TOP,
        placement: Coral.Overlay.placement.BOTTOM,
        target: SELECTOR.componentParentsButton,
      });
      var selectList = new Coral.SelectList().set({ loading: true });
      selectList.style.minWidth = '50px';
      overlay.appendChild(selectList)
      $parentSelectorButton = $(SELECTOR.componentParentsButton);
      $(overlay).insertAfter($parentSelectorButton)

      $.get('/apps/dialogeditor.dialog.json' + Util.removeExtension(that._dialogPath))
        .then(function (response) {
          selectList.set({ loading: false });
          selectList.items.clear()
          response.dialogAncestorPaths.forEach(function (path, i) {
            var space = '&nbsp;'.repeat(i * 2);
            var itemHtml = space + '<coral-icon icon="breakdown"></coral-icon>' + path;
            var selectItem = new Coral.SelectList.Item().set({ innerHTML: itemHtml, selected: i == 0 });
            selectItem.on('click', function () {
              var pathWithExtension = Util.addHtmlExtension(path)
              that.setDialogPath(pathWithExtension);
              that.refresh();
              overlay.hide();
            })
            selectList.items.add(selectItem)
          })
        })

      $parentSelectorButton.click(function () {
        event.stopPropagation(); // don't bubble (gum) ;)
        if (overlay.classList.contains('is-open')) {
          overlay.hide()
        } else {
          overlay.show()
        }
      });
      $(window).click(function () {
        overlay.hide() // click outside the overlay
      });
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
          that.togglePanelDirection();
        }));
    },
    /**
     * Ajax call to get the document view XML for current dialog
     */
    _getDocumentView: function () {
      // TODO: need a better way to handle this
      var dialogPathWithNoExtension = Util.removeExtension(this._dialogPath);
      var docViewPath = "/apps/dialogeditor.document-view.xml" + dialogPathWithNoExtension;
      return $.get(docViewPath)
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
      this._saveConfig();
    },
    /**
     * Set current dialog path being worked on
     */
    setDialogPath: function (dialogPath) {
      $(SELECTOR.currentDialogPath).html(dialogPath);
      this._dialogPath = dialogPath;
      this._dialogPath = Util.addHtmlExtension(this._dialogPath);
      this._docViewPath = Util.getDocumentViewPath(this._dialogPath);
    },
    refresh: function () {
      this.refreshDialog();
      this.refreshCode();
    },

    refreshCode: function () {
      var that = this;
      var scrollInfo = that.codeEditor.getScrollInfo();
      that._getDocumentView()
        .then(function (result) {
          that.codeEditor.setValue(result);
          that.codeEditor.scrollTo(scrollInfo.left, scrollInfo.top);
        })
    },

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
          // simulate dialog-loaded
          setTimeout(function () {
            $(document).trigger("dialog-loaded", {
              dialog: dialogEl
            })
          }, 1000);

        });
    },
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
