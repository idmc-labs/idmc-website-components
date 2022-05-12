import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Header from '#components/Header';
import DateOutput from '#components/DateOutput';
import HTMLOutput from '#components/HTMLOutput';
import EllipsizedContent from '#components/EllipsizedContent';

// import SmartLink from '#base/components/SmartLink';
// import route from '#base/configs/routes';

import styles from './styles.css';

interface Props {
    className?: string;
    // dataId?: number;
    coverImageUrl: string | undefined | null;
    heading: string;
    date: string;
    url: string;
    description: string | undefined | null;
}

function GoodPracticeItem(props: Props) {
    const {
        // dataId,
        className,
        coverImageUrl,
        heading,
        date,
        description,
        url,
    } = props;

    return (
        <div className={_cs(styles.goodPracticeItem, className)}>
            {coverImageUrl && (
                <img
                    src={coverImageUrl}
                    className={styles.coverImage}
                    alt="Cover"
                />
            )}
            <div className={styles.content}>
                <Header
                    heading={(
                        <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {heading}
                        </a>
                    )}
                    headingSize="extraSmall"
                    description={(
                        <DateOutput value={date} />
                    )}
                />
                <EllipsizedContent>
                    <HTMLOutput value={description} />
                </EllipsizedContent>
            </div>
        </div>
    );
}

export default GoodPracticeItem;
