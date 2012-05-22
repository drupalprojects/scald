<?php
/**
 * Filter by node type
 */
class scald_views_handler_filter_atom_provider extends views_handler_filter_in_operator {
  function get_value_options() {
    if (!isset($this->value_options)) {
      $this->value_title = t('Atom provider');
      $providers = array();
      $types = scald_types();
      foreach ($types as $type) {
        foreach ($type['atom_providers'] as $provider) {
          if (!isset($providers[$provider])) {
            $providers[$provider] = $provider;
          }
        }
      }
      //$providers = variable_get('scald_providers', array());
      foreach ($providers as $provider) {
        $options[$provider] = $provider;
      }
      $this->value_options = $options;
    }
  }
}
