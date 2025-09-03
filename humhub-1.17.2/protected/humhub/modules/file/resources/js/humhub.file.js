humhub.module('voicemessage', function(module, require, $) {

    var client = require('client');
    var event = require('event');

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
                    // Créer un objet fichier compatible avec HumHub
                    var fileObject = {
                        guid: response.guid || response.fileName, // Utiliser le GUID si disponible
                        name: response.fileName,
                        url: response.fileUrl,
                        size: response.fileSize || 0,
                        size_format: that.formatFileSize(response.fileSize || 0),
                        mimeIcon: 'mime-audio',
                        thumbnailUrl: null,
                        openLink: '<a href="' + response.fileUrl + '" target="_blank">' + response.fileName + '</a>'
                    };

                    // Ajouter le fichier au système HumHub
                    that.addToHumHubFileSystem(fileObject);
                    
                    // Afficher dans l'interface utilisateur
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

    // Fonction pour ajouter le fichier au système de fichiers HumHub
    VoiceRecorder.prototype.addToHumHubFileSystem = function(fileObject) {
        var that = this;
        
        // Chercher le composant d'upload de fichiers HumHub
        var $fileUpload = $('[data-ui-widget="file.Upload"]');
        
        if ($fileUpload.length > 0) {
            // Obtenir l'instance du widget d'upload
            var uploadWidget = humhub.require('ui.widget').Widget.instance($fileUpload);
            
            if (uploadWidget && uploadWidget.handleFileResponse) {
                // Utiliser la méthode handleFileResponse pour ajouter le fichier
                uploadWidget.handleFileResponse(fileObject);
                console.log('Fichier vocal ajouté au système HumHub');
            } else {
                // Méthode alternative : déclencher l'événement humhub:file:created
                humhub.require('event').trigger('humhub:file:created', [fileObject]);
                console.log('Événement humhub:file:created déclenché');
            }
        } else {
            // Méthode de fallback : ajouter directement au formulaire
            this.addToForm(fileObject);
        }
    };

    // Méthode de fallback pour ajouter le fichier au formulaire
    VoiceRecorder.prototype.addToForm = function(fileObject) {
        var $form = $('form').first(); // Ou une sélection plus spécifique
        
        if ($form.length > 0) {
            // Ajouter un champ caché avec le GUID du fichier
            $form.append('<input type="hidden" name="fileList[]" value="' + fileObject.guid + '">');
            console.log('Fichier ajouté au formulaire avec GUID:', fileObject.guid);
        }
    };

    // Utilitaire pour formater la taille du fichier
    VoiceRecorder.prototype.formatFileSize = function(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        var k = 1024;
        var sizes = ['Bytes', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Fonction pour afficher le fichier vocal dans l'interface
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
        var fileElement = $('<div class="voice-file-item" data-file-url="' + fileUrl + '" data-file-name="' + fileName + '">' +
            '<i class="fa fa-file-audio-o"></i>' +
            '<span class="file-name">' + fileName + '</span>' +
            '<audio controls style="width: 200px; height: 30px;">' +
                '<source src="' + fileUrl + '" type="audio/webm">' +
                'Your browser does not support the audio element.' +
            '</audio>' +
            '<button class="remove-voice-file" type="button" data-ui-loader title="Supprimer le fichier">' +
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
        
        // Supprimer du système HumHub
        var $form = $('form').first();
        $form.find('input[name="fileList[]"]').each(function() {
            var value = $(this).val();
            if (value === fileName || value.indexOf(fileName) !== -1) {
                $(this).remove();
            }
        });
        
        // Supprimer l'élément de l'interface
        fileItem.remove();
        
        console.log('Fichier vocal supprimé:', fileName);
    };

    // Fonction pour récupérer les fichiers uploadés
    VoiceRecorder.prototype.getUploadedFiles = function() {
        return this.uploadedFiles;
    };

    // Fonction pour nettoyer après l'envoi du message
    VoiceRecorder.prototype.cleanupAfterSend = function() {
        this.uploadedFiles = [];
        $('.voice-files-container').empty();
        console.log('Cleanup terminé après envoi du message');
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
        // Fonction publique pour nettoyer après l'envoi
        cleanup: function() {
            if (instance) {
                instance.cleanupAfterSend();
            }
        }
    });
});

$(document).ready(function() {
    if (typeof humhub !== 'undefined' && humhub.modules.voicemessage) {
        humhub.modules.voicemessage.init();
        
        // Nettoyer après l'envoi réussi du message
        $(document).on('submit', 'form', function(e) {
            if ($(this).find('textarea[name="ReplyForm[message]"]').length > 0) {
                setTimeout(function() {
                    humhub.modules.voicemessage.cleanup();
                }, 1000);
            }
        });
    }
});