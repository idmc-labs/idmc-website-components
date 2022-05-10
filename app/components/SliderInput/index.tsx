import React from 'react';
import ReactSlider from 'react-slider';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

// FIXME: set appropriate typings
function Thumb(props, state) {
    return (
        <div
            {...props}
            className={styles.thumb}
        >
            {state.valueNow}
        </div>
    );
}

// FIXME: set appropriate typings
function Track(props, state) {
    return (
        <div
            {...props}
            index={state.index}
            className={styles.track}
        />
    );
}

interface Props<T extends number | number[]> {
    className?: string;
    min: number;
    max: number;
    value: T;
    onChange: (value: T) => void;
    step: number;
    minDistance: number;
}

function Slider<T extends number | number[]>(props: Props<T>) {
    const {
        min,
        max,
        className,
        value,
        onChange,
        step,
        minDistance,
    } = props;

    return (
        <ReactSlider
            className={_cs(styles.slider, className)}
            min={min}
            max={max}
            step={step}
            minDistance={minDistance}
            pearling
            value={value}
            onChange={onChange}
            renderThumb={Thumb}
            renderTrack={Track}
        />
    );
}

export default Slider;
