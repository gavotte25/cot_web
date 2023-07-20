const hashtagsDiv = document.getElementById("hashtags");
const hashtagsParent = document.getElementById("hashtagsParent");
const items = hashtagsDiv.querySelectorAll(".item");
const sendButton = document.getElementById("sendBtn");
const processButton = document.getElementById("processBtn");
const promptTextarea = document.getElementById("prompt");
const resultDiv = document.getElementById("result");
const hashtagModal = document.getElementById("hashtagModal");
const toolbar = document.getElementById("toolbar");
const openDrawer = document.getElementById("openDrawer");
const scrollToTopBtn = document.getElementById("scrollToTop");
const hashtagTemplate = `
    <span class="btn btn-outline-primary btn-sm" data-toggle="dropdown" id="{{HASHTAG_SPAN}}" ondblclick="scrollToResult('{{HASHTAG_ID}}')">{{HASHTAG}}</span>
    <div class="dropdown-menu border-0 p-0" aria-labelledby="{{HASHTAG_SPAN}}">
        <div class="d-flex align-items-center">
            <span class="btn btn-secondary btn-sm" data-toggle="modal" data-target="#hashtagModal" data-hashtagvalue="{{HASHTAG}}" data-hashtagid="{{HASHTAG_ID}}">Edit</span>
            <span class="btn btn-secondary btn-sm" onClick="submitWriteRequest('{{HASHTAG_ID}}')" style="margin-left: 1px; margin-right: 1px;">Write</span>
            <span class="btn btn-secondary btn-sm" onClick="removeHashtag('{{HASHTAG_ID}}')">Delete</span>
        </div>
    </div>`;

var currentContext = '';
var canceled = false;
var editable = true;

const addHashtagHtml = `<span class="btn btn-success btn-sm mx-1" id="add_hashtag" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Add new hashtag" data-toggle="modal" data-target="#hashtagModal">&nbsp;+&nbsp;</span>`;

const addSortItemListener = (item) => {
    item.addEventListener("dragstart", () => {
        setTimeout(() => item.classList.add("dragging"), 0);
    });
    item.addEventListener("dragend", () => item.classList.remove("dragging"));
};

const createHashtagItem = (id) => {
    divElement = document.createElement("div");
    divElement.classList.add("dropdown", "item", "mx-1");
    divElement.setAttribute("id", id);
    divElement.setAttribute("draggable", "true");
    divElement.setAttribute("data-bs-toggle", "tooltip");
    divElement.setAttribute("data-bs-placement", "bottom");
    return divElement;
};

const initSortableList = (e) => {
    e.preventDefault();
    const draggingItem = document.querySelector(".dragging");
    let siblings = [...hashtagsDiv.querySelectorAll(".item:not(.dragging)")];
    let nextSibling = siblings.find(sibling => {
        return e.clientX <= sibling.offsetLeft + sibling.offsetWidth / 2;
    });

    hashtagsDiv.insertBefore(draggingItem, nextSibling);
    swapResultPosition(draggingItem, nextSibling)
};

const swapResultPosition = (item1, item2) => {
    if (item1 && item2) {
        resultId1 = "result_" + item1.id;
        resultId2 = "result_" + item2.id;
        result1 = document.getElementById(resultId1);
        result2 = document.getElementById(resultId2);
        if (result1 && result2) {
            resultDiv.insertBefore(result1, result2);
        }
    }
};

const removeHashtag = (id) => {
    document.getElementById(id).remove();
    pElement = document.getElementById("result_" + id);
    if (pElement) {
        pElement.remove();
        empty = true;
        results = resultDiv.querySelectorAll(".result");
        for (let i = 0; i < results.length; i++) {
            if (results[i].textContent) {
                empty = false;
                break;
            };
        }
        if (empty) {
            resultDiv.style.display = "none";
            toolbar.style.display = "none";
        }
    }
}

const showTypingAnimation = (parent) => {
    const html = `
    <div class="typing-animation">
        <div class="typing-dot" style="--delay: 0.2s"></div>
        <div class="typing-dot" style="--delay: 0.3s"></div>
        <div class="typing-dot" style="--delay: 0.4s"></div>
    </div>`;
    parent.innerHTML = html;
};

