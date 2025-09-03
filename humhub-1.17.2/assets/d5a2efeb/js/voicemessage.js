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
        this.recordingTime = 0;
        this.timerInterval = null;
        this.timerElement = null;
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
        this.timerElement = container.find('span[id$="-timer"]');
        this.previewSelector = this.recordButton.data('preview');
        this.progressSelector = this.recordButton.data('progress');

        if (this.previewSelector) {
            this.voicePreviewContainer = $(this.previewSelector);
        } else {
          
            this.voicePreviewContainer = container.find('.voice-message-preview');
        }

        if (this.progressSelector) {
            this.progressBarContainer = $(this.progressSelector);
            this.progressBar = this.progressBarContainer.find('.progress-bar');
        }
 
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
                 if (that.timerElement.length) {
                    that.startTimer(that.timerElement);
                }
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
              if (this.timerElement && this.timerInterval) {
                this.stopTimer(this.timerElement);
            }
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
            name: response.fileName,
            guid: response.guid,
            fileId: response.fileId // Assuming response also contains fileId
          });
         
          // Afficher le fichier dans l'interface utilisateur
          if (response.html) {
            // Utiliser le HTML généré par le serveur
            that.displayVoiceFileFromHtml(response.html);
          } else {
            // Fallback vers l'affichage manuel
            that.displayVoiceFile(response.fileUrl, response.fileName, response.guid);
          }
           var form = $('form').has('textarea[name="ReplyForm[message]"]');
        form.append(
        $('<input>')
            .attr('type', 'hidden')
            .attr('name', 'fileList[]')
            .val(response.guid)
        );
        var messageTextarea = $('textarea[name="ReplyForm[message]"]');
        if (messageTextarea.val().trim() === '') {
            messageTextarea.val('');
            messageTextarea.trigger('change');
        }
                    // --- END ADDED PART ---
        } else {
          module.log.error('Erreur lors de l\'envoi du message vocal: ' + (response.error || 'Erreur inconnue'));
        }
 
        that.progressBarContainer.hide();
        that.progressBar.css('width', '0%');
        that.isUploading = false;
      },
      error: function(xhr, status, error) { console.error('Upload error:', xhr.responseText);
        module.log.error('Erreur lors de l\'envoi du message vocal');
        that.progressBarContainer.hide();
        that.progressBar.css('width', '0%');
        that.isUploading = false;
      }
    });
  };
 
    
      VoiceRecorder.prototype.displayVoiceFileFromHtml = function(html) {
        var that = this;
        var voiceContainer = this.voicePreviewContainer || $(this.recordButton).closest('form').find('.voice-message-preview');

        
        if (voiceContainer.length === 0) {
            console.error('Conteneur vocal introuvable');
            return;
        }
        voiceContainer.append(html);
        voiceContainer.show();
    };
    
     VoiceRecorder.prototype.displayVoiceFile = function(fileUrl, fileName, guid) {
        var that = this;
        var form = $(this.recordButton).closest('form');
        var voiceContainer = form.find('.voice-message-preview');

        if (voiceContainer.length === 0) {
            console.error('Conteneur vocal introuvable');
            return;
        }
        
        var fileElement = $('<div class="file-preview-item voice-file-item" data-file-url="' + fileUrl + '" data-file-name="' + fileName + '" data-file-guid="' + guid + '">' +
            '<a data-ui-gallery="gallery-voice-message" href="' + fileUrl + '" title="' + fileName + '" class="audio-player-link">' +
            '<video src="' + fileUrl + '#t=0.001" type="video/webm" controls preload="metadata"></video>' +
            '</a>' +
            '<button class="remove-voice-file" type="button" title="Supprimer le fichier">' +
            '<i class="fa fa-trash-o"></i>' +
            '</button>' +
            '</div>');
       
        voiceContainer.append(fileElement);
        voiceContainer.show();
    };
 
    // Fonction pour supprimer un fichier vocal (mise à jour)
    VoiceRecorder.prototype.removeVoiceFile = function(button) {
    var that = this;
    var fileItem = $(button).closest('.voice-file-item');
    var guid = fileItem.data('file-guid'); // Récupérer le guid stocké dans l'attribut data-file-guid
   if (!guid) {
        console.error('GUID manquant');
        return;
    }
 
    // Supprimer via l'API
    $.ajax({
        url: 'http://localhost/social-voicemessage/humhub-1.17.2/voicemessage/voice/delete',
        type: 'POST',
        data: { guid: guid },
        success: function(response) {
            if (response.success) {
                // Supprimer de la liste des fichiers uploadés
                that.uploadedFiles = that.uploadedFiles.filter(function(file) {
                    return file.guid !== guid;
                });
  // Supprimer le champ caché associé
                    $('input[name="fileList[]"][value="' + guid + '"]').remove();
                    
                    // Supprimer l'élément visuel
                    fileItem.remove();
                    
                    // Masquer le conteneur s'il est vide
                    var voiceContainer = $('.voice-message-preview');
                    if (voiceContainer.children().length === 0) {
                        voiceContainer.hide();
                    }
                } else {
                    console.error('Erreur lors de la suppression:', response.error);
                }
        },
        error: function(xhr, status, error) {
            console.error('Erreur de suppression:', error);
        }
    });
};
 
 
    // Fonction pour récupérer les fichiers uploadés (pour l'envoi du message)
    VoiceRecorder.prototype.getUploadedFiles = function() {
        return this.uploadedFiles;
    };
 
    // Fonction pour nettoyer après l'envoi du message
  VoiceRecorder.prototype.cleanupAfterSend = function() {
    this.uploadedFiles = [];
    $('.file-preview-container').empty();
       
        // --- ADD THIS PART ---
        var messageTextarea = $('textarea[name="ReplyForm[message]"]');
        if (messageTextarea.val().trim() === '[Voice Message]') { // Check if it's *only* the placeholder
            messageTextarea.val('');
            messageTextarea.trigger('change'); // Ensure Richtext Editor updates
        }
        // --- END ADDED PART ---
 
    console.log('Cleanup terminé après envoi du message');
  };
 
    // Fonction pour intégrer avec le système de fichiers HumHub
    VoiceRecorder.prototype.attachToHumHubForm = function() {
        var that = this;
       
        // Trouver le formulaire actuel
        var form = $('form').has('textarea[name="ReplyForm[message]"]');
       
        if (form.length > 0) {
            // Ajouter les fichiers vocaux aux données du formulaire
            form.on('submit', function(e) {
                // Les fichiers sont déjà attachés via l'API HumHub
                console.log('Formulaire soumis avec', that.uploadedFiles.length, 'fichiers vocaux');
            });
        }
    };
