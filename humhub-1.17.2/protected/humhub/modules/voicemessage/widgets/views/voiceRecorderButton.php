<?php
// protected/modules/voicemessage/widgets/views/voiceRecorderButton.php

use yii\helpers\Html;
use humhub\modules\voicemessage\assets\VoiceRecorderAsset;

/* @var $id string */
/* @var $tooltip string */
/* @var $cssButtonClass string */
VoiceRecorderAsset::register($this);

?>

<div class="voice-recorder-container">
    <?= Html::beginTag('button', [
        'id' => $id . '-record',
        'class' => 'btn ' . $cssButtonClass . ' voice-record-btn',
        'type' => 'button',
        'title' => $tooltip,
        'data-toggle' => 'tooltip',
        'data-placement' => 'top',
        'data-progress' => $progress, // Ajout de l'attribut data pour le JS
        'data-preview' => $preview,   // Ajout de l'attribut data pour le JS
    ]) ?>
        <i class="fa fa-microphone" aria-hidden="true"></i>
        <span class="sr-only"><?= $tooltip ?></span>
    <?= Html::endTag('button') ?>
    
    <?= Html::beginTag('button', [
        'id' => $id . '-stop',
        'class' => 'btn btn-danger btn-sm voice-stop-btn',
        'type' => 'button',
        'title' => 'Arrêter l\'enregistrement',
        'style' => 'display:none;',
        'data-toggle' => 'tooltip',
        'data-placement' => 'top'
    ]) ?>
        <i class="fa fa-stop" aria-hidden="true"></i>
        <span class="sr-only">Arrêter l'enregistrement</span>
    <?= Html::endTag('button') ?>
 
    <div id="<?= $id ?>-indicator" class="voice-recording-indicator" style="display:none;">
   <svg xmlns="http://www.w3.org/2000/svg" class="microphone-icon" viewBox="0 0 24 24" fill="#e04040">
    <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z"/>
    <path d="M19 11v1a7 7 0 0 1-14 0v-1H3v1a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-1z"/>
  </svg>
    
        <span id="<?= $id ?>-timer" class="voice-indicator-timer">00:00</span>
    </div>
    
    <!-- <div id="<?= $id ?>-progress" class="voice-upload-progress" style="display:none;">
        <div class="progress">
            <div class="progress-bar" role="progressbar" style="width: 0%"></div>
        </div>
    </div> -->
</div>

