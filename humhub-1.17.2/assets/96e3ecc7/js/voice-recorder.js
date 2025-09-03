humhub.module('voicemessage', function(module, require, $) {

    var VoiceRecorder = function() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.recordButton = null;
        this.stopButton = null;
        this.indicator = null;
        this.progressBarContainer = null;
        this.progressBar = null;
        this.init();
    };

    VoiceRecorder.prototype.init = function() {
        var that = this;

        $(document).on('click', '.voice-record-btn', function(e) {
            e.preventDefault();
            that.startRecording(this);
        });

        $(document).on('click', '.voice-stop-btn', function(e) {
            e.preventDefault();
            that.stopRecording();
        });
    };

    VoiceRecorder.prototype.startRecording = function(button) {
        var that = this;
        var container = $(button).closest('.voice-recorder-container');

        this.recordButton = container.find('.voice-record-btn');
        this.stopButton = container.find('.voice-stop-btn');
        this.indicator = container.find('.voice-recording-indicator');
        this.progressBarContainer = container.find('.voice-upload-progress');
        this.progressBar = container.find('.voice-upload-progress .progress-bar');

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            module.log.error('Votre navigateur ne supporte pas l\'enregistrement audio');
            return;
        }

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function(stream) {
                that.mediaRecorder = new MediaRecorder(stream);

                that.mediaRecorder.ondataavailable = function(event) {
                    that.audioChunks.push(event.data);
                };

                that.mediaRecorder.onstop = function() {
                    var audioBlob = new Blob(that.audioChunks, { type: 'audio/webm' });
                    that.uploadAudio(audioBlob);
                    that.audioChunks = [];
                    stream.getTracks().forEach(track => track.stop());
                };

                that.mediaRecorder.start();
                that.isRecording = true;

                that.recordButton.hide();
                that.stopButton.show();
                that.indicator.show();
                that.progressBarContainer.hide();
                that.progressBar.css('width', '0%');
            })
            .catch(function(error) {
                console.error('Erreur d\'accès au microphone:', error);
                module.log.error('Impossible d\'accéder au microphone');
            });
    };

    VoiceRecorder.prototype.stopRecording = function() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;

            this.recordButton.show();
            this.stopButton.hide();
            this.indicator.hide();
            this.progressBarContainer.show();
        }
    };

    VoiceRecorder.prototype.uploadAudio = function(audioBlob) {
        var that = this;
        var formData = new FormData();
        formData.append('voiceFile', audioBlob, 'voice_' + Date.now() + '.webm');

        $.ajax({
            url: '/voicemessage/voice/upload',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    $.post('/voicemessage/voice/send-audio', {
                        fileUrl: response.fileUrl,
                        fileName: response.fileName,
                        messageId: $('#message-form').data('message-id') // ✅ ajuste ici si besoin
                    }, function(postResponse) {
                        if (postResponse.success) {
                            module.log.success('Message vocal envoyé dans la conversation');
                            // Optionnel : rafraîchir automatiquement les messages
                            $('.messageEntryContainer').trigger('humhub:content:reload');
                        } else {
                            module.log.error('Erreur lors de l\'envoi du message vocal');
                        }
                    });
                } else {
                    module.log.error('Erreur upload : ' + response.error);
                }

                that.progressBarContainer.hide();
                that.progressBar.css('width', '0%');
            },
            error: function() {
                module.log.error('Erreur lors de l\'upload du fichier audio');
                that.progressBarContainer.hide();
                that.progressBar.css('width', '0%');
            }
        });
    };

    module.export({
        VoiceRecorder: VoiceRecorder,
        init: function() {
            new VoiceRecorder();
        }
    });

});

$(document).ready(function() {
    if (typeof humhub !== 'undefined' && humhub.modules.voicemessage) {
        humhub.modules.voicemessage.init();
    }
});
