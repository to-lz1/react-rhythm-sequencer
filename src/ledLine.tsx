import React from "react";

interface LEDLineProps {
    isPlaying: boolean;
    idxCurrent16thNote: number;
}

export default class LEDLine extends React.Component<LEDLineProps> {

    render() {
        return (
        <div className="track">
            <span className="track-name"></span>
            { [...Array(16).keys()].map((_, i) =>
                <button
                className={ this.isLighted(i) ? "led  led-playing" : "led" }
                key={i} disabled
                />
            )}
        </div>
        );
    }

    isLighted(index: number) {
        return this.props.isPlaying && this.props.idxCurrent16thNote === (index + 1) % 16;
    }
}
