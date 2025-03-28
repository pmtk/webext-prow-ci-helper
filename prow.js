'use strict';

(async () => {
    const gcsRootDomain = "https://gcsweb-ci.apps.ci.l2s4.p1.openshiftapps.com";

    const artifactsRootDir = Array.from(document.getElementsByTagName('a')).filter((n) => n.innerText.includes("Artifacts"))[0].href;
    const prowjobJsonUrl = artifactsRootDir + "/prowjob.json";

    const prowjob = JSON.parse(await browser.runtime.sendMessage({ url: prowjobJsonUrl },));
    console.debug("Fetched prowjob.json: ", prowjob);

    if (prowjob.spec.pod_spec.containers.length === 0) {
        throw new Error("Prow job's PodSpec contains 0 containers");
    }

    const workflowName = prowjob.spec.pod_spec.containers[0].args.filter((n) => n.includes("--target"))[0].split("=")[1];
    console.debug("Got workflow name from the prowjob.json: ", workflowName);

    const workflow_uri = artifactsRootDir + "/artifacts/" + workflowName + "/";
    const orgRepo = prowjob.metadata.labels["prow.k8s.io/refs.org"] + "-" + prowjob.metadata.labels["prow.k8s.io/refs.repo"] + "-";

    const workflowArtifactsSource = await browser.runtime.sendMessage({ url: workflow_uri },);

    const parser = new DOMParser();
    const workflowArtifactsPage = parser.parseFromString(workflowArtifactsSource, `text/html`);

    // Get links to steps' results.
    const allLinks = Array.from(workflowArtifactsPage.getElementsByTagName('a'));
    // Filter out those not starting with '/gcs' and the '..' (go dir up)
    const filtered = allLinks.filter((n) => n.pathname.startsWith('/gcs') && !n.innerText.includes(".."));
    // Create an array of objects {name, url}
    const parsed = filtered.map((n) => (
        {
            name: n.innerText.trim().replaceAll("/", "").replaceAll(orgRepo, ""),
            url: gcsRootDomain + n.pathname + "build-log.txt",
            dir: gcsRootDomain + n.pathname
        }));

    console.log("Parsed links to workflow's steps' build-log.txt:", parsed);

    // Setup listener that will respond to messages sent from the page action's popup.
    browser.runtime.onMessage.addListener((msg, sender, sr) => {
        console.log("Received message from popup", msg);
        console.log("Sender", sender);
        return Promise.resolve({ links: parsed });
    });
})();
