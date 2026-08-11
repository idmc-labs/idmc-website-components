import React from 'react';
import { _cs } from '@togglecorp/fujs';
import { IoCloseOutline } from 'react-icons/io5';

import RawButton from '#components/RawButton';

import styles from './styles.css';

export interface Props {
    className?: string;
    label: React.ReactNode;
    onRemove: () => void;
}

function FilterPill(props: Props) {
    const {
        className,
        label,
        onRemove,
    } = props;

    return (
        <div className={_cs(styles.filterPill, className)}>
            <span className={styles.label}>
                {label}
            </span>
            <RawButton
                name={undefined}
                className={styles.remove}
                onClick={onRemove}
                title="Remove filter"
            >
                <IoCloseOutline />
            </RawButton>
        </div>
    );
}

export default FilterPill;
