<?php foreach ($library_items as $id => $item): ?>
  <div class="editor-item" id="sdl-<?php print $id; ?>">
    <?php print $item; ?>
  </div>
<?php endforeach; ?>
<?php if (count($library_items) == 0) : ?>
  <div class='editor-item'>
    Aucune ressource trouvée
  </div>
<?php endif; ?>
