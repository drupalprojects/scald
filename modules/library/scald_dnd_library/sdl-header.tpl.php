<div class='header'>
  <h3><?php print t('Library: Page @count', array('@count' => $page)); ?></h3>
  <div class='view-filters'>
    <a class="popups" href="<?php print url('node/add/rf-ressource-image') ?>">+ image</a>
    <a class="popups" href="<?php print url('node/add/rf-ressource-son') ?>">+ son</a>
    <a class="popups" href="<?php print url('node/add/rf-ressource-video') ?>">+ vidéo</a>
  </div>
  <div class='view-filters'>
    <?php print $form; ?>
  </div>
</div>
