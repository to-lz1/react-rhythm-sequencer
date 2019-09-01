export default class BufferLoader {

  constructor(context, urlList) {
    this.context = context;
    this.urlList = urlList;
    this.bufferList = new Array();
  }

  loadBuffer(url, index) {
    const request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    request.onload = () => {
      this.context.decodeAudioData(request.response).then(
        (buffer) =>  this.bufferList[index] = buffer
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
