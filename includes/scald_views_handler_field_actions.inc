<?php
/**
 * @file
 *   Provides a field containing the actions allowed for the current user on an atom
 */
class scald_views_handler_field_actions extends views_handler_field {
  /**
   * Renders the atom according in the context specified in the option form.
   */
  function render($values) {
    $actions = scald_actions();
    $supported_actions = array('view', 'edit');

    $atom = scald_fetch($values->sid);
    $current_actions = scald_user_actions($atom);

    $links = array();
    foreach ($actions as $action => $details) {
      if(in_array($action, $supported_actions) && ($current_actions & $details['bitmask'])) {
        $links[$action] = array(
          'title' => $details['title'],
          'href' => 'atoms/' . $action . '/' . $atom->sid,
          'query' => drupal_get_destination(),
          'attributes' => array(),
        );
      }
    }

    $content = array(
      '#theme' => 'links',
      '#links' => $links,
      '#attributes' => array('class' => array('links', 'inline')),
    );
    return $content;
  }
}
