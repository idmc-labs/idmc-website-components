import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Button from '#components/Button';
import Header from '#components/Header';
import HTMLOutput from '#components/HTMLOutput';

import TextOutput from '#components/TextOutput';
import SmartLink from '#base/components/SmartLink';
import route from '#base/configs/routes';
import { goodPractice } from './data';
import styles from './styles.css';

interface Props {
    className?: string;
}

function GoodPractices(props: Props) {
    const {
        className,
    } = props;

    return (
        <div className={_cs(styles.goodPractices, className)}>
            <img
                className={styles.coverImage}
                src="https://images.unsplash.com/photo-1465917566611-efba2904dd8a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1476&q=80"
                alt="good practices"
            />
            <div className={styles.mainContent}>
                <Header
                    headingSize="extraLarge"
                    heading={goodPractice.title}
                />
                <div className={styles.breadcrumb}>
                    <SmartLink
                        route={route.home}
                    />
                    ›
                    <SmartLink
                        route={route.goodPractices}
                    />
                    ›
                    <div>
                        {goodPractice.title}
                    </div>
                </div>
                <section className={styles.meta}>
                    <TextOutput
                        label="Last updated at"
                        value={goodPractice.lastUpdated}
                        valueType="date"
                        displayType="table"
                    />
                    <TextOutput
                        label="Region"
                        value={goodPractice.region}
                        displayType="table"
                    />
                    <TextOutput
                        label="Country"
                        value={goodPractice.country}
                        displayType="table"
                    />
                    <TextOutput
                        label="Implementing Entity"
                        value={goodPractice.implementingEntity}
                        displayType="table"
                    />
                    <TextOutput
                        label="CC Driver"
                        value={goodPractice.ccDriver}
                        displayType="table"
                    />
                    <TextOutput
                        label="Trigger"
                        value={goodPractice.trigger}
                        displayType="table"
                    />
                    <TextOutput
                        label="Displacement Impact"
                        value={goodPractice.displacementImpact}
                        displayType="table"
                    />
                    <TextOutput
                        label="Intervention Phase"
                        value={goodPractice.interventionPhase}
                        displayType="table"
                    />
                    <TextOutput
                        label="Timeframe"
                        value={goodPractice.timeframe}
                        displayType="table"
                    />
                </section>
                <section className={styles.details}>
                    <HTMLOutput
                        value={goodPractice.description}
                    />
                    <div className={styles.sidePane}>
                        <div className={styles.block}>
                            <div>
                                Do you have a Good Practice you would like us to review?
                            </div>
                            <Button
                                name={undefined}
                            >
                                Submit a Good Practice
                            </Button>
                        </div>
                        <div className={styles.block}>
                            <div>
                                For more information please contact:
                            </div>
                            <div className={styles.contactLinks}>
                                <a
                                    href={`mailto:${goodPractice.contactEmail}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Email
                                </a>
                                /
                                <a
                                    href={goodPractice.contactFormLink}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Online Form
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default GoodPractices;
