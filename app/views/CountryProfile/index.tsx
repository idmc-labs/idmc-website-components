import React from 'react';
import {
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
    IoArrowDown,
    IoArrowUp,
} from 'react-icons/io5';
import { _cs, isDefined, isNotDefined, randomString } from '@togglecorp/fujs';
import { saveAs } from 'file-saver';
import stringify from 'csv-stringify/lib/browser/sync';
import ReactTooltip from 'react-tooltip';

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
    RelatedMaterialsQuery,
    RelatedMaterialsQueryVariables,
    DisasterDataQuery,
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
import Container from '#components/Container';

import { formatNumber } from '#utils/common';

import ConflictIcon from '../../resources/icons/Icon_Conflict-Conflict.svg';
import DroughtIcon from '../../resources/icons/Icon_Disaster-Drought.svg';
import DryMassMovementIcon from '../../resources/icons/Icon_Disaster-Dry_Mass_Movements.svg';
import EarthquakeIcon from '../../resources/icons/Icon_Disaster-Earthquake.svg';
import ExtremeTemperatureIcon from '../../resources/icons/Icon_Disaster-Extreme_Temperature.svg';
import FloodIcon from '../../resources/icons/Icon_Disaster-Flood.svg';
import MassMovementIcon from '../../resources/icons/Icon_Disaster-Mass_Movement.svg';
import SevereWinterConditionsIcon from '../../resources/icons/Icon_Disaster-Sever_Winter_Conditions.svg';
import StormIcon from '../../resources/icons/Icon_Disaster-Storm.svg';
import VolcanicActivityIcon from '../../resources/icons/Icon_Disaster-Volcanic_Activity.svg';
import VolcanicEruptionIcon from '../../resources/icons/Icon_Disaster-Volcanic_Eruption.svg';
import WetMassMovementIcon from '../../resources/icons/Icon_Disaster-Wet_Mass_Movements.svg';
import WildfireIcon from '../../resources/icons/Icon_Disaster-Wildfire.svg';
import OtherIcon from '../../resources/icons/Icon_Other.svg';

import { countryMetadata } from './data';

import styles from './styles.css';

const DRUPAL_ENDPOINT = process.env.REACT_APP_DRUPAL_ENDPOINT as string;

function useId() {
    const id = React.useMemo(() => randomString(), []);
    return id;
}

function getProxyDrupalUrl(image: null): null;
function getProxyDrupalUrl(image: undefined): undefined;
function getProxyDrupalUrl(image: string): string;
function getProxyDrupalUrl(image: string | null | undefined): string | null | undefined;
function getProxyDrupalUrl(image: string | null | undefined) {
    if (!image || !DRUPAL_ENDPOINT) {
        return image;
    }
    const path = new URL(image).pathname;
    return `${DRUPAL_ENDPOINT}${path}`;
}

interface TooltipIconProps {
    children?: React.ReactNode;
}
function TooltipIcon(props: TooltipIconProps) {
    const {
        children,
    } = props;
    const id = useId();

    if (!children) {
        return null;
    }
    return (
        <>
            <span
                data-tip
                data-for={id}
            >
                <IoInformationCircleOutline />
            </span>
            <ReactTooltip
                id={id}
                place="top"
                type="dark"
                effect="solid"
                className={styles.tooltip}
            >
                {children}
            </ReactTooltip>
        </>
    );
}

const disasterMap: { [key: string]: string } = {
    // Disaster type we get from helix
    Storm: StormIcon,
    Flood: FloodIcon,
    Earthquake: EarthquakeIcon,
    Drought: DroughtIcon,
    'Wet mass movement': WetMassMovementIcon,
    Wildfire: WildfireIcon,
    'Dry mass movement': DryMassMovementIcon,
    'Volcanic eruption': VolcanicEruptionIcon,
    'Extreme temperature': ExtremeTemperatureIcon,

    // Disaster type we have on gidd but did not get from helix
    'Mass movement': MassMovementIcon,
    'Severe winter condition': SevereWinterConditionsIcon,
    'Volcanic activity': VolcanicActivityIcon,

    Unknown: OtherIcon,
};

