(function($) {
CKEDITOR.dialog.add('atomProperties', function(editor) {
  var lang = editor.lang.dnd, element, atom, cmbContext = [];
  for (context in Drupal.settings.dnd.contexts) {
    cmbContext.push([Drupal.settings.dnd.contexts[context], context]);
  }

  return {
    title: lang.atom_properties,
    minWidth: 420,
    minHeight: 360,
    onShow: function() {
      if (!Drupal.dnd.atomCurrent) {
        this.hide();
        // If the library is hidden, show it
        if ($('.dnd-library-wrapper').length && !$('.dnd-library-wrapper').hasClass('library-on')) {
          $('.dnd-library-wrapper .scald-anchor').click();
        }
        else {
          alert(lang.atom_none);
        }
        return;
      }
      var data;
      data = decodeURIComponent(Drupal.dnd.atomCurrent.data('scald')).match(/(\d+):([^:]+)([\s\S]*)$/);
      atom = {
        sid: data[1],
        context: data[2],
        legend: data[3].substr(1).trim()
      };
      this.setupContent(atom);
    },
    onOk: function() {
      Drupal.dnd.Atoms[atom.sid].meta.legend = this.getValueOf('info', 'txtLegend');
      var context = this.getValueOf('info', 'cmbContext');
      Drupal.dnd.fetchAtom(context, atom.sid, function() {
        var html = Drupal.theme('scaldEmbed', Drupal.dnd.Atoms[atom.sid], context);
        // Remove the first 13 characters '<p>&nbsp;</p>'
        CKEDITOR.dom.element.createFromHtml(html.substr(13)).replace(Drupal.dnd.atomCurrent);
      });
    },
    contents: [
      {
        id: 'info',
        label: '',
        title: '',
        expand: true,
        padding: 0,
        elements: [
          {
            id: 'txtLegend',
            type: 'textarea',
            rows: 5,
            label: 'Legend',
            setup: function(atom) {
              this.setValue(atom.legend);
            }
          },
          {
            id: 'cmbContext',
            type: 'select',
            label: 'Context',
            items: cmbContext,
            setup: function(atom) {
              this.setValue(atom.context);
            }
          }
        ]
      }
    ]
  };
});
})(jQuery);
