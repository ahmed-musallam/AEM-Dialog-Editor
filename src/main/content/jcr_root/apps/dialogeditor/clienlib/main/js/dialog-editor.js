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

  var Util = {
    removeExtension: function (path) {
      if (path) {
        return path.split('.').slice(0, -1).join('.')
      }
    },
    addHtmlExtension: function (path) {
      if (path && !path.endsWith('.html')) {
        return path + '.html'
      } else return path;
    },
    prefixWith: function (string, prefix) {
      if (!string || !prefix) return;
      var trimmed = string.trim();
      if (!trimmed.startsWith(prefix)) {
        return prefix + trimmed;
      } else return string;
    }
  }

  window.DialogEditor = {
    config: {
      panelDirection: VERTICAL
    },
    codeEditor: null,
    _wrapper: null,
    _dialog: null,
    _dialogPath: null,
    _docViewPath: null,
    _split: null,

    init: function (selector) {
      this._wrapper = $(SELECTOR.container);
      this._dialog = this._wrapper.find(SELECTOR.dialog);
      this.setDialogPath(this._wrapper.data('dialog-path'));
      var localStorageState = JSON.parse(localStorage.getItem('dialogEditorState')) || {};
      this.config = Object.assign(this.config, localStorageState)

      if (!this._dialogPath) {
        this._renderError();
        return;
      }


      // initial refresh
      this._initParentSelector();
      this._splitPanels();
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
      this._wrapper.children().hide();
      this._wrapper.append("<h1>No dialog path provided in request suffix, it should be a path to a dialog path<h1>")

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
          if (that._split.pairs[0].direction === VERTICAL) {
            that._splitPanels(HORIZONTAL)
          } else {
            that._splitPanels(VERTICAL)
          }
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
    _splitPanels: function (direction) {
      if (this._split) {
        this._split.destroy();
      }
      direction = direction || this.config.panelDirection;
      var isVertical = direction === VERTICAL;
      trueDirection = isVertical ? VERTICAL : HORIZONTAL;
      this.config.panelDirection = trueDirection;
      this._saveConfig();
      var minSize = isVertical ? [0, 0] : [0, 590];
      this._wrapper.removeClass(VERTICAL);
      this._wrapper.removeClass(HORIZONTAL);
      this._wrapper.addClass(direction);
      this._split = Split([SELECTOR.editorSplitPane, SELECTOR.dialogSplitPane], {
        sizes: [50, 50],
        direction: trueDirection,
        minSize: minSize
      });
    },
    setDialogPath: function (dialogPath) {
      $(SELECTOR.currentDialogPath).html(dialogPath); // eh, it works... I'll refactor it someday
      this._dialogPath = dialogPath;
      this._dialogPath = Util.addHtmlExtension(this._dialogPath);
      this._docViewPath = "/apps/dialogeditor.document-view.xml" + Util.removeExtension(this._dialogPath);
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
            that._dialog.empty().append(dialogEl)
            that._dialog.append(css);
            that._dialog.append(js);
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

  window.DialogEditor.init();
})
