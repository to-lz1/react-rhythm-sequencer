export default class BufferLoader {

  private context: AudioContext;
  private urlList: string[];
  bufferList: AudioBuffer[];

  constructor(context: AudioContext, urlList: string[]) {
    this.context = context;
    this.urlList = urlList;
    this.bufferList = new Array();
  }

  loadBuffer(url: string, index: number) {
    const request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    request.onload = () => {
      this.context.decodeAudioData(request.response).then(
        (buffer: AudioBuffer) =>  this.bufferList[index] = buffer
      );
    }
    request.onerror = (e) => {
      console.error(`XHR Request error: ${e}`);
    }
    request.send();
  }

  load() {
    this.urlList.forEach((url, i) => this.loadBuffer(url, i));
  }
};
