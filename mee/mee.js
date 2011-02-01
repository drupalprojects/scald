Drupal.behaviors.mee = function(context) {
  for (editor in Drupal.settings.dndDropAreas) {
    var $editor = $('#' + editor);
    $editor.bind('wysiwygAttach', Drupal.mee.attach);
    $editor.bind('wysiwygDetach', Drupal.mee.detach);
  }
}

Drupal.mee = {
  attach: function(e, data) {
    var t = setInterval(function() {
      if (!tinyMCE) {
        return;
      }
      var tiny_instance = tinyMCE.getInstanceById(data.field);
      if (tiny_instance) {
        clearInterval(t);
        $(tiny_instance.editor_id)
          .find('iframe')
          .unbind('dnd_drop')
          .bind('dnd_drop', function(e, data) {
            var rep = Drupal.dnd.Atoms[data.representation_id];
            if (!rep) return;
            $(this)
              .parents('div.mee-wrap-editor-library')
              .find('table.mee-ressource-manager')
              .each(function(i) {
                var row = Drupal.mee.generate(
                  data.representation_id,
                  rep,
                  Drupal.tableDrag[this.id]
                );
                if (row) {
                  $(this).append(row);
                }
              });
          });
      }
    }, 100);
  },
  detach: function(e, data) {

  },
  generate: function(id, representation, tableDrag) {
    var $weight = $("<select />"), $tr = $('<tr />'), $td = $("<td />"), parity;
    var $separator = $(tableDrag.table).find('div.mee-rm-separator select');
    var separator = $separator.get(0);
    var wn = separator.name.replace(/\[0\]\[weight\]$/, '[' + id +'][weight]');
    var action = representation.meta.action || 0;
    var $required = $("<select />")
      .attr('name', wn.replace(/\[weight\]$/, '[required]'))
      .append("<option value='0'>"+ Drupal.t('Optional') +"</option>")
      .append("<option value='1'>"+ Drupal.t('Required') +"</option>")
      .val(action);
    // If this ressource is already in the Ressource Manager, don't add a line
    if ($('select[name="'+ wn +'"]', tableDrag.table).length) {
      return '';
    }
    $tr
      .addClass('draggable')
      .append($('<td></td>'))
      .append($('<td></td>').append(representation.meta.title))
      .append($('<td></td>').append($required));
    for (var i = -10; i <= 10; i++) {
      $weight.append("<option>"+ i +"</option>");
    }
    $weight
      .val(0)
      .addClass('mee-rm-weight')
      .attr('name', wn);
    $td
      .append($weight)
      .css('display', $separator.parents('td').css('display'));
    $tr.append($td);
    parity = $(tableDrag.table).find('tr').size() % 2 ? 'odd' : 'even';
    $tr.addClass(parity);
    tableDrag.makeDraggable($tr.get(0));
    return $tr;
  }
}
