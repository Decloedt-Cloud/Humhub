<?php
/**
 * This file provides to overwrite the default HumHub / Yii configuration by your local common (Console and Web) environments
 * @see http://www.yiiframework.com/doc-2.0/guide-concept-configurations.html
 * @see https://docs.humhub.org/docs/admin/advanced-configuration
 */
return [
    'components' => [
        'authClientCollection' => [
            'clients' => [
                'jwt' => [
                    'class' => 'humhub\modules\sso\jwt\authclient\JWT',
             
                    // 🔐 Ton secret partagé (le même que dans Wayo)
                    'sharedKey' => 'Pz-UpjQKoCU_ETNpiwcoZB_C7L7cnVLFGvMbXmk4JfrBpff3DbYZcX2rSUAihZ8f7UGyOOIBz1kA4xbRzfphp1',
                
                    // 🌐 URL de ton app Wayo si tu veux un bouton de redirection (facultatif)
                   // 'url' => 'http://localhost/School-Management-De',
                   
                     'url'=> 'http://localhost/humhub/humhub-1.17.2',
                    // 🏷️ Titre affiché si le bouton SSO est visible
                   // 'title' => 'ddd Wayo',

                    // ⚡ Login auto si IP autorisée
                    'autoLogin' => true,

                    // (Optionnel) IP autorisées pour l’autologin
                   // 'allowedIPs' => ['127.0.0.1', '192.168.1.*'], ca cousé l'affichage du page login
                    /*Comportement avec allowedIPs activé:
                    Si l'adresse IP du visiteur est dans la liste: l'autologin est autorisé
                    Si l'adresse IP du visiteur n'est pas dans la liste: HumHub affiche la page de connexion par mesure de sécurité, même avec un token JWT valide*/
                    
                    // ⏱ Marge de tolérance (en secondes)
                    'leeway' => 660,

                    // 🔐 Algorithmes JWT supportés
                    'supportedAlgorithms' => ['HS256'],
                   
                ],
            ],
        ],
        
        // Configuration de l'URL Manager (déjà présente)
        'urlManager' => [
            'showScriptName' => false,
            'enablePrettyUrl' => true,
        ],

       'session' => [
            'cookieParams' => [
                'sameSite' => 'None', // Autorise les cookies dans les iframes
                'secure' => true,      // Nécessaire si en HTTPS
            ],
        ],
        
    ]
];
