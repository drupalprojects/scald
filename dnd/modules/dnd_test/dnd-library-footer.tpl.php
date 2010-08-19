<div class="footer">
  <div class="pager">
    <ul>
      <?php for ($i=1; $i < 6; $i++) {
        $opts = array('query' => array('page' => $i));
        if ($page == $i) {
          $opts['class'] = 'active';
        };
        print l($i, 'dnd-test/library', $opts) .' ';
      } ?>
    </ul>
  </div>
</div>
