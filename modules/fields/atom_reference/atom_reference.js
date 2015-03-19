/**
 * @file
 *   Provides the JavaScript behaviors for the Atom Reference field.
 */
(function($) {

  var $edit_link_model = $('<a target="_blank">')
    .html(Drupal.t('Edit'))
    .addClass('ctools-use-modal ctools-modal-custom-style atom-reference-edit');
  var $view_link_model = $('<a target="_blank">')
    .html(Drupal.t('View'))
    .addClass('atom-reference-view');

Drupal.behaviors.atom_reference = {
  attach: function(context, settings) {
    var this_behavior_attach = this;

    // Record if the edit target link modal frame is updated
    $('.ctools-modal-content form').bind('formUpdated', function() {
      this_behavior_attach['update_atom_reference_drop_zone'] = true;
    });

    // Update drop zone (especially when returning from the edit modal frame).
    if (typeof(this.update_atom_reference_drop_zone) !== 'undefined') {
      $('div.atom_reference_drop_zone.atom_reference_processed').each(function() {
        var $this = $(this);
        var rendering_context = $this.attr('data-rendering-context');
        var match_atom_id = /<!-- scald=(\d+):.*-->/g.exec($this.html());
        if (match_atom_id) {
          var atom_id = match_atom_id[1];
          delete Drupal.dnd.Atoms[atom_id].contexts[rendering_context]; // to force reload
          Drupal.dnd.fetchAtom(rendering_context, atom_id, function() {
            $this
              .empty()
              .append(Drupal.dnd.Atoms[atom_id].contexts[rendering_context]);
          });
        }
      });
    }

    $("div.atom_reference_drop_zone:not(.atom_reference_processed)", context).each(function() {
      var $this = $(this);

      // Build operations (remove reference, edit and view) structure.
      var $operation_wrapper = $('<div class="atom_reference_operations">');
      var $operation_buttons = $('<div id="ctools-button-0" class="buttons ctools-no-js ctools-button">')
        .append('<div class="ctools-link"><a href="#" class="ctools-twisty ctools-text">' + Drupal.t('Operation') + '</a></div>')
        .append('<div class="ctools-content"><ul><li class="remove"><li class="edit"><li class="view"></ul></div>')
        .prependTo($operation_wrapper);

      // Add the remove link
      $('<a href="#" />')
        .html(Drupal.t('Remove'))
        .click(function(e) {
          e.preventDefault();
          $operation_buttons
            .closest('div.form-item')
            .find('input:text')
            .val('')
            .end()
            .find('div.atom_reference_drop_zone')
            .empty()
            .append(Drupal.t('Drop a resource here'))
            .end()
            .find('div.atom_reference_operations')
            .hide();
        })
        .appendTo($operation_buttons.find('li.remove'));

      var match_atom_id = /<!-- scald=(\d+):.*-->/g.exec($this.html());
      if (match_atom_id) {
        var atom_id = match_atom_id[1];

        Drupal.dnd.fetchAtom('', atom_id, function() {

          // Add the edit link
          if ($.grep(Drupal.dnd.Atoms[atom_id].actions, function(e){ return e == 'edit'; }).length > 0) {
            // Permission granted for edit

            $edit_link_model.clone()
              .attr('href', settings.basePath + 'atom/' + atom_id + '/edit/nojs')
              .appendTo($operation_buttons.find('li.edit'));
            Drupal.behaviors.ZZCToolsModal.attach($operation_buttons);
            $operation_buttons.addClass('ctools-dropbutton');
          }

          // Add the view link
          if ($.grep(Drupal.dnd.Atoms[atom_id].actions, function(e){ return e == 'view'; }).length > 0) {
            // Permission granted for view

            $view_link_model.clone()
              .attr('href', settings.basePath + 'atom/' + atom_id)
              .appendTo($operation_buttons.find('li.view'));
            $operation_buttons.addClass('ctools-dropbutton');
          }

          Drupal.attachBehaviors($operation_buttons);
        });
      }

      // If the element doesn't have a value yet, hide the operations wrapper
      // by default
      if (!$this.closest('div.form-item').find('input:text').val()) {
        $operation_wrapper.css('display', 'none');
      }
      $this
        .addClass('atom_reference_processed')
        .bind('dragover', function(e) {e.preventDefault();})
        .bind('dragenter', function(e) {e.preventDefault();})
        .bind('drop', function(e) {
          var ressource_id = e.originalEvent.dataTransfer.getData('Text').replace(/^\[scald=(\d+).*$/, '$1');
          var ret = Drupal.atom_reference.droppable(ressource_id, this);
          var $this = $(this);

          if (ret.found && ret.keepgoing) {
            var rendering_context = $this.attr('data-rendering-context');

            // Display and set id of dropped atom
            Drupal.dnd.fetchAtom(rendering_context, ressource_id, function() {
              $this
                .empty()
                .append(Drupal.dnd.Atoms[ressource_id].contexts[rendering_context])
                .closest('div.form-item')
                .find('input:text')
                .val(ressource_id)
                .end()
                .find('.atom_reference_operations')
                .show();
            });

            // Process atom's operation links (edit and view) rendering
            var $operation_buttons = $this.closest('.form-item')
              .find('.atom_reference_operations').show()
              .find('.buttons');
            $operation_buttons
              .removeClass('ctools-dropbutton')
              .removeClass('ctools-dropbutton-processed')
              .removeClass('ctools-button-processed')
              .find('li.edit, li.view').empty();

            Drupal.dnd.fetchAtom('', ressource_id, function() {
              // Process Edit link
              if ($.grep(Drupal.dnd.Atoms[ressource_id].actions, function(e){ return e == 'edit'; }).length > 0) {
                // Permission granted for edit

                var atom_edit_link = Drupal.settings.basePath + 'atom/' + ressource_id + '/edit/nojs';
                $edit_link_model.clone()
                  .attr('href', atom_edit_link)
                  .appendTo($operation_buttons.find('li.edit'));
                Drupal.behaviors.ZZCToolsModal.attach($operation_buttons);
                $operation_buttons.addClass('ctools-dropbutton');
              }

              // Process View link
              if ($.grep(Drupal.dnd.Atoms[ressource_id].actions, function(e){ return e == 'view'; }).length > 0) {
                // Permission granted for view

                var atom_view_link = Drupal.settings.basePath + 'atom/' + ressource_id;
                $view_link_model.clone()
                  .attr('href', atom_view_link)
                  .appendTo($operation_buttons.find('li.view'));
                $operation_buttons.addClass('ctools-dropbutton')
              }

              Drupal.attachBehaviors($operation_buttons);
            });
          }
          else {
            var placeholder = Drupal.t("You can't drop a resource of type %type in this field", {'%type': ret.type});
            $this.empty().append(placeholder);
          }
          e.stopPropagation();
          e.preventDefault();

          return false;
        })
        .closest('div.form-item')
        .find('input')
        .css('display', 'none')
        .end()
        .append($operation_wrapper);
    });
  }
}

if (!Drupal.atom_reference) {
  Drupal.atom_reference = {};
  Drupal.atom_reference.droppable = function(ressource_id, field) {
    var retVal = {'keepgoing': true, 'found': true};
    if (Drupal.dnd.Atoms[ressource_id]) {
      var type = Drupal.dnd.Atoms[ressource_id].meta.type;
      var accept = $(field).closest('div.form-item').find('input:text').data('types').split(',');
      if (jQuery.inArray(type, accept) == -1) {
        retVal.keepgoing = false;
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
