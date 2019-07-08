(function () {
  var VERTICAL = 'vertical',
    HORIZONTAL = 'horizontal';
  window.dialogEditor = window.dialogEditor || {};

  // Panel Split
  window.dialogEditor.PanelSplit = function (panel1Selector, panel2Selector) {
   
    this.panel1Selector = panel1Selector;
    this.panel2Selector = panel2Selector;
    this.direction = HORIZONTAL;
    this.split = undefined;

    /** Init Split view  */
    this.init = function () {
      if (this.direction !== VERTICAL) {
        this.direction = HORIZONTAL;
      }
      var isVertical = this.direction === VERTICAL;
      this.direction = isVertical ? VERTICAL : HORIZONTAL;
      var minSize = isVertical ? [0, 0] : [0, 590];
      // update classes to reflect direction
      var container = document.querySelector(panel1Selector).parentElement;
      container.classList.remove(VERTICAL);
      container.classList.remove(HORIZONTAL);
      container.classList.add(this.direction);

      this._split = Split([panel1Selector, panel2Selector], {
        sizes: [50, 50],
        direction: this.direction,
        minSize: minSize
      });
      return this.direction;
    }

    /** Change split direction, only "vertical" or "horizontal" allowed, defaults to "horizontal" */
    this.changeDirection = function (direction) {
      if (this._split) {
        this._split.destroy();
      }
      this.direction = direction;
      this.init();
      return this.direction;
    }

    /** Toggles to other direction */
    this.toggleDirection = function () {
      var isVertical = this.direction === VERTICAL;
      var otherDirection = isVertical ? HORIZONTAL : VERTICAL;
      return this.changeDirection(otherDirection)
    }
    // INITIALIZE
    this.init();
  }
})();