import React from 'react';
import {
    _cs,
    isNotDefined,
} from '@togglecorp/fujs';

import Header from '#components/Header';
import HTMLOutput from '#components/HTMLOutput';
import EllipsizedContent from '#components/EllipsizedContent';

import gridCover from '../../resources/img/grid2021-cover.png';

import styles from './styles.css';

interface Props {
    className?: string;
    goodPracticeId: string | undefined;
    description: string | undefined | null;
    image: string | undefined;
    title: React.ReactNode;
    startYear: number | undefined | null;
    endYear: number | undefined | null;
}

function GoodPracticeItem(props: Props) {
    const {
        className,
        goodPracticeId,
        title,
        description,
        image,
        startYear,
        endYear,
    } = props;

    // NOTE: Advanced stuff, contact frozenhelium
    if (isNotDefined(goodPracticeId)) {
        return <div />;
    }

    return (
        <a
            href={`/?page=good-practice&id=${goodPracticeId}`}
            className={_cs(styles.goodPracticeItem, className)}
        >
            <img
                className={styles.preview}
                src={image ?? gridCover}
                alt=""
            />
            <div className={styles.details}>
                <Header
                    headingSize="extraSmall"
                    heading={title}
                    description={startYear && (
                        <>
                            <span>
                                {startYear}
                            </span>
                            <span>
                                -
                            </span>
                            <span>
                                {endYear ?? 'Ongoing'}
                            </span>
                        </>
                    )}
                />
                <HTMLOutput
                    className={styles.description}
                    value={description}
                />
            </div>
        </a>
    );
}

export default GoodPracticeItem;
