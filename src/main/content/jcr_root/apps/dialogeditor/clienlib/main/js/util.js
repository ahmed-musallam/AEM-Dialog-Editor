(function () {
  window.dialogEditor = window.dialogEditor || {};
  window.dialogEditor.Util = {
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
    },
    getDocumentViewPath(dialogPath) {
      return "/apps/dialogeditor.document-view.xml" + this.removeExtension(dialogPath);
    }
  }
})();