VoiceRecorder.prototype.startTimer = function(timerElement) {
    var that = this;
    this.recordingTime = 0;
 
    this.timerInterval = setInterval(function() {
        that.recordingTime++;
        var minutes = Math.floor(that.recordingTime / 60);
        var seconds = that.recordingTime % 60;
        var formattedTime = (minutes < 10 ? '0' + minutes : minutes) + ':' +
                            (seconds < 10 ? '0' + seconds : seconds);
        timerElement.text(formattedTime);
    }, 1000);
};
VoiceRecorder.prototype.stopTimer = function(timerElement) {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
    this.recordingTime = 0;
    timerElement.text('00:00');
}
 
    var instance;
   
    module.export({
        VoiceRecorder: VoiceRecorder,
        init: function() {
            if (!instance) {
                instance = new VoiceRecorder();
                instance.attachToHumHubForm();
            }
            return instance;
        },
        // Fonction publique pour nettoyer après l'envoi
        cleanup: function() {
            if (instance) {
                instance.cleanupAfterSend();
            }
        },
        // Fonction publique pour obtenir les fichiers uploadés
        getUploadedFiles: function() {
            if (instance) {
                return instance.getUploadedFiles();
            }
            return [];
        }
    });
});
 
$(document).ready(function() {
    if (typeof humhub !== 'undefined' && humhub.modules.voicemessage) {
        humhub.modules.voicemessage.init();
       
        // Intercepter l'envoi du formulaire pour nettoyer après l'envoi
        $(document).on('submit', 'form', function(e) {
            // Vérifier si c'est le formulaire de réponse
            if ($(this).find('textarea[name="ReplyForm[message]"]').length > 0) {
                // Nettoyer après un court délai pour permettre l'envoi
                setTimeout(function() {
                    humhub.modules.voicemessage.cleanup();
                }, 1000);
            }
        });
       
        // Intercepter le clic sur le bouton d'envoi
        $(document).on('click', '.reply-button, button[type="submit"]', function(e) {
            var form = $(this).closest('form');
            if (form.find('textarea[name="ReplyForm[message]"]').length > 0) {
                // Nettoyer après un court délai pour permettre l'envoi
                setTimeout(function() {
                    humhub.modules.voicemessage.cleanup();
                }, 1000);
            }
        });
    }
});