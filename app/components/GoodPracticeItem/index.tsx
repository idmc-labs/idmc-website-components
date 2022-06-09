import React from 'react';
import {
    _cs,
    isNotDefined,
} from '@togglecorp/fujs';

import Header from '#components/Header';
import HTMLOutput from '#components/HTMLOutput';
import { getGoodPracticeLink } from '#utils/common';

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
    countries: string | undefined;
    regions: string | undefined;
    type?: React.ReactNode;
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
        countries,
        regions,
        type = 'Good Practice',
    } = props;

    // NOTE: Advanced stuff, contact frozenhelium
    if (isNotDefined(goodPracticeId)) {
        return <div />;
    }

    return (
        <a
            href={getGoodPracticeLink(goodPracticeId)}
            className={_cs(styles.goodPracticeItem, className)}
        >
            <img
                className={styles.preview}
                src={image ?? gridCover}
                alt=""
            />
            <div className={styles.details}>
                <div className={styles.type}>
                    {type}
                </div>
                <Header
                    headingSize="smallAlt"
                    heading={title}
                    description={startYear && (
                        <>
                            <span>
                                {startYear}
                            </span>
                            <span>
                                &nbsp;-&nbsp;
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
                    hideHeadings
                />
                <div className={styles.countryList}>
                    <div className={styles.tags}>
                        {countries}
                    </div>
                    <div className={styles.tags}>
                        {regions}
                    </div>
                </div>
            </div>
        </a>
    );
}

export default GoodPracticeItem;
