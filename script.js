const messageForm = document.querySelector(".prompt__form");
const chatHistoryContainer = document.querySelector(".chats");
const suggestionItems = document.querySelectorAll(".suggests__item");

const themeToggleButton = document.getElementById("themeToggler");
const clearChatButton = document.getElementById("deleteButton");

let currentUserMessage = null;
let isGeneratingResponse = false;

const GOOGLE_API_KEY = "AIzaSyAVWbPQNnZAmM114F4j3AygDtVBLJ7L-eI";
const API_REQUEST_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`;

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
    
    const responseHtml = `
        <div class="message__content">
            <img class="message__avatar" src="assets/zilai.png" alt="ZilAI">
            <p class="message__text">${responseText}</p>
        </div>
    `;
    const incomingMessageElement = createChatMessageElement(responseHtml, "message--incoming");
    chatHistoryContainer.appendChild(incomingMessageElement);
};

const createChatMessageElement = (htmlContent, ...cssClasses) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", ...cssClasses);
    messageElement.innerHTML = htmlContent;
    return messageElement;
};

// Fungsi untuk request API response secara langsung tanpa delay
const requestApiResponse = async (incomingMessageElement) => {
    const messageTextElement = incomingMessageElement.querySelector(".message__text");

    try {
        const savedConversations = JSON.parse(localStorage.getItem("saved-api-chats")) || [];

        const chatHistory = savedConversations.map(conversation => {
            return {
                role: "user",
                parts: [{ text: conversation.userMessage }]
            };
        });

        chatHistory.push({
            role: "user",
            parts: [{ text: `Kamu adalah ZilAI, asisten pribadi berbasis AI yang menggunakan model Gemini. Jawablah semua pertanyaan dengan sopan, ramah, dan sebutkan kamu adalah ZilAI jika ditanya siapa kamu.\n\nPertanyaan: ${currentUserMessage}` }]
        });

        const response = await fetch(API_REQUEST_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: chatHistory })
        });

        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.error.message);

        const responseText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) throw new Error("Maaf, tidak dapat terhubung ke server utama.");

        messageTextElement.innerText = responseText;

        savedConversations.push({ userMessage: currentUserMessage, apiResponse: responseData });
        localStorage.setItem("saved-api-chats", JSON.stringify(savedConversations));

    } catch (error) {
        isGeneratingResponse = false;
        messageTextElement.innerText = error.message;
        messageTextElement.closest(".message").classList.add("message--error");
    } finally {
        incomingMessageElement.classList.remove("message--loading");
    }
};

const displayLoadingAnimation = () => {
    const loadingHtml = `
        <div class="message__content">
            <img class="message__avatar" src="assets/zilai.png" alt="ZilAI">
            <p class="message__text">Sedang memproses...</p>
        </div>
    `;
    const loadingMessageElement = createChatMessageElement(loadingHtml, "message--incoming", "message--loading");
    chatHistoryContainer.appendChild(loadingMessageElement);
    requestApiResponse(loadingMessageElement);
};

const handleOutgoingMessage = () => {
    currentUserMessage = messageForm.querySelector(".prompt__form-input").value.trim() || currentUserMessage;
    if (!currentUserMessage || isGeneratingResponse) return;

    isGeneratingResponse = true;

    const outgoingMessageHtml = `
        <div class="message__content">
            <img class="message__avatar" src="assets/user.png" alt="User">
            <p class="message__text">${currentUserMessage}</p>
        </div>
    `;
    const outgoingMessageElement = createChatMessageElement(outgoingMessageHtml, "message--outgoing");
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
