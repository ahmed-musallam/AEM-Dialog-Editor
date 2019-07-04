$(function() {
  //http://localhost:4502/bin/querybuilder.json?path=/apps&1_property=sling:resourceType&1_property.value=cq/gui/components/authoring/dialog&1_property.operation=like&orderby=path&p.limit=-1

  // create and add dialog to dom
  var dialog = new Coral.Dialog().set({
    id: 'dialog-explorer-dialog', // ¯\_(ツ)_/¯ 
    closable: 'on',
    //movable: true,
    open: false,
    header: {
      innerHTML: 'Availabe Dialogs Under /apps'
    },
    content: {
      innerHTML: '<coral-wait></coral-wait>'
    },
    footer: {
      innerHTML: '<button is="coral-button" variant="primary" coral-close>Close</button>'
    }
  });
  document.body.appendChild(dialog);

  $('#dialog-explorer').click(function() {
    dialog.content.innerHTML = '<coral-wait></coral-wait>';
    dialog.show();
    $.get('/bin/querybuilder.json', {
      "path": "/apps",
      "1_property":"sling:resourceType",
      "1_property.value": "cq/gui/components/authoring/dialog",
      "1_property.operation":"like",
      "orderby":"path",
      "p.limit":-1
    }).then(function(resp) {
      var buttonList = new Coral.ButtonList();
      resp.hits.forEach(function (hit) {
        var item = new Coral.ButtonList.Item().set({
          innerHTML: `<b>${hit.title}: </b><a href="/apps/dialogeditor.html${hit.path}">${hit.path}</a>`
        })
        buttonList.items.add(item);
      })
      // clear dialog
      dialog.content.innerHTML = "";

      var searchField = document.createElement('input', 'coral-textfield');
      searchField.style.width = '100%';
      searchField.placeholder = "Filter";
      dialog.content.appendChild(searchField)
      searchField.addEventListener('input', function(e) {
        buttonList.items.getAll().forEach(function(itemEl) {
          var notAMatch = !(new RegExp(searchField.value, "i").test(itemEl.textContent));
          if (notAMatch) {
            itemEl.hide();
          } else {
            itemEl.show();
          }
        })
      })
      dialog.content.appendChild(buttonList);
      dialog.center();
    })
  })
})