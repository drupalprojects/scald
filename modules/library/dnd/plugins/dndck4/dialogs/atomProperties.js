(function($) {

CKEDITOR.dialog.add('atomProperties', function(editor) {
  var lang = editor.lang.dndck4;

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
          },
          // @todo Expose a hook to remove this hardcoded option.
          {
            id: 'txtLink',
            type: 'text',
            label: 'Link',
            // "Link" edits the 'link' property in the options JSON string.
            setup: function(widget) {
              if (Drupal.dnd.Atoms[widget.data.sid].meta.type === 'image') {
                this.getElement().show();
                var options = JSON.parse(widget.data.options);
                this.setValue(options.link);
              }
              else {
                this.disable();
                this.getElement().hide();
              }
            },
            commit: function(widget) {
              if (Drupal.dnd.Atoms[widget.data.sid].meta.type === 'image') {
                // Copy the current options into a new object,
                var options = JSON.parse(widget.data.options);
                var value = this.getValue();
                if (value != '') {
                  options.link = value;
                }
                else {
                  delete options.link;
                }
                widget.setData('options', JSON.stringify(options));
              }
            }
          }
        ]
      }
    ]
  };
});

})(jQuery);
