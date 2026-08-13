import React, { useCallback } from 'react';
import { _cs } from '@togglecorp/fujs';
import { IoCalendarClearOutline } from 'react-icons/io5';

import styles from './styles.css';

interface Props {
    className?: string;
    startDate: string | undefined;
    endDate: string | undefined;
    minDate: string;
    maxDate: string;
    onChange: (startDate: string | undefined, endDate: string | undefined) => void;
}

function DateFilter(props: Props) {
    const {
        className,
        startDate,
        endDate,
        minDate,
        maxDate,
        onChange,
    } = props;

    const handleFromChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const from = e.target.value || undefined;
        if (from && endDate && from > endDate) {
            onChange(endDate, from);
        } else {
            onChange(from, endDate);
        }
    }, [endDate, onChange]);

    const handleToChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const to = e.target.value || undefined;
        if (to && startDate && startDate > to) {
            onChange(to, startDate);
        } else {
            onChange(startDate, to);
        }
    }, [startDate, onChange]);

    const handleShowPicker = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
        const input = e.currentTarget;
        if (typeof input.showPicker === 'function') {
            try {
                input.showPicker();
            } catch {
                // showPicker needs transient activation; ignore if unavailable
            }
        }
    }, []);

    return (
        <div className={_cs(styles.dateFilter, className)}>
            <label className={styles.field} htmlFor="idu-date-from">
                <span className={styles.label}>From</span>
                <span className={styles.inputWrapper}>
                    <input
                        id="idu-date-from"
                        className={styles.input}
                        type="date"
                        value={startDate ?? ''}
                        min={minDate}
                        max={maxDate}
                        onChange={handleFromChange}
                        onClick={handleShowPicker}
                    />
                    <IoCalendarClearOutline className={styles.icon} />
                </span>
            </label>
            <label className={styles.field} htmlFor="idu-date-to">
                <span className={styles.label}>To</span>
                <span className={styles.inputWrapper}>
                    <input
                        id="idu-date-to"
                        className={styles.input}
                        type="date"
                        value={endDate ?? ''}
                        min={minDate}
                        max={maxDate}
                        onChange={handleToChange}
                        onClick={handleShowPicker}
                    />
                    <IoCalendarClearOutline className={styles.icon} />
                </span>
            </label>
        </div>
    );
}

export default DateFilter;
