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
    coverImageUrl: string | undefined | null;
    heading: string;
    date: string | undefined | null;
    url: string;
    description: string | undefined | null;
    type: string | undefined | null;
}

function RelatedMaterialItem(props: Props) {
    const {
        className,
        coverImageUrl,
        heading,
        date,
        type,
        description,
        url,
    } = props;

    return (
        <div className={_cs(styles.goodPracticeItem, className)}>
            {coverImageUrl && (
                <a
                    className={styles.coverWrapper}
                    href={url}
                >
                    <img
                        src={coverImageUrl}
                        className={styles.coverImage}
                        alt="Cover"
                    />
                </a>
            )}
            <div className={styles.content}>
                <div className={styles.type}>
                    {type}
                </div>
                <Header
                    heading={(
                        <a
                            href={url}
                            className={styles.link}
                        >
                            {heading}
                        </a>
                    )}
                    headingSize="extraSmall"
                />
                <EllipsizedContent
                    expandDisabled
                >
                    <HTMLOutput value={description} />
                </EllipsizedContent>
                <DateOutput
                    className={styles.date}
                    value={date}
                    format="dd MMM yyyy"
                />
            </div>
        </div>
    );
}

export default RelatedMaterialItem;
