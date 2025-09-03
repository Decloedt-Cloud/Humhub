// protected/modules/voicemessage/resources/js/voice-recorder.js

$(document).ready(function() {
    let mediaRecorder;
    let recordedChunks = [];
    let startTime;
    let timerInterval;
    let stream;

    // Initialiser l'enregistreur vocal
    $('#voiceRecorderButton').click(function() {
        startRecording();
    });

    function startRecording() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(function(audioStream) {
                    stream = audioStream;
                    recordedChunks = [];
                    
                    mediaRecorder = new MediaRecorder(audioStream);
                    
                    mediaRecorder.ondataavailable = function(event) {
                        if (event.data.size > 0) {
                            recordedChunks.push(event.data);
                        }
                    };
                    
                    mediaRecorder.onstop = function() {
                        stopStream();
                        showPreview();
                    };
                    
                    mediaRecorder.start();
                    startTime = Date.now();
                    showRecordingModal();
                    startTimer();
                })
                .catch(function(error) {
                    console.error('Erreur d\'accès au microphone:', error);
                    alert('Impossible d\'accéder au microphone. Veuillez vérifier vos permissions.');
                });
        } else {
            alert('Votre navigateur ne supporte pas l\'enregistrement audio.');
        }
    }

    function stopStream() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }

    function showRecordingModal() {
        $('#voice-recorder-modal').modal('show');
    }

    function startTimer() {
        timerInterval = setInterval(function() {
            const elapsed = Date.now() - startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            $('.recording-timer').text(
                (minutes < 10 ? '0' : '') + minutes + ':' +
                (seconds < 10 ? '0' : '') + seconds
            );
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
        }
    }

    // Arrêter l'enregistrement
    $('#stop-recording').click(function() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            stopTimer();
            $('#voice-recorder-modal').modal('hide');
        }
    });

    // Annuler l'enregistrement
    $('#cancel-recording').click(function() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        stopTimer();
        stopStream();
        $('#voice-recorder-modal').modal('hide');
    });

    function showPreview() {
        if (recordedChunks.length > 0) {
            const blob = new Blob(recordedChunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(blob);
            
            $('#voice-preview').attr('src', audioUrl);
            $('#voice-preview-modal').modal('show');
        }
    }

    // Réenregistrer
    $('#re-record').click(function() {
        $('#voice-preview-modal').modal('hide');
        startRecording();
    });

    // Envoyer le message vocal
    $('#send-voice').click(function() {
        if (recordedChunks.length > 0) {
            const blob = new Blob(recordedChunks, { type: 'audio/webm' });
            uploadVoiceMessage(blob);
        }
    });

    function uploadVoiceMessage(blob) {
        const formData = new FormData();
        formData.append('voiceFile', blob, 'voice_message.webm');

        const uploadUrl = humhub.config.get('voicemessage.uploadUrl');
        
        // Afficher un indicateur de chargement
        $('#send-voice').prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Envoi...');

        $.ajax({
            url: uploadUrl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    // Succès - intégrer le message dans le stream
                    insertVoiceMessage(response.fileUrl, response.fileName);
                    $('#voice-preview-modal').modal('hide');
                    
                    // Réinitialiser le bouton
                    $('#send-voice').prop('disabled', false).html('<i class="fa fa-send"></i> Envoyer');
                } else {
                    alert('Erreur lors de l\'envoi: ' + response.error);
                    $('#send-voice').prop('disabled', false).html('<i class="fa fa-send"></i> Envoyer');
                }
            },
            error: function(xhr, status, error) {
                console.error('Erreur AJAX:', error);
                alert('Erreur de connexion. Veuillez réessayer.');
                $('#send-voice').prop('disabled', false).html('<i class="fa fa-send"></i> Envoyer');
            }
        });
    }

    function insertVoiceMessage(fileUrl, fileName) {
        // Créer l'élément de message vocal
        const voiceMessage = `
            <div class="voice-message-item">
                <div class="voice-message-content">
                    <i class="fa fa-volume-up"></i>
                    <audio controls style="width: 200px;">
                        <source src="${fileUrl}" type="audio/webm">
                        Votre navigateur ne supporte pas l'audio HTML5.
                    </audio>
                    <span class="voice-message-info">Message vocal</span>
                </div>
            </div>
        `;

        // Insérer dans le stream HumHub (ajustez selon votre implémentation)
        // Ceci dépend de votre intégration avec le système de messages HumHub
        if (typeof humhub !== 'undefined' && humhub.modules.stream) {
            // Intégration avec le stream HumHub
            humhub.modules.stream.post({
                url: humhub.config.get('baseUrl') + '/content/perma/create',
                data: {
                    'contentType': 'voicemessage',
                    'fileUrl': fileUrl,
                    'fileName': fileName
                }
            });
        } else {
            // Fallback - afficher dans la zone de messages
            $('.stream-container, .message-stream, #wallStream').first().prepend(voiceMessage);
        }
    }

    // Nettoyer les modales lors de la fermeture
    $('#voice-recorder-modal, #voice-preview-modal').on('hidden.bs.modal', function() {
        stopTimer();
        stopStream();
        $('.recording-timer').text('00:00');
        $('#send-voice').prop('disabled', false).html('<i class="fa fa-send"></i> Envoyer');
    });
});