const chatLog = document.getElementById('chat-log'),
    userInput = document.getElementById('user-input'),
    sendButton = document.getElementById('send-button'),
    buttonIcon = document.getElementById('button-icon'),
    info = document.querySelector('.info');

const GEMINI_API_KEY = 'AIzaSyDsY4txJ9kibJufN9NV4FoyelaqlU_IX4g';

// Simpan percakapan
const chatHistory = [];

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const message = userInput.value.trim();
    if (message === '') return;

    appendMessage('user', message);
    chatHistory.push({ role: 'user', text: message });
    userInput.value = '';

    if (message.toLowerCase() === 'developer') {
        setTimeout(() => {
            const devMsg = 'This Source Coded By Reza Mehdikhanlou\nYoutube : @AsmrProg';
            appendMessage('bot', devMsg);
            chatHistory.push({ role: 'model', text: devMsg });
            resetButtonIcon();
        }, 2000);
        return;
    }

    const formattedHistory = chatHistory.map(msg => ({
        parts: [{ text: msg.text }],
        role: msg.role
    }));

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify({ contents: formattedHistory })
    };

    fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', options)
        .then((response) => response.json())
        .then((data) => {
            let reply = "Tidak dapat terhubung ke server utama.";
            if (data && data.candidates && data.candidates.length > 0) {
                const candidates = data.candidates[0].content?.parts;
                if (candidates && candidates.length > 0) {
                    reply = candidates.map(p => p.text).join('\n');
                }
            }
            appendMessage('bot', reply);
            chatHistory.push({ role: 'model', text: reply });
            resetButtonIcon();
        })
        .catch((err) => {
            appendMessage('bot', '❌ Error: ' + err.message);
            resetButtonIcon();
        });
}

function appendMessage(sender, message) {
    info.style.display = "none";
    buttonIcon.classList.remove('fa-solid', 'fa-paper-plane');
    buttonIcon.classList.add('fas', 'fa-spinner', 'fa-pulse');

    const messageElement = document.createElement('div');
    const iconElement = document.createElement('div');
    const chatElement = document.createElement('div');
    const icon = document.createElement('i');

    chatElement.classList.add("chat-box");
    iconElement.classList.add("icon");
    messageElement.classList.add(sender);
    messageElement.innerText = message;

    if (sender === 'user') {
        icon.classList.add('fa-regular', 'fa-user');
        iconElement.setAttribute('id', 'user-icon');
    } else {
        icon.classList.add('fa-solid', 'fa-robot');
        iconElement.setAttribute('id', 'bot-icon');
    }

    iconElement.appendChild(icon);
    chatElement.appendChild(iconElement);
    chatElement.appendChild(messageElement);
    chatLog.appendChild(chatElement);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function resetButtonIcon() {
    buttonIcon.classList.add('fa-solid', 'fa-paper-plane');
    buttonIcon.classList.remove('fas', 'fa-spinner', 'fa-pulse');
}