function getIcon(
    displacementType: string | undefined | null,
    disasterType: string | undefined | null,
) {
    if (displacementType === 'Conflict') {
        return ConflictIcon;
    }
    if (displacementType === 'Disaster' && disasterType) {
        return disasterMap[disasterType] ?? OtherIcon;
    }
    return OtherIcon;
}

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
            displacementDataDescription
            internalDisplacementDescription
            latestNewDisplacementsDescription
        }
        conflictStatistics(filters: { countriesIso3: [$iso3] }) {
            newDisplacements
            totalIdps
        }
        disasterStatistics(filters: { countriesIso3: [$iso3] }) {
            newDisplacements

            categories {
                label
                total
            }
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

const IDU_DATA = gql`
    query IduData($country: String!) {
        idu(country: $country) @rest(
            type: "[IduData]",
            method: "GET",
            endpoint: "helix",
            path: "/data/idus_view_flat_cached?iso3=eq.:country&order=displacement_start_date.desc,displacement_end_date.desc"
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

const RELATED_MATERIALS = gql`
    query RelatedMaterials($countryName: String!, $offset: Int!, $itemsPerPage: Int!) {
        relatedMaterials(countryName: $countryName, offset: $offset, itemsPerPage: $itemsPerPage) @rest(
            type: "RelatedMaterials!",
            method: "GET",
            endpoint: "drupal",
            path: "/previous-information/rest?_format=json&tags=:countryName&offset=:offset&items_per_page=:itemsPerPage"
        ) {
            rows {
                type {
                    target_id
                }
                metatag {
                    value {
                        canonical_url
                        title
                        description
                        og_type
                        og_image_0
                    }
                }
            }
            pager {
                total_items
                total_pages
                items_per_page
            }
        }
    }
`;

// constant
const initialIduItems = 2;
const startYear = 2008;
const endYear = (new Date()).getFullYear();
const giddLink = 'https://www.internal-displacement.org/database/displacement-data';

interface Props {
    className?: string;
    iso3: string;
    countryName?: string;
}

function CountryProfile(props: Props) {
    const {
        className,
        iso3: currentCountry,
        countryName,
    } = props;

    // Overview section
    const [activeYear, setActiveYear] = React.useState<string>(String(endYear));

    // Conflict section
    // FIXME: debounce this value
    const [conflictTimeRange, setConflictTimeRange] = React.useState([startYear, endYear]);

    // Disaster section
    const [categories, setCategories] = React.useState<string[] | undefined>();
    // FIXME: debounce this value
    const [disasterTimeRange, setDisasterTimeRange] = React.useState([startYear, endYear]);

    // Related material section
    const pageSize = 4;

    // IDU list section
    const [iduPage, setIduPage] = React.useState(1);

    // IDU map section
    const [timerangeBounds, setTimerangeBounds] = React.useState([startYear, endYear]);
    const [timerange, setTimerange] = React.useState([startYear, endYear]);

    const [
        typeOfDisplacements,
        setTypeOfDisplacements,
    ] = useInputState<DisplacementType[]>([]);

    const handleTypeOfDisplacementsChange = React.useCallback((value: DisplacementType) => {
        setTypeOfDisplacements((oldValue: DisplacementType[]) => {
            const newValue = [...oldValue];
            const oldIndex = oldValue.findIndex((d) => d === value);
            if (oldIndex !== -1) {
                newValue.splice(oldIndex, 1);
            } else {
                newValue.push(value);
            }

            return newValue;
        });
    }, [setTypeOfDisplacements]);

    const [
        noOfDisplacements,
        setNoOfDisplacements,
    ] = useInputState<DisplacementNumber[]>([]);

    const handleNoOfDisplacementsChange = React.useCallback((value: DisplacementNumber) => {
        setNoOfDisplacements((oldValue: DisplacementNumber[]) => {
            const newValue = [...oldValue];
            const oldIndex = oldValue.findIndex((d) => d === value);
            if (oldIndex !== -1) {
                newValue.splice(oldIndex, 1);
            } else {
                newValue.push(value);
            }

            return newValue;
        });
    }, [setNoOfDisplacements]);

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
        // FIXME: handle loading and error
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
        previousData: previousDisasterData,
        data: disasterData = previousDisasterData,
        // FIXME: handle loading and error
        // loading: disasterDataLoading,
        // error: disasterDataError,
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
        // FIXME: handle loading and error
        // loading: conflictDataLoading,
        // error: conflictDataError,
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
        // FIXME: handle loading and error
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

    const {
        data,
        fetchMore,
        // FIXME: handle loading and error
        // loading,
        // error,
    } = useQuery<RelatedMaterialsQuery, RelatedMaterialsQueryVariables>(
        RELATED_MATERIALS,
        {
            skip: !countryName,
            variables: countryName ? {
                countryName,
                offset: 0,
                itemsPerPage: pageSize,
            } : undefined,
        },
    );

    const relatedMaterials = data?.relatedMaterials?.rows;
    const offset = relatedMaterials?.length ?? 0;

    const remainingRelatedMaterials = Math.max(
        0,
        Number(data?.relatedMaterials?.pager?.total_items || '0') - pageSize,
    );

    const idus = iduData?.idu;
    const countryInfo = countryProfileData?.country;

    const conflictShown = (
        (countryProfileData?.conflictStatistics?.newDisplacements ?? 0)
        + (countryProfileData?.conflictStatistics?.totalIdps ?? 0)
    ) > 0;
    const disasterShown = (countryProfileData?.disasterStatistics?.newDisplacements ?? 0) > 0;

    const handleExportIduClick = React.useCallback(() => {
        if (idus && idus.length > 0) {
            // FIXME: we may need to manually set headers (first data may not
            // always have all the keys)
            const headers = Object.keys(idus[0]);

            const dataString = stringify(idus, {
                columns: headers,
            });
            const fullCsvString = `${headers}\n${dataString}`;
            const blob = new Blob(
                [fullCsvString],
                { type: 'text/csv;charset=utf-8' },
            );
            saveAs(blob, 'idu_export.csv');
        }
    }, [idus]);

    const handleShowMoreButtonClick = React.useCallback(() => {
        fetchMore({
            variables: {
                countryName,
                offset,
                itemsPerPage: pageSize,
            },
            updateQuery: (previousResult, { fetchMoreResult }) => {
                if (!previousResult.relatedMaterials) {
                    return previousResult;
                }
                const newRows = fetchMoreResult?.relatedMaterials?.rows;
                const newPager = fetchMoreResult?.relatedMaterials?.pager;
                const oldRows = previousResult.relatedMaterials?.rows;

                if (!newRows || !newPager) {
                    return previousResult;
                }
                return ({
                    ...previousResult,
                    relatedMaterials: {
                        ...previousResult.relatedMaterials,
                        rows: [
                            ...(oldRows ?? []),
                            ...(newRows ?? []),
                        ],
                        pager: newPager,
                    },
                });
            },
        });
    }, [
        countryName,
        offset,
        fetchMore,
    ]);

    const countryOverviewSortedByYear = React.useMemo(() => {
        if (countryInfo?.overviews) {
            return [...countryInfo.overviews].sort((c1, c2) => c2.year - c1.year);
        }

        return undefined;
    }, [countryInfo]);

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

    if (iduDataError || countryProfileError || !countryInfo) {
        return (
            <div className={_cs(styles.countryProfile, className)}>
                Error fetching country profile....
            </div>
        );
    }

    const profileSection = (
        <section className={styles.profile}>
            <Header
                headingSize="extraLarge"
                headingInfo={(
                    <TooltipIcon>
                        {countryMetadata.countryProfileTooltip }
                    </TooltipIcon>
                )}
                headingTitle="Country Profile"
                heading={countryInfo.name}
            />
            <EllipsizedContent>
                <HTMLOutput
                    value={countryInfo.description}
                />
            </EllipsizedContent>
        </section>
    );

    const navbar = (
        <nav className={styles.navbar}>
            <a
                href="#overview"
                className={styles.navLink}
            >
                Overview
            </a>
            <a
                href="#displacement-data"
                className={styles.navLink}
            >
                Displacement Data
            </a>
            <a
                href="#latest-displacement"
                className={styles.navLink}
            >
                Latest Displacement
            </a>
            <a
                href="#displacement-updates"
                className={styles.navLink}
            >
                Displacement Updates
            </a>
            <a
                href="#related-materials"
                className={styles.navLink}
            >
                Related Materials
            </a>
            <a
                href="#contact"
                className={styles.navLink}
            >
                Contact
            </a>
        </nav>
    );

    const overviewSection = (
        countryOverviewSortedByYear && countryOverviewSortedByYear.length > 0
    ) && (
        <section className={styles.overview}>
            <Header
                headingSize="large"
                heading="Overview"
            />
            <div className={styles.overviewContent}>
                <Tabs
                    value={activeYear}
                    onChange={setActiveYear}
                    variant="secondary"
                >
                    <TabList className={styles.tabList}>
                        {countryOverviewSortedByYear.map((countryOverview) => (
                            <Tab
                                className={styles.tab}
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
                            <EllipsizedContent>
                                <HTMLOutput
                                    value={countryOverview.description}
                                />
                                <TextOutput
                                    label="Last modified"
                                    value={countryOverview.updatedAt}
                                    valueType="date"
                                />
                            </EllipsizedContent>
                        </TabPanel>
                    ))}
                </Tabs>
            </div>
        </section>
    );

    const disasterSection = disasterShown && (
        <Container
            heading="Disaster Data"
            headingSize="small"
            headingInfo={(
                <TooltipIcon>
                    {countryMetadata.disasterTooltip }
                </TooltipIcon>
            )}
            footerActions={(
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
                    <Link
                        to={giddLink}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        View GIDD dashboard
                    </Link>
                </>
            )}
            filters={(
                <>
                    <Header
                        heading="Disaster Category"
                        headingSize="extraSmall"
                        description={(
                            <MultiSelectInput
                                variant="general"
                                placeholder="Disaster Category"
                                name="disasterCategory"
                                value={categories}
                                options={countryProfileData?.disasterStatistics.categories}
                                keySelector={categoryKeySelector}
                                labelSelector={categoryKeySelector}
                                onChange={setCategories}
                            />
                        )}
                    />
                    <div className={styles.separator} />
                    <Header
                        heading="Timescale"
                        headingSize="extraSmall"
                        headingDescription={`${disasterTimeRange[0]} - ${disasterTimeRange[1]}`}
                        inlineHeadingDescription
                        description={(
                            <SliderInput
                                hideValues
                                min={startYear}
                                max={endYear}
                                step={1}
                                minDistance={0}
                                value={disasterTimeRange}
                                onChange={setDisasterTimeRange}
                            />
                        )}
                    />
                    <div />
                </>
            )}
        >
            <div className={styles.infographicList}>
                <Infographic
                    className={styles.disasterInfographic}
                    totalValue={disasterData
                        ?.disasterStatistics.newDisplacements || 0}
                    description={(
                        <div className={styles.description}>
                            <Header
                                headingClassName={styles.heading}
                                heading="Internal Displacements"
                                headingSize="extraSmall"
                                headingInfo={(
                                    <TooltipIcon>
                                        {countryMetadata?.disasterInternalDisplacementTooltip}
                                    </TooltipIcon>
                                )}
                            />
                        </div>
                    )}
                    date={`${disasterTimeRange[0]} - ${disasterTimeRange[1]}`}
                    chart={(
                        <ResponsiveContainer>
                            <LineChart
                                data={disasterData?.disasterStatistics.timeseries}
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
                    className={styles.disasterInfographic}
                    totalValue={disasterData
                        ?.disasterStatistics.totalEvents || 0}
                    description={(
                        <Header
                            headingClassName={styles.heading}
                            heading="Disaster events reported"
                            headingSize="extraSmall"
                            headingInfo={(
                                <TooltipIcon>
                                    {countryMetadata?.disasterEventTooltip }
                                </TooltipIcon>
                            )}
                        />
                    )}
                    date={`${disasterTimeRange[0]} - ${disasterTimeRange[1]}`}
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
                                    {disasterData
                                        ?.disasterStatistics
                                        ?.categories
                                        ?.map(({ label }, index) => (
                                            <Cell
                                                key={label}
                                                fill={colorScheme[
                                                    index % colorScheme.length
                                                ]}
                                            />
                                        ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                />
            </div>
        </Container>
    );

    const conflictSection = conflictShown && (
        <Container
            heading="Conflict and Violence Data"
            headingSize="small"
            headingInfo={(
                <TooltipIcon>
                    {countryMetadata.conflictAndViolenceTooltip }
                </TooltipIcon>
            )}
            filters={(
                <>
                    <Header
                        heading="Timescale"
                        headingSize="extraSmall"
                        headingDescription={`${conflictTimeRange[0]} - ${conflictTimeRange[1]}`}
                        inlineHeadingDescription
                        description={(
                            <SliderInput
                                hideValues
                                className={styles.timeRangeFilter}
                                min={startYear}
                                max={endYear}
                                step={1}
                                minDistance={0}
                                value={conflictTimeRange}
                                onChange={setConflictTimeRange}
                            />
                        )}
                    />
                    <div />
                    <div />
                </>
            )}
            footerActions={(
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
                    <Link
                        to={giddLink}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        View GIDD dashboard
                    </Link>
                </>
            )}
        >
            <div className={styles.infographicList}>
                <Infographic
                    className={styles.conflictInfographic}
                    totalValue={conflictData?.conflictStatistics.newDisplacements || 0}
                    description={(
                        <Header
                            headingClassName={styles.heading}
                            heading="Internal Displacements"
                            headingSize="extraSmall"
                            headingInfo={(
                                <TooltipIcon>
                                    {countryMetadata?.conflictInternalDisplacementTooltip }
                                </TooltipIcon>
                            )}
                        />
                    )}
                    date={`${conflictTimeRange[0]} - ${conflictTimeRange[1]}`}
                    chart={(
                        <ResponsiveContainer>
                            <LineChart
                                data={conflictData?.conflictStatistics.timeseries}
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
                    className={styles.conflictInfographic}
                    totalValue={conflictData?.conflictStatistics.totalIdps || 0}
                    description={(
                        <Header
                            headingClassName={styles.heading}
                            heading="Total number of IDPs"
                            headingSize="extraSmall"
                            headingInfo={(
                                <TooltipIcon>
                                    {countryMetadata?.conflictIDPTooltip }
                                </TooltipIcon>
                            )}
                        />
                    )}
                    date={`As of end of ${conflictTimeRange[1]}`}
                    chart={(
                        <ResponsiveContainer>
                            <BarChart
                                data={conflictData?.conflictStatistics.timeseries}
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
        </Container>
    );

    const displacementSection = (
        conflictSection
        || disasterSection
        || countryInfo.displacementDataDescription
    ) && (
        <section className={styles.displacementData}>
            <Header
                headingSize="large"
                heading="Displacement Data"
                headingInfo={(
                    <TooltipIcon>
                        {countryMetadata.displacementDataTooltip}
                    </TooltipIcon>
                )}
            />
            <EllipsizedContent>
                <HTMLOutput
                    value={countryInfo.displacementDataDescription}
                />
            </EllipsizedContent>
            <div className={styles.infographics}>
                {conflictSection}
                {disasterSection}
            </div>
        </section>
    );

    const latestNewDisplacementSection = (
        (idus && idus.length > 0)
        || countryInfo.latestNewDisplacementsDescription
    ) && (
        <section className={styles.latestNewDisplacements}>
            <Header
                headingSize="large"
                heading="Latest Internal Displacements"
                headingInfo={(
                    <TooltipIcon>
                        {countryMetadata.latestNewDisplacementsTooltip }
                    </TooltipIcon>
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
                        <img
                            className={styles.icon}
                            src={getIcon(idu.displacement_type, idu.type)}
                            alt="type"
                        />
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
                        onClick={() => {
                            setIduPage((val) => val + 1);
                        }}
                        actions={<IoArrowDown />}
                    >
                        View Older Displacements
                    </Button>
                )}
                {iduPage > 1 && (
                    <Button
                        name={undefined}
                        onClick={() => {
                            setIduPage(1);
                        }}
                        actions={<IoArrowUp />}
                    >
                        See Less
                    </Button>
                )}
            </div>
        </section>
    );

    const internalDisplacementSection = (
        countryInfo.internalDisplacementDescription
        || (idus && idus.length > 0)
    ) && (
        <section className={styles.internalDisplacementUpdates}>
            <Header
                headingSize="large"
                heading="Internal Displacement Updates"
                headingInfo={(
                    <TooltipIcon>
                        {countryMetadata.internalDisplacementUpdatesTooltip }
                    </TooltipIcon>
                )}
            />
            <EllipsizedContent>
                <HTMLOutput
                    value={countryInfo.internalDisplacementDescription}
                />
            </EllipsizedContent>
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
                                    name="Conflict"
                                    onClick={handleTypeOfDisplacementsChange}
                                    isActive={typeOfDisplacements.includes('Conflict')}
                                    color="var(--color-conflict)"
                                    label="Conflict"
                                />
                                <LegendElement
                                    name="Disaster"
                                    onClick={handleTypeOfDisplacementsChange}
                                    isActive={typeOfDisplacements.includes('Disaster')}
                                    color="var(--color-disaster)"
                                    label="Disaster"
                                />
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
                                    name="less-than-100"
                                    onClick={handleNoOfDisplacementsChange}
                                    isActive={noOfDisplacements.includes('less-than-100')}
                                    color="grey"
                                    size={10}
                                    label="< 100"
                                />
                                <LegendElement
                                    name="less-than-1000"
                                    onClick={handleNoOfDisplacementsChange}
                                    isActive={noOfDisplacements.includes('less-than-1000')}
                                    color="grey"
                                    size={18}
                                    label="< 1000"
                                />
                                <LegendElement
                                    name="more-than-1000"
                                    onClick={handleNoOfDisplacementsChange}
                                    isActive={noOfDisplacements.includes('more-than-1000')}
                                    color="grey"
                                    size={26}
                                    label="> 1000"
                                />
                            </div>
                        </div>
                        <div className={styles.separator} />
                        <div className={styles.timeRangeContainer}>
                            <Header
                                headingSize="extraSmall"
                                heading="Timescale"
                                headingDescription={`${timerange[0]} - ${timerange[1]}`}
                                inlineHeadingDescription
                            />
                            <SliderInput
                                hideValues
                                className={styles.timeRangeInput}
                                // NOTE: timescale
                                min={timerangeBounds[0]}
                                max={timerangeBounds[1]}
                                step={1}
                                minDistance={0}
                                value={timerange}
                                onChange={setTimerange}
                            />
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
            <div>
                <Link
                    to={giddLink}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    View GIDD dashboard
                </Link>
                <Button
                    name={undefined}
                    // variant="secondary"
                    onClick={handleExportIduClick}
                >
                    Download Displacement Data
                </Button>
            </div>
        </section>
    );

    const relatedMaterialsSection = (
        relatedMaterials && relatedMaterials.length > 0
    ) && (
        <section className={styles.relatedMaterial}>
            <Header
                headingSize="large"
                heading="Related Material"
                headingInfo={(
                    <TooltipIcon>
                        {countryMetadata.relatedMaterialTooltip }
                    </TooltipIcon>
                )}
            />
            <div className={styles.materialList}>
                {relatedMaterials.map((gp) => (
                    <GoodPracticeItem
                        key={gp.metatag.value.canonical_url}
                        className={styles.material}
                        coverImageUrl={getProxyDrupalUrl(gp.metatag.value.og_image_0)}
                        url={gp.metatag.value.canonical_url}
                        heading={gp.metatag.value.title}
                        description={gp.metatag.value.description}
                        // FIXME: pass date
                        // FIXME: pass doc type
                        date="2021-05-20"
                    />
                ))}
            </div>
            {remainingRelatedMaterials > 0 && (
                <Button
                    // FIXME: need to hide this if there is no more data
                    name={undefined}
                    onClick={handleShowMoreButtonClick}
                    actions={<IoArrowDown />}
                >
                    <span>Show more</span>
                </Button>
            )}
        </section>
    );

    const essentialLinksSection = (
        countryInfo.essentialLinks
    ) && (
        <div className={styles.essentialReading}>
            <Header
                heading="Essential Reading"
                headingSize="large"
                headingInfo={(
                    <TooltipIcon>
                        {countryMetadata.essentialReadingTooltip }
                    </TooltipIcon>
                )}
            />
            <HTMLOutput
                value={countryInfo.essentialLinks}
            />
        </div>
    );

    const contactSection = (
        countryInfo.contactPersonDescription
        || countryInfo.contactPersonImage
    ) && (
        <div className={styles.contact}>
            <Header
                heading="For more information please contact:"
                headingSize="medium"
                headingInfo={(
                    <TooltipIcon>
                        {countryMetadata.contactTooltip }
                    </TooltipIcon>
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
    );

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
                <div className={styles.headerContainer}>
                    <div className={styles.content}>
                        {profileSection}
                        {navbar}
                    </div>
                </div>
                <div className={styles.bodyContainer}>
                    <div className={styles.content}>
                        {overviewSection}
                        {displacementSection}
                        {latestNewDisplacementSection}
                        {internalDisplacementSection}
                        {relatedMaterialsSection}
                        <section className={styles.misc}>
                            {essentialLinksSection}
                            {contactSection}
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CountryProfile;
