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
      var data, sid, context, options, legend;
      // Get the data directly from the comment markup.
      data = Drupal.dnd.atomCurrent.getChild(0).getHtml()
        .replace(/<!--\{cke_protected\}\{C\}([\s\S]+?)-->.*/, function(match, data) {
          return decodeURIComponent(data);
        })
        .replace(/^<!--\s+scald=(.+?)\s+-->$/, '$1');
      legend = Drupal.dnd.atomCurrent.getChild(1);
      legend = legend ? legend.getHtml().replace( /<!--\{cke_protected\}\{C\}([\s\S]+?)-->/g, function(match, data) {
        return decodeURIComponent(data);
      }).trim() : false;

      sid = data.split(':', 1)[0];
      context = data.substr(sid.length + 1).split(' ', 1)[0];
      options = (data.length > sid.length + context.length + 2) ? JSON.parse(data.substr(sid.length + context.length + 2)) : {link: ''};

      atom = {
        sid: sid,
        context: context,
        options: options,
        legend: legend
      };
      this.setupContent(atom);
    },
    onOk: function() {
      Drupal.dnd.Atoms[atom.sid].meta.legend = this.getValueOf('info', 'txtLegend');
      var context = this.getValueOf('info', 'cmbContext');
      atom.options.link = this.getValueOf('info', 'txtLink');
      Drupal.dnd.fetchAtom(context, atom.sid, function() {
        var html = Drupal.theme('scaldEmbed', Drupal.dnd.Atoms[atom.sid], context, atom.options);
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
          },
          // @todo Expose a hook to remove this hardcoded option.
          {
            id: 'txtLink',
            type: 'text',
            label: 'Link',
            setup: function(atom) {
              this.setValue(atom.options.link);
            }
          }
        ]
      }
    ]
  };
});
})(jQuery);
