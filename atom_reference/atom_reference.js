/**
 * @file
 *   Provides the JavaScript behaviors for the Atom Reference field.
 */
(function($) {
Drupal.behaviors.atom_reference = function(context) {
  $("div.atom_reference_drop_zone:not(.atom_reference_processed)").each(function() {
    var $this = $(this);
    var $reset = $("<input type='button' />")
      .val(Drupal.t('Delete'))
      .click(function() {
        $(this)
          .hide()
          .parent()
          .find('input:text')
          .val('')
          .end()
          .find('div.atom_reference_drop_zone')
          .empty()
          .append(Drupal.t('Drop a resource here'))
      });
    // If the element doesn't have a value yet, hide the Delete button
    // by default
    if (!$this.parent().find('input:text').val()) {
      $reset.css('display', 'none');
    }
    $this
      .addClass('atom_reference_processed')
      .bind('dragover', function(e) {e.preventDefault();})
      .bind('dragenter', function(e) {e.preventDefault();})
      .bind('drop', function(e) {
        var dt = e.originalEvent.dataTransfer.getData('Text');
        var ret = Drupal.atom_reference.droppable(dt, this);
        var $this = $(this);
        if (ret.found && ret.continue) {
          $this
            .empty()
            .append(Drupal.dnd.Atoms[dt].editor)
            .parent()
            .find('input:text')
            .val(dt)
            .end()
            .find('input:button')
            .show();
        }
        else {
          var placeholder = Drupal.t("You can't drop a resource of type %type in this field", {'%type': ret.type});
          $this.empty().append(placeholder);
        }
        e.preventDefault();
      })
      .parent()
      .find('input')
      .css('display', 'none')
      .end()
      .append($reset);
  });
}

if (!Drupal.atom_reference) {
  Drupal.atom_reference = {};
  Drupal.atom_reference.droppable = function(ressource_id, field) {
    var retVal = {'continue': true, 'found': true};
    if (Drupal.dnd.Atoms[ressource_id]) {
      var type = Drupal.dnd.Atoms[ressource_id].meta.type;
      var accept = $(field).parent().find('input:text').attr('atom:types').split(',');
      if (accept.indexOf(type) == -1) {
        retVal.continue = false;
      }
      retVal.type = type;
    }
    else {
      retVal.found = false;
    }
    return retVal;
  }
}
})(jQuery);
