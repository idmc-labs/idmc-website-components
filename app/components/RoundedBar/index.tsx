import React from 'react';

// NOTE: No types defined by Recharts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RoundedBar(props: any) {
    const {
        fill,
        x,
        y,
        width,
        height,
    } = props;

    return (
        <rect
            x={x}
            y={y}
            rx={width / 2}
            width={width}
            height={height}
            stroke="none"
            fill={fill}
        />
    );
}

export default RoundedBar;
