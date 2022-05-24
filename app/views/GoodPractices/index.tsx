import React, { useCallback, useState } from 'react';
import { gql, useQuery } from '@apollo/client';

import {
    FaqsQueryVariables,
    FaqsQuery,
    GoodPracticesQuery,
    GoodPracticesQueryVariables,
} from '#generated/types';
import {
    TextInput,
    SelectInput,
} from '@the-deep/deep-ui';
import Map, {
    MapContainer,
    MapSource,
    MapLayer,
} from '@togglecorp/re-map';
import { _cs } from '@togglecorp/fujs';
import {
    IoSearch,
    IoGridOutline,
    IoListOutline,
} from 'react-icons/io5';

import TextOutput from '#components/TextOutput';
import Tabs from '#components/Tabs';
import Tab from '#components/Tabs/Tab';
import TabList from '#components/Tabs/TabList';
import LegendElement from '#components/LegendElement';
import Button from '#components/Button';
import Header from '#components/Header';
import HTMLOutput from '#components/HTMLOutput';
import EllipsizedContent from '#components/EllipsizedContent';
import CollapsibleContent from '#components/CollapsibleContent';
import GoodPracticeItem from '#components/GoodPracticeItem';
import TabPanel from '#components/Tabs/TabPanel';

import styles from './styles.css';

const FAQS = gql`
    query Faqs {
            faqs {
            answer
            id
            question
        }
    } 
`;

const GOODPRACTICES = gql`
    query GoodPractices {
        goodPracticies {
            id
            title
            description
        }
    }
`;

const orangePointHaloCirclePaint: mapboxgl.CirclePaint = {
    'circle-opacity': 0.6,
    'circle-color': {
        property: 'status',
        type: 'categorical',
        stops: [
            ['recently_submitted', 'rgb(239, 125, 0)'],
            ['under_review', 'rgb(1, 142, 202)'],
            ['approved', 'rgb(51, 149, 62)'],
        ],
    },
    'circle-radius': 9,
};

const options: { key: string; label: string }[] = [];

const sourceOption: mapboxgl.GeoJSONSourceRaw = {
    type: 'geojson',
};

const lightStyle = 'mapbox://styles/mapbox/light-v10';

interface Props {
    className?: string;

}

