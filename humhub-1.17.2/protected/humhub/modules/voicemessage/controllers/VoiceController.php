<?php
// protected/modules/voicemessage/controllers/VoiceController.php

namespace humhub\modules\voicemessage\controllers;

use humhub\components\Controller;
use Yii;
use yii\web\Response;
use yii\web\UploadedFile;
use humhub\modules\file\models\FileUpload; 
class VoiceController extends Controller
{
    public function actionUpload()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;
                sleep(2); // Pause for 2 seconds. You can change this value (e.g., sleep(3) for 3 seconds)

        $uploadedFile = UploadedFile::getInstanceByName('voiceFile');
        
        if ($uploadedFile === null) {
            return ['success' => false, 'error' => 'Aucun fichier reçu'];
        }
        
        // Vérifier le type de fichier
        $allowedTypes = ['audio/webm', 'audio/wav', 'audio/ogg', 'audio/mp3'];
        if (!in_array($uploadedFile->type, $allowedTypes)) {
            return ['success' => false, 'error' => 'Type de fichier non autorisé'];
        }
        
        // Vérifier la taille (max 10MB)
        if ($uploadedFile->size > 10 * 1024 * 1024) {
            return ['success' => false, 'error' => 'Fichier trop volumineux'];
        }
        
    try {
            // Utiliser le modèle FileUpload de HumHub pour gérer l'upload
            $file = new FileUpload();
            $file->setUploadedFile($uploadedFile, 'voicemessage_audio_' . time() . '_' . Yii::$app->user->id . '.webm');
            
            if ($file->save()) {
                // Générer une URL accessible
                $fileUrl = $file->getUrl();
                
                return [
                    'success' => true,
                    'fileUrl' => $fileUrl,
                    'fileName' => $file->file_name,
                    'guid' => $file->guid, // Utiliser le guid généré par HumHub
                ];
            }else {
                return ['success' => false, 'error' => 'Erreur lors de la sauvegarde'];
            }
        } catch (\Exception $e) {
            Yii::error('Erreur upload vocal: ' . $e->getMessage());
            return ['success' => false, 'error' => 'Erreur serveur: ' . $e->getMessage()];
        }
    }
   public function actionDelete()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;
        
        $guid = Yii::$app->request->post('guid'); // Utiliser guid au lieu de fileName
        if (empty($guid)) {
            return ['success' => false, 'error' => 'GUID manquant'];
        }
        
        try {
            $file = FileUpload::findOne(['guid' => $guid]);
            if ($file && $file->created_by === Yii::$app->user->id) {
                if ($file->delete()) {
                    return ['success' => true, 'message' => 'Fichier supprimé avec succès'];
                } else {
                    return ['success' => false, 'error' => 'Impossible de supprimer le fichier'];
                }
            } else {
                return ['success' => false, 'error' => 'Fichier non trouvé ou non autorisé'];
            }
        } catch (\Exception $e) {
            Yii::error('Erreur suppression fichier vocal: ' . $e->getMessage());
            return ['success' => false, 'error' => 'Erreur serveur: ' . $e->getMessage()];
        }
    }
}
/*Utilisation de FileUpload au lieu de File : Remplace File par FileUpload, 
qui inclut la méthode setUploadedFile() pour gérer l'upload correctement.
HumHub a son propre système de gestion de fichiers (via le module file), qui stocke les fichiers dans un emplacement 
prédéfini (généralement uploads/files)et les associe à des métadonnées (comme le guid, l'utilisateur créateur, etc.).
*/