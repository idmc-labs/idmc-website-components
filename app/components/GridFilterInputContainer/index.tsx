import React from 'react';
import { _cs } from '@togglecorp/fujs';
import { IoInformationCircleOutline } from 'react-icons/io5';

import styles from './styles.css';

interface Props {
    className?: string;
    input: React.ReactNode;
    label?: string | React.ReactNode;
    labelDescription?: string | React.ReactNode;
    helpText?: string;
    secondaryInput?: React.ReactNode;
}

function GridFilterInputContainer(props: Props) {
    const {
        className,
        input,
        label,
        labelDescription,
        helpText,
        secondaryInput,
    } = props;

    return (
        <div className={_cs(styles.gridFilterInputContainer, className)}>
            <header className={styles.header}>
                <div className={styles.label}>
                    {label}
                    {helpText && (
                        <IoInformationCircleOutline
                            className={styles.infoIcon}
                            title={helpText}
                        />
                    )}
                </div>
                {labelDescription && (
                    <div className={styles.labelDescription}>
                        {labelDescription}
                    </div>
                )}
            </header>
            <div className={styles.inputsContainer}>
                <div className={styles.input}>
                    {input}
                </div>
                {secondaryInput && (
                    <div className={styles.secondaryInput}>
                        {secondaryInput}
                    </div>
                )}
            </div>
        </div>
    );
}

export default GridFilterInputContainer;
