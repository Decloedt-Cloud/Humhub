<?php
// protected/modules/voicemessage/widgets/VoiceRecorderButton.php

namespace humhub\modules\voicemessage\widgets;

use humhub\components\Widget;
use humhub\modules\voicemessage\assets\VoiceRecorderAsset;
use yii\helpers\Html;

class VoiceRecorderButton extends Widget
{
    public $id = 'voice-recorder';
    public $tooltip = 'Enregistrer un message vocal';
    public $cssButtonClass = 'btn-sm btn-primary';
      public $progress;
       public $preview;  // Sélecteur pour la prévisualisation
    public function run()
    {
        VoiceRecorderAsset::register($this->getView());
        return $this->render('voiceRecorderButton', [
            'id' => $this->id,
            'tooltip' => $this->tooltip,
            'cssButtonClass' => $this->cssButtonClass,
            'progress' => $this->progress,
            'preview' => $this->preview,
            
        ]);
    }
}
?>