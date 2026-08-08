import React, {
    useState,
    useCallback,
    useMemo,
} from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    LngLatBounds,
} from 'mapbox-gl';
import {
    IoDownloadOutline,
    IoSearchOutline,
    IoRefreshOutline,
    IoShareSocialOutline,
    IoInformationCircleOutline,
} from 'react-icons/io5';
import {
    Button,
    TextInput,
    SegmentInput,
    MultiSelectInput,
    DateRangeDualInput,
    Modal,
} from '@togglecorp/toggle-ui';
import {
    isDefined,
    isNotDefined,
    caseInsensitiveSubmatch,
    compareString,
    mapToList,
} from '@togglecorp/fujs';

import {
    IduDataQuery,
    IduDataQueryVariables,
    GiddFilterOptionsQuery,
    GiddFilterOptionsQueryVariables,
} from '#generated/types';

import Message from '#components/Message';
import RawButton from '#components/RawButton';
import Carousel from '#components/Carousel';
import CarouselItem from '#components/Carousel/CarouselItem';
import CarouselButton from '#components/Carousel/CarouselButton';
import useBooleanState from '#hooks/useBooleanState';

import { suffixDrupalEndpoint } from '#utils/common';

import RawIduMap from './RawIduMap';

import styles from './styles.css';

const giddLink = suffixDrupalEndpoint('/database/displacement-data');

const IDU_DATA = gql`
    query IduData($clientId: String!) {
        idu(clientId: $clientId) @rest(
            type: "[IduData]",
            method: "GET",
            endpoint: "helix",
            path: "idus/last-180-days/?client_id={args.clientId}"
        ) {
            id
            country
            iso3
            latitude
            longitude
            centroid
            role
            displacement_type
            qualifier
            figure
            displacement_date
            displacement_start_date
            displacement_end_date
            year
            event_id
            event_name
            event_codes
            event_code_types
            event_start_date
            event_end_date
            category
            subcategory
            type
            subtype
            standard_popup_text
            standard_info_text
            old_id
            sources
            source_url
            locations_name
            locations_coordinates
            locations_accuracy
            locations_type
            displacement_occurred
            created_at
        }
    }
`;

const IDU_FILTER_OPTIONS = gql`
    query IduFilterOptions($clientId: String!) {
        giddPublicCountries(clientId: $clientId) {
            id
            idmcShortName
            iso3
            region {
                id
                name
            }
        }
        giddPublicHazardTypes(clientId: $clientId) {
            id
            name
        }
    }
`;

type CauseKey = 'all' | 'Conflict' | 'Disaster';
interface CauseOption {
    key: CauseKey;
    label: string;
}
const causeKeySelector = (option: CauseOption) => option.key;
const causeLabelSelector = (option: CauseOption) => option.label;
const causeOptions: CauseOption[] = [
    { key: 'all', label: 'All' },
    { key: 'Conflict', label: 'Conflict' },
    { key: 'Disaster', label: 'Disasters' },
];

type ViewKey = 'map' | 'table';
interface ViewOption {
    key: ViewKey;
    label: string;
}
const viewKeySelector = (option: ViewOption) => option.key;
const viewLabelSelector = (option: ViewOption) => option.label;
const viewOptions: ViewOption[] = [
    { key: 'map', label: 'Map' },
    { key: 'table', label: 'Table' },
];

interface Option {
    key: string;
    label: string;
}
const optionKeySelector = (option: Option) => option.key;
const optionLabelSelector = (option: Option) => option.label;

interface LocationOption {
    // key is prefixed: 'r:<regionId>' for a region, 'c:<iso3>' for a country
    key: string;
    label: string;
    // groupKey is sort-prefixed so "Regions" always renders before "Countries"
    groupKey: string;
    groupLabel: string;
}
const locationKeySelector = (option: LocationOption) => option.key;
const locationLabelSelector = (option: LocationOption) => option.label;
const locationGroupKeySelector = (option: LocationOption) => option.groupKey;
const locationGroupLabelSelector = (option: LocationOption) => option.groupLabel;

const CAROUSEL_SLIDE_COUNT = 6;
const carouselSlides = Array.from(
    { length: CAROUSEL_SLIDE_COUNT },
    (_, index) => index + 1,
);

const TODAY = new Date();
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function toDateInputValue(date: Date) {
    return date.toISOString().split('T')[0];
}

const defaultEndDate = toDateInputValue(TODAY);
const defaultStartDateObj = new Date(TODAY);
defaultStartDateObj.setDate(defaultStartDateObj.getDate() - 180);
const defaultStartDate = toDateInputValue(defaultStartDateObj);

