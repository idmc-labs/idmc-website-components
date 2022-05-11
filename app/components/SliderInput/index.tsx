import React, { RefCallback, HTMLProps } from 'react';
import ReactSlider from 'react-slider';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

interface HTMLPropsWithRefCallback<T> extends HTMLProps<T> {
    ref: RefCallback<T>;
}

function Mark(
    props: HTMLPropsWithRefCallback<HTMLDivElement>,
) {
    return (
        <span
            {...props}
            className={styles.mark}
        />
    );
}

interface HTMLPropsWithRefCallback<T> extends HTMLProps<T> {
    ref: RefCallback<T>;
}

function Thumb(
    props: HTMLPropsWithRefCallback<HTMLDivElement>,
) {
    return (
        <div
            {...props}
            className={styles.thumb}
        />
    );
}

function Track<T extends number | number[]>(
    props: HTMLPropsWithRefCallback<HTMLDivElement>,
    state: { index: number; value: T },
) {
    const { index } = state;
    return (
        <div
            {...props}
            // index={index}
            className={_cs(
                styles.track,
                index === 1 && styles.center,
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
    hideValues?: boolean;
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
        hideValues,
    } = props;

    const marks = Array.from(
        { length: max - min + 1 },
        (_, i) => i + min,
    );

    return (
        <div className={_cs(styles.slider, className)}>
            {typeof value !== 'number' && !hideValues && (
                <div className={styles.value}>
                    {value[0]}
                </div>
            )}
            <ReactSlider
                className={styles.reactSlider}
                min={min}
                max={max}
                step={step}
                marks={marks}
                minDistance={minDistance}
                pearling
                value={value}
                onChange={onChange}
                renderThumb={Thumb}
                renderTrack={Track}
                renderMark={Mark}
            />
            {typeof value !== 'number' && !hideValues && (
                <div className={styles.value}>
                    {value[1]}
                </div>
            )}
        </div>
    );
}

export default Slider;
