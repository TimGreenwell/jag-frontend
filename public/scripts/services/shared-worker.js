const mutations = {
    ADD: 'ADD',
    SET: 'SET'
}

const browserInstances = [];
const messages = [];

onconnect = function(e) {
    console.log("Worker making initial connection");
    const port = e.ports[0];
    browserInstances.push(port);

    port.onmessage = function(event) {
        console.log(event);
        // console.log("Worker received message");
        // switch(data.mutation) {
        //     case mutations.ADD:
        //         messages = [...messages, data.value];
        //         break;
        //     case mutations.SET:
        //         messages = data.value;
        //         break;
        // }
        //
        // if (!Array.isArray(data.value)) {
        //     data.value = [data.value];
        // }

        browserInstances.forEach(instance => {
            console.log("Worker sending message");
       //    instance.postMessage(message);
            instance.postMessage(event.data);
        });
    }
}