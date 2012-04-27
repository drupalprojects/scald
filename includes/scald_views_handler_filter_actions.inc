<?php
/**
 * @file
 *   Provides a Views filter handler allowing to restrict the results to
 *   atoms the user can interact with.
 */
class scald_views_handler_filter_actions extends views_handler_filter {
  /**
   * Overrides operator_form: hardcode our bitwise AND, and tells Views
   * that this filter doesn't expose an operator.
   */
  function operator_form(&$form, &$form_state) {
    $this->no_operator = TRUE;
    $form['operator'] = array(
      '#type' => 'value',
      '#value' => '&'
    );
  }

  /**
   * Overrides value_form: provides checkboxes for the defined actions.
   */
  function value_form(&$form, &$form_state) {
    // First, get the config
    $config = variable_get('scald_config', 0);
    // And prepare our default, the value needs to be reformated for FAPI
    // to deal with it correctly.
    $defaults = array();
    foreach ($config->actions as $slug => $action) {
      $options[$slug] = $action['title'];
      $defaults[$slug] = ($this->options['value'] & $action['mask']) ? $slug : '';
    }
    // And now, we just need to add our select item with the values
    // we've prepared above.
    $form['value'] = array(
      '#title' => t('Actions'),
      '#type' => 'checkboxes',
      '#options' => $options,
      '#default_value' => $defaults
    );
  }

  /**
   * Overrides value_submit: translate the checkboxes to a bitmask.
   */
  function value_submit(&$form, &$form_state) {
    $config = variable_get('scald_config', 0);
    $mask = 0;
    foreach ($form_state['values']['options']['value'] as $value) {
      if (!empty($value)) {
        $mask += $config->actions[$value]['mask'];
      }
    }
    $form_state['values']['options']['value'] = $mask;
  }

  /**
   * Overrides query: change the operator before querying.
   */
  function query() {
    $this->operator = ' & '. $this->options['value'] . ' = ';
    parent::query();
  }
}
