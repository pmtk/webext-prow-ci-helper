'use strict';

if (typeof browser === "undefined") {
    var browser = chrome;
}

function handleMessage(message, sender, sendResponse) {
    fetch(message.url).then(response => response.text()).then(sendResponse);
    return true;
}

browser.runtime.onMessage.addListener(handleMessage);
