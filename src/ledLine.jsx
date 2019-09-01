import React from "react";

export default class LEDLine extends React.Component {
    render() {
        return (
        <div className="track">
            <span className="track-name"></span>
            { Array(16).fill().map((_, i) =>
                <button
                className={ this.isLighted(i) ? "led  led-playing" : "led" }
                key={i} disabled
                />
            )}
        </div>
        );
    }

    isLighted(index) {
        return this.props.isPlaying && this.props.idxCurrent16thNote === (index + 1) % 16;
    }
}