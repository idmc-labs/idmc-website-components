import React from 'react';
import {
    SelectInput,
    MultiSelectInput,
    useInputState,
    Link,
} from '@the-deep/deep-ui';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    MapboxGeoJSONFeature,
    LngLat,
    PopupOptions,
    LngLatLike,
    LngLatBounds,
} from 'mapbox-gl';
import Map, {
    MapContainer,
    MapBounds,
    MapSource,
    MapLayer,
    MapTooltip,
} from '@togglecorp/re-map';
import {
    IoDownloadOutline,
    IoInformationCircleOutline,
} from 'react-icons/io5';
import { _cs, isDefined, isNotDefined } from '@togglecorp/fujs';
import {
    ResponsiveContainer,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import {
    CountryProfileQuery,
    CountryProfileQueryVariables,
    IduDataQuery,
    IduDataQueryVariables,
    DisasterDataQuery,
    DisasterCategoryQuery,
    DisasterCategoryQueryVariables,
    DisasterDataQueryVariables,
    CategoryStatisticsType,
    ConflictDataQuery,
    ConflictDataQueryVariables,
} from '#generated/types';
import RoundedBar from '#components/RoundedBar';
import Tabs from '#components/Tabs';
import Tab from '#components/Tabs/Tab';
import TabList from '#components/Tabs/TabList';
import TabPanel from '#components/Tabs/TabPanel';

import LegendElement from '#components/LegendElement';
import Button from '#components/Button';
import Header from '#components/Header';
import HTMLOutput from '#components/HTMLOutput';
import EllipsizedContent from '#components/EllipsizedContent';
import TextOutput from '#components/TextOutput';
import Infographic from '#components/Infographic';
import GoodPracticeItem from '#components/GoodPracticeItem';
import SliderInput from '#components/SliderInput';
import { goodPracticesList as relatedMaterials } from '#views/GoodPractices/data';
import { formatNumber } from '#utils/common';

import {
    countryMetadata,
} from './data';
import styles from './styles.css';

type DisplacementType = 'Conflict' | 'Disaster' | 'Other';
type DisplacementNumber = 'less-than-100' | 'less-than-1000' | 'more-than-1000';

interface PopupProperties {
    type: 'Disaster' | 'Conflict' | 'Other',
    value: number,
    description: string,
}

type IduGeoJSON = GeoJSON.FeatureCollection<
    GeoJSON.Point,
    { type: 'Disaster' | 'Conflict' | 'Other', value: number, description: string | null | undefined }
>;

const REST_ENDPOINT = process.env.REACT_APP_REST_ENDPOINT as string;
const categoryKeySelector = (d: CategoryStatisticsType) => d.label;

const options: { key: string; label: string }[] = [];

const iduPointColor: mapboxgl.CirclePaint = {
    'circle-opacity': 0.6,
    'circle-color': {
        property: 'type',
        type: 'categorical',
        stops: [
            ['Conflict', 'rgb(239, 125, 0)'],
            ['Disaster', 'rgb(1, 142, 202)'],
            ['Other', 'rgb(51, 149, 62)'],
        ],
    },
    'circle-radius': {
        property: 'value',
        base: 1.75,
        stops: [
            [0, 5],
            [100, 9],
            [1000, 13],
        ],
    },
};

const popupOptions: PopupOptions = {
    closeOnClick: true,
    closeButton: false,
    offset: 12,
    maxWidth: '480px',
};

const sourceOption: mapboxgl.GeoJSONSourceRaw = {
    type: 'geojson',
};

const lightStyle = process.env.REACT_APP_MAPBOX_STYLE || 'mapbox://styles/mapbox/light-v10';

const colorScheme = [
    'rgb(6, 23, 158)',
    'rgb(8, 56, 201)',
    'rgb(8, 116, 226)',
    'rgb(1, 142, 202)',
    'rgb(45, 183, 226)',
    'rgb(94, 217, 238)',
];

const COUNTRY_PROFILE = gql`
    query CountryProfile($iso3: String!) {
        country(iso3: $iso3) {
            id
            name
            boundingBox
            description
            backgroundImage {
                name
                url
            }
            overviews {
                description
                id
                year
                updatedAt
            }
            contactPersonDescription
            contactPersonImage {
                url
                name
            }
            essentialLinks
            internalDisplacementDescription
            latestNewDisplacementsDescription
        }
    }
`;

const CONFLICT_DATA = gql`
    query ConflictData($countryIso3: String!, $startYear: Int, $endYear: Int) {
        conflictStatistics(filters: { countriesIso3: [$countryIso3], endYear: $endYear, startYear: $startYear }) {
            newDisplacements
            totalIdps
            timeseries {
                totalIdps
                totalNewDisplacement
                year
            }
        }
    }
`;

const DISASTER_DATA = gql`
    query DisasterData($countryIso3: String!, $startYear: Int, $endYear: Int, $categories: [String!]) {
        disasterStatistics(filters: { countriesIso3: [$countryIso3], endYear: $endYear, startYear: $startYear, categories: $categories}) {
            newDisplacements
            totalEvents
            categories {
                label
                total
            }
            timeseries {
                total
                year
            }
        }
    }
`;

const COUNTRY_DISASTER_CATEGORIES = gql`
    query DisasterCategory($countryIso3: String!) {
        disasterStatistics(filters: { countriesIso3: [$countryIso3] }) {
            categories {
                label
                total
            }
        }
    }
`;

const IDU_DATA = gql`
    query IduData($country: String!) {
        idu(country: $country) @rest(
            type: "[IduData]",
            method: "GET",
            path: "data/idus_view_flat_cached?iso3=eq.:country&order=displacement_start_date.desc,displacement_end_date.desc"
        ) {
            id
            country
            iso3
            centroid
            latitude
            longitude
            displacement_type
            qualifier
            figure
            displacment_date
            displacement_start_date
            displacement_end_date
            year
            event_name
            event_start_date
            event_end_date
            category
            subcategory
            type
            subtype
            standard_popup_text
            standard_info_text
        }
    }
`;

// constant
const initialIduItems = 2;
const startYear = 2008;
const endYear = (new Date()).getFullYear();

// options
const typeOfDisplacementOptions: {
    key: DisplacementType;
    label: string;
}[] = [
    { key: 'Conflict', label: 'Conflict' },
    { key: 'Disaster', label: 'Disaster' },
];
const noOfDisplacementOptions: {
    key: DisplacementNumber;
    label: string;
}[] = [
    { key: 'less-than-100', label: '< 100' },
    { key: 'less-than-1000', label: '< 1000' },
    { key: 'more-than-1000', label: '> 1000' },
];

interface Props {
    className?: string;
}

function CountryProfile(props: Props) {
    const {
        className,
    } = props;

    // Send this to server
    // Read this from navbar
    const currentCountry = 'MMR';

    // Overview section
    const [activeYear, setActiveYear] = React.useState<string>(String(endYear));

    // Disaster section
    const [categories, setCategories] = React.useState<string[] | undefined>();

    // IDU list section
    const [iduPage, setIduPage] = React.useState(1);

    // IDU map section
    const [timerangeBounds, setTimerangeBounds] = React.useState([startYear, endYear]);
    const [timerange, setTimerange] = React.useState([startYear, endYear]);
    const [conflictTimeRange, setConflictTimeRange] = React.useState([startYear, endYear]);
    const [disasterTimeRange, setDisasterTimeRange] = React.useState([startYear, endYear]);

    const [
        typeOfDisplacements,
        handleTypeOfDisplacementsChange,
    ] = useInputState<DisplacementType[]>([]);
    const [
        noOfDisplacements,
        handleNoOfDisplacementsChange,
    ] = useInputState<DisplacementNumber[]>([]);
    const [
        hoverFeatureProperties,
        setHoverFeatureProperties,
    ] = React.useState<PopupProperties | undefined>(undefined);
    const [hoverLngLat, setHoverLngLat] = React.useState<LngLatLike>();

    const handlePointClick = React.useCallback((feature: MapboxGeoJSONFeature, lngLat: LngLat) => {
        if (feature.properties) {
            setHoverLngLat(lngLat);
            setHoverFeatureProperties(feature.properties as PopupProperties);
        } else {
            setHoverFeatureProperties(undefined);
        }
        return true;
    }, []);

    const handlePopupClose = React.useCallback(() => {
        setHoverLngLat(undefined);
        setHoverFeatureProperties(undefined);
    }, []);

    const {
        previousData,
        data: countryProfileData = previousData,
        loading: countryProfileLoading,
        error: countryProfileError,
    } = useQuery<CountryProfileQuery, CountryProfileQueryVariables>(
        COUNTRY_PROFILE,
        {
            variables: {
                iso3: currentCountry,
            },
            onCompleted: (response) => {
                if (!response.country) {
                    return;
                }
                const {
                    overviews,
                } = response.country;
                if (overviews && overviews.length > 0) {
                    setActiveYear(overviews[0].year.toString());
                }
            },
        },
    );

    const {
        previousData: previousDisasterCategories,
        data: disasterCategories = previousDisasterCategories,
        loading: disasterCategoriesLoading,
        error: disasterCategoriesError,
    } = useQuery<DisasterCategoryQuery, DisasterCategoryQueryVariables>(
        COUNTRY_DISASTER_CATEGORIES,
        {
            variables: {
                countryIso3: currentCountry,
            },
        },
    );

    const {
        previousData: previousDisasterData,
        data: disasterData = previousDisasterData,
        loading: disasterDataLoading,
        error: disasterDataError,
    } = useQuery<DisasterDataQuery, DisasterDataQueryVariables>(
        DISASTER_DATA,
        {
            variables: {
                countryIso3: currentCountry,
                startYear: disasterTimeRange[0],
                endYear: disasterTimeRange[1],
                categories,
            },
        },
    );

    const {
        previousData: previousConflictData,
        data: conflictData = previousConflictData,
        loading: conflictDataLoading,
        error: conflictDataError,
    } = useQuery<ConflictDataQuery, ConflictDataQueryVariables>(
        CONFLICT_DATA,
        {
            variables: {
                countryIso3: currentCountry,
                startYear: conflictTimeRange[0],
                endYear: conflictTimeRange[1],
            },
        },
    );

    const {
        previousData: previousIduData,
        data: iduData = previousIduData,
        loading: iduDataLoading,
        error: iduDataError,
    } = useQuery<IduDataQuery, IduDataQueryVariables>(
        IDU_DATA,
        {
            variables: {
                country: currentCountry,
            },
            onCompleted: (response) => {
                if (!response.idu || response.idu.length <= 0) {
                    return;
                }
                const max = Math.max(...response.idu.map((item) => item.year).filter(isDefined));
                let min = Math.min(...response.idu.map((item) => item.year).filter(isDefined));
                if (min === max) {
                    min -= 1;
                }
                setTimerangeBounds([min, max]);
                setTimerange([min, max]);
            },
        },
    );

    const idus = iduData?.idu;
    const countryInfo = countryProfileData?.country;

    const iduGeojson: IduGeoJSON = React.useMemo(
        () => ({
            type: 'FeatureCollection',
            features: idus
                ?.map((idu) => {
                    if (
                        isNotDefined(idu.longitude)
                        || isNotDefined(idu.latitude)
                        || isNotDefined(idu.figure)
                        || isNotDefined(idu.displacement_type)
                        // NOTE: filtering out displacement_type Other
                        || idu.displacement_type === 'Other'
                    ) {
                        return undefined;
                    }

                    if (typeOfDisplacements.length > 0) {
                        if (!typeOfDisplacements.includes(idu.displacement_type)) {
                            return undefined;
                        }
                    }
                    if (noOfDisplacements.length > 0) {
                        let key: DisplacementNumber;
                        if (idu.figure < 100) {
                            key = 'less-than-100';
                        } else if (idu.figure < 1000) {
                            key = 'less-than-1000';
                        } else {
                            key = 'more-than-1000';
                        }

                        if (!noOfDisplacements.includes(key)) {
                            return undefined;
                        }
                    }
                    if (timerange) {
                        const [min, max] = timerange;
                        if (!idu.year || idu.year < min || idu.year > max) {
                            return undefined;
                        }
                    }

                    return {
                        id: idu.id,
                        type: 'Feature' as const,
                        properties: {
                            type: idu.displacement_type,
                            value: idu.figure,
                            description: idu.standard_popup_text,
                        },
                        geometry: {
                            type: 'Point' as const,
                            coordinates: [
                                idu.longitude,
                                idu.latitude,
                            ],
                        },
                    };
                }).filter(isDefined) ?? [],
        }),
        [idus, noOfDisplacements, typeOfDisplacements, timerange],
    );

    if (countryProfileLoading || iduDataLoading) {
        return (
            <div className={_cs(styles.countryProfile, className)}>
                Loading....
            </div>
        );
    }

    if (
        iduDataError
        || countryProfileError
        || !countryInfo
    ) {
        return (
            <div className={_cs(styles.countryProfile, className)}>
                Error fetching country profile....
            </div>
        );
    }

    return (
        <div className={_cs(styles.countryProfile, className)}>
            {countryInfo.backgroundImage && (
                <img
                    className={styles.coverImage}
                    src={countryInfo.backgroundImage.url}
                    alt={countryInfo.backgroundImage.name}
                />
            )}
            <div className={styles.mainContent}>
                <section className={styles.profile}>
                    <Header
                        headingSize="extraLarge"
                        headingInfo={countryMetadata.countryProfileTooltip && (
                            <IoInformationCircleOutline
                                title={countryMetadata.countryProfileTooltip}
                            />
                        )}
                        heading={`Country Profile: ${countryInfo.name}`}
                    />
                    <EllipsizedContent>
                        <HTMLOutput
                            value={countryInfo.description}
                        />
                    </EllipsizedContent>
                </section>
                {countryInfo.overviews && countryInfo.overviews.length > 0 && (
                    <section className={styles.overview}>
                        <Header
                            headingSize="large"
                            heading="Overview"
                        />
                        <Tabs
                            value={activeYear}
                            onChange={setActiveYear}
                        >
                            <TabList>
                                {countryInfo.overviews.map((countryOverview) => (
                                    <Tab
                                        key={countryOverview.year}
                                        name={countryOverview.year.toString()}
                                    >
                                        {countryOverview.year}
                                    </Tab>
                                ))}
                            </TabList>
                            {countryInfo.overviews.map((countryOverview) => (
                                <TabPanel
                                    key={countryOverview.year}
                                    name={countryOverview.year.toString()}
                                >
                                    <TextOutput
                                        label="Last modified"
                                        value={countryOverview.updatedAt}
                                        valueType="date"
                                    />
                                    <EllipsizedContent>
                                        <HTMLOutput
                                            value={countryOverview.description}
                                        />
                                    </EllipsizedContent>
                                </TabPanel>
                            ))}
                        </Tabs>
                    </section>
                )}
                {(
                    conflictData?.conflictStatistics
                    || disasterData?.disasterStatistics
                    || countryInfo.description
                ) && (
                    <section className={styles.displacementData}>
                        <Header
                            headingSize="large"
                            heading="Displacement Data"
                            headingInfo={countryMetadata.displacementDataTooltip && (
                                <IoInformationCircleOutline
                                    title={countryMetadata.displacementDataTooltip}
                                />
                            )}
                        />
                        <EllipsizedContent>
                            <HTMLOutput
                                value={countryInfo.description}
                            />
                        </EllipsizedContent>
                        <div className={styles.infographics}>
                            {conflictData?.conflictStatistics && (
                                <div className={styles.conflictInfographics}>
                                    <Header
                                        heading="Conflict and Violence Data"
                                        headingSize="small"
                                        headingDescription={(
                                            <>
                                                <Link
                                                    to={`${REST_ENDPOINT}/countries/${currentCountry}/conflict-export/`}
                                                    icons={(
                                                        <IoDownloadOutline />
                                                    )}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Download data
                                                </Link>
                                            </>
                                        )}
                                        headingInfo={countryMetadata.conflictAndViolenceTooltip && (
                                            <IoInformationCircleOutline
                                                title={countryMetadata.conflictAndViolenceTooltip}
                                            />
                                        )}
                                        inlineHeadingDescription
                                    />
                                    <div className={styles.conflictFilter}>
                                        <SliderInput
                                            min={startYear}
                                            max={endYear}
                                            step={1}
                                            minDistance={0}
                                            value={conflictTimeRange}
                                            onChange={setConflictTimeRange}
                                        />
                                    </div>
                                    <div className={styles.infographicList}>
                                        <Infographic
                                            totalValue={conflictData
                                                ?.conflictStatistics.newDisplacements || 0}
                                            description="New Displacements"
                                            date={`${startYear} - ${endYear}`}
                                            chart={(
                                                <ResponsiveContainer>
                                                    <LineChart
                                                        data={conflictData
                                                            ?.conflictStatistics.timeseries}
                                                    >
                                                        <XAxis
                                                            dataKey="year"
                                                            axisLine={false}
                                                        />
                                                        <CartesianGrid
                                                            vertical={false}
                                                            strokeDasharray="3 3"
                                                        />
                                                        <YAxis
                                                            axisLine={false}
                                                            tickFormatter={formatNumber}
                                                        />
                                                        <Tooltip
                                                            formatter={formatNumber}
                                                        />
                                                        <Legend />
                                                        <Line
                                                            dataKey="totalNewDisplacement"
                                                            key="totalNewDisplacement"
                                                            stroke="var(--color-conflict)"
                                                            name="Conflict internal displacements"
                                                            strokeWidth={2}
                                                            connectNulls
                                                            dot
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            )}
                                        />
                                        <Infographic
                                            totalValue={conflictData
                                                ?.conflictStatistics.totalIdps || 0}
                                            description="Total number of IDPs"
                                            date={`As of end of ${endYear}`}
                                            chart={(
                                                <ResponsiveContainer>
                                                    <BarChart
                                                        data={conflictData
                                                            ?.conflictStatistics.timeseries}
                                                    >
                                                        <XAxis
                                                            dataKey="year"
                                                            axisLine={false}
                                                        />
                                                        <CartesianGrid
                                                            vertical={false}
                                                            strokeDasharray="3 3"
                                                        />
                                                        <YAxis
                                                            axisLine={false}
                                                            tickFormatter={formatNumber}
                                                        />
                                                        <Tooltip
                                                            formatter={formatNumber}
                                                        />
                                                        <Legend />
                                                        <Bar
                                                            dataKey="totalIdps"
                                                            name="Conflict total number of IDPs"
                                                            fill="var(--color-conflict)"
                                                            shape={<RoundedBar />}
                                                            maxBarSize={6}
                                                        />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            )}
                                        />
                                    </div>
                                </div>
                            )}
                            {disasterData?.disasterStatistics && (
                                <div className={styles.disasterInfographics}>
                                    <Header
                                        headingSize="small"
                                        heading="Disaster Data"
                                        headingDescription={(
                                            <>
                                                <Link
                                                    to={`${REST_ENDPOINT}/countries/${currentCountry}/disaster-export/`}
                                                    icons={(
                                                        <IoDownloadOutline />
                                                    )}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Download data
                                                </Link>
                                            </>
                                        )}
                                        headingInfo={countryMetadata.disasterTooltip && (
                                            <IoInformationCircleOutline
                                                title={countryMetadata.disasterTooltip}
                                            />
                                        )}
                                        inlineHeadingDescription
                                    />
                                    <div className={styles.disasterFilter}>
                                        <SliderInput
                                            min={startYear}
                                            max={endYear}
                                            step={1}
                                            minDistance={0}
                                            value={disasterTimeRange}
                                            onChange={setDisasterTimeRange}
                                        />
                                        <MultiSelectInput
                                            variant="general"
                                            placeholder="Disaster Category"
                                            name="disasterCategory"
                                            value={categories}
                                            options={
                                                disasterCategories?.disasterStatistics.categories
                                            }
                                            keySelector={categoryKeySelector}
                                            labelSelector={categoryKeySelector}
                                            onChange={setCategories}
                                            disabled={disasterCategoriesLoading
                                                || isDefined(disasterCategoriesError)}
                                        />
                                    </div>
                                    <div className={styles.infographicList}>
                                        <Infographic
                                            totalValue={disasterData
                                                ?.disasterStatistics.newDisplacements || 0}
                                            description="New Displacements"
                                            date={`${startYear} - ${endYear}`}
                                            chart={(
                                                <ResponsiveContainer>
                                                    <LineChart
                                                        data={disasterData
                                                            ?.disasterStatistics.timeseries}
                                                    >
                                                        <XAxis
                                                            dataKey="year"
                                                            axisLine={false}
                                                        />
                                                        <CartesianGrid
                                                            vertical={false}
                                                            strokeDasharray="3 3"
                                                        />
                                                        <YAxis
                                                            axisLine={false}
                                                            tickFormatter={formatNumber}
                                                        />
                                                        <Tooltip
                                                            formatter={formatNumber}
                                                        />
                                                        <Legend />
                                                        <Line
                                                            dataKey="total"
                                                            key="total"
                                                            fill="var(--color-disaster)"
                                                            name="Disaster internal displacements"
                                                            strokeWidth={2}
                                                            connectNulls
                                                            dot
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            )}
                                        />
                                        <Infographic
                                            totalValue={disasterData
                                                ?.disasterStatistics.totalEvents || 0}
                                            description="Disaster events reported"
                                            date={`${startYear} - ${endYear}`}
                                            chart={(
                                                <ResponsiveContainer>
                                                    <PieChart>
                                                        <Tooltip
                                                            formatter={formatNumber}
                                                        />
                                                        <Legend />
                                                        <Pie
                                                            data={disasterData
                                                                ?.disasterStatistics.categories}
                                                            dataKey="total"
                                                            nameKey="label"
                                                        >
                                                            {disasterCategories
                                                                ?.disasterStatistics?.categories?.map(({ label }, index) => ( // eslint-disable-line max-len
                                                                    <Cell
                                                                        key={label}
                                                                        fill={colorScheme[
                                                                            index % colorScheme.length // eslint-disable-line max-len
                                                                        ]}
                                                                    />
                                                                ))}
                                                        </Pie>
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            )}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}
                {((idus && idus.length > 0) || countryInfo.latestNewDisplacementsDescription) && (
                    <section className={styles.latestNewDisplacements}>
                        <Header
                            headingSize="large"
                            heading="Latest Internal Displacements"
                            headingInfo={countryMetadata.latestNewDisplacementsTooltip && (
                                <IoInformationCircleOutline
                                    title={countryMetadata.latestNewDisplacementsTooltip}
                                />
                            )}
                        />
                        <EllipsizedContent>
                            <HTMLOutput
                                value={countryInfo.latestNewDisplacementsDescription}
                            />
                        </EllipsizedContent>
                        <div className={styles.iduContainer}>
                            {idus && idus.slice(0, iduPage * initialIduItems)?.map((idu) => (
                                <div
                                    key={idu.id}
                                    className={styles.idu}
                                >
                                    <HTMLOutput
                                        value={idu.standard_popup_text}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className={styles.iduPager}>
                            {idus && idus.length > (iduPage * initialIduItems) && (
                                <Button
                                    name={undefined}
                                    // variant="secondary"
                                    onClick={() => {
                                        setIduPage((val) => val + 1);
                                    }}
                                >
                                    Show more
                                </Button>
                            )}
                            {iduPage > 1 && (
                                <Button
                                    name={undefined}
                                    // variant="secondary"
                                    onClick={() => {
                                        setIduPage(1);
                                    }}
                                >
                                    Collapse
                                </Button>
                            )}
                        </div>
                    </section>
                )}
                {(
                    countryInfo.internalDisplacementDescription
                    || (idus && idus.length > 0)
                ) && (
                    <section className={styles.internalDisplacementUpdates}>
                        <Header
                            headingSize="large"
                            heading="Internal Displacement Updates"
                            headingInfo={countryMetadata.internalDisplacementUpdatesTooltip && (
                                <IoInformationCircleOutline
                                    title={countryMetadata.internalDisplacementUpdatesTooltip}
                                />
                            )}
                        />
                        <EllipsizedContent>
                            <HTMLOutput
                                value={countryInfo.internalDisplacementDescription}
                            />
                        </EllipsizedContent>
                        <div className={styles.filter}>
                            <SliderInput
                                // NOTE: timescale
                                min={timerangeBounds[0]}
                                max={timerangeBounds[1]}
                                step={1}
                                minDistance={0}
                                value={timerange}
                                onChange={setTimerange}
                            />
                            <MultiSelectInput
                                variant="general"
                                placeholder="Type of displacement"
                                name="typeOfDisplacement"
                                value={typeOfDisplacements}
                                options={typeOfDisplacementOptions}
                                keySelector={(item) => item.key}
                                labelSelector={(item) => item.label}
                                onChange={handleTypeOfDisplacementsChange}
                            />
                            <MultiSelectInput
                                variant="general"
                                placeholder="No. of displacement"
                                name="numberOfDisplacement"
                                value={noOfDisplacements}
                                options={noOfDisplacementOptions}
                                keySelector={(item) => item.key}
                                labelSelector={(item) => item.label}
                                onChange={handleNoOfDisplacementsChange}
                            />
                        </div>
                        <div>
                            Hover over and click on the coloured bubbles to see near real-time
                            snapshots of situations of internal displacement across the globe.
                        </div>
                        <Map
                            mapStyle={lightStyle}
                            mapOptions={{
                                logoPosition: 'bottom-left',
                                scrollZoom: false,
                            }}
                            scaleControlShown
                            navControlShown
                        >
                            <div className={styles.mapWrapper}>
                                <div className={styles.legendList}>
                                    <div className={styles.legend}>
                                        <Header
                                            headingSize="extraSmall"
                                            heading="Type of displacement"
                                        />
                                        <div className={styles.legendElementList}>
                                            <LegendElement
                                                color="var(--color-conflict)"
                                                label="Conflict"
                                            />
                                            <LegendElement
                                                color="var(--color-disaster)"
                                                label="Disaster"
                                            />
                                            {/*
                                            <LegendElement
                                                color="var(--color-other)"
                                                label="Other"
                                            />
                                            */}
                                        </div>
                                    </div>
                                    <div className={styles.separator} />
                                    <div className={styles.legend}>
                                        <Header
                                            headingSize="extraSmall"
                                            heading="No. of Displacement"
                                        />
                                        <div className={styles.legendElementList}>
                                            <LegendElement
                                                color="grey"
                                                size={10}
                                                label="< 100"
                                            />
                                            <LegendElement
                                                color="grey"
                                                size={18}
                                                label="< 1000"
                                            />
                                            <LegendElement
                                                color="grey"
                                                size={26}
                                                label="> 1000"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <MapContainer
                                    className={styles.mapContainer}
                                />
                            </div>
                            <MapBounds
                                bounds={countryInfo.boundingBox as LngLatBounds | undefined}
                                padding={50}
                            />
                            <MapSource
                                sourceKey="idu-points"
                                sourceOptions={sourceOption}
                                geoJson={iduGeojson}
                            >
                                <MapLayer
                                    layerKey="idu-point"
                                    // onClick={handlePointClick}
                                    layerOptions={{
                                        type: 'circle',
                                        paint: iduPointColor,
                                    }}
                                    onClick={handlePointClick}
                                />
                                {hoverLngLat && hoverFeatureProperties && (
                                    <MapTooltip
                                        coordinates={hoverLngLat}
                                        tooltipOptions={popupOptions}
                                        onHide={handlePopupClose}
                                    >
                                        <HTMLOutput
                                            value={hoverFeatureProperties.description}
                                        />
                                    </MapTooltip>
                                )}
                            </MapSource>
                        </Map>
                    </section>
                )}
                {relatedMaterials.length > 0 && (
                    <section className={styles.relatedMaterial}>
                        <Header
                            headingSize="large"
                            heading="Related Material"
                            headingInfo={countryMetadata.relatedMaterialTooltip && (
                                <IoInformationCircleOutline
                                    title={countryMetadata.relatedMaterialTooltip}
                                />
                            )}
                        />
                        <div className={styles.materialList}>
                            {relatedMaterials.map((gp) => (
                                <GoodPracticeItem
                                    dataId={gp.id}
                                    key={gp.id}
                                    className={styles.material}
                                    coverImageUrl={gp.image}
                                    heading={gp.title}
                                    description={gp.description}
                                    date="2021-05-20"
                                />
                            ))}
                        </div>
                    </section>
                )}
                <section className={styles.misc}>
                    {countryInfo.essentialLinks && (
                        <div className={styles.essentialReading}>
                            <Header
                                heading="Essential Reading"
                                headingSize="large"
                                headingInfo={countryMetadata.essentialReadingTooltip && (
                                    <IoInformationCircleOutline
                                        title={countryMetadata.essentialReadingTooltip}
                                    />
                                )}
                            />
                            <HTMLOutput
                                value={countryInfo.essentialLinks}
                            />
                        </div>
                    )}
                    {(
                        countryInfo.contactPersonDescription
                        || countryInfo.contactPersonImage
                    ) && (
                        <div className={styles.contact}>
                            <Header
                                heading="For more information please contact:"
                                headingSize="medium"
                                headingInfo={countryMetadata.contactTooltip && (
                                    <IoInformationCircleOutline
                                        title={countryMetadata.contactTooltip}
                                    />
                                )}
                            />
                            {countryInfo.contactPersonImage && (
                                <img
                                    className={styles.preview}
                                    src={countryInfo.contactPersonImage.url}
                                    alt={countryInfo.contactPersonImage.name}
                                />
                            )}
                            <HTMLOutput
                                value={countryInfo.contactPersonDescription}
                            />
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default CountryProfile;
