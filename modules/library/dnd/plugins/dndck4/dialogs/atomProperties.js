(function($) {

CKEDITOR.dialog.add('atomProperties', function(editor) {
  var lang = editor.lang.dndck4;

  Drupal.dndck4.registeredOptions = [];

  function showHideOptions(ctx) {
    var dialog = ctx.getDialog(),
      context = ctx.getValue(),
      config = Drupal.settings.dnd.contexts_config[context],
      widget = editor.widgets.focused,
      atom = Drupal.dnd.Atoms[widget.data.sid],
      type = atom.meta.type,
      provider = atom.meta.provider,
      states=[];

    var registeredOptions = Drupal.dndck4.registeredOptions;

    $.each(registeredOptions, function(){
      states[this.id] = false;
    });
    $.each(registeredOptions, function(){
      // Check provider
      if (this.mode == 'atom' && this.name == provider) {
        states[this.id] = true;
        //console.log(this.id+' handled by '+provider+' '+type+' provider');
      }
      // check player
      else if (this.mode == 'player' && this.type == type && this.name == config.player[type]['*']) {
        states[this.id] = true;
        //console.log(this.id+' handled by '+config.player[type]['*']+' '+this.type+' player');
      }
      // check context
      else if (this.mode == 'context' && this.type == type && this.name == context) {
        states[this.id] = true;
        //console.log(this.id+' handled by context '+context);
      }
      //else console.log(this.id+' not handled');
    });
    $.each(registeredOptions, function(){
      if (states[this.id]) {
        dialog.getContentElement('info', this.id).getElement().show();
      }
      else {
        dialog.getContentElement('info', this.id).getElement().hide();
      }
    });
  }

  return {
    title: lang.atom_properties,
    minWidth: 420,
    minHeight: 360,
    contents: [
      {
        id: 'info',
        label: '',
        title: '',
        expand: true,
        padding: 0,
        elements: [
          {
            id: 'cmbContext',
            type: 'select',
            label: lang.properties_context,
            items: [],
            setup: function(widget) {
              // Populate the available context options for the atom type.
              this.clear();
              var type = Drupal.dnd.Atoms[widget.data.sid].meta.type;
              for (var context in Drupal.settings.dnd.contexts[type]) {
                this.add(Drupal.settings.dnd.contexts[type][context], context);
              }
              this.setValue(widget.data.context);
            },
            onChange: function(ev){
              showHideOptions(this);
            },
            commit: function(widget) {
              widget.setData('context', this.getValue());
            }
          },
          {
            id: 'cmbAlign',
            type: 'select',
            label: lang.properties_alignment,
            items: [ [lang.alignment_none, 'none'],
                     [lang.alignment_left, 'left'],
                     [lang.alignment_right, 'right'],
                     [lang.alignment_center, 'center'] ],
            setup: function(widget) {
              this.setValue(widget.data.align);
            },
            commit: function(widget) {
              widget.setData('align', this.getValue());
            }
          },
          {
            id: 'chkCaption',
            type: 'checkbox',
            label: lang.properties_has_caption,
            setup: function(widget) {
              this.setValue(widget.data.usesCaption);
            },
            commit: function(widget) {
              widget.setData('usesCaption', this.getValue());
            }
          }
        ]
      }
    ]
  };
});

})(jQuery);
