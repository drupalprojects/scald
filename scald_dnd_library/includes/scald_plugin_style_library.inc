<?php
// $Id$
/**
 * @file
 *   Provides the library style plugin. Ideally, this shouldn't be needed,
 *   but I haven't figured out a cleaner way to do this yet.
 */
class scald_plugin_style_library extends views_plugin_style {
  function option_definition() {
    $options = parent::option_definition();

    $options['default'] = array('default' => 'sid');
    $options['override'] = array('default' => TRUE);
    $options['order'] = array('default' => 'desc');

    return $options;
  }

  function build_sort() {
    return FALSE;
  }

  function build_sort_post() {
    $this->options['default'] = 'sid';
    $this->options['order'] = 'desc';
    if (!isset($_GET['order'])) {
      // check for a 'default' clicksort. If there isn't one, exit gracefully.
      if (empty($this->options['default'])) {
        return;
      }
      $sort = $this->options['default'];
      $this->order = !empty($this->options['order']) ? $this->options['order'] : 'desc';
    }
    else {
      $sort = $_GET['order'];
      // Store the $order for later use.
      $this->order = !empty($_GET['sort']) ? strtolower($_GET['sort']) : 'desc';
    }

    // If a sort we don't know anything about gets through, exit gracefully.
    if (empty($this->view->field[$sort])) {
      return;
    }

    // Ensure $this->order is valid.
    if ($this->order != 'asc' && $this->order != 'desc') {
      $this->order = 'desc';
    }

    // Store the $sort for later use.
    $this->active = $sort;

    // Tell the field to click sort.
    $this->view->field[$sort]->click_sort($this->order);
    return;
  }
}
