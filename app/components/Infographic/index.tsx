import React from 'react';
import {
    NumberOutput,
} from '@the-deep/deep-ui';

import styles from './styles.css';

interface InfoGraphicProps {
    totalValue: number;
    description: React.ReactNode;
    date: React.ReactNode;
    chart: React.ReactNode;
}

function Infographic(props: InfoGraphicProps) {
    const {
        totalValue,
        description,
        date,
        chart,
    } = props;

    return (
        <div className={styles.infographic}>
            <div>
                <NumberOutput
                    className={styles.totalValue}
                    value={totalValue}
                    precision={1}
                    normal
                />
                <div className={styles.description}>
                    {description}
                </div>
                <div className={styles.date}>
                    {date}
                </div>
            </div>
            <div className={styles.chart}>
                {chart}
            </div>
        </div>
    );
}
export default Infographic;
