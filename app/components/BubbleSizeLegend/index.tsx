import React, { useMemo } from 'react';
import { _cs } from '@togglecorp/fujs';

import Numeral from '#components/Numeral';
import {
    getLogRadius,
    BUBBLE_RADIUS_MIN,
    BUBBLE_RADIUS_MAX,
} from '#utils/common';

import styles from './styles.css';

const LEADER_LENGTH = 14;
const LABEL_WIDTH = 44;

function niceRound(value: number) {
    if (value <= 0) {
        return 0;
    }
    const magnitude = 10 ** Math.floor(Math.log10(value));
    return Math.round(value / magnitude) * magnitude;
}

function getLegendValues(domainMax: number) {
    const values: number[] = [];
    let current = niceRound(domainMax);
    while (current >= 1 && values.length < 3) {
        values.push(current);
        current = niceRound(current / 100);
    }
    return values;
}

interface Props {
    className?: string;
    title?: string;
    domainMin: number;
    domainMax: number;
    // Where the labelled circles sit, when the sizing domain is a fixed ceiling rather than
    // the data on screen. Without it the legend advertises a bubble nothing on the map has.
    valueMax?: number;
    // Required, not defaulted: the legend labels the same figures the map does, and an
    // optional flag is how this one silently stopped following the map's number format.
    abbreviate: boolean;
}

function BubbleSizeLegend(props: Props) {
    const {
        className,
        title = 'Number of internal displacements',
        domainMin,
        domainMax,
        valueMax = domainMax,
        abbreviate,
    } = props;

    const items = useMemo(() => (
        getLegendValues(Math.min(valueMax, domainMax)).map((value) => ({
            value,
            radius: getLogRadius(
                value,
                domainMin,
                domainMax,
                BUBBLE_RADIUS_MIN,
                BUBBLE_RADIUS_MAX,
            ),
        }))
    ), [domainMin, domainMax, valueMax]);

    if (domainMax <= 0 || items.length === 0) {
        return null;
    }

    const maxRadius = items[0].radius;
    const diameter = 2 * maxRadius;

    return (
        <div className={_cs(styles.sizeLegend, className)}>
            {title && (
                <div className={styles.title}>
                    {title}
                </div>
            )}
            <div
                className={styles.plot}
                style={{
                    height: diameter,
                    width: diameter + LEADER_LENGTH + LABEL_WIDTH,
                }}
            >
                <div
                    className={styles.circles}
                    style={{ width: diameter, height: diameter }}
                >
                    {items.map((item) => (
                        <span
                            key={item.value}
                            className={styles.circle}
                            style={{ width: 2 * item.radius, height: 2 * item.radius }}
                        />
                    ))}
                </div>
                {items.map((item) => {
                    const top = diameter - (2 * item.radius);
                    return (
                        <React.Fragment key={item.value}>
                            <span
                                className={styles.leader}
                                style={{
                                    top,
                                    left: maxRadius,
                                    width: maxRadius + LEADER_LENGTH,
                                }}
                            />
                            <span
                                className={styles.label}
                                style={{ top, left: diameter + LEADER_LENGTH }}
                            >
                                <Numeral value={item.value} abbreviate={abbreviate} />
                            </span>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}

export default BubbleSizeLegend;
