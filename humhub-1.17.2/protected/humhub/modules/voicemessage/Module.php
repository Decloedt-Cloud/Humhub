<?php
// protected/modules/voicemessage/Module.php

namespace humhub\modules\voicemessage;

use humhub\components\Module as BaseModule;

class Module extends BaseModule
{
    /**
     * L'ID du module (obligatoire pour éviter l'erreur de configuration).
     */
    public $id = 'voicemessage';

    /**
     * @inheritdoc
     */
    public $resourcesPath = 'resources';


    /**
     * @inheritdoc
     */
    public function disable()
    {
        // Cleanup when module is disabled
        parent::disable();
    }

    /**
     * @inheritdoc
     */
    public function enable()
    {
        parent::enable();
    }
    
}
