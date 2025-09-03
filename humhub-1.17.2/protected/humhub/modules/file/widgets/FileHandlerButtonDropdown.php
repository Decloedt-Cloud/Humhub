<?php

/**
 * @link https://www.humhub.org/
 * @copyright Copyright (c) 2017 HumHub GmbH & Co. KG
 * @license https://www.humhub.com/licences
 */

namespace humhub\modules\file\widgets;

use humhub\components\Widget;
use humhub\libs\Html;
use humhub\modules\file\handler\BaseFileHandler;
use yii\helpers\ArrayHelper;

/**
 * FileHandlerButtonWidget shows a dropdown with different file handlers
 *
 * @since 1.2
 * @author Luke
 */
class FileHandlerButtonDropdown extends Widget
{
    /**
     * @var string the primary button html code, if not set the first handler will be used
     */
    public $primaryButton;

    /**
     * @var string the default parent css class
     * You can make the menu drop up by replacing it with 'btn-group dropup'
     */
    public $cssClass = 'btn-group';

    /**
     * @var string the default css bootstrap button class
     */
    public $cssButtonClass = '';

    /**
     * @var BaseFileHandler[] the handlers to show
     */
    public $handlers;

    /**
     * @var bool if true the dropdown-menu will be assigned with an dropdown-menu-right class.
     */
    public $pullRight = false;

    /**
     * @inheritdoc
     */
public function run()
{
    if (!$this->primaryButton && empty($this->handlers)) {
        return;
    }

    $output = Html::beginTag('div', ['class' => $this->cssClass]);

    // Affiche le bouton principal s'il est défini
    if ($this->primaryButton) {
        $output .= $this->primaryButton;
    } elseif (!empty($this->handlers)) {
        // Si pas de primaryButton, on prend le premier handler
        $firstButton = array_shift($this->handlers)->getLinkAttributes();
        Html::addCssClass($firstButton, ['btn', $this->cssButtonClass]);
        $output .= $this->renderLink($firstButton);
    }
    foreach ($this->handlers as $handler) {
        $buttonOptions = $handler->getLinkAttributes();
        Html::addCssClass($buttonOptions, ['btn', $this->cssButtonClass, 'ms-1']); // 'ms-1' pour espacer les boutons
        $output .= $this->renderLink($buttonOptions);
    }

    $output .= Html::endTag('div');

    return $output;
}


    /**
     * Renders the file handle link
     *
     * @param array $options the HTML options
     * @return string the rendered HTML tag
     */
    protected function renderLink($options)
    {

        $options['data-action-process'] = 'file-handler';

        $label = ArrayHelper::remove($options, 'label', 'Label');

        if (isset($options['url'])) {
            $url = ArrayHelper::remove($options, 'url', '#');
            $options['href'] = $url;
        }

        return Html::tag('a', $label, $options);
    }

}
