<?php
/**
 * @file
 *   This file contains the various pages related to the creation and
 *   edition of the atoms entities.
 */

function scald_atom_add_form($form, $form_state, $type) {
  $form = array();
  $atom = new stdClass();
  $atom->type = $type->type;

  $form['title'] = array(
    '#type' => 'textfield',
    '#title' => t('Title')
  );

  $form['actions'] = array(
    '#type' => 'actions',
  );

  $form['actions']['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save')
  );

  field_attach_form('scald_atom', $atom, $form, $form_state);
  return $form;
}
