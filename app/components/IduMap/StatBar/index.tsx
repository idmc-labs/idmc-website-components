import React, { useMemo } from 'react';
import { _cs, sum } from '@togglecorp/fujs';

import Numeral from '#components/Numeral';
import { IduDataQuery } from '#generated/types';

import styles from './styles.css';

type IduRow = NonNullable<IduDataQuery['idu']>[number];

interface Props {
    className?: string;
    idus: IduRow[] | undefined;
}

function StatBar(props: Props) {
    const {
        className,
        idus,
    } = props;

    const {
        conflictTotal,
        disasterTotal,
    } = useMemo(() => {
        const list = idus ?? [];
        return {
            conflictTotal: sum(
                list
                    .filter((d) => d.displacement_type === 'Conflict')
                    .map((d) => d.figure),
            ),
            disasterTotal: sum(
                list
                    .filter((d) => d.displacement_type === 'Disaster')
                    .map((d) => d.figure),
            ),
        };
    }, [idus]);

    return (
        <div className={_cs(styles.statBar, className)}>
            <div className={styles.stat}>
                <span className={_cs(styles.dot, styles.conflictDot)} />
                <Numeral
                    className={styles.value}
                    value={conflictTotal}
                    abbreviate
                    valueClassName={styles.conflictText}
                    abbrClassName={styles.conflictText}
                />
                <span className={styles.label}>
                    conflict and violence
                </span>
            </div>
            <div className={styles.stat}>
                <span className={_cs(styles.dot, styles.disasterDot)} />
                <Numeral
                    className={styles.value}
                    value={disasterTotal}
                    abbreviate
                    valueClassName={styles.disasterText}
                    abbrClassName={styles.disasterText}
                />
                <span className={styles.label}>
                    disasters
                </span>
            </div>
        </div>
    );
}

export default StatBar;
