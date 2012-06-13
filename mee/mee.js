(function($) {

Drupal.settings.mee = {
  editors: {}
};

Drupal.behaviors.mee = {
  attach: function(context, settings) {
    for (editor in settings.dndDropAreas) {
      $('#' + editor, context).each(function() {
        var $this = $(this);
        // I currently don't know how to effectively detect changes in
        // textareas. So monitor theirs contents and periodically compare to the
        // old values.
        settings.mee.editors[$this.attr('id')] = '';
        setInterval(function() {
          Drupal.mee.update($this);
        }, 1000);
      });
    }
  }
}

Drupal.mee = {
  update: function(obj) {
    var text = obj.val();
    var id = obj.attr('id');

    if (text === Drupal.settings.mee.editors[id]) {
      return;
    }

    Drupal.settings.mee.editors[id] = text;

    // 1. Check if there are known atoms.
    // Known atoms are ones actually in the current library view and available
    // for drag and drop. If library is unavailable, detection happens on the
    // server side.
    for (atom in Drupal.dnd.Atoms) {
      // Theoretically we can search for Drupal.dnd.Atoms[atom].editor in the
      // text, but we can, because RTE reformat the HTML source (eg. change
      // class='image' into class="image" etc.).
      if (text.indexOf('<!-- scald=' + atom + ':sdl_editor_representation -->') > -1) {
        // @todo check the selector
        Drupal.mee.generate(atom, obj.parents('.text-format-wrapper').find('.mee-resource-manager').attr('id'));
      }
    }

    // @todo 2. Scan the resource manager table to clean up removed atoms.
  },

 /**
   * Generate a new item in the MEE Resource Manager table. For the sake of
   * simplicity and performance, we don't use AHAH.
   */
  generate: function(atom_id, table_id) {
    var $weight = $("<select />"), $tr = $('<tr />'), $td = $("<td />"), parity;
    var $tableDrag = $('#' + table_id);
    var $separator = $tableDrag.find('div.mee-rm-separator select');
    var separator = $separator.get(0);
    var wn = separator.name.replace(/\[0\]\[weight\]$/, '[' + atom_id +'][weight]');
    var action = Drupal.dnd.Atoms[atom_id].meta.action || 0;
    var $required = $("<select />")
      .attr('name', wn.replace(/\[weight\]$/, '[required]'))
      .append("<option value='0'>"+ Drupal.t('Optional') +"</option>")
      .append("<option value='1'>"+ Drupal.t('Required') +"</option>")
      .addClass('form-select')
      .val(action);

    // If this ressource is already in the Ressource Manager, don't add a line
    if ($('select[name="'+ wn +'"]', $tableDrag).length) {
      return;
    }
    $tr
      .addClass('draggable')
      .append($('<td></td>').append(Drupal.dnd.Atoms[atom_id].meta.title))
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
    parity = $tableDrag.find('tr').size() % 2 ? 'odd' : 'even';
    $tr.addClass(parity);
    Drupal.tableDrag[table_id].makeDraggable($tr.get(0));
    $tableDrag.find('tbody').append($tr);
  }
}

})(jQuery);
