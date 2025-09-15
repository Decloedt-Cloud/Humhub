<?php
/**
 * Overwrite HumHub / Yii configuration by your local Web environments
 */
use yii\base\Application;

return [
    'components' => [
        'response' => [
            'on beforeSend' => function ($event) {
                unset($event->sender->headers['X-Frame-Options']);
            },
        ],
    ],
    // Ajouter un event global pour changer la langue
    'on beforeRequest' => function ($event) {
        $lang = $_GET['lang'] ?? null;
        if ($lang) {
            Yii::$app->language = $lang;
            Yii::$app->session->set('language', $lang);
        }
    },
];
