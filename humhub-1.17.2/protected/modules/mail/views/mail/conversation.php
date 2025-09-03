<?php

use humhub\libs\Html;
use humhub\modules\content\widgets\richtext\AbstractRichTextEditor;
use humhub\modules\file\handler\BaseFileHandler;
use humhub\modules\file\widgets\FileHandlerButtonDropdown;
use humhub\modules\file\widgets\FilePreview;
use humhub\modules\file\widgets\UploadButton;
use humhub\modules\mail\models\forms\ReplyForm;
use humhub\modules\mail\models\Message;
use humhub\modules\mail\widgets\ConversationHeader;
use humhub\modules\mail\widgets\ConversationTags;
use humhub\modules\mail\widgets\MailRichtextEditor;
use humhub\modules\mail\widgets\Messages;
use humhub\modules\ui\form\widgets\ActiveForm;
use humhub\modules\ui\view\components\View;
use humhub\widgets\Button;
use humhub\modules\voicemessage\widgets\VoiceRecorderButton;

/* @var $this View */
/* @var $replyForm ReplyForm */
/* @var $messageCount integer */
/* @var $message Message */
/* @var $fileHandlers BaseFileHandler[] */

?>
<div class="panel panel-default">

    <?php if ($message === null) : ?>

        <div class="panel-body">
            <?= Yii::t('MailModule.base', 'There are no messages yet.'); ?>
        </div>

    <?php else : ?>

        <div id="mail-conversation-header" class="panel-heading">
            <?= ConversationHeader::widget(['message' => $message]) ?>
        </div>

        <?= ConversationTags::widget(['message' => $message]) ?>

        <div class="panel-body">

            <div class="media-list conversation-entry-list">
                <?= Messages::widget(['message' => $message]) ?>
            </div>

        </div>

        <div id="'mail-create-form-<?= $message->id ?>" class="mail-message-form content_create">
            <?php if ($message->isBlocked()) : ?>
                <div class="alert alert-danger">
                    <?= Yii::t('MailModule.base', 'You are not allowed to participate in this conversation. You have been blocked by: {userNames}.', [
                        'userNames' => implode(', ', $message->getBlockerNames())
                    ]); ?>
                </div>
            <?php else : ?>
                <?php $form = ActiveForm::begin(['enableClientValidation' => false, 'acknowledge' => true]) ?>

                <div class="content-create-input-group">
            <div class="input-addon-left"> 
                     <div class="dropup">
                        <button class="btn btn-sm" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <i class="fa fa-plus"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li>
                                <?php $uploadButton =UploadButton::widget([
                                    'id' => 'mail-create-upload-' . $message->id,
                                    'label' => Yii::t('ContentModule.base', 'Attach Files'), // Le texte visible
                                    'options' => ['class' => 'main_mail_upload'],
                                    'progress' => '#mail-create-upload-progress-' . $message->id,
                                    'preview' => '#mail-create-upload-preview-' . $message->id,
                                    'dropZone' => '#mail-create-form-' . $message->id,
                                    'max' => Yii::$app->getModule('content')->maxAttachedFiles,
                                    'cssButtonClass' => 'dropdown-item', // TRÈS IMPORTANT: pour le style du menu
                                ]) ?>
                            </li>
                            <li>
                                <?= FileHandlerButtonDropdown::widget([
                                    'primaryButton' => $uploadButton,
                                    'handlers' => $fileHandlers,
                                    'pullRight' => true,
                                ]) ?>
                            </li>
                        </ul>
                </div>
            </div>
                    <div class="flex-grow-1 mb-0">
                        <?= $form->field($replyForm, 'message')->widget(MailRichtextEditor::class, [
                            'id' => 'reply-' . time(),
                            'layout' => AbstractRichTextEditor::LAYOUT_INLINE,
                        ])->label(false) ?>
                    </div>

                      <div class="input-addon-right">
                            <?php if (Yii::$app->hasModule('voicemessage')) : ?>
                                <?= VoiceRecorderButton::widget([
                                    'id' => 'mail-voice-recorder-' . $message->id,
                                    'tooltip' => 'Enregistrer un message vocal',
                                    'cssButtonClass' => 'btn-sm btn-success me-2',
                                    'progress' => '#mail-create-upload-progress-' . $message->id,
                                    'preview' => '#mail-create-upload-preview-' . $message->id,
                                    
                                ]) ?>
                            <?php endif; ?>

                            <?= Button::info()
                                ->cssClass('reply-button')
                                ->submit()
                                ->action('reply', $replyForm->getUrl())
                                ->icon('paper-plane-o')
                                ->sm() ?>
                     </div>
                </div>
          <div id="mail-create-upload-progress-<?= $message->id ?>" style="display:none;margin:10px 0;"></div>
             <?= FilePreview::widget([
                    'id' => 'mail-create-upload-preview-' . $message->id,
                    'options' => ['style' => 'margin-top:10px;'],
                    'edit' => true,
                ]) ?>

<div id="voice-message-preview-<?= $message->id ?>" class="voice-message-preview" style="margin-top:10px;"></div>
                <?php ActiveForm::end(); ?>
            <?php endif; ?>
    <?php endif; ?>

    <script <?= Html::nonce() ?>>
        humhub.modules.mail.notification.setMailMessageCount(<?= $messageCount ?>);
    </script>
</div>
