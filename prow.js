'use strict';

(async () => {
    const gcsRootDomain = "https://gcsweb-ci.apps.ci.l2s4.p1.openshiftapps.com";

    const artifactsRootDir = Array.from(document.getElementsByTagName('a')).filter((n) => n.innerText.includes("Artifacts"))[0].href;
    const prowjobJsonUrl = artifactsRootDir + "/prowjob.json";

    let orgRepo;

    fetch(prowjobJsonUrl)
        .then(response => response.text())
        .then(t => {
            const prowjobJson = JSON.parse(t);
            console.debug("Fetched prowjob.json: ", prowjobJson);

            if (prowjobJson.spec.pod_spec.containers.length === 0) {
                throw new Error("Prow job's PodSpec contains 0 containers");
            }

            const workflowName = prowjobJson.spec.pod_spec.containers[0].args.filter((n) => n.includes("--target"))[0].split("=")[1];
            console.debug("Got workflow name from the prowjob.json: ", workflowName);
            const workflow_uri = artifactsRootDir + "/artifacts/" + workflowName + "/";

            orgRepo = prowjobJson.metadata.labels["prow.k8s.io/refs.org"] + "-" + prowjobJson.metadata.labels["prow.k8s.io/refs.repo"] + "-";

            return fetch(workflow_uri);
        })
        .then(response => response.text())
        .then(t => {
            // Turn fetched artifacts/workflowName/ contents into HTML object.
            var el = document.createElement('html');
            el.innerHTML = t;
            el.getElementsByTagName('a');

            // Get links to steps' results.
            const allLinks = Array.from(el.getElementsByTagName('a'));
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
            browser.runtime.onMessage.addListener((msg) => {
                console.log("Received message from popup", msg);
                return Promise.resolve({ links: parsed });
            });

            return parsed;
        });
})();
