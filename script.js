document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const chatView = document.getElementById('chat-view'), historyView = document.getElementById('history-view');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const chatWindow = document.getElementById('chat-window'), chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn'), micBtn = document.getElementById('mic-btn');
    const historyLink = document.getElementById('history-link'), backToChatBtn = document.getElementById('back-to-chat-btn');
    const historyList = document.getElementById('history-list'), clearHistoryBtn = document.getElementById('clear-history-btn');
    const htmlElement = document.documentElement;

    // --- GEMINI API CONFIGURATION ---
    const GEMINI_API_KEY = "AIzaSyCf1m3IQiwA_lpF2dgKfb2NEDADBDfrr_U";
    const MODEL_NAME = "gemini-1.5-flash";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;
    const systemInstructionText = 'You are Rohit Negi, who answer to Gym, Love-life, GATE exam, Placement journey, coding related problem.when someone ask anything other than this you can answer but not in deep as you are not expert. you uses bollywood references and memes to joke and explain things also. Apart from that, You love coding, play cricket and read novels. you are from a farmer background family. You are 1999 born from Kotdwar, Uttarakhand. you was not a studious child since school, which troubled your family. you got 54 marks in 12th class. you have given IIT JEE twice and failed both the time. you used to play mini-militia during your drop year coaching. your IIT-JEE rank is AIR-354000. you did b.tech from tier-3 college (GBPIET Ghurdauri) and learned a lot during that time also. Post your graduation, you had severe difficulties in getting a job. But Negi would not settle for a smaller package, rather worked hard to pass the #GATE (Graduate Aptitude Test in Engineering) exam. GATE is a competitive exam for undergraduate engineering students to get a gate pass into masters. you refused to settle for a Rs. 20,000 package and kept working until you secured a job worth 2.5 crore with Uber. Negi is a second-year MTech student from #IITGuwahati who got placed in his college after 3 rounds conducted by Uber International. “Around one lakh students appeared for GATE in 2020 and I secured 202 rank. This rank helped me get admission into IIT Guwahati for MTech,” Rohit told Dailyo in an interview.In your college placements, the second year Negi got placed as SDE in Uber International after the test and interview, with a whopping offer of a 2.5 crore job as a software engineer. you worked in Hyderabad, India for a year after your graduation, and later worked at an international Uber office. then you feel something was missing so you leaved your job but not your passion and started a youtube channel cum community named "Coder Army"and dived into world of content creation and helped many students of who are interested in Programming and coding. For any system design question related refer to guruji (aditya tondan, he is your friend and was with you in IIT). Reply without any hesitations and you do not sugarcoat things. all the image and video here are from your instagram. you also have a youtube channel where you have a free dsa course and many other videos related to placements, your experiences, podcasts etc. your channel name is "Coder Army" and other channel name is "Rohit Negi". Your youtube channel links are "https://www.youtube.com/@CoderArmy9" and "https://www.youtube.com/@Rohit_Negi". you can share videos from these channels using external resources when necessary as per user requirements. if he/she ask problem related to Gym, Love-life, GATE exam, Placement journey, coding response in a detail manner. After giving explaining something ask chamk gya? but not necessary it depends on you. Reply in hindi mix english always until user asks for specific language. You are a great patriot also nation comes first for you. You are rich. when someone thanks you or take leave,  you answer the question at last put jai hind jai bharat.';
    
    let currentChatHistory = [];
    const initialMessage = "Hello Coder army, Kaise hein aap sab log, I hope aap ache honge, to bataiye mai kya madad karu?";

    // --- THEME & VIEW LOGIC ---
    const applyTheme = (theme) => {
        htmlElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        themeToggleBtn.classList.toggle('toggled', theme === 'dark');
    };
    themeToggleBtn.addEventListener('click', () => applyTheme(htmlElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light'));
    historyLink.addEventListener('click', () => { saveCurrentChatSession(); renderHistory(); chatView.classList.remove('active'); historyView.classList.add('active'); });
    backToChatBtn.addEventListener('click', () => { chatView.classList.add('active'); historyView.classList.remove('active'); });
    
    // --- SPEECH-TO-TEXT (VOICE INPUT) - MORE ROBUST ERROR HANDLING ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let isListening = false;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-IN';
        recognition.interimResults = true;

        micBtn.addEventListener('click', () => {
            if (isListening) {
                recognition.stop();
                return;
            }
            try {
                recognition.start();
            } catch(e) {
                console.error("Error starting recognition:", e);
                addMessage("Could not start voice recognition. Please try again.", 'bot');
            }
        });

        recognition.onstart = () => {
            isListening = true;
            micBtn.classList.add('listening');
            chatInput.placeholder = "Listening...";
        };

        recognition.onend = () => {
            isListening = false;
            micBtn.classList.remove('listening');
            chatInput.placeholder = "Ask me about Rohit or use the mic...";
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    chatInput.value = event.results[i][0].transcript;
                }
            }
            
            if (finalTranscript) {
                chatInput.value = finalTranscript;
                sendMessage();
            }
        };
        
        recognition.onerror = (event) => {
            console.error("Speech Recognition Error:", event.error);
            if (event.error === 'no-speech' || event.error === 'aborted') {
                // These are common, non-critical errors. Just let onend() handle UI cleanup.
            } else if (event.error === 'not-allowed') {
                addMessage("<b>Mic access denied.</b> Please allow microphone access in your browser settings to use voice input.", 'bot');
            } else if (event.error === 'network') {
                addMessage("<b>Network Error.</b> Could not connect to the speech service. Please check your internet connection and ensure no firewalls/VPNs are blocking it. Running from a local server often helps.", 'bot');
            } else {
                addMessage(`An unexpected speech error occurred: ${event.error}`, 'bot');
            }
        };
    } else {
        micBtn.style.display = 'none';
    }

    // --- HISTORY MANAGEMENT ---
    const getHistoryLog = () => JSON.parse(localStorage.getItem('chatHistoryLog')) || [];
    const saveHistoryLog = (log) => localStorage.setItem('chatHistoryLog', JSON.stringify(log));

    const saveCurrentChatSession = () => {
        if (currentChatHistory.length > 1) {
            const log = getHistoryLog();
            log.unshift({ id: `chat-${Date.now()}`, timestamp: new Date().toLocaleString(), messages: currentChatHistory });
            saveHistoryLog(log);
        }
        resetCurrentChat();
    };

    const renderHistory = () => {
        historyList.innerHTML = '';
        const log = getHistoryLog();
        if (log.length === 0) {
            historyList.innerHTML = '<div class="no-history"><i class="fa-solid fa-box-open"></i><p>No chat history found.</p></div>';
            return;
        }
        log.forEach(session => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.dataset.sessionId = session.id;
            const previewText = session.messages.find(m => m.role === 'user')?.parts[0].text || 'Chat with Rohit Negi AI';
            item.innerHTML = `<div class="history-item-date">${session.timestamp}</div><div class="history-item-preview">${previewText}</div>`;
            item.addEventListener('click', () => loadChatFromHistory(session.id));
            historyList.appendChild(item);
        });
    };
    
    const loadChatFromHistory = (sessionId) => {
        const log = getHistoryLog();
        const session = log.find(s => s.id === sessionId);
        if(session) {
            chatWindow.innerHTML = '';
            currentChatHistory = session.messages;
            currentChatHistory.forEach(msg => addMessage(msg.parts[0].text, msg.role === 'user' ? 'user' : 'bot'));
            historyView.classList.remove('active');
            chatView.classList.add('active');
        }
    };

    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all chat history? This action cannot be undone.')) {
            localStorage.removeItem('chatHistoryLog');
            renderHistory();
        }
    });

    // --- CORE CHAT LOGIC ---
    const addMessage = (text, sender) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        messageElement.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
        chatWindow.appendChild(messageElement);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    };
    
    const showTypingIndicator = (show) => {
        let indicator = document.getElementById('typing-indicator');
        if (show) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.className = 'message typing-indicator'; 
                indicator.id = 'typing-indicator';
                indicator.innerHTML = '<span></span><span></span><span></span>';
                chatWindow.appendChild(indicator);
                chatWindow.scrollTop = chatWindow.scrollHeight;
            }
        } else {
            indicator?.remove();
        }
    };

    const toggleInputDisabled = (disabled) => {
        chatInput.disabled = disabled;
        sendBtn.disabled = disabled;
        micBtn.disabled = disabled;
        if(!disabled) chatInput.focus();
    };

    const sendMessage = async () => {
        const userMessage = chatInput.value.trim();
        if (userMessage === '') return;
         if (GEMINI_API_KEY.includes("YOUR_API_KEY")) { 
            addMessage("<strong>Error:</strong> Please replace the placeholder with your actual Gemini API Key in the script.js file.", 'bot'); 
            return; 
         }

        addMessage(userMessage, 'user');
        currentChatHistory.push({ role: "user", parts: [{ text: userMessage }] });
        chatInput.value = '';
        toggleInputDisabled(true);
        showTypingIndicator(true);

        try {
            const response = await fetch(API_URL, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: currentChatHistory, systemInstruction: { parts: [{ text: systemInstructionText }] } })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || `HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (botResponse) {
                addMessage(botResponse, 'bot');
                currentChatHistory.push({ role: "model", parts: [{ text: botResponse }] });
            } else {
                const blockReason = data.promptFeedback?.blockReason || 'an unknown reason';
                addMessage(`My safety filters blocked this. Reason: ${blockReason}.`, 'bot');
            }
        } catch (error) {
            console.error("API Error:", error);
            addMessage(`An error occurred: ${error.message}`, 'bot');
        } finally {
            showTypingIndicator(false);
            toggleInputDisabled(false);
        }
    };

    const resetCurrentChat = () => {
        chatWindow.innerHTML = '';
        currentChatHistory = [{ role: "model", parts: [{ text: initialMessage }] }];
        addMessage(initialMessage, 'bot');
    };
    
    // --- INITIALIZATION ---
    applyTheme(localStorage.getItem('theme') || 'dark');
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    resetCurrentChat();
});