function GoodPractices(props: Props) {
    const {
        className,
    } = props;

    const practicesListRef = React.useRef<HTMLDivElement>(null);

    const [expandedFaq, setExpandedFaq] = React.useState<number>();
    const [activeTab, setActiveTab] = useState<'grid' | 'list'>('grid');

    const handleFaqExpansionChange = React.useCallback((newValue: boolean, name: number) => {
        if (newValue === false) {
            setExpandedFaq(undefined);
        } else {
            setExpandedFaq(name);
        }
    }, []);

    const {
        data: faqsResponse,
    } = useQuery<FaqsQuery, FaqsQueryVariables>(
        FAQS,
    );

    const {
        data: goodPracticeResponse,
    } = useQuery<GoodPracticesQuery, GoodPracticesQueryVariables>(
        GOODPRACTICES,
    );

    const handleJumpToGoodPractices = React.useCallback(
        () => {
            if (practicesListRef.current) {
                practicesListRef.current.scrollIntoView({
                    behavior: 'smooth',
                });
            }
        },
        [],
    );

    return (
        <div className={_cs(styles.goodPractices, className)}>
            <img
                className={styles.coverImage}
                src="https://images.unsplash.com/photo-1534271057238-c2c170a76672?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
                alt="good practices"
            />
            <div className={styles.mainContent}>
                <section className={styles.profile}>
                    <Header
                        headingSize="extraLarge"
                        heading="Global Repositories for Good Practices"
                    />
                    <div className={styles.content}>
                        <EllipsizedContent
                            className={styles.description}
                        >
                            <HTMLOutput
                                // desciption
                                value={undefined}
                            />
                        </EllipsizedContent>
                        <div className={styles.numberBlock}>
                            <TextOutput
                                className={styles.count}
                                // total count
                                value={undefined}
                                valueType="number"
                            />
                            <div className={styles.countLabel}>
                                Good Practices
                            </div>
                        </div>
                    </div>
                    <Button
                        onClick={handleJumpToGoodPractices}
                        name={undefined}
                    >
                        Find Good Practices
                    </Button>
                </section>
                <section className={styles.map}>
                    <Map
                        mapStyle={lightStyle}
                        mapOptions={{
                            logoPosition: 'bottom-left',
                            scrollZoom: false,
                            zoom: 1,
                        }}
                        scaleControlShown
                        navControlShown
                    >
                        <div className={styles.mapWrapper}>
                            <MapContainer className={styles.mapContainer} />
                            <MapSource
                                sourceKey="multi-points"
                                sourceOptions={sourceOption}
                                geoJson={undefined}
                            >
                                <MapLayer
                                    layerKey="points-halo-circle"
                                    layerOptions={{
                                        type: 'circle',
                                        paint: orangePointHaloCirclePaint,
                                    }}
                                />
                            </MapSource>
                            <div className={styles.legendList}>
                                <div className={styles.legend}>
                                    <Header
                                        headingSize="extraSmall"
                                        heading="State"
                                    />
                                    <div className={styles.legendElementList}>
                                        <LegendElement
                                            color="var(--color-green)"
                                            label="Approved"
                                        />
                                        <LegendElement
                                            color="var(--color-blue)"
                                            label="Under Review"
                                        />
                                        <LegendElement
                                            color="var(--color-orange)"
                                            label="Recently submitted or registered"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Map>
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
                                {/* <a
                                    href={`mailto:${goodPracticeMeta.contactEmail}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Email
                                </a>
                                /
                                <a
                                    href={goodPracticeMeta.contactFormLink}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Online Form
                                </a> */}
                            </div>
                        </div>
                    </div>
                </section>
                <section className={styles.faqSection}>
                    {faqsResponse?.faqs.map((faqs: any, i: any) => (
                        <CollapsibleContent
                            key={faqs.id}
                            name={faqs.id}
                            onExpansionChange={handleFaqExpansionChange}
                            isExpanded={expandedFaq === faqs.id}
                            header={`Q${i + 1}: ${faqs?.question}`}
                        >
                            {faqs.answer || '-'}
                        </CollapsibleContent>
                    ))}
                </section>
                <section
                    className={styles.filters}
                    ref={practicesListRef}
                >
                    <Header
                        headingSize="large"
                        heading="Filter or search the Good Practices"
                    />
                    <div>
                        Filter or search for the Good Practices using the options below.
                    </div>
                    <div className={styles.inputs}>
                        <SelectInput
                            variant="general"
                            placeholder="Type of Good Practice"
                            name="typeOfGoodPractice"
                            value={undefined}
                            options={options}
                            keySelector={(item) => item.key}
                            labelSelector={(item) => item.label}
                            onChange={() => undefined}
                        />
                        <SelectInput
                            variant="general"
                            placeholder="Drivers of Displacement"
                            name="driversOfDisplacement"
                            value={undefined}
                            options={options}
                            keySelector={(item) => item.key}
                            labelSelector={(item) => item.label}
                            onChange={() => undefined}
                        />
                        <SelectInput
                            variant="general"
                            placeholder="Focus Area"
                            name="focusArea"
                            value={undefined}
                            options={options}
                            keySelector={(item) => item.key}
                            labelSelector={(item) => item.label}
                            onChange={() => undefined}
                        />
                        <SelectInput
                            variant="general"
                            placeholder="State"
                            name="stage"
                            value={undefined}
                            options={options}
                            keySelector={(item) => item.key}
                            labelSelector={(item) => item.label}
                            onChange={() => undefined}
                        />
                        <SelectInput
                            variant="general"
                            placeholder="Region"
                            name="region"
                            value={undefined}
                            options={options}
                            keySelector={(item) => item.key}
                            labelSelector={(item) => item.label}
                            onChange={() => undefined}
                        />
                        <SelectInput
                            variant="general"
                            placeholder="Country"
                            name="country"
                            value={undefined}
                            options={options}
                            keySelector={(item) => item.key}
                            labelSelector={(item) => item.label}
                            onChange={() => undefined}
                        />
                    </div>
                    <div className={styles.searchContainer}>
                        <Tabs
                            value={activeTab}
                            onChange={setActiveTab}
                        >
                            <TabList
                                actions={(
                                    <div className={styles.filter}>
                                        <TextInput
                                            variant="general"
                                            value={undefined}
                                            placeholder="Search for Best Practice"
                                            name="search"
                                            onChange={() => undefined}
                                            icons={(
                                                <IoSearch />
                                            )}
                                        />
                                        <SelectInput
                                            variant="general"
                                            placeholder="Most popular"
                                            name="order"
                                            value={undefined}
                                            options={options}
                                            keySelector={(item) => item.key}
                                            labelSelector={(item) => item.label}
                                            onChange={() => undefined}
                                        />
                                    </div>
                                )}
                            >
                                <Tab name="grid">
                                    <IoGridOutline />
                                </Tab>
                                <Tab name="list">
                                    <IoListOutline />
                                </Tab>
                            </TabList>
                            <TabPanel
                                name="grid"
                            >
                                <section className={styles.goodPracticeList}>
                                    {goodPracticeResponse?.goodPracticies.map((gp) => (
                                        <GoodPracticeItem
                                            key={gp.id}
                                            coverImageUrl={undefined}
                                            heading={gp.title}
                                            date="2021-05-20"
                                            description={gp.description}
                                            type={undefined}
                                            // FIXME: define actual url
                                            url="#"
                                        />
                                    ))}
                                </section>
                            </TabPanel>
                            <TabPanel
                                name="list"
                            >
                                <section className={styles.goodPracticeGrid}>
                                    {goodPracticeResponse?.goodPracticies.map((gp) => (
                                        <GoodPracticeItem
                                            className={styles.coverImage}
                                            key={gp.id}
                                            coverImageUrl={undefined}
                                            heading={gp.title}
                                            date="2021-05-20"
                                            description={gp.description}
                                            type={undefined}
                                            // FIXME: define actual url
                                            url="#"
                                        />
                                    ))}
                                </section>
                            </TabPanel>
                        </Tabs>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default GoodPractices;
