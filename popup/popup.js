'use strict';

const prow_baseurl = "https://prow.ci.openshift.org/view/gs/test-platform-results/logs/";

(async () => {
  function update_popup_contents(html) {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(html, `text/html`);
    const tags = parsed.getElementsByTagName(`body`);

    document.querySelector("#content").innerHTML = ``;
    for (const tag of tags) {
      document.querySelector("#content").appendChild(tag);
    }
  }

  if (typeof browser === "undefined") {
    var browser = chrome;
  }

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  browser.tabs.sendMessage(tab.id, {})
    .then((resp) => {
      console.log("Response from content script:", resp)

      const links = resp.links;
      if (links.length == 0) {
        update_popup_contents(`<h3>No steps found in artifacts</h3>`);
        return;
      }

      const html = links.map((link) => (
        `<li>
        <a target="_blank" rel="noopener noreferrer" href='${link.url}'>${link.name}</a>
        (<a target="_blank" rel="noopener noreferrer" href='${link.dir}'>dir</a>)
        </li>`)).join('\n');

      update_popup_contents(`<h3>Links to build-log.txt</h3>
      <ul>
      ${html} 
      </ul>`);
    })
    .catch(e => {
      console.log("err", e.message)
      if (e.message.includes("Could not establish connection")) {
        console.log("Page script didn't finish yet. Retry.")
        update_popup_contents(`<h3>Error</h3><p>Page script didn't finish yet. Retry by clicking the icon again.</p>`);
      } else {
        update_popup_contents(`<h3>Error</h3><p>${e.message}</p>`);
      }
    });
})();
