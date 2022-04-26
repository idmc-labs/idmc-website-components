import React from 'react';
import {
    Header,
    Tab,
    Tabs,
    TabList,
    TabPanel,
    NumberOutput,
} from '@the-deep/deep-ui';
import { IoBarChart } from 'react-icons/io5';
import { _cs } from '@togglecorp/fujs';

import HTMLOutput from '#components/HTMLOutput';

import { countryMetadata, countryOverviews, statistics } from './data';
import styles from './styles.css';

interface InfoGraphicProps {
    totalValue: number;
    description: React.ReactNode;
    date: React.ReactNode;
    chart: React.ReactNode;
}

function Infographic(props: InfoGraphicProps) {
    const {
        totalValue,
        description,
        date,
        chart,
    } = props;

    return (
        <div className={styles.infographic}>
            <NumberOutput
                className={styles.totalValue}
                value={totalValue}
                precision={1}
                normal
            />
            <div className={styles.description}>
                {description}
            </div>
            <div className={styles.date}>
                {date}
            </div>
            <div className={styles.chart}>
                {chart ?? <IoBarChart className={styles.icon} />}
            </div>
        </div>
    );
}

interface Props {
    className?: string;
}

function CountryProfile(props: Props) {
    const {
        className,
    } = props;

    const [activeYear, setActiveYear] = React.useState<string | undefined>('2022');

    return (
        <div className={_cs(styles.countryProfile, className)}>
            <div className={styles.mainContent}>
                <section className={styles.profile}>
                    <Header
                        headingSize="extraLarge"
                        heading="Country Profile"
                    />
                    <HTMLOutput
                        value={countryMetadata.description}
                    />
                </section>
                {countryOverviews && countryOverviews.length > 0 && (
                    <section className={styles.overview}>
                        <Header
                            headingSize="medium"
                            heading="Overview"
                        />
                        <Tabs
                            value={activeYear}
                            onChange={setActiveYear}
                        >
                            <TabList>
                                {countryOverviews.map((countryOverview) => (
                                    <Tab
                                        key={countryOverview.year}
                                        name={countryOverview.year}
                                        className={styles.tab}
                                    >
                                        {countryOverview.year}
                                    </Tab>
                                ))}
                            </TabList>
                            {countryOverviews.map((countryOverview) => (
                                <TabPanel
                                    key={countryOverview.year}
                                    name={countryOverview.year}
                                >
                                    <div>
                                        Last modified:
                                        {countryOverview.lastModified}
                                    </div>
                                    <HTMLOutput
                                        value={countryOverview.description}
                                    />
                                </TabPanel>
                            ))}
                        </Tabs>
                    </section>
                )}
                {(
                    statistics.conflict
                    || statistics.disaster
                    || countryMetadata.displacementData
                ) && (
                    <section className={styles.displacementData}>
                        <Header
                            headingSize="medium"
                            heading="Displacement Data"
                        />
                        <HTMLOutput
                            value={countryMetadata.displacementData}
                        />
                        <div className={styles.infographics}>
                            {statistics.conflict && (
                                <div className={styles.conflictInfographics}>
                                    <Header
                                        heading="Conflict and Violence Data"
                                    />
                                    <div className={styles.infographicList}>
                                        <Infographic
                                            totalValue={statistics.conflict.newDisplacements}
                                            description={statistics.conflict.newDisplacementsLabel}
                                            date={`${statistics.startYear} - ${statistics.endYear}`}
                                            chart={undefined}
                                        />
                                        <Infographic
                                            totalValue={statistics.conflict.noOfIdps}
                                            description={statistics.conflict.noOfIdpsLabel}
                                            date={`As of end of ${statistics.endYear}`}
                                            chart={undefined}
                                        />
                                    </div>
                                </div>
                            )}
                            {statistics.disaster && (
                                <div className={styles.disasterInfographics}>
                                    <Header
                                        heading="Disaster Data"
                                    />
                                    <div className={styles.infographicList}>
                                        <Infographic
                                            totalValue={statistics.disaster.newDisplacements}
                                            description={statistics.disaster.newDisplacementsLabel}
                                            date={`${statistics.startYear} - ${statistics.endYear}`}
                                            chart={undefined}
                                        />
                                        <Infographic
                                            totalValue={statistics.disaster.noOfEvents}
                                            description={statistics.disaster.noOfEventsLabel}
                                            date={`${statistics.startYear} - ${statistics.endYear}`}
                                            chart={undefined}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}

export default CountryProfile;
