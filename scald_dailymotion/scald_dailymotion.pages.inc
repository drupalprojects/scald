<?php
// $Id$
/**
 * @file
 *   Contains form handlers for the DailyMotion search form.
 */

/**
 * Generates the search and search results form.
 */
function scald_dailymotion_search_form($form_state) {
  $terms = $form_state['storage']['terms'];
  $form = array();
  $form['search'] = array(
    '#type' => 'fieldset',
    '#tree' => TRUE,
    '#attributes' => array('class' => 'container-inline')
  );
  $form['search']['search_term'] = array(
    '#type' => 'textfield',
    '#title' => t('Terms'),
    '#default_value' => $terms
  );
  $form['search']['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Search'),
    '#submit' => array('scald_dailymotion_search_form_search_submit')
  );
  if (!empty($terms)) {
    $form['results'] = array(
      '#type' => 'fieldset',
      '#title' => t('Search results'),
      '#tree' => TRUE,
      '#theme' => 'scald_dailymotion_search_results_table'
    );
    $items = scald_dailymotion_feed('search', $terms);
    if (count($items)) {
      foreach ($items as $video) {
        $thumb = str_replace('large', 'small', $video->thumbnail['src']);
        $form['results'][$video->id] = array(
          'checkbox' => array(
            '#type' => 'checkbox',
          ),
          'title' => array(
            '#type' => 'item',
            '#value' => $video->title
          ),
          'thumbnail' => array(
            '#type' => 'markup',
            '#value' => theme('image', $thumb, '', '', NULL, FALSE)
          )
        );
      }
      $form['import'] = array(
        '#type' => 'submit',
        '#value' => t('Import'),
        '#submit' => array('scald_dailymotion_search_form_submit')
      );
    }
    else {
      $form['results']['empty'] = array(
        '#type' => 'markup',
        '#value' => t('No results')
      );
    }
  }
  return $form;
}

/**
 * Handles search terms form submission.
 */
function scald_dailymotion_search_form_search_submit($form, &$form_state) {
  if ($form_state['clicked_button']['#value'] == t('Search')) {
    $form_state['storage']['terms'] = $form_state['values']['search']['search_term'];
  }
}

/**
 * Handlers import form submission.
 */
function scald_dailymotion_search_form_submit($form, &$form_state) {
  $ids = array();
  // Find all the elements that have been checked in the results table
  foreach ($form_state['values']['results'] as $id => $element) {
    if ($element['checkbox']) {
      $ids[] = $id;
    }
  }
  // And now create an atom for each of them
  foreach ($ids as $id) {
    $sid = scald_dailymotion_register($id);
    $video = scald_fetch($sid);
    drupal_set_message(t('Created video %title', array('%title' => $video->title)));
  }
  // End the multistep workflow
  unset($form_state['storage']);
  $form_state['rebuild'] = FALSE;
}

/**
 * Themes the results table.
 */
function theme_scald_dailymotion_search_results_table($form) {
  $headers = array(t('Import'), t('Title'), t('Thumbnail'));
  $rows = array();
  foreach (element_children($form) as $key) {
    // Render our row
    $row = array();
    $row[] = drupal_render($form[$key]['checkbox']);
    $row[] = drupal_render($form[$key]['title']);
    $row[] = drupal_render($form[$key]['thumbnail']);
    // And add it to the list of table rows.
    $rows[] = $row;
  }
  return theme('table', $headers, $rows);
}