const updateHashtag = () => {
    id = document.getElementById("hashtagId").value;
    value = document.getElementById("hashtagValue").value;
    if (id) {
        if (value) {
            document.getElementById(id).querySelector("span").textContent = value;
            document.getElementById(id).setAttribute("title", "Edited");
            pElement = document.getElementById("result_" + id);
            if (pElement) {
                pElement.setAttribute("data-toggle","tooltip");
                pElement.setAttribute("title",value);
            }
        }
    } else {
        if (value) {
            id = "hashtag_" + Date.now();
            spanId = "span_" + id;
            item = createHashtagItem(id);
            item.setAttribute("title", "Manual added");
            html = hashtagTemplate.replaceAll("{{HASHTAG}}", value);
            html = html.replaceAll("{{HASHTAG_ID}}", id);
            html = html.replaceAll("{{HASHTAG_SPAN}}", spanId);
            item.innerHTML = html;
            hashtagsDiv.insertBefore(item, null);
            addSortItemListener(item);
            pElement = document.createElement("p");
            pElement.setAttribute("id", "result_" + id);
            pElement.classList.add("result");
            pElement.setAttribute("data-toggle","tooltip");
            pElement.setAttribute("title",value);
            resultDiv.appendChild(pElement);
        }
    }
};

const copyResult = () => {
    content = resultDiv.textContent;
    if (content == "") {
        textArea = resultDiv.querySelector("textarea");
        if (textArea) {
            content = textArea.value;
        }
    }
    navigator.clipboard.writeText(content);
};

const scrollToResult = (hastagId) => {
    id = "result_" + hastagId;
    pElement = document.getElementById(id);
    if (pElement) {
        pElement.scrollIntoView();
    }
}

const editResult = () => {
    if (!editable) {
        return;
    }
    content = resultDiv.textContent;
    height = resultDiv.offsetHeight;
    hashtagsDiv.textContent = "";
    addHashtag = document.getElementById("add_hashtag");
    if (addHashtag) {
        addHashtag.remove();
    }
    processButton.style.display = "none";
    resultDiv.textContent = "";
    textArea = document.createElement("textarea");
    textArea.value = content;
    textArea.classList.add("form-control","border-0", "p-0");
    textArea.offsetHeight = height;
    textArea.setAttribute("style", "height: " + height + "px");
    resultDiv.appendChild(textArea);
    editable = false;
}

const submitPrompt = async () => {
    prompt = promptTextarea.value.trim();
    if (!prompt) return;
    hashtagsDiv.textContent = "";
    addHashtag = document.getElementById("add_hashtag");
    if (addHashtag) {
        addHashtag.remove();
    }
    clearResult();
    currentContext = "";
    resultDiv.classList.add("border", "rounded");
    const API_URL = BASE_URL + "/hashtags";
    pElement = document.createElement("p");
    showTypingAnimation(hashtagsDiv);
    model = document.getElementById("model").value;
    temperature = document.getElementById("temperature").value;
    top_p = document.getElementById("top_p").value;
    frequency_penalty = document.getElementById("frequency_penalty").value;
    presence_penalty = document.getElementById("presence_penalty").value;

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: model,
            prompt: prompt
        })
    }
    try {
        rawResponse = await fetch(API_URL, requestOptions)
        if (rawResponse.status >= 400) {
            errorText = await rawResponse.text();
            alert(errorText);
            hashtagsDiv.textContent = "";
            return;
        }
        response = await rawResponse.json();
        currentContext = response.context;
        hashtagsDiv.textContent = "";
        editable = true;
        i = 0;
        for (key in response.prompts) {
            id = "hashtag_" + i;
            spanId = "span_" + id;
            item = createHashtagItem(id);
            item.setAttribute("title", response.prompts[key]);
            html = hashtagTemplate.replaceAll("{{HASHTAG}}", key);
            html = html.replaceAll("{{HASHTAG_ID}}", id);
            html = html.replaceAll("{{HASHTAG_SPAN}}", spanId);
            item.innerHTML = html;
            hashtagsDiv.appendChild(item);
            addSortItemListener(item);
            pElement = document.createElement("p");
            pElement.setAttribute("id", "result_" + id);
            pElement.classList.add("result");
            pElement.setAttribute("data-toggle","tooltip");
            pElement.setAttribute("title",key);
            resultDiv.appendChild(pElement);
            i += 1;
        }
        hashtagsParent.insertAdjacentHTML("beforeend", addHashtagHtml);
        processButton.style.display = "block";
    } catch (error) {
        alert(error.message)
        hashtagsDiv.textContent = "";
    }
};

