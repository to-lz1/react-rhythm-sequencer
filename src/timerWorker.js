let timerID=null;
let interval=25;

function startTick() {
    timerID = setInterval(() => self.postMessage("tick"), interval);
}

self.onmessage=function(message){
    if (message.data.interval) {
        interval = message.data.interval;
        console.log(`set interval. interval: ${interval}ms`);
        if (timerID) {
            clearInterval(timerID);
            startTick(); // replace existing timer, if already ticking.
        }
    }
	else if (message.data === "start") {
		startTick();
	}
	else if (message.data === "stop") {
		clearInterval(timerID);
		timerID=null;
	}
};
