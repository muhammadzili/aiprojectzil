const messageForm = document.querySelector(".prompt__form");
const chatHistoryContainer = document.querySelector(".chats");
const suggestionItems = document.querySelectorAll(".suggests__item");

const themeToggleButton = document.getElementById("themeToggler");
const clearChatButton = document.getElementById("deleteButton");

let currentUserMessage = null;
let isGeneratingResponse = false;

const GROQ_API_KEY = "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"; // ganti dengan kunci kamu
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const loadSavedChatHistory = () => {
    const savedConversations = JSON.parse(localStorage.getItem("saved-api-chats")) || [];
    const isLightTheme = localStorage.getItem("themeColor") === "light_mode";

    document.body.classList.toggle("light_mode", isLightTheme);
    themeToggleButton.innerHTML = isLightTheme ? '<i class="bi bi-moon-fill"></i>' : '<i class="bi bi-brightness-high-fill"></i>';

    chatHistoryContainer.innerHTML = '';
    savedConversations.forEach(conversation => {
        renderConversation(conversation);
    });

    document.body.classList.toggle("hide-header", savedConversations.length > 0);
};

const renderConversation = (conversation) => {
    const userMessageHtml = `
        <div class="message__content">
            <img class="message__avatar" src="assets/user.png" alt="User">
            <p class="message__text">${conversation.userMessage}</p>
        </div>
    `;
    const outgoingMessageElement = createChatMessageElement(userMessageHtml, "message--outgoing");
    chatHistoryContainer.appendChild(outgoingMessageElement);

    const responseText = conversation.apiResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsedApiResponse = marked.parse(responseText);
    const rawApiResponse = responseText;

    const responseHtml = `
        <div class="message__content">
            <img class="message__avatar" src="assets/zilai.png" alt="ZilAI">
            <p class="message__text"></p>
            <div class="message__loading-indicator hide">
                <div class="message__loading-bar"></div>
                <div class="message__loading-bar"></div>
                <div class="message__loading-bar"></div>
            </div>
        </div>
        <span onClick="copyMessageToClipboard(this)" class="message__icon hide"><i class='bx bx-copy-alt'></i></span>
    `;
    const incomingMessageElement = createChatMessageElement(responseHtml, "message--incoming");
    chatHistoryContainer.appendChild(incomingMessageElement);

    const messageTextElement = incomingMessageElement.querySelector(".message__text");
    showTypingEffect(rawApiResponse, parsedApiResponse, messageTextElement, incomingMessageElement, true);
};

const createChatMessageElement = (htmlContent, ...cssClasses) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", ...cssClasses);
    messageElement.innerHTML = htmlContent;
    return messageElement;
};

const showTypingEffect = (rawText, htmlText, messageElement, incomingMessageElement, skipEffect = false) => {
    const copyIconElement = incomingMessageElement.querySelector(".message__icon");
    copyIconElement.classList.add("hide");

    if (skipEffect) {
        messageElement.innerHTML = htmlText;
        hljs.highlightAll();
        addCopyButtonToCodeBlocks();
        copyIconElement.classList.remove("hide");
        isGeneratingResponse = false;
        return;
    }

    const wordsArray = rawText.split(' ');
    let wordIndex = 0;

    // Update interval speed to 0.2 second per word
    const typingInterval = setInterval(() => {
        messageElement.innerText += (wordIndex === 0 ? '' : ' ') + wordsArray[wordIndex++];
        if (wordIndex === wordsArray.length) {
            clearInterval(typingInterval);
            isGeneratingResponse = false;
            messageElement.innerHTML = htmlText;
            hljs.highlightAll();
            addCopyButtonToCodeBlocks();
            copyIconElement.classList.remove("hide");
        }
    }, 0); 
};

const requestApiResponse = async (incomingMessageElement) => {
    const messageTextElement = incomingMessageElement.querySelector(".message__text");

    try {
        const savedConversations = JSON.parse(localStorage.getItem("saved-api-chats")) || [];

        const messages = savedConversations.flatMap(conversation => ([
            { role: "user", content: conversation.userMessage },
            { role: "assistant", content: conversation.apiResponse }
        ]));

        messages.push({
            role: "user",
            content: `Kamu adalah ZilAI, asisten pribadi berbasis AI. Jawablah sopan, ramah, dan sebutkan kamu adalah ZilAI jika ditanya siapa kamu.\n\nPertanyaan: ${currentUserMessage}`
        });

const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
        model: selectedModel, // <- pakai model terpilih
        messages: [
            { role: "system", content: "Kamu adalah ZilAI, asisten pribadi AI." },
            { role: "user", content: currentUserMessage }
        ]
    })
});


        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.error?.message || "Request failed");

        const responseText = responseData.choices?.[0]?.message?.content || "Maaf, tidak ada balasan.";
        const parsedApiResponse = marked.parse(responseText);

        showTypingEffect(responseText, parsedApiResponse, messageTextElement, incomingMessageElement);

        savedConversations.push({
            userMessage: currentUserMessage,
            apiResponse: responseText
        });
        localStorage.setItem("saved-api-chats", JSON.stringify(savedConversations));

    } catch (error) {
        isGeneratingResponse = false;
        messageTextElement.innerText = error.message;
        incomingMessageElement.classList.add("message--error");
    } finally {
        incomingMessageElement.classList.remove("message--loading");
    }
};


