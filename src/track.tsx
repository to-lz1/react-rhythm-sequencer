import React from 'react';

interface SquareProps {
    marking: string;
    onClick: () => void;
}
const Square: React.FC<SquareProps> = (props) => {
  return (
    <button className="note" onClick={()=>props.onClick()}>
      {props.marking}
    </button>
  );
};

interface TrackProps {
    name: string;
    squares: string[];
    handler: (i: number) => void;
}

export default class Track extends React.Component<TrackProps> {
  render() {
    return (
      <div className="track">
        <span className="track-name">{this.props.name}</span>
        { [...Array(16).keys()].map((_, i) =>
          <Square
            key={i}
            marking={this.props.squares[i]}
            onClick={()=>this.props.handler(i)}
          />,
        )}
      </div>
    );
  }
}
