const API_URL = "/chat/"; // Django endpoint
const FILE_READER_URL = "/chat/read-file/"; // File reader endpoint

window.chatAPI = {
    currentUtterance: null,
    isReading: false,
    roomId: null, // Will be set from template
    isPaused: false,
    fileReadingSentences: [],
    currentSentenceIndex: 0,
    readingTimeout: null,
    
    init: function() {
        console.log("chatAPI.init called");
        // Generate UUID for session
        const sessionId = this.generateUUID();
        console.log("Session ID:", sessionId);

        // Check SpeechRecognition support
        const recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        let isListening = false;

        if (!recognition) {
            console.log("SpeechRecognition not supported");
            const micBtn = document.getElementById("mic-btn");
            if (micBtn) {
                micBtn.disabled = true;
                micBtn.title = "Voice input not supported in this browser";
            }
            const voiceStatus = document.getElementById("voice-status");
            if (voiceStatus) {
                voiceStatus.textContent = "Voice input is not supported in this browser.";
                voiceStatus.classList.remove("hidden");
            }
        } else {
            const recognizer = new recognition();
            recognizer.interimResults = true;
            recognizer.lang = 'en-US';

            recognizer.onresult = (event) => {
                console.log("SpeechRecognition result received");
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');
                const userInput = document.getElementById("user-input");
                if (userInput) userInput.value = transcript;
                const voiceStatus = document.getElementById("voice-status");
                if (voiceStatus) voiceStatus.textContent = "Listening... (Speak clearly)";
            };

            recognizer.onend = () => {
                console.log("SpeechRecognition ended");
                isListening = false;
                const micBtn = document.getElementById("mic-btn");
                if (micBtn) micBtn.classList.remove("listening");
                const voiceStatus = document.getElementById("voice-status");
                if (voiceStatus) voiceStatus.classList.add("hidden");
                const userInput = document.getElementById("user-input");
                if (userInput && userInput.value.trim()) {
                    this.sendMessage(sessionId, userInput.value.trim());
                }
            };

            recognizer.onerror = (event) => {
                console.log("SpeechRecognition error:", event.error);
                isListening = false;
                const micBtn = document.getElementById("mic-btn");
                if (micBtn) micBtn.classList.remove("listening");
                const voiceStatus = document.getElementById("voice-status");
                if (voiceStatus) voiceStatus.classList.add("hidden");
                const errorMessage = document.getElementById("error-message");
                if (errorMessage) {
                    errorMessage.textContent = `Voice input error: ${event.error}`;
                    errorMessage.classList.remove("hidden");
                }
            };

            const micBtn = document.getElementById("mic-btn");
            if (micBtn) {
                micBtn.addEventListener("click", () => {
                    console.log("Mic button clicked");
                    if (!isListening) {
                        isListening = true;
                        micBtn.classList.add("listening");
                        const voiceStatus = document.getElementById("voice-status");
                        if (voiceStatus) {
                            voiceStatus.textContent = "Listening... (Speak clearly)";
                            voiceStatus.classList.remove("hidden");
                        }
                        recognizer.start();
                    }
                });
            } else {
                console.error("Mic button not found");
            }
        }

        // Check SpeechSynthesis support
        if (!window.speechSynthesis) {
            console.log("SpeechSynthesis not supported");
            const enableSpeech = document.getElementById("enable-speech");
            if (enableSpeech) enableSpeech.disabled = true;
            const speechSupport = document.getElementById("speech-support");
            if (speechSupport) {
                speechSupport.textContent = "Text-to-speech is not supported in this browser.";
                speechSupport.classList.remove("hidden");
            }
        }

        // Set up event listeners
        const sendBtn = document.getElementById("send-btn");
        if (sendBtn) {
            sendBtn.addEventListener("click", () => {
                console.log("Send button clicked");
                const userInput = document.getElementById("user-input");
                if (userInput && userInput.value.trim()) {
                    this.sendMessage(sessionId, userInput.value.trim());
                }
            });
        } else {
            console.error("Send button not found");
        }

        const userInput = document.getElementById("user-input");
        if (userInput) {
            userInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    console.log("Enter key pressed");
                    if (userInput.value.trim()) {
                        this.sendMessage(sessionId, userInput.value.trim());
                    }
                }
            });
        } else {
            console.error("User input field not found");
        }

        const summaryBtn = document.getElementById("summary-btn");
        if (summaryBtn) {
            summaryBtn.addEventListener("click", () => {
                console.log("Summary button clicked");
                this.requestSummary(sessionId);
            });
        } else {
            console.error("Summary button not found");
        }

        // Set up file upload listeners
        this.setupFileReader();
    },

    generateUUID: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    sendMessage: function(sessionId, message) {
        console.log("sendMessage called with:", message);
        const errorMessage = document.getElementById("error-message");

        if (!message) {
            console.log("No message provided");
            if (errorMessage) {
                errorMessage.textContent = "Please enter or speak a message.";
                errorMessage.classList.remove("hidden");
            }
            return;
        }

        if (errorMessage) errorMessage.classList.add("hidden");
        this.appendMessage("User", message, "user-message");

        const data = {
            session_id: sessionId,
            message: message,
            room_id: this.roomId
        };

        fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log("API response received:", response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("API data:", data);
            this.appendMessage("StudentHelper", data.response, "bot-message");
            if (window.speechSynthesis && document.getElementById("enable-speech")?.checked) {
                console.log("Speaking response:", data.response);
                const utterance = new SpeechSynthesisUtterance(data.response);
                utterance.lang = 'en-US';
                window.speechSynthesis.speak(utterance);
            }
            const userInput = document.getElementById("user-input");
            if (userInput) userInput.value = "";
            this.scrollToBottom();
        })
        .catch(error => {
            console.error("API error:", error);
            if (errorMessage) {
                errorMessage.textContent = "Error communicating with the server.";
                errorMessage.classList.remove("hidden");
            }
        });
    },

    requestSummary: function(sessionId) {
        console.log("requestSummary called");
        const errorMessage = document.getElementById("error-message");
        if (errorMessage) errorMessage.classList.add("hidden");

        const data = {
            session_id: sessionId,
            is_summary: true,
            room_id: this.roomId
        };

        fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log("API response received:", response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("API data:", data);
            if (data.summary) {
                const summaryMessage = "Session Summary:\n" + data.summary;
                const messageDiv = this.appendMessage("StudentHelper", summaryMessage, "bot-message");
                // Add save button
                const saveBtn = document.createElement("button");
                saveBtn.textContent = "Save Summary";
                saveBtn.className = "bg-black-500 text-black p-1 rounded ml-2 mt-2";
                saveBtn.onclick = () => this.saveSummary(data.summary);
                messageDiv.appendChild(saveBtn);
            }
            if (window.speechSynthesis && document.getElementById("enable-speech")?.checked) {
                console.log("Speaking summary:", data.summary);
                const utterance = new SpeechSynthesisUtterance(data.summary);
                utterance.lang = 'en-US';
                window.speechSynthesis.speak(utterance);
            }
            this.scrollToBottom();
        })
        .catch(error => {
            console.error("API error:", error);
            if (errorMessage) {
                errorMessage.textContent = "Error generating summary.";
                errorMessage.classList.remove("hidden");
            }
        });
    },

    saveSummary: function(summary) {
        const blob = new Blob([summary], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "session_summary.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    appendMessage: function(sender, message, className) {
        console.log("Appending message from:", sender);
        const chatOutput = document.getElementById("chat-output");
        if (chatOutput) {
            const messageDiv = document.createElement("div");
            messageDiv.className = `chat-message ${className} mb-3`;
            
            if (className === 'user-message') {
                // User message (right aligned)
                messageDiv.innerHTML = `
                    <div class="d-flex align-items-start justify-content-end">
                        <div class="flex-grow-1 text-end">
                            <div class="bg-primary text-white rounded-3 p-3 shadow-sm d-inline-block" style="max-width: 80%;">
                                <p class="mb-0">${message.replace(/\n/g, "<br>")}</p>
                            </div>
                            <div><small class="text-muted">Just now</small></div>
                        </div>
                        <div class="flex-shrink-0 ms-3">
                            <div class="bg-secondary rounded-circle d-flex align-items-center justify-content-center" 
                                 style="width: 40px; height: 40px;">
                                <i class="bi bi-person text-white"></i>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // Bot message (left aligned)
                messageDiv.innerHTML = `
                    <div class="d-flex align-items-start">
                        <div class="flex-shrink-0 me-3">
                            <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center" 
                                 style="width: 40px; height: 40px;">
                                <i class="bi bi-robot text-white"></i>
                            </div>
                        </div>
                        <div class="flex-grow-1">
                            <div class="bg-white rounded-3 p-3 shadow-sm" style="max-width: 85%;">
                                <p class="mb-0"><strong>${sender}:</strong> ${message.replace(/\n/g, "<br>")}</p>
                            </div>
                            <div><small class="text-muted">Just now</small></div>
                        </div>
                    </div>
                `;
            }
            
            chatOutput.appendChild(messageDiv);
            this.scrollToBottom();
            return messageDiv;
        }
    },

    scrollToBottom: function() {
        console.log("Scrolling to bottom");
        const chatContainer = document.querySelector(".chat-container");
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    },

    setupFileReader: function() {
        const uploadBtn = document.getElementById("upload-btn");
        const fileInput = document.getElementById("file-input");
        const stopBtn = document.getElementById("stop-reading-btn");
        const pauseBtn = document.getElementById("pause-reading-btn");
        const resumeBtn = document.getElementById("resume-reading-btn");
        const readingControls = document.getElementById("reading-controls");

        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener("click", () => {
                const file = fileInput.files[0];
                if (file) {
                    this.handleFileUpload(file);
                } else {
                    this.showFileStatus("Please select a file first", "error");
                }
            });
        }

        if (stopBtn) {
            stopBtn.addEventListener("click", () => {
                this.stopReading();
            });
        }

        if (pauseBtn) {
            pauseBtn.addEventListener("click", () => {
                this.pauseReading();
            });
        }

        if (resumeBtn) {
            resumeBtn.addEventListener("click", () => {
                this.resumeReading();
            });
        }

        // Allow drag and drop
        const fileReaderSection = document.querySelector(".bg-blue-50");
        if (fileReaderSection) {
            fileReaderSection.addEventListener("dragover", (e) => {
                e.preventDefault();
                fileReaderSection.classList.add("bg-blue-100");
            });

            fileReaderSection.addEventListener("dragleave", (e) => {
                e.preventDefault();
                fileReaderSection.classList.remove("bg-blue-100");
            });

            fileReaderSection.addEventListener("drop", (e) => {
                e.preventDefault();
                fileReaderSection.classList.remove("bg-blue-100");
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    fileInput.files = files;
                    this.handleFileUpload(files[0]);
                }
            });
        }
    },

    handleFileUpload: function(file) {
        console.log("Handling file upload:", file.name);
        
        // Validate file type
        const allowedTypes = ['text/plain', 'application/pdf', 'application/msword', 
                             'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        
        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt')) {
            this.showFileStatus("Unsupported file type. Please upload .txt, .pdf, .doc, or .docx files", "error");
            return;
        }

        // Check file size (limit to 10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showFileStatus("File too large. Please upload files smaller than 10MB", "error");
            return;
        }

        this.showFileStatus(`Processing "${file.name}"...`, "processing");
        this.showReadingProgress();

        const formData = new FormData();
        formData.append('file', file);

        fetch(FILE_READER_URL, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': this.getCSRFToken()
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                this.showFileStatus(`"${file.name}" processed successfully`, "success");
                this.startTextToSpeech(data.text, file.name);
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        })
        .catch(error => {
            console.error("File upload error:", error);
            this.showFileStatus(`Error processing file: ${error.message}`, "error");
            this.hideReadingProgress();
        });
    },

    startTextToSpeech: function(text, fileName) {
        if (!window.speechSynthesis) {
            this.showFileStatus("Text-to-speech is not supported in this browser", "error");
            return;
        }

        // Stop any current reading
        this.stopReading();

        // Split text into sentences for better control
        this.fileReadingSentences = text.match(/[^\.!?]+[\.!?]+/g) || [text];
        this.currentSentenceIndex = 0;

        // Limit sentences to prevent infinite reading (max 200 sentences)
        const maxSentences = Math.min(this.fileReadingSentences.length, 200);
        this.fileReadingSentences = this.fileReadingSentences.slice(0, maxSentences);

        if (this.fileReadingSentences.length > 100) {
            const confirmRead = confirm(`This file contains ${this.fileReadingSentences.length} sentences. This may take approximately ${Math.ceil(this.fileReadingSentences.length * 3 / 60)} minutes to read. Continue?`);
            if (!confirmRead) {
                this.showFileStatus("Reading cancelled by user", "info");
                return;
            }
        }

        this.isReading = true;
        this.isPaused = false;
        this.showReadingControls(true);
        this.showReadingProgress();
        this.updateReadingStatus(`Starting to read "${fileName}" (${this.fileReadingSentences.length} sentences)`);

        this.readNextSentence(fileName);
    },

    readNextSentence: function(fileName) {
        if (!this.isReading) return;

        if (this.isPaused) {
            this.updateReadingStatus(`Paused - "${fileName}" (${this.currentSentenceIndex}/${this.fileReadingSentences.length})`);
            return;
        }

        if (this.currentSentenceIndex >= this.fileReadingSentences.length) {
            this.finishReading();
            return;
        }

        const sentence = this.fileReadingSentences[this.currentSentenceIndex].trim();
        if (sentence.length === 0) {
            this.currentSentenceIndex++;
            this.readingTimeout = setTimeout(() => this.readNextSentence(fileName), 100);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.rate = 0.9;
        utterance.lang = 'en-US';

        utterance.onstart = () => {
            this.updateProgress((this.currentSentenceIndex / this.fileReadingSentences.length) * 100);
            this.updateReadingStatus(`Reading "${fileName}" (${this.currentSentenceIndex + 1}/${this.fileReadingSentences.length})`);
        };

        utterance.onend = () => {
            if (!this.isReading) return;
            
            this.currentSentenceIndex++;
            this.updateProgress((this.currentSentenceIndex / this.fileReadingSentences.length) * 100);
            
            // Small delay between sentences
            this.readingTimeout = setTimeout(() => this.readNextSentence(fileName), 500);
        };

        utterance.onerror = (event) => {
            console.error("Speech synthesis error:", event.error);
            this.showFileStatus(`Speech error: ${event.error}. Reading stopped.`, "error");
            this.stopReading();
        };

        this.currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
    },

    pauseReading: function() {
        if (!this.isReading) return;
        
        this.isPaused = true;
        
        // Cancel current utterance
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        
        // Clear pending timeouts
        if (this.readingTimeout) {
            clearTimeout(this.readingTimeout);
            this.readingTimeout = null;
        }
        
        this.showPauseResumeButtons(false);
        this.updateReadingStatus(`Paused at sentence ${this.currentSentenceIndex + 1}/${this.fileReadingSentences.length}`);
        this.showFileStatus('Reading paused', 'info');
    },

    resumeReading: function() {
        if (!this.isReading || !this.isPaused) return;
        
        this.isPaused = false;
        this.showPauseResumeButtons(true);
        this.showFileStatus('Resuming reading...', 'info');
        
        // Continue from current sentence
        this.readNextSentence('Uploaded File');
    },

    stopReading: function() {
        console.log("Stopping text-to-speech");
        this.isReading = false;
        this.isPaused = false;
        
        // Clear timeouts
        if (this.readingTimeout) {
            clearTimeout(this.readingTimeout);
            this.readingTimeout = null;
        }
        
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }

        // Reset variables
        this.currentUtterance = null;
        this.fileReadingSentences = [];
        this.currentSentenceIndex = 0;
        
        this.showReadingControls(false);
        this.hideReadingProgress();
        this.showFileStatus("Reading stopped", "info");
    },

    finishReading: function() {
        console.log("Finished reading file");
        this.isReading = false;
        this.isPaused = false;
        this.currentUtterance = null;
        
        // Clear timeouts
        if (this.readingTimeout) {
            clearTimeout(this.readingTimeout);
            this.readingTimeout = null;
        }
        
        this.showReadingControls(false);
        this.updateProgress(100);
        this.updateReadingStatus("Reading completed!");
        
        // Hide progress after a delay
        setTimeout(() => {
            this.hideReadingProgress();
            this.showFileStatus("File reading completed successfully", "success");
        }, 2000);
    },

    showFileStatus: function(message, type) {
        const statusDiv = document.getElementById("file-status");
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.className = "text-sm mt-2";
            
            switch(type) {
                case "error":
                    statusDiv.className += " text-red-500";
                    break;
                case "success":
                    statusDiv.className += " text-green-500";
                    break;
                case "processing":
                    statusDiv.className += " text-blue-500";
                    break;
                case "info":
                    statusDiv.className += " text-gray-500";
                    break;
                default:
                    statusDiv.className += " text-gray-500";
            }
            
            statusDiv.classList.remove("hidden");
            
            // Auto-hide success and info messages after 5 seconds
            if (type === "success" || type === "info") {
                setTimeout(() => {
                    statusDiv.classList.add("hidden");
                }, 5000);
            }
        }
    },

    showReadingProgress: function() {
        const progressDiv = document.getElementById("reading-progress");
        if (progressDiv) {
            progressDiv.classList.remove("hidden");
            this.updateProgress(0);
        }
    },

    hideReadingProgress: function() {
        const progressDiv = document.getElementById("reading-progress");
        if (progressDiv) {
            progressDiv.classList.add("hidden");
        }
    },

    updateProgress: function(percentage) {
        const progressBar = document.getElementById("progress-bar");
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    },

    updateReadingStatus: function(status) {
        const statusSpan = document.getElementById("reading-status");
        if (statusSpan) {
            statusSpan.textContent = status;
        }
    },

    showStopButton: function(show) {
        const stopBtn = document.getElementById("stop-reading-btn");
        const uploadBtn = document.getElementById("upload-btn");
        
        if (stopBtn && uploadBtn) {
            if (show) {
                stopBtn.classList.remove("hidden");
                uploadBtn.classList.add("hidden");
            } else {
                stopBtn.classList.add("hidden");
                uploadBtn.classList.remove("hidden");
            }
        }
    },

    showReadingControls: function(show) {
        const readingControls = document.getElementById("reading-controls");
        const uploadBtn = document.getElementById("upload-btn");
        
        if (readingControls && uploadBtn) {
            if (show) {
                readingControls.classList.remove("d-none");
                uploadBtn.classList.add("d-none");
                this.showPauseResumeButtons(true); // Show pause initially
            } else {
                readingControls.classList.add("d-none");
                uploadBtn.classList.remove("d-none");
            }
        }
    },

    showPauseResumeButtons: function(showPause) {
        const pauseBtn = document.getElementById("pause-reading-btn");
        const resumeBtn = document.getElementById("resume-reading-btn");
        
        if (pauseBtn && resumeBtn) {
            if (showPause) {
                pauseBtn.classList.remove("d-none");
                resumeBtn.classList.add("d-none");
            } else {
                pauseBtn.classList.add("d-none");
                resumeBtn.classList.remove("d-none");
            }
        }
    },

    getCSRFToken: function() {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'csrftoken') {
                return value;
            }
        }
        // Fallback to meta tag
        const csrfMeta = document.querySelector('meta[name=csrf-token]');
        return csrfMeta ? csrfMeta.getAttribute('content') : '';
    }
};