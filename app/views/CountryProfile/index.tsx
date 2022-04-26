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
import styles from './styles.css';

const countryDescription = `
<p>Afghanistan faces one of the world’s most acute internal displacement crises as it suffers protracted conflict and insecurity as well as recurring disasters, including droughts, floods, storms and earthquakes. Displacement has become a common coping strategy for many Afghans and, in some cases, an inevitable feature of life for multiple generations. <a href="https://www.humanitarianresponse.info/sites/www.humanitarianresponse.info/files/documents/files/afghanistan_humanitarian_needs_overview_2021.pdfhttps://reliefweb.int/sites/reliefweb.int/files/resources/AFG_REACH_WoAA_MSNI-Analysis-Report_September-2019_final-2.pdf">Humanitarian needs</a> are high and the situation is further complicated by widespread poverty, unemployment, and lack of access to basic services.&nbsp;</p>
<p>Over 404,000 new displacements associated with conflict and violence were recorded in 2020, and there were 3.5 million people internally displaced as a result at the end of the year. This latter figure is an 18 per cent increase compared with 2019 and the highest figure in more than a decade. Disasters throughout 2020 triggered more than 46,000 new displacements, with most displacements caused by flooding in March, May, and August, particularly affecting the eastern provinces.</p>
`;

const overview = `
<p>
The history of conflict displacement in Afghanistan goes back to the late 1970s. War between the Soviet-backed government and mujahideen fighters and the Soviet occupation triggered large-scale internal displacement and refugee flows in the 1980s. The fall of the government in 1992, ensuing ethnic conflict between mujahideen factions and the rise of the Taliban in the late 1990s displaced millions more.
</p>
`;

const displacementData = `
<p>The compounding impacts of conflict and disasters have exacted a <a href="https://reliefweb.int/sites/reliefweb.int/files/resources/AFG_REACH_WoAA_MSNI-Analysis-Report_September-2019_final-2.pdf">heavy toll</a> on the population. In 2020, <a href="http://www.ipcinfo.org/ipc-country-analysis/details-map/en/c/1152907/#:~:text=Between%20November%202020%20and%20March,Phase%203)%20and%20nearly%204.3">11.15 million people</a> were estimated to be experiencing high levels of acute food insecurity (IPC Phase 3 or above). This is particularly <a href="https://www.humanitarianresponse.info/sites/www.humanitarianresponse.info/files/documents/files/afghanistan_humanitarian_needs_overview_2021.pdf">true for IDP</a>s, whose ability to maintain adequate food consumption and nutrition is hindered by tenure insecurity and unemployment. &nbsp;</p>

<p>Shelter needs are particularly acute, with a recent assessment indicating shelter needs as the second priority need after food. The majority of IDPs live in <a href="https://www.nrc.no/perspectives/2020/how-ana-got-a-roof-over-her-head/">informal settlements</a> and makeshift shelters. IDPs who settle on government or private land are at heightened <a href="https://www.internal-displacement.org/global-report/grid2019/downloads/background_papers/HirschHolland_FinalPaper.pdf">risk of eviction</a> and inadequate shelter also makes people more vulnerable to the impacts of sudden-onset disasters such as floods and avalanches, heightening their <a href="https://www.humanitarianresponse.info/sites/www.humanitarianresponse.info/files/documents/files/afghanistan_humanitarian_needs_overview_2021.pdf">risk of secondary displacement</a>. Conditions in informal settlements are dire and IDPs often lack access to water and sanitation facilities and face acute protection concerns. IDP and refugee households report high levels of early marriage, gender-based violence, and exploitation.</p><p></p>
`;

interface InfoGraphicsData {
    id: number;
    totalValue: number;
    description: React.ReactNode;
    date: React.ReactNode;
    chart: React.ReactNode;
}
const conflictMeta: InfoGraphicsData[] = [
    {
        id: 1,
        totalValue: 22434502,
        description: 'New displacements Conflict and Violence',
        date: '2020 - 2020',
        chart: null,
    },
    {
        id: 2,
        totalValue: 53244390,
        description: 'Total number of IDPs Conflict and violence',
        date: 'As of end of 2020',
        chart: null,
    },
];
const disasterMeta: InfoGraphicsData[] = [
    {
        id: 1,
        totalValue: 1000000,
        description: 'New displacements Disasters',
        date: '2008 - 2020',
        chart: null,
    },
    {
        id: 2,
        totalValue: 120,
        description: 'Disaster events reported',
        date: '2008 - 2020',
        chart: null,
    },
];

interface InfoGraphicProps {
    totalValue: number;
    description: React.ReactNode;
    date: React.ReactNode;
    chart: React.ReactNode;
}

function InfoGraphic(props: InfoGraphicProps) {
    const {
        totalValue,
        description,
        date,
        chart,
    } = props;

    return (
        <div className={styles.infoGraphic}>
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
                        value={countryDescription}
                    />
                </section>
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
                            <Tab
                                name="2022"
                                className={styles.tab}
                            >
                                2022
                            </Tab>
                            <Tab
                                name="2021"
                                className={styles.tab}
                            >
                                2021
                            </Tab>
                        </TabList>
                        <TabPanel name="2022">
                            Looks like 2022
                        </TabPanel>
                        <TabPanel name="2021">
                            Feels like 2021
                        </TabPanel>
                    </Tabs>
                    <HTMLOutput
                        value={overview}
                    />
                </section>
                <section className={styles.displacementData}>
                    <Header
                        headingSize="medium"
                        heading="Displacement Data"
                    />
                    <HTMLOutput
                        value={displacementData}
                    />
                    <div className={styles.infoGraphics}>
                        <div className={styles.conflictInfoGraphics}>
                            <Header
                                heading="Conflict and Violence Data"
                            />
                            <div className={styles.infoGraphicList}>
                                {conflictMeta.map((conflict) => (
                                    <InfoGraphic
                                        key={conflict.id}
                                        totalValue={conflict.totalValue}
                                        description={conflict.description}
                                        date={conflict.date}
                                        chart={conflict.chart}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className={styles.disasterInfoGraphics}>
                            <Header
                                heading="Disaster Data"
                            />
                            <div className={styles.infoGraphicList}>
                                {disasterMeta.map((disaster) => (
                                    <InfoGraphic
                                        key={disaster.id}
                                        totalValue={disaster.totalValue}
                                        description={disaster.description}
                                        date={disaster.date}
                                        chart={disaster.chart}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default CountryProfile;