function useIduMap(
    clientCode: string,
    boundingBox?: LngLatBounds | undefined,
    iso3?: string,
) {
    const [searchText, setSearchText] = useState<string | undefined>();
    const [cause, setCause] = useState<CauseKey>('all');
    const [triggerTypes, setTriggerTypes] = useState<string[]>([]);
    const [locations, setLocations] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<string | undefined>(defaultStartDate);
    const [endDate, setEndDate] = useState<string | undefined>(defaultEndDate);
    const [mapOrTable, setMapOrTable] = useState<ViewKey>('map');

    const {
        previousData: previousIduData,
        data: iduData = previousIduData,
        loading,
        error,
    } = useQuery<IduDataQuery, IduDataQueryVariables>(
        IDU_DATA,
        {
            variables: {
                clientId: clientCode,
            },
        },
    );

    const {
        data: filterOptionsData,
    } = useQuery<GiddFilterOptionsQuery, GiddFilterOptionsQueryVariables>(
        IDU_FILTER_OPTIONS,
        {
            variables: {
                clientId: clientCode,
            },
            context: {
                clientName: 'helix',
            },
        },
    );

    const hazardOptions = useMemo<Option[]>(() => (
        (filterOptionsData?.giddPublicHazardTypes ?? [])
            .filter(isDefined)
            .map((hazard) => ({ key: hazard.name, label: hazard.name }))
            .sort((a, b) => compareString(a.label, b.label))
    ), [filterOptionsData]);

    const {
        locationOptions,
        regionToIso3,
    } = useMemo(() => {
        const countriesData = filterOptionsData?.giddPublicCountries ?? [];
        const regionNames: Record<string, string> = {};
        const regionIso3Map = new Map<string, string[]>();
        countriesData.forEach((country) => {
            if (country.region && isDefined(country.iso3)) {
                regionNames[country.region.id] = country.region.name ?? country.region.id;
                const existing = regionIso3Map.get(country.region.id) ?? [];
                existing.push(country.iso3);
                regionIso3Map.set(country.region.id, existing);
            }
        });

        const regionOpts: LocationOption[] = mapToList(
            regionNames,
            (name, id) => ({
                key: `r:${id}`,
                label: name,
                groupKey: '1-regions',
                groupLabel: 'Regions',
            }),
        ).sort((a, b) => compareString(a.label, b.label));

        const countryOpts: LocationOption[] = countriesData
            .filter((country) => isDefined(country.iso3))
            .map((country) => ({
                key: `c:${country.iso3}`,
                label: country.idmcShortName ?? country.iso3 ?? '',
                groupKey: '2-countries',
                groupLabel: 'Countries',
            }))
            .sort((a, b) => compareString(a.label, b.label));

        return {
            locationOptions: [...regionOpts, ...countryOpts],
            regionToIso3: regionIso3Map,
        };
    }, [filterOptionsData]);

    const idus = useMemo(() => (
        iso3
            ? iduData?.idu?.filter((item) => item.iso3 === iso3)
            : iduData?.idu
    ), [iso3, iduData]);

    const idusForMap = useMemo(() => {
        const allowedIso3 = locations.length > 0
            ? new Set<string>(
                locations.flatMap((key) => {
                    if (key.startsWith('c:')) {
                        return [key.slice(2)];
                    }
                    if (key.startsWith('r:')) {
                        return regionToIso3.get(key.slice(2)) ?? [];
                    }
                    return [];
                }),
            )
            : undefined;

        return idus?.filter((d) => {
            if (isNotDefined(d.displacement_date)) {
                return false;
            }

            if (cause !== 'all' && d.displacement_type !== cause) {
                return false;
            }

            if (
                triggerTypes.length > 0
                && (isNotDefined(d.type) || !triggerTypes.includes(d.type))
            ) {
                return false;
            }

            if (allowedIso3 && (isNotDefined(d.iso3) || !allowedIso3.has(d.iso3))) {
                return false;
            }

            const search = searchText?.trim();
            if (search) {
                const haystack = `${d.event_name ?? ''} ${d.country ?? ''} ${d.locations_name ?? ''}`;
                if (!caseInsensitiveSubmatch(haystack, search)) {
                    return false;
                }
            }

            const displacementTime = new Date(d.displacement_date).getTime();
            if (startDate && displacementTime < new Date(startDate).getTime()) {
                return false;
            }
            if (endDate && displacementTime > (new Date(endDate).getTime() + DAY_IN_MS - 1)) {
                return false;
            }

            return true;
        });
    }, [idus, cause, triggerTypes, locations, regionToIso3, searchText, startDate, endDate]);

    const handleDownload = useCallback(() => {
        if (isNotDefined(idusForMap)) {
            return;
        }
        const onlyData = idusForMap.map((item) => {
            const {
                __typename,
                ...remaining
            } = item as (typeof item & { __typename: string });
            return remaining;
        });

        const jsonStr = JSON.stringify(onlyData);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'idu-data.json';
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [idusForMap]);

    const handleReset = useCallback(() => {
        setSearchText(undefined);
        setCause('all');
        setTriggerTypes([]);
        setLocations([]);
        setStartDate(defaultStartDate);
        setEndDate(defaultEndDate);
    }, []);

    const handleShare = useCallback(() => {
        // TODO: encode the active filters into the URL for a shareable view
        if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
        }
    }, []);

    const [
        definitionsShown,
        showDefinitions,
        hideDefinitions,
    ] = useBooleanState(false);

    if (error) {
        return {
            idus,
            widget: <Message message="Some error occurred!" />,
        };
    }

    const widget = (
        <div className={styles.dashboard}>
            <div className={styles.topBar}>
                <div className={styles.topActions}>
                    <Button
                        name={undefined}
                        onClick={handleReset}
                        icons={<IoRefreshOutline />}
                        transparent
                    >
                        Reset filters
                    </Button>
                    <Button
                        name={undefined}
                        onClick={handleShare}
                        icons={<IoShareSocialOutline />}
                        transparent
                    >
                        Share this view
                    </Button>
                </div>
            </div>
            <div className={styles.filterBar}>
                <TextInput
                    className={styles.search}
                    name="search"
                    placeholder="Search events..."
                    value={searchText}
                    onChange={setSearchText}
                    icons={<IoSearchOutline />}
                />
                <SegmentInput
                    className={styles.cause}
                    name="cause"
                    options={causeOptions}
                    keySelector={causeKeySelector}
                    labelSelector={causeLabelSelector}
                    value={cause}
                    onChange={setCause}
                />
                <MultiSelectInput
                    className={styles.triggerTypes}
                    name="triggerTypes"
                    placeholder="All trigger types"
                    options={hazardOptions}
                    keySelector={optionKeySelector}
                    labelSelector={optionLabelSelector}
                    value={triggerTypes}
                    onChange={setTriggerTypes}
                />
                {isNotDefined(iso3) && (
                    <MultiSelectInput
                        className={styles.countries}
                        name="locations"
                        placeholder="All countries and regions"
                        options={locationOptions}
                        keySelector={locationKeySelector}
                        labelSelector={locationLabelSelector}
                        value={locations}
                        onChange={setLocations}
                        grouped
                        groupKeySelector={locationGroupKeySelector}
                        groupLabelSelector={locationGroupLabelSelector}
                    />
                )}
                <DateRangeDualInput
                    className={styles.dateRange}
                    fromName="startDate"
                    toName="endDate"
                    fromValue={startDate}
                    toValue={endDate}
                    fromOnChange={setStartDate}
                    toOnChange={setEndDate}
                />
            </div>
            <div className={styles.panes}>
                <div className={styles.leftPane}>
                    {mapOrTable === 'map' ? (
                        <RawIduMap
                            idus={idusForMap}
                            boundingBox={boundingBox}
                        />
                    ) : (
                        <div className={styles.tablePlaceholder}>
                            Table view coming soon
                        </div>
                    )}
                    <SegmentInput
                        className={styles.viewToggle}
                        name="view"
                        options={viewOptions}
                        keySelector={viewKeySelector}
                        labelSelector={viewLabelSelector}
                        value={mapOrTable}
                        onChange={setMapOrTable}
                    />
                </div>
                <div className={styles.rightPane}>
                    <Carousel className={styles.carousel}>
                        <div className={styles.slides}>
                            {carouselSlides.map((order) => (
                                <CarouselItem
                                    key={order}
                                    order={order}
                                    className={styles.slide}
                                >
                                    <div className={styles.slidePlaceholder}>
                                        {`Visualization ${order}`}
                                    </div>
                                </CarouselItem>
                            ))}
                        </div>
                        <div className={styles.carouselSelector}>
                            <div className={styles.pager}>
                                <CarouselButton
                                    action="prev"
                                    className={styles.pagerButton}
                                />
                                {carouselSlides.map((order) => (
                                    <CarouselButton
                                        key={order}
                                        action="set"
                                        order={order}
                                        className={styles.pagerButton}
                                    />
                                ))}
                                <CarouselButton
                                    action="next"
                                    className={styles.pagerButton}
                                />
                                <div className={styles.pagerDivider} />
                                <RawButton
                                    name={undefined}
                                    className={styles.definitions}
                                    onClick={showDefinitions}
                                >
                                    <IoInformationCircleOutline />
                                    Definitions
                                </RawButton>
                            </div>
                        </div>
                    </Carousel>
                    <div className={styles.rightFooter}>
                        <p className={styles.footerText}>
                            {/* eslint-disable-next-line max-len */}
                            IDMC&apos;s Internal Displacement Updates (IDU) are preliminary estimates of internal displacement events reported in the last 180 days, updated daily. Curated and validated estimates are published in the
                            {' '}
                            <a href={giddLink} target="_parent">
                                Global Internal Displacement Database (GIDD)
                            </a>
                            .
                        </p>
                        <Button
                            className={styles.downloadButton}
                            name={undefined}
                            onClick={handleDownload}
                            icons={<IoDownloadOutline />}
                            disabled={loading || isNotDefined(idusForMap)}
                        >
                            Download current selection
                        </Button>
                    </div>
                </div>
            </div>
            {definitionsShown && (
                <Modal
                    heading="Definitions"
                    onClose={hideDefinitions}
                    size="small"
                >
                    <p>
                        {/* eslint-disable-next-line max-len */}
                        Definitions of the terms used in this dashboard (cause, trigger type and figures) will be listed here.
                    </p>
                </Modal>
            )}
        </div>
    );

    return {
        idus,
        widget,
    };
}

export default useIduMap;
