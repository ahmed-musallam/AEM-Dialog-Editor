$(function () {

  window.DialogEditor = {
    
    codeEditor: null,
    _wrapper: null,
    _dialog: null,
    _dialogPath: null,
    _docViewPath: null,
    _split: null,


    init: function (selector) {
      this._wrapper = $('#dialog-editor');
      this._dialogPath = this._wrapper.data('dialog-path');
      this._dialog = this._wrapper.find('#dialog');
      // TODO - do this serverside
      this._docViewPath = "/apps/dialogeditor.document-view.xml" + this._dialogPath.split('.').slice(0, -1).join('.');

      // initial refresh
      this._splitPanels();
      this._initCodeEditor();
      this.refresh();

      $("#refresh").click((function () {
        this.updateDialogNode()
      }).bind(this));

      $("#split-direction").click((function () {
        if (this._split.pairs[0].direction === 'vertical') {
          this._splitPanels('horizontal')
        } else {
          this._splitPanels('vertical')
        }
      }).bind(this));
    },
    _getDocumentView: function () {
      // TODO: need a better way to handle this
      var dialogPathWithNoExtension = this._dialogPath.split('.').slice(0, -1).join('.');
      var docViewPath = "/apps/dialogeditor.document-view.xml" + dialogPathWithNoExtension;
      return $.get(docViewPath)
    },
    _initCodeEditor: function() {
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
      var isVertical = direction === 'vertical';
      var trueDirection = isVertical ? 'vertical' : 'horizontal';
      var minSize = isVertical ? [0,0] : [0,590];
      this._wrapper.removeClass('vertical');
      this._wrapper.removeClass('horizontal');
      this._wrapper.addClass(direction);
      this._split = Split(['#split-editor', '#split-result'], {
        sizes: [50, 50],
        direction: trueDirection,
        minSize: minSize
      });
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
      $.get(that._dialogPath + '/')
        .then(function (data) {
          var dialogEl = $.parseHTML(data).find(function (el) {
            return el.tagName && el.tagName === "CORAL-DIALOG"
          })
          if (dialogEl) {
            that._dialog.empty().append(dialogEl)
          }
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



  /*
  var dummy = {
    attrs: {
      color: ["red", "green", "blue", "purple", "white", "black", "yellow"],
      size: ["large", "medium", "small"],
      description: null
    },
    children: []
  };

  var tags = {
    "!top": ["top"],
    "!attrs": {
      id: null,
      class: ["A", "B", "C"]
    },
    top: {
      attrs: {
        lang: ["en", "de", "fr", "nl"],
        freeform: null
      },
      children: ["animal", "plant"]
    },
    animal: {
      attrs: {
        name: null,
        isduck: ["yes", "no"]
      },
      children: ["wings", "feet", "body", "head", "tail"]
    },
    plant: {
      attrs: { name: null },
      children: ["leaves", "stem", "flowers"]
    },
    wings: dummy, feet: dummy, body: dummy, head: dummy, tail: dummy,
    leaves: dummy, stem: dummy, flowers: dummy
  };

  function completeAfter(cm, pred) {
    var cur = cm.getCursor();
    if (!pred || pred()) setTimeout(function () {
      if (!cm.state.completionActive)
        cm.showHint({ completeSingle: false });
    }, 100);
    return CodeMirror.Pass;
  }

  function completeIfAfterLt(cm) {
    return completeAfter(cm, function () {
      var cur = cm.getCursor();
      return cm.getRange(CodeMirror.Pos(cur.line, cur.ch - 1), cur) == "<";
    });
  }

  function completeIfInTag(cm) {
    return completeAfter(cm, function () {
      var tok = cm.getTokenAt(cm.getCursor());
      if (tok.type == "string" && (!/['"]/.test(tok.string.charAt(tok.string.length - 1)) || tok.string.length == 1)) return false;
      var inner = CodeMirror.innerMode(cm.getMode(), tok.state).state;
      return inner.tagName;
    });
  }

  var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
    mode: "xml",
    lineNumbers: true,
    extraKeys: {
      "'<'": completeAfter,
      "'/'": completeIfAfterLt,
      "' '": completeIfInTag,
      "'='": completeIfInTag,
      "Ctrl-Space": "autocomplete"
    },

    hintOptions: { schemaInfo: tags }

  });
  */
})
