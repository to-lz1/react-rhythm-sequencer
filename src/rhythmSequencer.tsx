import React from 'react';
import ReactDOM from 'react-dom';
import BufferLoader from './bufferLoader';
import Slider from '@mui/material/Slider';
import Track from './track';
import LEDLine from './ledLine';

// スケジューリング間隔（milliseconds, handled by javascript clock)
const SCHEDULER_TICK = 25.0;
// スケジューリング先読み範囲（sec, handled by WebAudio clock)
const SCHEDULER_LOOK_AHEAD = 0.1;

//audio context initialization
window.AudioContext = window.AudioContext;
const audioContext = new AudioContext();

//loading audio buffers
const bufferLoader = new BufferLoader(
  audioContext,
  [
    'sounds/hihat_open.wav',
    'sounds/hihat_close.wav',
    'sounds/snare.wav',
    'sounds/kick.wav'
  ]
);
bufferLoader.load();

// run a worker process to schedule next note(s)
const timerWorker = new Worker(new URL('./timerWorker.ts', import.meta.url));
timerWorker.postMessage({"interval": SCHEDULER_TICK});

class RhythmSequencer extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
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
      noteTime: 0.0,
      swing: 0
    };
    timerWorker.onmessage = (({data}: {data: string}) => {
      if (data === "tick") {
        this.schedule();
      }
    }).bind(this);
  }

  render() {
    return (
      <div className="sequencer">
        <div className="area-tracks">
          {[...Array(4).keys()].map((_,i) =>
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
          <label className="label-bpm">[bpm]</label>
          <div style={{width: '200px', padding: '0 16px'}}>
            <Slider min={40} max={250} step={1} size="medium"
              defaultValue={100} valueLabelDisplay="auto" onChange={this.handleBpmSliderChange}/>
          </div>
        </div>
        <div className="area-swing">
          <span className="label-swing">[swing]</span>
          <div style={{width: '200px', padding: '0 16px'}}>
            <Slider min={0} max={100} step={1} size="medium"
              defaultValue={0} valueLabelDisplay="auto" onChange={this.handleSwingSliderChange}/>
          </div>
        </div>
      </div>
    );
  }

  handleBpmSliderChange = (e: Event, value: number | number[], activeThumb: number) => {
    this.setState({bpm: value});
  }

  handleSwingSliderChange = (e: Event, value: number | number[], activeThumb: number) => {
    this.setState({swing: value});
  }

  shuffleNotes(){
    let tr = this.state.tracks.slice();
    tr[0].steps = this.generateSequence(0.1);
    tr[1].steps = this.generateSequence(0.6);
    tr[2].steps = this.generateSequence(0.25);
    tr[3].steps = this.generateSequence(0.33);
    this.setState({tracks: tr});
  }

  generateSequence(density: number){
    const newSeq = [...Array(16).keys()].map((x, i) =>{
      let random = Math.random();
      return random <= density ? '■' : null;
    });
    return newSeq;
  }

  toggleStep(idxTrack: number, idxNote: number) {
    let tr = this.state.tracks.slice();
    tr[idxTrack].steps[idxNote] = tr[idxTrack].steps[idxNote] == null ? '■' : null;
    this.setState({tracks: tr});
  }

  togglePlayButton(){
      if (this.state.isPlaying === false) {
        audioContext.resume().then(() => {
          timerWorker.postMessage("start");
          this.setState({
            // to avoid first note delay
            noteTime: audioContext.currentTime + SCHEDULER_TICK/1000,
            isPlaying: true,
          });
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
    while (this.state.noteTime < audioContext.currentTime + SCHEDULER_LOOK_AHEAD ) {
        this.scheduleSound( this.state.idxCurrent16thNote, this.state.noteTime );
        this.setNextNoteTime();
    }
  }

  scheduleSound(idxNote: number, time: number) {
      this.state.tracks.forEach((tr: any, i: number) =>{
        if (tr.steps[idxNote]) {
            const source = audioContext.createBufferSource();
            source.buffer = bufferLoader.bufferList[i];
            source.connect(audioContext.destination);
            source.start(time);
        }
      });
  }

  setNextNoteTime() {
      const secondsPerNote = 15.0 / this.state.bpm; // 60[seconds] / bpm / 4[notes per beat]
      const swingRateCorrection =
        this.state.idxCurrent16thNote % 2 === 0 ?
        1 + this.state.swing/(100 * 3) : 1 - this.state.swing/(100 * 3);
      this.setState({
        noteTime: this.state.noteTime + secondsPerNote * swingRateCorrection,
        idxCurrent16thNote: (this.state.idxCurrent16thNote + 1) % 16,
    });
  }
}
// ========================================

ReactDOM.render(
  <RhythmSequencer />,
  document.getElementById('root')
);
