(function () {
  var buttonSelector = "#super-type-selector";
  window.dialogEditor = window.dialogEditor || {};
  var Util = window.dialogEditor.Util;

  // Panel Split
  window.dialogEditor.SuperTypeSelector = function (dialogPath) {
    handlers = [];

    /** Add a handler to be called when a path is selected */
    this.addHandler = function (handlerCallback) {
      handlers.push(handlerCallback);
    }

    var overlay = new Coral.Overlay().set({
      alignAt: Coral.Overlay.align.CENTER_BOTTOM,
      alignMy: Coral.Overlay.align.CENTER_TOP,
      placement: Coral.Overlay.placement.BOTTOM,
      target: buttonSelector,
    });

    var selectList = new Coral.SelectList().set({ loading: true });
    selectList.style.minWidth = '50px';
    overlay.appendChild(selectList)
    $parentSelectorButton = $(buttonSelector);
    $(overlay).insertAfter($parentSelectorButton)

    $.get('/apps/dialogeditor.dialog.json' + Util.removeExtension(dialogPath))
      .then(function (response) {
        selectList.set({ loading: false });
        selectList.items.clear()
        response.dialogAncestorPaths.forEach(function (path, i) {
          var space = '&nbsp;'.repeat(i * 2);
          var itemHtml = space + '<coral-icon icon="breakdown"></coral-icon>' + path;
          var selectItem = new Coral.SelectList.Item().set({ innerHTML: itemHtml, selected: i == 0 });
          selectItem.on('click', function () {
            handlers.forEach(function(handler) {
              handler(path) // call all registered handlers
            });
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
  }
})();