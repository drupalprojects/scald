<?php
/**
 * @file
 *   This file contains the various pages related to the creation and
 *   edition of the atoms entities.
 */

function scald_atom_add_form($form, $form_state, $type) {
  $form = array();

  $form['actions'] = array(
    '#type' => 'actions',
  );

  $form['actions']['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Next')
  );

  // Start by getting the list of all the modules that
  // said they can provide this atom type.
  $providers = scald_atom_providers();
  $sources = $providers[$type->type];

  // If there's more than one, provide a choice between
  // them. Otherwise, skip a step and select the only
  // provider upfront.
  if (empty($form_state['storage'])) {
    $form_state['storage']['type'] = $type;
    if (count($sources) < 2) {
      $form_state['storage']['step'] = 1;
      $form_state['storage']['source'] = key($sources);
    }
    else {
      $form_state['storage']['step'] = 0;
    }
  }
  $step = $form_state['storage']['step'];

  switch ($step) {
    case 0:
      $form['source'] = array(
        '#title' => t('Source'),
        '#type' => 'select',
        '#options' => $sources,
        '#description' => t('Please choose the source of your new atom'),
      );

      break;
    case 1:
      // Let the source put the all the fields it needs on this
      // step.
      $source = $form_state['storage']['source'];
      $function = $source . '_scald_add_form';
      if (function_exists($function)) {
        $function($form, $form_state);
      }
      else {
        // TODO: Figure out what should be done here.
        $form['error'] = array(
          '#markup' => 'Importer without form ; does it makes sense ?'
        );
      }
      break;

    case 2:
      $atom = $form_state['storage']['atom'];

      $form['title'] = array(
        '#type' => 'textfield',
        '#title' => t('Title'),
        '#required' => TRUE,
        '#default_value' => $atom->title,
      );

      field_attach_form('scald_atom', $atom, $form, $form_state);

      $form['actions']['submit']['#value'] = t('Save');

      break;

  }
  return $form;
}

/**
 * Handles the submission of the atom add form.
 */
function scald_atom_add_form_submit($form, &$form_state) {
  $step = $form_state['storage']['step'];
  $form_state['rebuild'] = TRUE;

  switch ($step) {
    case 0:
      $form_state['storage']['source'] = $form_state['values']['source'];
      $form_state['storage']['step']++;
      break;

    case 1: 
      // Create the stub atom
      $type = $form_state['storage']['type'];

      $atom = new stdClass();
      $atom->title = '';
      $atom->type = $type->type;
      $atom->provider = $form_state['storage']['source'];

      // Allow the source provider to alter it, filling in
      // defaults value.
      $function = $atom->provider . '_scald_add_form_submit';
      if (function_exists($function)) {
        $function($atom, $form, $form_state);
      }

      // And put it in the form_state
      $form_state['storage']['atom'] = $atom;

      // Finally, mark that we should move on to the next step
      $form_state['storage']['step']++;
      break;

    case 2:
      $form_state['rebuild'] = FALSE;

      $atom = $form_state['storage']['atom'];

      // Let entity add its properties to the atom
      entity_form_submit_build_entity('scald_atom', $atom, $form, $form_state);

      // And save it
      scald_atom_save($atom);

      // Add a message confirming the creation
      drupal_set_message(t('Atom %title, of type %type has been created', array(
        '%title' => $atom->title,
        '%type'  => $atom->type,
      )));

      break;
  }
}
