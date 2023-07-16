const sortableList = document.querySelector(".sortable-list");
const items = sortableList.querySelectorAll(".item");
const sendButton = document.querySelector("#send-btn");
const promptTextarea = document.querySelector("#prompt");

items.forEach(item => {
    item.addEventListener("dragstart", () => {
        // Adding dragging class to item after a delay
        setTimeout(() => item.classList.add("dragging"), 0);
    });
    // Removing dragging class from item on dragend event
    item.addEventListener("dragend", () => item.classList.remove("dragging"));
});

const initSortableList = (e) => {
    e.preventDefault();
    const draggingItem = document.querySelector(".dragging");
    // Getting all items except currently dragging and making array of them
    let siblings = [...sortableList.querySelectorAll(".item:not(.dragging)")];

    // Finding the sibling after which the dragging item should be placed
    let nextSibling = siblings.find(sibling => {
        // return e.clientY <= sibling.offsetTop + sibling.offsetHeight / 2;
        // Customized for horizontal sort
        return e.clientX <= sibling.offsetLeft + sibling.offsetWidth / 2;
    });

    // Inserting the dragging item before the found sibling
    sortableList.insertBefore(draggingItem, nextSibling);
}

const removeHashtag = (e) => {
    const clicked = e.target;
    clicked.remove();
}

const getPromptRequest = async (prompt) => {
    const API_URL = "http://localhost:8000"; // TODO

    // Define the properties and data for the API request
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            // "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: "text-davinci-003",
            prompt: prompt,
            max_tokens: 2048,
            temperature: 0.2,
            n: 1,
            stop: null
        })
    }

    // Send POST request to API, get response and set the reponse as paragraph element text
    try {
        const response = await (await fetch(API_URL, requestOptions)).json();
        alert(response.answer.trim());
    } catch (error) { // Add error class to the paragraph element and set error text
        alert("error!");
        // pElement.classList.add("error");
        // pElement.textContent = "Oops! Something went wrong while retrieving the response. Please try again.";
    }

    // Remove the typing animation, append the paragraph element and save the chats to local storage
    incomingChatDiv.querySelector(".typing-animation").remove();
    incomingChatDiv.querySelector(".chat-details").appendChild(pElement);
    localStorage.setItem("all-chats", chatContainer.innerHTML);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
}

const submitPrompt = () => {
    prompt = promptTextarea.value.trim(); // Get chatInput value and remove extra spaces
    if(!prompt) return; // If chatInput is empty return from here
    // setTimeout(showTypingAnimation, 500);
    alert(prompt);
    model = document.getElementById("models").value;
    alert(model);
}

sortableList.addEventListener("dragover", initSortableList);
sortableList.addEventListener("dragenter", e => e.preventDefault());
sortableList.addEventListener("dblclick", removeHashtag);
sendButton.addEventListener("click", submitPrompt);