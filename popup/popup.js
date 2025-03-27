
const prow_baseurl = "https://prow.ci.openshift.org/view/gs/test-platform-results/logs/";

(async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  if (!tab.url.includes(prow_baseurl)) {
    document.querySelector("#content").innerHTML = `<h3>Extension is only usable on Prow CI jobs</h3>`;
    return;
  }

  browser.tabs.executeScript({ file: "/prow.js" })
    .then(res => {
      links = res[0];
      console.log("Links from content script:", links);
      if (links.length == 0) {
        document.querySelector("#content").innerHTML = `<h3>No steps found in artifacts</h3>`;
        return;
      }

      html = links.map((link) => (
        `<li>
        <a target="_blank" rel="noopener noreferrer" href='${link.url}'>${link.name}</a>
        (<a target="_blank" rel="noopener noreferrer" href='${link.dir}'>dir</a>)
        </li>`)).join('\n');

      document.querySelector("#content").innerHTML = `
      <h3>Links to build-log.txt</h3>
      <ul>
      ${html} 
      </ul>`;
    })
    .catch(e => {
      document.querySelector("#content").innerHTML = `
      <h3>Error</h3>
      <p>${e.message}</p>`;
    });
})();