const processAll = async () => {
    canceled = false;
    processButton.textContent = "Stop";
    processButton.classList.remove("btn-success");
    processButton.classList.add("btn-danger");
    processButton.removeEventListener("click", processAll);
    processButton.addEventListener("click", stopProcess);
    hashtags = [...hashtagsDiv.querySelectorAll(".item")];
    for (let i = 0; i < hashtags.length; i++) {
        if (canceled) {
            console.log("break");
            break;
        }
        item = hashtags[i];
        pElement = document.getElementById("result_" + item.id);
        if (pElement && pElement.textContent == "") {
            await submitWriteRequest(item.id);
        }
    }
    processButton.removeEventListener("click", stopProcess);
    processButton.textContent = "Process All";
    processButton.classList.remove("btn-danger");
    processButton.classList.add("btn-success");
    processButton.addEventListener("click", processAll);
    processButton.removeAttribute("disabled");
    console.log("addEventListener processAll");
    canceled = false;
}

const insertResult = (element) => {
    resultDiv.appendChild(element);
    toolbar.style.display = "block";
}

const clearResult = () => {
    resultDiv.textContent = "";
    toolbar.style.display = "none";
    resultDiv.style.display = "none";
}

const stopProcess = () => {
    canceled = true;
    processButton.setAttribute("disabled", "");
}

const openNav = () => {
    document.getElementById("mySidenav").style.width = "220px";
    document.getElementById("main").style.marginRight = "220px";
    document.body.style.backgroundColor = "white";
    openDrawer.style.display = "none";
  }
  
const closeNav = () => {
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("main").style.marginRight= "0";
    document.body.style.backgroundColor = "white";
    openDrawer.style.display = "block";
  }

const submitWriteRequest = async (id) => {
    prompt = document.getElementById(id).querySelector("span").textContent.trim();
    if (!prompt) return;
    const API_URL = BASE_URL + "/write";
    pElement = document.getElementById("result_" + id);
    if (!pElement) {
        return;
    }
    resultDiv.style.display = "block";
    showTypingAnimation(pElement);
    model = document.getElementById("model").value;
    temperature = document.getElementById("temperature").value;
    top_p = document.getElementById("top_p").value;
    frequency_penalty = document.getElementById("frequency_penalty").value;
    presence_penalty = document.getElementById("presence_penalty").value;

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            context: currentContext,
            prompt: prompt,
            model: model,
            temperature: temperature,
            top_p: top_p,
            frequency_penalty: frequency_penalty,
            presence_penalty: presence_penalty
        })
    }

    try {
        rawResponse = await fetch(API_URL, requestOptions)
        if (rawResponse.status >= 400) {
            errorText = await rawResponse.text();
            alert(errorText);
            pElement.textContent = "";
        } else {
            response = await rawResponse.text();
            pElement.textContent = response;
            if (pElement.textContent) {
                toolbar.style.display = "block";
            }
            pElement.scrollIntoView();
            span = document.getElementById("span_" + id);
            if (span) {
                span.classList.remove("btn-outline-primary");
                span.classList.add("btn-primary");
            }
        }
    } catch (error) {
        alert(error.message)
        pElement.textContent = "";
    }
    content = resultDiv.textContent;
    if (content == "") {
        resultDiv.style.display = "none";
    }
};

function scrollFunction() {
  if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
    scrollToTopBtn.style.display = "block";
  } else {
    scrollToTopBtn.style.display = "none";
  }
}

function topFunction() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

hashtagsDiv.addEventListener("dragover", initSortableList);
hashtagsDiv.addEventListener("dragenter", e => e.preventDefault());
sendButton.addEventListener("click", submitPrompt);
processButton.addEventListener("click", processAll);
window.onscroll = function() {scrollFunction()};