<?php
/**
 * Filter by node type
 */
class scald_views_handler_filter_atom_type extends views_handler_filter_in_operator {
  function get_value_options() {
    if (!isset($this->value_options)) {
      $this->value_title = t('Atom type');
      //$types = node_get_types();
      $types = scald_types();
      foreach ($types as $type => $info) {
        $options[$type] = t($info->title);
      }
      $this->value_options = $options;
    }
  }
}
