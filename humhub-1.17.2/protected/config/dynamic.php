<?php return array (
  'components' => 
  array (
    'db' => 
    array (
      'class' => 'yii\\db\\Connection',
      'dsn' => 'mysql:host=localhost;dbname=humhub_local',
      'username' => 'root',
      'password' => '',
    ),
    'user' => 
    array (
    ),
    'mailer' => 
    array (
      'transport' => 
      array (
        'dsn' => 'native://default',
      ),
    ),
    'cache' => 
    array (
      'class' => 'yii\\caching\\FileCache',
      'keyPrefix' => 'humhub',
    ),
  ),
  'params' => 
  array (
    'installer' => 
    array (
      'db' => 
      array (
        'installer_hostname' => 'localhost',
        'installer_database' => 'humhub_local',
      ),
    ),
    'config_created_at' => 1746789090,
    'horImageScrollOnMobile' => 1,
    'databaseInstalled' => true,
    'installed' => true,
  ),
  'name' => 'Wayo Academy',
); ?>