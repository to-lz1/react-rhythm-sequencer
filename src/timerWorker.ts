// eslint-disable-next-line @typescript-eslint/no-explicit-any
const worker: Worker = self as any;

let timerID: number | undefined;
let interval = 25;

function startTick() {
  timerID = setInterval(() => worker.postMessage('tick'), interval);
}

type SchedulingData = string | { interval: number }

worker.addEventListener('message', (event: MessageEvent<SchedulingData>) => {
  const data = event.data
  if (typeof data === "object" && data !== null) {
    interval = data.interval;
    console.log(`set interval. interval: ${interval}ms`);
    if (timerID) {
      clearInterval(timerID);
      startTick(); // replace existing timer, if already ticking.
    }
  } else if (data === 'start') {
    startTick();
  } else if (data === 'stop') {
    clearInterval(timerID);
    timerID = undefined;
  }
});
