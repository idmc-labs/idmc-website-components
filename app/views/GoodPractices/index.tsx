import React, { useCallback, useMemo, useState } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';

import {
    FaqsQueryVariables,
    FaqsQuery,
    GoodPracticesQuery,
    GoodPracticesQueryVariables,
    StaticPagesQuery,
    StaticPagesQueryVariables,
    GoodPracticeQuery,
    GoodPracticeQueryVariables,
    GoodPracticeFilterChoicesQuery,
    GoodPracticeFilterChoicesQueryVariables,
} from '#generated/types';
import {
    TextInput,
    SelectInput,
    MultiSelectInput,
    ListView,
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
import Tabs from '#components/Tabs';
import Tab from '#components/Tabs/Tab';
import TabList from '#components/Tabs/TabList';
import LegendElement from '#components/LegendElement';
import Button from '#components/Button';
import Header from '#components/Header';
import HTMLOutput from '#components/HTMLOutput';
import ButtonLikeLink from '#components/ButtonLikeLink';
import EllipsizedContent from '#components/EllipsizedContent';
import CollapsibleContent from '#components/CollapsibleContent';
import TabPanel from '#components/Tabs/TabPanel';
import useDebouncedValue from '../../hooks/useDebouncedValue';

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
query GoodPractices($search : String!) {
    goodPractices(ordering: {}, filters: {search: $search}, pagination: {limit: 10, offset: 0}) {
        results {
            id
            title
            description
            publishedDate
            image {
                name
                url
                }
            }
        }
    }
`;

const GOOD_PRACTICE = gql`
query GoodPractice ($ID: ID!) {
    goodPractice(pk: $ID) {
        goodPracticeFormUrl
        id
    }
}  
`;

const STATIC_PAGES = gql`
query StaticPages {
    staticPages(filters: {staticPageTypes: GOOD_PRACTICE_LISTING_PAGE}) {
        description
        type
        id
        }
    }
`;

const GOOD_PRACTICE_FILTER_CHOICES = gql`
query GoodPracticeFilterChoices {
    goodPracticeFilterChoices {
        countries {
            name
            id
        }
        driversOfDispalcement
        focusArea
        regions
        stage
        type
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

type goodPracticeList = NonNullable<NonNullable<GoodPracticesQuery['goodPractices']>['results']>[number];
type countryFilterList = NonNullable<NonNullable<GoodPracticeFilterChoicesQuery['goodPracticeFilterChoices']>['countries']>[number];

const keySelector = (d: any) => d.key;
const labelSelector = (d: any) => d.label;

function countryKeySelector(d: countryFilterList) {
    return d.id;
}

function countryLabelSelector(d: countryFilterList) {
    return d.name;
}

function goodPracticekeySelector(d: goodPracticeList) {
    return d.id;
}

function GoodPracticeRenderer({
    title,
    description,
    publishedDate,
    image,
}) {
    return (
        <div className={styles.goodPracticeList}>
            {title}
            {description}
            {publishedDate}
            <img
                className={styles.preview}
                src={image}
                alt=""
            />
        </div>
    );
}

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

    const [expandedFaq, setExpandedFaq] = useState<number>();
    const [activeTab, setActiveTab] = useState<'grid' | 'list'>('grid');
    const [searchText, setSearchText] = useState<string>();
    const debouncedSearchText = useDebouncedValue(searchText);

    const [goodPracticeType, setGoodPracticeType] = useState<string | undefined>();
    const [goodPracticeArea, setGoodPracticeArea] = useState<string | undefined>();
    const [goodPracticeDrive, setGoodPracticeDrive] = useState<string | undefined>();
    const [goodpracticeStage, setGoodPracticeStage] = useState<string | undefined>();
    const [goodPracticeRegion, setGoodPracticeRegion] = useState<string | undefined>();
    const [goodPracticeCountry, setGoodPracticeCountry] = useState<string | undefined>();

    const variables = useMemo(() => ({
        search: debouncedSearchText,
    }), [debouncedSearchText]);

    const {
        data: faqsResponse,
    } = useQuery<FaqsQuery, FaqsQueryVariables>(
        FAQS,
    );

    const {
        data: goodPracticeResponse,
        error: goodPracticeError,
        loading: goodPracticeLoading,
    } = useQuery<GoodPracticesQuery, GoodPracticesQueryVariables>(
        GOODPRACTICES,
        {
            variables,
        },
    );

    const {
        data: staticPagesResponse,
    } = useQuery<StaticPagesQuery, StaticPagesQueryVariables>(
        STATIC_PAGES,
    );

    const {
        data: goodPracticeUrlResponse,
    } = useQuery<GoodPracticeQuery, GoodPracticeQueryVariables>(
        GOOD_PRACTICE,
    );

    const {
        data: goodPracticeFilterResponse,
    } = useQuery<GoodPracticeFilterChoicesQuery, GoodPracticeFilterChoicesQueryVariables>(
        GOOD_PRACTICE_FILTER_CHOICES,
    );

    const typeFilter = goodPracticeFilterResponse?.goodPracticeFilterChoices.type
        ?.map((v) => ({ key: v, label: v }));

    const driverFilter = goodPracticeFilterResponse?.goodPracticeFilterChoices.driversOfDispalcement
        ?.map((v) => ({ key: v, label: v }));

    const areaFilter = goodPracticeFilterResponse?.goodPracticeFilterChoices.focusArea
        ?.map((v) => ({ key: v, label: v }));

    const stageFilter = goodPracticeFilterResponse?.goodPracticeFilterChoices.stage
        ?.map((v) => ({ key: v, label: v }));

    const regionFilter = goodPracticeFilterResponse?.goodPracticeFilterChoices.regions
        ?.map((v) => ({ key: v, label: v }));

    const countryFilter = goodPracticeFilterResponse?.goodPracticeFilterChoices.countries
        ?.map((v) => ({ name: v, id: v }));

    const goodPracticeLink = `${goodPracticeUrlResponse?.goodPractice?.goodPracticeFormUrl}`;

    const goodPracticeRendererParams = useCallback((
        _: string,
        d: goodPracticeList,
    ) => ({
        description: d.description,
        title: d.title,
        publishedDate: d.publishedDate,
        image: d.image?.url,
    }), []);

    const handleFaqExpansionChange = useCallback((newValue: boolean, name: number) => {
        if (newValue === false) {
            setExpandedFaq(undefined);
        } else {
            setExpandedFaq(name);
        }
    }, []);

    const handleJumpToGoodPractices = useCallback(
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
                            {staticPagesResponse?.staticPages.map((value) => (
                                <HTMLOutput
                                    // desciption
                                    value={value.description}
                                />
                            ))}
                            <HTMLOutput
                                // desciption
                                value={undefined}
                            />
                        </EllipsizedContent>
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
                            <ButtonLikeLink
                                href={goodPracticeLink}
                            >
                                Submit a Good Practice
                            </ButtonLikeLink>
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
                            name="type"
                            value={goodPracticeType}
                            options={typeFilter}
                            keySelector={keySelector}
                            labelSelector={labelSelector}
                            onChange={setGoodPracticeType}
                        />
                        <SelectInput
                            variant="general"
                            placeholder="Drivers of Displacement"
                            name="driversOfDisplacement"
                            value={goodPracticeDrive}
                            options={driverFilter}
                            keySelector={keySelector}
                            labelSelector={labelSelector}
                            onChange={setGoodPracticeDrive}
                        />
                        <SelectInput
                            variant="general"
                            placeholder="Focus Area"
                            name="focusArea"
                            value={goodPracticeArea}
                            options={areaFilter}
                            keySelector={keySelector}
                            labelSelector={labelSelector}
                            onChange={setGoodPracticeArea}
                        />
                        <SelectInput
                            variant="general"
                            placeholder="Stage"
                            name="stage"
                            value={goodpracticeStage}
                            options={stageFilter}
                            keySelector={keySelector}
                            labelSelector={labelSelector}
                            onChange={setGoodPracticeStage}
                        />
                        <SelectInput
                            variant="general"
                            placeholder="Region"
                            name="region"
                            value={goodPracticeRegion}
                            options={regionFilter}
                            keySelector={keySelector}
                            labelSelector={labelSelector}
                            onChange={setGoodPracticeRegion}
                        />
                        <SelectInput
                            variant="general"
                            placeholder="Country"
                            name="country"
                            value={goodPracticeCountry}
                            options={countryFilter}
                            keySelector={countryKeySelector}
                            labelSelector={countryLabelSelector}
                            onChange={setGoodPracticeCountry}
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
                                            className={className}
                                            name="search"
                                            placeholder="Search for Best Practice"
                                            value={searchText}
                                            onChange={setSearchText}
                                            disabled={goodPracticeLoading}
                                            error={undefined}
                                            icons={(
                                                <IoSearch />
                                            )}
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
                                    <ListView
                                        className={styles.goodPracticeList}
                                        data={goodPracticeResponse?.goodPractices?.results}
                                        keySelector={goodPracticekeySelector}
                                        rendererParams={goodPracticeRendererParams}
                                        renderer={GoodPracticeRenderer}
                                        errored={!!goodPracticeError}
                                        pending={false}
                                        filtered={false}
                                    />
                                </section>
                            </TabPanel>
                            <TabPanel
                                name="list"
                            >
                                <section className={styles.goodPracticeGrid}>
                                    <ListView
                                        className={styles.goodPracticeList}
                                        data={goodPracticeResponse?.goodPractices?.results}
                                        keySelector={goodPracticekeySelector}
                                        rendererParams={goodPracticeRendererParams}
                                        renderer={GoodPracticeRenderer}
                                        errored={!!goodPracticeError}
                                        pending={false}
                                        filtered={false}
                                    />
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
