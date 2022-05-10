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
        />
    );
}

// FIXME: set appropriate typings
function Track(props, state) {
    return (
        <div
            {...props}
            index={state.index}
            className={_cs(
                styles.track,
                state.index === 1 && styles.center,
            )}
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
        <div className={_cs(styles.slider, className)}>
            <ReactSlider
                className={styles.reactSlider}
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
            {typeof value !== 'number' && (
                <div className={styles.selectedRange}>
                    {`${value[0]} - ${value[1]}`}
                </div>
            )}
        </div>
    );
}

export default Slider;
