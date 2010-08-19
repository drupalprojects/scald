Drupal.behaviors.mee = function(context) {
  $("div.mee-wrap-editor-library:not(.mee-processed)")
    .addClass('mee-processed')
    .find('> div.dnd-library-wrapper')
    .each(function() {
      var $editor = $('#' + this.id.slice(0, -12)); 
      $editor.bind('wysiwygAttach', Drupal.mee.attach);
      $editor.bind('wysiwygDetach', Drupal.mee.detach);
    })
    .end()
}

Drupal.mee = {
  attach: function(e, data) {
    var t = setInterval(function() {
      var tiny_instance = tinyMCE.getInstanceById(data.field);
      if (tiny_instance) {
        clearInterval(t);
        $(tiny_instance.editor_id)
          .find('iframe')
          .unbind('dnd_drop')
          .bind('dnd_drop', function(e, data) {
            var rep = Drupal.settings.dndEditorRepresentations[data.representation_id];
            if (!rep) return;
            $(this)
              .parents('div.mee-wrap-editor-library.mee-processed')
              .find('table.mee-ressource-manager')
              .each(function(i) {
                $(this).append(Drupal.mee.generate(
                  data.representation_id,
                  rep,
                  Drupal.tableDrag[this.id]
                ));
              });
          });
      }
    }, 100);
  },
  detach: function(e, data) {

  },
  generate: function(id, representation, tableDrag) {
    var $weight = $("<select />"), $tr = $('<tr />'), $td = $("<td />"), parity;
    var separator = $(tableDrag.table).find('div.mee-rm-separator select')[0];
    var wn = separator.name.replace(/\[0\]\[weight\]$/, '[' + id +'][weight]');
    var $required = $("<select />")
      .attr('name', wn.replace(/\[weight\]$/, '[required]'))
      .append("<option value='0'>"+ Drupal.t('Optional') +"</option>")
      .append("<option value='1'>"+ Drupal.t('Required') +"</option>")
      .val(representation.meta.action);
    // If this ressource is already in the Ressource Manager, don't add a line
    if ($('select[name="'+ wn +'"]', tableDrag.table).length) {
      return '';
    }
    $tr
      .addClass('draggable')
      .append($('<td></td>'))
      .append($('<td></td>').append(representation.title))
      .append($('<td></td>').append($required));
    for (var i = -10; i <= 10; i++) {
      $weight.append("<option>"+ i +"</option>");
    }
    $weight.val(0).addClass('mee-rm-weight').attr('name', wn);
    $td.append($weight);
    $tr.append($td);
    parity = $(tableDrag.table).find('tr').size() % 2 ? 'odd' : 'even';
    $tr.addClass(parity);
    tableDrag.makeDraggable($tr.get(0));
    return $tr;
  }
}
