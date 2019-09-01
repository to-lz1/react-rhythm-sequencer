import React from 'react';

function Square (props) {
    return (
        <button className="note" onClick={()=>props.onClick()}>
            {props.marking}
        </button>
    );
}

export default class Track extends React.Component {
    render() {
        return (
        <div className="track">
            <span className="track-name">{this.props.name}</span>
            { Array(16).fill().map((_, i) =>
                <Square
                key={i}
                marking={this.props.squares[i]}
                onClick={()=>this.props.handler(i)}
                />
            )}
        </div>
        );
    }
}
