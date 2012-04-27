<div class="footer">
  <div class="pager">
    <ul>
      <?php
      for ($i=0; $i < ceil($count / SCALD_DND_LIBRARY_PAGE_SIZE); $i++) {
        $args = (array)$_GET;
        unset($args['q']);
        $args['page'] = $i;
        $opts = array('query' => $args);
        if ($page == $i) {
          $opts['class'] = 'active';
        };
        print l($i + 1, 'sdl-library/library', $opts) .' ';
      } ?>
    </ul>
  </div>
</div>
