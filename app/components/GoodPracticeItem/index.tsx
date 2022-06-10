import React from 'react';
import {
    _cs,
    isNotDefined,
} from '@togglecorp/fujs';

import Header from '#components/Header';
import HTMLOutput from '#components/HTMLOutput';
import EllipsizedContent from '#components/EllipsizedContent';
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
    countries?: string | null;
    regions?: string | null;
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
        countries = [],
        regions = [],
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
                <EllipsizedContent
                    maxCharacters={120}
                    expandDisabled
                >
                    <HTMLOutput
                        value={description}
                        hideHeadings
                    />
                </EllipsizedContent>
                {(countries || regions) && (
                    <div className={styles.countryList}>
                        {countries && (
                            <span className={styles.tags}>
                                {countries}
                            </span>
                        )}
                        {countries && regions && <>, </>}
                        {regions && (
                            <span className={styles.tags}>
                                {regions}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </a>
    );
}

export default GoodPracticeItem;
