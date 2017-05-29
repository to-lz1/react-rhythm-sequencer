import React from 'react';
import ReactDOM from 'react-dom';
import BufferLoader from './bufferloader.js';
import Slider from 'react-toolbox/lib/slider';


// スケジューリング間隔（milliseconds, handled by javascript clock)
var SCHEDULER_TICK = 25.0;
// スケジューリング先読み範囲（sec, handled by WebAudio clock)
var SCHEDULER_LOOK_AHEAD = 0.1;

//audio context initialization
window.AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext = new AudioContext();

//loadimg audio buffers
var bufferLoader = new BufferLoader(
  audioContext,
  ['sounds/hihat_open.wav',
    'sounds/hihat_close.wav',
    'sounds/snare.wav',
    'sounds/kick.wav'],
  ()=>console.log('audio resource loading finished.'));
bufferLoader.load();

// run a worker process to schedule next note(s)
var timerWorker = new Worker('scripts/timerworker.js');
timerWorker.postMessage({"interval": SCHEDULER_TICK});

function Square (props) {
    return (
        <button className="note" onClick={()=>props.onClick()}>
            {props.marking}
        </button>
    );
}

class Track extends React.Component {
  render() {
    return (
        <div className="track">
          <span className="track-name">{this.props.name}</span>
          {Array(16).fill().map((x,i) =>
            <Square 
              key={i}
              marking={this.props.squares[i]}
              onClick={()=>this.props.handler(i)}
            />)}
        </div>
    );
  }
}

class LEDLine extends React.Component {
  render() {
    return (
        <div className="track">
          <span className="track-name"></span>
          {Array(16).fill().map((x,i) =>
          <button className={
            (this.props.isPlaying && this.props.idxCurrent16thNote == (i+1)%16)? "led  led-playing" : "led"
            } key={i} disabled />)}
        </div>
    );
  }
}

class Sequencer extends React.Component {
  constructor() {
    super();
    this.state = {
      tracks: [
        {name:"hihat-open",
         steps: [null,null,null,null,null,null,null,null,null,null,'■',null,null,null,null,null]},
        {name:"hihat-close",
         steps: ['■','■','■',null,'■',null,'■',null,'■',null,null,null,'■',null,'■',null]},
        {name:"snare",
         steps: [null,null,null,null,'■',null,null,null,null,null,null,null,'■',null,null,'■']},
        {name:"kick",
         steps: ['■',null,null,null,null,null,null,'■',null,'■','■',null,null,'■',null,null]},
      ],
      bpm: 100,
      isPlaying: false,
      idxCurrent16thNote: 0,
      startTime: 0.0,
      nextNoteTime: 0.0,
      swing: 0
    };
    timerWorker.onmessage = function(e) {
      if(e.data=="tick"){
            this.schedule();
      }
    }.bind(this);
  }

  render() {
    return (
      <div className="sequencer">
        <div className="area-tracks">
          {Array(4).fill().map((x,i) =>
            <Track 
              key={i}
              name={this.state.tracks[i].name}
              squares={this.state.tracks[i].steps}
              handler={(idx)=>this.toggleStep(i, idx)}
            />
            )
          }
          <LEDLine
            isPlaying={this.state.isPlaying}
            idxCurrent16thNote={this.state.idxCurrent16thNote}
          />
        </div>
        <hr />
        <div className="area-play">
          <button className="button-play" onClick={()=>this.togglePlayButton()}>
            {this.state.isPlaying ? '■STOP' : '▶PLAY!'}
          </button>
        </div>
        <div className="area-shuffle">
          <button className="button-shuffle" onClick={()=>this.shuffleNotes()}>SHUFFLE</button>
        </div>
        <div className="area-bpm">
          <span className="label-bpm">[bpm]</span>
          <div style={{display: 'inline-block', width: '200px'}}>
            <Slider min={40} max={250} step={1}
              editable pinned value={this.state.bpm} onChange={this.handleSliderChange.bind(this, 'bpm')}/>
          </div>
        </div>
        <div className="area-swing">
          <span className="label-swing">[swing]</span>
          <div style={{display: 'inline-block', width: '200px'}}>
            <Slider min={0} max={100} step={1}
              editable pinned value={this.state.swing} onChange={this.handleSliderChange.bind(this, 'swing')}/>
          </div>
        </div>
      </div>
    );
  }

    handleSliderChange(slider, value){
      const newState = {};
      newState[slider] = value;
      this.setState(newState);
    }

  shuffleNotes(){
    let tr = this.state.tracks.slice();
    tr[0].steps = this.generateSequence(0.1);
    tr[1].steps = this.generateSequence(0.6);
    tr[2].steps = this.generateSequence(0.25);
    tr[3].steps = this.generateSequence(0.33);
    this.setState({tracks: tr});
  }

  generateSequence(density){
    var newSeq = Array(16).fill().map((x,i) =>{
      let random = Math.random();
      return random <= density ? '■' : null;
    });
    return newSeq;
  }

  toggleStep(idxTrack, idxNote) {
    let tr = this.state.tracks.slice();
    tr[idxTrack].steps[idxNote] = tr[idxTrack].steps[idxNote] == null ? '■' : null;
    this.setState({tracks: tr});
  }

  togglePlayButton(){
      if (this.state.isPlaying == false) {
          timerWorker.postMessage("start");
          this.setState({
            // to avoid first note delay
            nextNoteTime: audioContext.currentTime + SCHEDULER_TICK/1000,
            isPlaying: true,
          });
      } else {
          timerWorker.postMessage("stop");
          this.setState({
            idxCurrent16thNote: 0,
            isPlaying: false,
          });
      }
  }

  schedule() {
    while (this.state.nextNoteTime < audioContext.currentTime + SCHEDULER_LOOK_AHEAD ) {
        this.scheduleSound( this.state.idxCurrent16thNote, this.state.nextNoteTime );
        this.nextNote();
    }
  }

  scheduleSound(idxNote, time) {
      this.state.tracks.map((tr, i) =>{
        if(tr.steps[idxNote])
        {
            let source = audioContext.createBufferSource();
            source.buffer = bufferLoader.bufferList[i];
            source.connect(audioContext.destination);
            source.start(time);
        }
      });
  }

  nextNote() {
      let secondsPerBeat = 60.0 / this.state.bpm;
      let noteRateWithSwingCalc = 
        this.state.idxCurrent16thNote % 2 == 0 ?
        1/4 + 1/1200*this.state.swing : 1/4 - 1/1200*this.state.swing;
      this.setState({
        nextNoteTime: this.state.nextNoteTime + noteRateWithSwingCalc * secondsPerBeat,
        idxCurrent16thNote: (this.state.idxCurrent16thNote + 1) % 16,
    });
  }
}
// ========================================

ReactDOM.render(
  <Sequencer />,
  document.getElementById('root')
);