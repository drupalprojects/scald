<?php
// @todo [API change] we might want to pass more info into the $item so that in
// tpl we can add more specific class (atom type, for example) to the wrapper
// DIV.
foreach ($library_items as $id => $item): ?>
  <div class="editor-item clear-block" id="sdl-<?php print $id; ?>">
    <?php print $item; ?>
  </div>
<?php endforeach; ?>
<?php if (count($library_items) == 0) : ?>
  <div class='editor-item'>
    Aucune ressource trouvée
  </div>
<?php endif; ?>
