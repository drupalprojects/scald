<h3><?php print t('Test library: Page @page', array('@page' => $page)); ?></h3>

<div class="view-filters">
  <form method="get" action="/" id="test-form">
    <div><label for="test-form-page">Page:</label> <input type="text" id="test-form-page" name="test-form-page" /></div>
    <div><input type="submit" id="test-form-submit" value="Switch page" /></div>
  </form>
</div>

