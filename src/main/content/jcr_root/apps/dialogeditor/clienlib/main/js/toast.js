// Based on: jQuery toast plugin created by Kamran Ahmed copyright MIT license 2015
if (typeof Object.create !== 'function') {
  Object.create = function (obj) {
    function F() { }
    F.prototype = obj;
    return new F();
  };
}

(function ($, window, document, undefined) {

  "use strict";
  var CLOSE_ICON = '<coral-icon icon="close" size="XS" style="position:absolute;right:1em" coral-close></coral-icon>';

  var Toast = {

    _positionClasses: ['bottom-left', 'bottom-right', 'top-right', 'top-left', 'bottom-center', 'top-center', 'mid-center'],
    _defaultIcons: ['success', 'error', 'info', 'warning'],

    init: function (options, elem) {
      this.prepareOptions(options, $.toast.options);
      this.process();
    },

    prepareOptions: function (options, options_to_extend) {
      var _options = {};
      if (typeof options === 'string') {
        _options.heading = options;
      } else {
        _options = options;
      }
      this.options = $.extend({}, options_to_extend, _options);
    },

    process: function () {
      this.setup();
      this.addToDom();
      this.position();
      this.bindToast();
      this.animate();
    },

    setup: function () {
      if (!this._toastEl) {
        var closeIcon = this.options.allowToastClose ? CLOSE_ICON : '';
        var titleHtml = '<span style="padding-right:1em;">' + this.options.heading + '</span>'
        var _toastEl = new Coral.Alert()
          .set({
            variant: this.options.variant || "info",
            header: { innerHTML: titleHtml + closeIcon },
            footer: {
              innerHTML: this.options.text || ""
            }
          });
        _toastEl.classList.add("toast");
        this._toastEl = $(_toastEl)
      }
    },
    /** positions the new toast */
    position: function () {
      if ((typeof this.options.position === 'string') && ($.inArray(this.options.position, this._positionClasses) !== -1)) {

        if (this.options.position === 'bottom-center') {
          this._container.css({
            left: ($(window).outerWidth() / 2) - this._container.outerWidth() / 2,
            bottom: 20
          });
        } else if (this.options.position === 'top-center') {
          this._container.css({
            left: ($(window).outerWidth() / 2) - this._container.outerWidth() / 2,
            top: 20
          });
        } else if (this.options.position === 'mid-center') {
          this._container.css({
            left: ($(window).outerWidth() / 2) - this._container.outerWidth() / 2,
            top: ($(window).outerHeight() / 2) - this._container.outerHeight() / 2
          });
        } else {
          this._container.addClass(this.options.position);
        }

      } else if (typeof this.options.position === 'object') {
        this._container.css({
          top: this.options.position.top ? this.options.position.top : 'auto',
          bottom: this.options.position.bottom ? this.options.position.bottom : 'auto',
          left: this.options.position.left ? this.options.position.left : 'auto',
          right: this.options.position.right ? this.options.position.right : 'auto'
        });
      } else {
        this._container.addClass('bottom-left');
      }
    },
    /** binds event handlers. */
    bindToast: function () {

      var that = this;

      this._toastEl.find('[close]').on('click', function (e) {

        e.preventDefault();

        if (that.options.showHideTransition === 'fade') {
          that._toastEl.trigger('beforeHide');
          that._toastEl.fadeOut(function () {
            that._toastEl.trigger('afterHidden');
          });
        } else if (that.options.showHideTransition === 'slide') {
          that._toastEl.trigger('beforeHide');
          that._toastEl.slideUp(function () {
            that._toastEl.trigger('afterHidden');
          });
        } else {
          that._toastEl.trigger('beforeHide');
          that._toastEl.hide(function () {
            that._toastEl.trigger('afterHidden');
          });
        }
      });

      if (typeof this.options.beforeShow == 'function') {
        this._toastEl.on('beforeShow', function () {
          that.options.beforeShow(that._toastEl);
        });
      };

      if (typeof this.options.afterShown == 'function') {
        this._toastEl.on('afterShown', function () {
          that.options.afterShown(that._toastEl);
        });
      };

      if (typeof this.options.beforeHide == 'function') {
        this._toastEl.on('beforeHide', function () {
          that.options.beforeHide(that._toastEl);
        });
      };

      if (typeof this.options.afterHidden == 'function') {
        this._toastEl.on('afterHidden', function () {
          that.options.afterHidden(that._toastEl);
        });
      };

      if (typeof this.options.onClick == 'function') {
        this._toastEl.on('click', function () {
          that.options.onClick(that._toastEl);
        });
      };
    },

    addToDom: function () {

      var _container = $('.toast-wrapper');

      if (_container.length === 0) {

        _container = $('<div></div>', {
          class: "toast-wrapper",
          role: "alert",
          "aria-live": "polite"
        });

        $('body').append(_container);

      } else if (!this.options.stack || isNaN(parseInt(this.options.stack, 10))) {
        _container.empty();
      }

      _container.find('.toast:hidden').remove();

      _container.append(this._toastEl);

      if (this.options.stack && !isNaN(parseInt(this.options.stack), 10)) {

        var _prevToastCount = _container.find('.toast').length,
          _extToastCount = _prevToastCount - this.options.stack;

        if (_extToastCount > 0) {
          $('.toast-wrapper').find('.toast').slice(0, _extToastCount).remove();
        };

      }

      this._container = _container;
    },

    canAutoHide: function () {
      return (this.options.hideAfter !== false) && !isNaN(parseInt(this.options.hideAfter, 10));
    },

    processLoader: function () {
      // Show the loader only, if auto-hide is on and loader is demanded
      if (!this.canAutoHide() || this.options.loader === false) {
        return false;
      }

      var loader = this._toastEl.find('.jq-toast-loader');

      // 400 is the default time that jquery uses for fade/slide
      // Divide by 1000 for milliseconds to seconds conversion
      var transitionTime = (this.options.hideAfter - 400) / 1000 + 's';
      var loaderBg = this.options.loaderBg;

      var style = loader.attr('style') || '';
      style = style.substring(0, style.indexOf('-webkit-transition')); // Remove the last transition definition

      style += '-webkit-transition: width ' + transitionTime + ' ease-in; \
                    -o-transition: width ' + transitionTime + ' ease-in; \
                    transition: width ' + transitionTime + ' ease-in; \
                    background-color: ' + loaderBg + ';';


      loader.attr('style', style).addClass('jq-toast-loaded');
    },

    animate: function () {

      var that = this;

      this._toastEl.hide();

      this._toastEl.trigger('beforeShow');

      if (this.options.showHideTransition.toLowerCase() === 'fade') {
        this._toastEl.fadeIn(function () {
          that._toastEl.trigger('afterShown');
        });
      } else if (this.options.showHideTransition.toLowerCase() === 'slide') {
        this._toastEl.slideDown(function () {
          that._toastEl.trigger('afterShown');
        });
      } else {
        this._toastEl.show(function () {
          that._toastEl.trigger('afterShown');
        });
      }

      if (this.canAutoHide()) {

        var that = this;

        window.setTimeout(function () {

          if (that.options.showHideTransition.toLowerCase() === 'fade') {
            that._toastEl.trigger('beforeHide');
            that._toastEl.fadeOut(function () {
              that._toastEl.trigger('afterHidden');
            });
          } else if (that.options.showHideTransition.toLowerCase() === 'slide') {
            that._toastEl.trigger('beforeHide');
            that._toastEl.slideUp(function () {
              that._toastEl.trigger('afterHidden');
            });
          } else {
            that._toastEl.trigger('beforeHide');
            that._toastEl.hide(function () {
              that._toastEl.trigger('afterHidden');
            });
          }

        }, this.options.hideAfter);
      };
    },

    reset: function (resetWhat) {

      if (resetWhat === 'all') {
        $('.toast-wrapper').remove();
      } else {
        this._toastEl.remove();
      }

    },

    update: function (options) {
      this.prepareOptions(options, this.options);
      this.setup();
      this.bindToast();
    },

    close: function () {
      this._toastEl.find('[close]').click();
    }
  };

  $.toast = function (options) {
    var toast = Object.create(Toast);
    toast.init(options, this);

    return {

      reset: function (what) {
        toast.reset(what);
      },

      update: function (options) {
        toast.update(options);
      },

      close: function () {
        toast.close();
      }
    }
  };

  $.toast.options = {
    text: '',
    heading: '',
    showHideTransition: 'fade',
    allowToastClose: true,
    hideAfter: 3000,
    stack: 5,
    position: 'bottom-right',
    variant: 'info',
    beforeShow: function () { },
    afterShown: function () { },
    beforeHide: function () { },
    afterHidden: function () { },
    onClick: function () { }
  };

})(jQuery, window, document);