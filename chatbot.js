// Define variables for accessing UI elements
const sendButton = document.getElementById("sendBTN");
const chatInput = document.getElementById("chat-input");
const chatbox = document.querySelector(".chatbox");

// Backend URL (replace with your backend URL if deploying)
const backendURL = 'http://localhost:8080/assistant';

// Function to append messages to the chatbox
function appendMessage(message, sender) {
    const messageElement = document.createElement('li');
    messageElement.classList.add(sender, 'chat');
    const messageText = document.createElement('p');
    messageText.textContent = message;
    messageElement.appendChild(messageText);
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight;  // Scroll to the bottom
}

// Function to handle sending messages
async function sendMessage() {
    const userMessage = chatInput.value;
    if (!userMessage.trim()) return;

    // Append user message to chat
    appendMessage(userMessage, 'chat-outgoing');
    chatInput.value = '';  // Clear the input field

    // Call the backend API
    try {
        const response = await fetch(backendURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: userMessage }),
        });

        const data = await response.json();
        const gptMessage = data.message;

        // Append GPT's response to chat
        appendMessage(gptMessage, 'chat-incoming');
    } catch (error) {
        console.error('Error:', error);
        appendMessage('Sorry, something went wrong. Please try again later.', 'chat-incoming');
    }
}

// Event listener for button click
sendButton.addEventListener('click', sendMessage);

// Allow pressing Enter to send the message
chatInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();  // Prevent creating a new line
        sendMessage();
    }
});

// Function to close the chatbot (from the close button)
function cancel() {
    document.querySelector(".chatBot").style.display = "none";
}
