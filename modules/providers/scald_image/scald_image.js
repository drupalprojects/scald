(function ($) {
  Drupal.behaviors.scaldImage = {
    attach: function (context, settings) {
      $('body').once('scald-image', function() {
        if (typeof CKEDITOR !== 'undefined') {
          CKEDITOR.on('dialogDefinition', function(ev) {
            if (typeof Drupal.dndck4 !== 'undefined') {
              if (ev.data.name == 'atomProperties') {
                var dialogDefinition = ev.data.definition;
                var infoTab = dialogDefinition.getContents( 'info' );

                infoTab.add( {
                  id: 'txtLink',
                  type: 'text',
                  label: 'Link',
                  onLoad: function() {
                    Drupal.dndck4.registeredOptions.push({id: this.id, type: 'image', mode: 'atom', name: 'scald_image'});
                  },
                  // "Link" edits the 'link' property in the options JSON string.
                  setup: function(widget) {
                    var options = JSON.parse(widget.data.options);
                    this.setValue(options.link);
                  },
                  commit: function(widget) {
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
                });
              }
            }
          });
        }
      });
    }
  };
})(jQuery);
