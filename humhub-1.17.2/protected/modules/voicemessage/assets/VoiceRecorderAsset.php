<?php
// protected/modules/voicemessage/assets/VoiceRecorderAsset.php

namespace humhub\modules\voicemessage\assets;

use humhub\components\assets\AssetBundle;

class VoiceRecorderAsset extends AssetBundle
{
   public $sourcePath = '@humhub/modules/voicemessage/resources';
    public $js = [
        'js/voicemessage.js'
    ];
     public $css = [
        'css/voiceRecorder.css' // Ajoute ce fichier CSS
    ];
    public $depends = [
        'humhub\assets\AppAsset'
    ];
     // Force la republication en dev pour être sûr du changement
    public $publishOptions = [
        'forceCopy' => true, // à supprimer en production
    ];
}
?>