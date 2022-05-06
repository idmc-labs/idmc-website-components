import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Header from '#components/Header';
import DateOutput from '#components/DateOutput';
import HTMLOutput from '#components/HTMLOutput';
import EllipsizedContent from '#components/EllipsizedContent';
import SmartLink from '#base/components/SmartLink';

import route from '#base/configs/routes';

import styles from './styles.css';

interface Props {
    className?: string;
    dataId?: number;
    coverImageUrl: string;
    heading: string;
    date: string;
    description: string;
}

function GoodPracticeItem(props: Props) {
    const {
        dataId,
        className,
        coverImageUrl,
        heading,
        date,
        description,
    } = props;

    return (
        <div className={_cs(styles.goodPracticeItem, className)}>
            <img
                src={coverImageUrl}
                className={styles.coverImage}
                alt="Cover"
            />
            <div className={styles.content}>
                <Header
                    heading={(
                        <SmartLink
                            route={route.goodPractice}
                            attrs={{
                                id: dataId,
                            }}
                        >
                            {heading}
                        </SmartLink>
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
