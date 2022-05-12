import React from 'react';
import {
    NumberOutput,
} from '@the-deep/deep-ui';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

interface InfoGraphicProps {
    className?: string;
    totalValue: number;
    description: React.ReactNode;
    date: React.ReactNode;
    chart: React.ReactNode;
}

function Infographic(props: InfoGraphicProps) {
    const {
        className,
        totalValue,
        description,
        date,
        chart,
    } = props;

    return (
        <div className={_cs(styles.infographic, className)}>
            <div>
                <NumberOutput
                    className={styles.totalValue}
                    value={totalValue}
                    precision={1}
                    normal
                />
                <div className={styles.descriptionAndDate}>
                    <div className={styles.description}>
                        {description}
                    </div>
                    <div className={styles.date}>
                        (
                        {date}
                        )
                    </div>
                </div>
            </div>
            <div className={styles.chart}>
                {chart}
            </div>
        </div>
    );
}
export default Infographic;