const addCopyButtonToCodeBlocks = () => {
    const codeBlocks = document.querySelectorAll('pre');
    codeBlocks.forEach((block) => {
        const codeElement = block.querySelector('code');
        let language = [...codeElement.classList].find(cls => cls.startsWith('language-'))?.replace('language-', '') || 'Text';

        const languageLabel = document.createElement('div');
        languageLabel.innerText = language.charAt(0).toUpperCase() + language.slice(1);
        languageLabel.classList.add('code__language-label');
        block.appendChild(languageLabel);

        const copyButton = document.createElement('button');
        copyButton.innerHTML = `<i class='bx bx-copy'></i>`;
        copyButton.classList.add('code__copy-btn');
        block.appendChild(copyButton);

        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(codeElement.innerText).then(() => {
                copyButton.innerHTML = `<i class='bx bx-check'></i>`;
                setTimeout(() => copyButton.innerHTML = `<i class='bx bx-copy'></i>`, 2000);
            }).catch(err => {
                console.error("Copy failed:", err);
                alert("Unable to copy text!");
            });
        });
    });
};

const displayLoadingAnimation = () => {
    const loadingHtml = `
        <div class="message__content">
            <img class="message__avatar" src="assets/zilai.png" alt="ZilAI">
            <p class="message__text"></p>
            <div class="message__loading-indicator">
                <div class="message__loading-bar"></div>
                <div class="message__loading-bar"></div>
                <div class="message__loading-bar"></div>
            </div>
        </div>
        <span onClick="copyMessageToClipboard(this)" class="message__icon hide"><i class='bx bx-copy-alt'></i></span>
    `;
    const loadingMessageElement = createChatMessageElement(loadingHtml, "message--incoming", "message--loading");
    chatHistoryContainer.appendChild(loadingMessageElement);
    requestApiResponse(loadingMessageElement);
};

const copyMessageToClipboard = (copyButton) => {
    const messageContent = copyButton.parentElement.querySelector(".message__text").innerText;
    navigator.clipboard.writeText(messageContent);
    copyButton.innerHTML = `<i class='bx bx-check'></i>`;
    setTimeout(() => copyButton.innerHTML = `<i class='bx bx-copy-alt'></i>`, 1000);
};

let selectedModel = "llama3-8b-8192";

const modelSelect = document.getElementById("modelSelect");
modelSelect.addEventListener("change", (e) => {
  selectedModel = e.target.value;
  console.log("Model dipilih:", selectedModel);
});


const handleOutgoingMessage = () => {
    currentUserMessage = messageForm.querySelector(".prompt__form-input").value.trim() || currentUserMessage;
    if (!currentUserMessage || isGeneratingResponse) return;

    isGeneratingResponse = true;

    const outgoingMessageHtml = `
        <div class="message__content">
            <img class="message__avatar" src="assets/user.png" alt="User">
            <p class="message__text"></p>
        </div>
    `;
    const outgoingMessageElement = createChatMessageElement(outgoingMessageHtml, "message--outgoing");
    outgoingMessageElement.querySelector(".message__text").innerText = currentUserMessage;
    chatHistoryContainer.appendChild(outgoingMessageElement);

    messageForm.reset();
    document.body.classList.add("hide-header");
    setTimeout(displayLoadingAnimation, 100);
};

themeToggleButton.addEventListener('click', () => {
    const isLightTheme = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode");
    const newIconClass = isLightTheme ? "bi bi-moon-fill" : "bi bi-brightness-high-fill";
    themeToggleButton.querySelector("i").className = newIconClass;
});

clearChatButton.addEventListener('click', () => {
    if (confirm("Are you sure you want to delete all chat history?")) {
        localStorage.removeItem("saved-api-chats");
        loadSavedChatHistory();

        currentUserMessage = null;
        isGeneratingResponse = false;
    }
});

suggestionItems.forEach(suggestion => {
    suggestion.addEventListener('click', () => {
        currentUserMessage = suggestion.querySelector(".suggests__item-text").innerText;
        handleOutgoingMessage();
    });
});

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleOutgoingMessage();
});

loadSavedChatHistory();
