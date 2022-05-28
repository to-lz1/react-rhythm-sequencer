const worker: Worker = self as any;

let timerID: number | undefined;
let interval = 25;

function startTick() {
  timerID = setInterval(() => worker.postMessage('tick'), interval);
}

worker.addEventListener('message', (event: MessageEvent<any>) => {
  if (event.data.interval) {
    interval = event.data.interval;
    console.log(`set interval. interval: ${interval}ms`);
    if (timerID) {
      clearInterval(timerID);
      startTick(); // replace existing timer, if already ticking.
    }
  } else if (event.data === 'start') {
    startTick();
  } else if (event.data === 'stop') {
    clearInterval(timerID);
    timerID = undefined;
  }
});
