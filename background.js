'use strict';

function handleMessage(message, sender, sendResponse) {
    return fetch(message.url).then(response => response.text())
}

browser.runtime.onMessage.addListener(handleMessage);
