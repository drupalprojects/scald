(function ($) {
  Drupal.behaviors.dndModal= {
    attach: function (context, settings) {
      $('#edit-next', context).click(function(e) {
        var form = $('#scald-atom-add-form-add');
        if (form.find('.plupload-element').length > 0) {
          var uploader = form.find('.plupload-element').first().pluploadQueue();
          if ((uploader.total.uploaded + uploader.total.failed) != uploader.files.length || uploader.files.length == 0) {
            uploader.start();
            uploader.bind('UploadComplete', function() {
              setTimeout(function(){
                $('#edit-next', context).click();
              },500);
            });
            return false;
          }
        }
        else if (form.find('.form-managed-file')) {
          var file = form.find('.form-managed-file').first();
          var name = file.attr('id').substr(5).replace('-', '_');
          if (file.find("[name='" + name + "[fid]']").val() == 0) {
            return false;
          }
        }
      });
    }
  };
})(jQuery);

