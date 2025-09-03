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
                that.progressBarContainer.hide(); // Reset just in case
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
            this.progressBarContainer.show(); // 👈 Affiche bien le conteneur
        }
    };

    VoiceRecorder.prototype.uploadAudio = function(audioBlob) {
        var that = this;
        var formData = new FormData();
        formData.append('voiceFile', audioBlob, 'voice_' + Date.now() + '.webm');

        $.ajax({
            url: '/social-voicemessage/humhub-1.17.2/upload/file',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            xhr: function() {
                var xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener('progress', function(e) {
                    if (e.lengthComputable) {
                        var percentComplete = (e.loaded / e.total) * 100;
                        console.log('Progress:', percentComplete + '%');

                        if (that.progressBar.length > 0) {
                            that.progressBar.css('width', percentComplete + '%');
                        }
                    }
                });
                return xhr;
            },
            success: function(response) {
                if (response.success) {
                    that.insertAudioIntoMessage(response.fileUrl, response.fileName);
                } else {
                    module.log.error('Erreur lors de l\'upload du fichier audio');
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

    VoiceRecorder.prototype.insertAudioIntoMessage = function(fileUrl, fileName) {
        var audioHtml = '<div class="voice-message-container">' +
            '<audio controls class="voice-message-audio">' +
            '<source src="' + fileUrl + '" type="audio/webm">' +
            'Votre navigateur ne supporte pas l\'audio.' +
            '</audio>' +
            '<div class="voice-message-info">' +
            '<i class="fa fa-microphone"></i> ' + fileName +
            '</div>' +
            '</div>';

        var richTextEditor = $('.richtext-editor');
        if (richTextEditor.length > 0) {
            var editorContent = richTextEditor.html();
            richTextEditor.html(editorContent + audioHtml);
        } else {
            var textarea = $('textarea[name="ReplyForm[message]"]');
            if (textarea.length > 0) {
                var currentContent = textarea.val();
                textarea.val(currentContent + '\n[AUDIO]' + fileUrl + '[/AUDIO]');
            }
        }
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
