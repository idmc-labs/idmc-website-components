import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Header from '#components/Header';
import DateOutput from '#components/DateOutput';

import styles from './styles.css';

interface Props {
    className?: string;
    coverImageUrl: string;
    type: string;
    heading: string;
    date: string;
    description: string;
    tags: string;
}

function GoodPracticeItem(props: Props) {
    const {
        className,
        coverImageUrl,
        type,
        heading,
        date,
        description,
        tags,
    } = props;

    return (
        <div className={_cs(styles.goodPracticeItem, className)}>
            <img
                src={coverImageUrl}
                className={styles.coverImage}
                alt="Cover"
            />
            <div className={styles.type}>
                {type}
            </div>
            <Header
                heading={heading}
                description={(
                    <DateOutput value={date} />
                )}
            />
            <div className={styles.description}>
                {description}
            </div>
            <div className={styles.tags}>
                {tags}
            </div>
        </div>
    );
}

export default GoodPracticeItem;
