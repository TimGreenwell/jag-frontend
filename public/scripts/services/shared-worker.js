const browserInstances = [];

onconnect = function(e) {
    console.log("Worker making initial connection");
    const port = e.ports[0];
    browserInstances.push(port);

    port.onmessage = function(event) {
        browserInstances.forEach(instance => {
            instance.postMessage(event.data);
        });
    }
}