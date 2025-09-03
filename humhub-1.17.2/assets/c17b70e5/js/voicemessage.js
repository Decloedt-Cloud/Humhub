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
        this.isUploading = false;
        this.uploadedFiles = []; // Pour stocker les fichiers uploadés
        this.init();
    };

    VoiceRecorder.prototype.init = function() {
        var that = this;

        $(document).off('click', '.voice-record-btn').on('click', '.voice-record-btn', function(e) {
            e.preventDefault();
            that.startRecording(this);
        });

        $(document).off('click', '.voice-stop-btn').on('click', '.voice-stop-btn', function(e) {
            e.preventDefault();
            that.stopRecording();
        });

        // Gestionnaire pour supprimer un fichier vocal
        $(document).off('click', '.remove-voice-file').on('click', '.remove-voice-file', function(e) {
            e.preventDefault();
            that.removeVoiceFile(this);
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
        
        if (this.isUploading) {
            console.log('Upload already in progress, skipping...');
            return;
        }
        
        this.isUploading = true;
        
        var formData = new FormData();
        formData.append('voiceFile', audioBlob, 'voice_' + Date.now() + '.webm');

        $.ajax({
            url: 'http://localhost/social-voicemessage/humhub-1.17.2/voicemessage/voice/upload',
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
                console.log('Upload success:', response);
                if (response.success) {
                    // Ajouter le fichier à la liste des fichiers uploadés
                    that.uploadedFiles.push({
                        url: response.fileUrl,
                        name: response.fileName
                    });
                    
                    // Afficher le fichier dans l'interface utilisateur
                    that.displayVoiceFile(response.fileUrl, response.fileName);
                } else {
                    module.log.error('Erreur lors de l\'envoi du message vocal: ' + (response.error || 'Erreur inconnue'));
                }

                that.progressBarContainer.hide();
                that.progressBar.css('width', '0%');
                that.isUploading = false;
            },
            error: function(xhr, status, error) {
                console.error('Upload error:', xhr.responseText);
                module.log.error('Erreur lors de l\'envoi du message vocal');
                that.progressBarContainer.hide();
                that.progressBar.css('width', '0%');
                that.isUploading = false;
            }
        });
    };

    // Nouvelle fonction pour afficher le fichier vocal
    VoiceRecorder.prototype.displayVoiceFile = function(fileUrl, fileName) {
        var that = this;
        
        // Chercher le conteneur où afficher les fichiers
        var fileContainer = $('.voice-files-container');
        
        // Si le conteneur n'existe pas, le créer
        if (fileContainer.length === 0) {
            var textarea = $('textarea[name="ReplyForm[message]"]');
            if (textarea.length > 0) {
                textarea.after('<div class="voice-files-container" style="margin-top: 10px;"></div>');
                fileContainer = $('.voice-files-container');
            }
        }
        
        // Créer l'élément d'affichage du fichier
     // Créer l'élément d'affichage du fichier comme dans votre image
        var fileElement = $('<div class="voice-file-item" data-file-url="' + fileUrl + '" data-file-name="' + fileName + '" style="' +
            'display: inline-flex; align-items: center; background: #f0f0f0; border: 1px solid #d0d0d0; ' +
            'border-radius: 3px; padding: 4px 8px; margin-bottom: 5px; margin-right: 5px; font-size: 12px;">' +
            '<i class="fa fa-file-audio-o" style="margin-right: 5px; color: #007bff;"></i>' +
            '<span class="file-name" style="color: #333; margin-right: 5px;">' + fileName + '</span>' +
            '<button class="remove-voice-file" type="button" data-ui-loader style="' +
                'background: none; border: none; color: #ff4444; cursor: pointer; ' +
                'font-size: 14px; padding: 0; margin-left: 3px;" ' +
                'title="Supprimer le fichier">' +
                '<i class="fa fa-trash-o"></i>' +
            '</button>' +
        '</div>');
        
        
        fileContainer.append(fileElement);
        
        console.log('Fichier vocal affiché:', fileName);
    };

    // Fonction pour supprimer un fichier vocal
    VoiceRecorder.prototype.removeVoiceFile = function(button) {
        var that = this;
        var fileItem = $(button).closest('.voice-file-item');
        var fileUrl = fileItem.data('file-url');
        var fileName = fileItem.data('file-name');
        
        // Supprimer de la liste des fichiers uploadés
        this.uploadedFiles = this.uploadedFiles.filter(function(file) {
            return file.url !== fileUrl;
        });
        
        // Supprimer l'élément de l'interface
        fileItem.remove();
        
        // Optionnel: Supprimer le fichier du serveur
        // Vous pouvez ajouter un appel AJAX pour supprimer le fichier du serveur
        /*
        $.ajax({
            url: 'http://localhost/social-voicemessage/humhub-1.17.2/voicemessage/voice/delete',
            type: 'POST',
            data: { fileName: fileName },
            success: function(response) {
                console.log('Fichier supprimé du serveur');
            },
            error: function() {
                console.error('Erreur lors de la suppression du fichier');
            }
        });
        */
        
        console.log('Fichier vocal supprimé:', fileName);
    };

    // Fonction pour récupérer les fichiers uploadés (pour l'envoi du message)
    VoiceRecorder.prototype.getUploadedFiles = function() {
        return this.uploadedFiles;
    };

    // Fonction pour insérer les fichiers vocaux dans le message lors de l'envoi
    VoiceRecorder.prototype.insertVoiceFilesIntoMessage = function() {
        var textarea = $('textarea[name="ReplyForm[message]"]');
        
        if (textarea.length > 0 && this.uploadedFiles.length > 0) {
            var currentContent = textarea.val();
            var voiceMessages = '';
            
            this.uploadedFiles.forEach(function(file) {
                voiceMessages += '\n[AUDIO] ' + file.name + ' : ' + file.url + ' [/AUDIO]';
            });
            
            textarea.val(currentContent + voiceMessages);
            
            // Vider la liste des fichiers uploadés après insertion
            this.uploadedFiles = [];
            $('.voice-files-container').empty();
            
            console.log('Messages vocaux insérés dans le textarea');
        }
    };

    var instance;
    
    module.export({
        VoiceRecorder: VoiceRecorder,
        init: function() {
            if (!instance) {
                instance = new VoiceRecorder();
            }
            return instance;
        },
        // Fonction publique pour insérer les fichiers vocaux avant l'envoi
        insertVoiceFiles: function() {
            if (instance) {
                instance.insertVoiceFilesIntoMessage();
            }
        }
    });
});

$(document).ready(function() {
    if (typeof humhub !== 'undefined' && humhub.modules.voicemessage) {
        humhub.modules.voicemessage.init();
        
        // Intercepter l'envoi du formulaire pour insérer les fichiers vocaux
        $(document).on('submit', 'form', function(e) {
            // Vérifier si c'est le formulaire de réponse
            if ($(this).find('textarea[name="ReplyForm[message]"]').length > 0) {
                humhub.modules.voicemessage.insertVoiceFiles();
            }
        });
        
        // Intercepter le clic sur le bouton d'envoi
        $(document).on('click', '.reply-button, button[type="submit"]', function(e) {
            var form = $(this).closest('form');
            if (form.find('textarea[name="ReplyForm[message]"]').length > 0) {
                humhub.modules.voicemessage.insertVoiceFiles();
            }
        });
    }
});