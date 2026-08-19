import React, { useMemo, useState, useCallback } from 'react';
import {
    _cs,
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import { gql, useQuery } from '@apollo/client';
import ReMap, {
    MapContainer,
    MapSource,
    MapLayer,
    MapImage,
    MapTooltip,
} from '@togglecorp/re-map';
import {
    MapboxGeoJSONFeature,
    LngLat,
    LngLatLike,
    PopupOptions,
} from 'mapbox-gl';
import {
    IoClose,
    IoArrowForward,
    IoInformationCircleOutline,
} from 'react-icons/io5';

import { mapboxStyle } from '#base/configs/mapbox';
import Numeral from '#components/Numeral';
import RawButton from '#components/RawButton';
import TooltipIcon from '#components/TooltipIcon';
import { DATA_RELEASE, getHazardTypeLabel } from '#utils/common';
import useDebouncedValue from '#hooks/useDebouncedValue';
import {
    GiddMapCountryPointsQuery,
    GiddMapCountryPointsQueryVariables,
    GiddMapDisplacementsQuery,
    GiddMapDisplacementsQueryVariables,
    GiddMapPopupHazardBreakdownQuery,
    GiddMapPopupHazardBreakdownQueryVariables,
} from '#generated/types';

import {
    buildBreakdownQuery,
    BreakdownQueryResult,
    BreakdownQueryVariables,
    TypeOption,
} from '../utils';

import styles from './styles.css';

// Country centroids now come from helix (giddPublicCountries.centroid) rather
// than the gidd-server's countryProfiles. `centroid` is [lon, lat], already in
// mapbox order.
const COUNTRY_POINTS = gql`
    query GiddMapCountryPoints($clientId: String!) {
        giddPublicCountries(clientId: $clientId) {
            id
            iso3
            idmcShortName
            centroid
        }
    }
`;

// giddPublicCountryDisplacements collapses the year range server-side and
// returns one row per country (no pagination wrapper, no cause arg — both
// causes come back as separate columns on every row).
const MAP_DISPLACEMENTS = gql`
    query GiddMapDisplacements(
        $endYear: Float,
        $startYear: Float,
        $countriesIso3: [String!],
        $releaseEnvironment: String!,
        $clientId: String!,
    ){
        giddPublicCountryDisplacements(
            countriesIso3: $countriesIso3,
            endYear: $endYear,
            startYear: $startYear,
            releaseEnvironment: $releaseEnvironment,
            clientId: $clientId,
        ){
            iso3
            countryName
            countryId
            conflictNewDisplacement
            conflictNewDisplacementRounded
            conflictTotalDisplacement
            conflictTotalDisplacementRounded
            disasterNewDisplacement
            disasterNewDisplacementRounded
            disasterTotalDisplacement
            disasterTotalDisplacementRounded
        }
    }
`;

const POPUP_HAZARD_BREAKDOWN = gql`
    query GiddMapPopupHazardBreakdown(
        $countriesIso3: [String!],
        $startYear: Float,
        $endYear: Float,
        $releaseEnvironment: String!,
        $clientId: String!,
    ){
        giddPublicDisasterStatistics(
            countriesIso3: $countriesIso3,
            startYear: $startYear,
            endYear: $endYear,
            releaseEnvironment: $releaseEnvironment,
            clientId: $clientId,
        ){
            displacementsByHazardType {
                id
                label
                newDisplacements
                newDisplacementsRounded
            }
        }
    }
`;

type HazardBreakdownItem = NonNullable<
    GiddMapPopupHazardBreakdownQuery['giddPublicDisasterStatistics']['displacementsByHazardType']
>[number];

interface ViolenceBreakdownItem {
    id: string;
    name: string;
    newDisplacements: number;
}

const CONFLICT_COLOR = 'rgb(239, 125, 0)';
const DISASTER_COLOR = 'rgb(1, 142, 202)';

const RADIUS_MIN = 2;
const RADIUS_MAX = 18;
const RADIUS_SCALE_FACTOR = 0.028;

const MIN_PIE_RADIUS = 6;

const MARKER_BORDER_WIDTH = 1.5;

// giddPublicCountries.centroid comes back as Maybe<number>[]; narrow it to a
// concrete [lon, lat] pair (already mapbox order) before handing it to GeoJSON.
function getCoordinates(
    centroid: (number | null | undefined)[] | null | undefined,
): [number, number] | undefined {
    if (isNotDefined(centroid) || centroid.length < 2) {
        return undefined;
    }
    const [lon, lat] = centroid;
    if (isNotDefined(lon) || isNotDefined(lat)) {
        return undefined;
    }
    return [lon, lat];
}

function getRadiusForValue(value: number) {
    if (value <= 0) {
        return RADIUS_MIN;
    }
    const radius = RADIUS_MIN + Math.sqrt(value) * RADIUS_SCALE_FACTOR;
    return Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, radius));
}

function createPieIcon(radius: number, conflictValue: number, disasterValue: number): ImageData {
    const size = Math.ceil((radius + MARKER_BORDER_WIDTH) * 2);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return new ImageData(size, size);
    }

    const center = size / 2;
    const total = conflictValue + disasterValue;
    const conflictShare = total > 0 ? conflictValue / total : 0;
    const startAngle = -Math.PI / 2;
    const conflictEndAngle = startAngle + (Math.PI * 2 * conflictShare);

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, startAngle, conflictEndAngle);
    ctx.closePath();
    ctx.fillStyle = CONFLICT_COLOR;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, conflictEndAngle, startAngle + Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = DISASTER_COLOR;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = MARKER_BORDER_WIDTH;
    ctx.stroke();

    return ctx.getImageData(0, 0, size, size);
}

const SQUARE_SIZE = 16;
const SQUARE_CORNER_RADIUS = 4;

type ChoroplethRampKey = 'both' | 'conflict' | 'disaster';
type ChoroplethRamp = [[number, number, number], [number, number, number]];

const CHOROPLETH_RAMPS: Record<ChoroplethRampKey, ChoroplethRamp> = {
    both: [[219, 226, 234], [15, 42, 77]],
    conflict: [[246, 230, 219], [143, 71, 18]],
    disaster: [[210, 229, 244], [29, 90, 146]],
};

function lerpChannel(from: number, to: number, t: number) {
    return Math.round(from + ((to - from) * t));
}

function getChoroplethColor(ramp: ChoroplethRampKey, t: number) {
    const [from, to] = CHOROPLETH_RAMPS[ramp];
    const r = lerpChannel(from[0], to[0], t);
    const g = lerpChannel(from[1], to[1], t);
    const b = lerpChannel(from[2], to[2], t);
    return `rgb(${r}, ${g}, ${b})`;
}

const SQUARE_BORDER_WIDTH = 1.5;

function createSquareIcon(size: number, color: string): ImageData {
    const canvasSize = Math.ceil(size + (SQUARE_BORDER_WIDTH * 2));
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return new ImageData(canvasSize, canvasSize);
    }

    const offset = SQUARE_BORDER_WIDTH;
    const radius = Math.min(SQUARE_CORNER_RADIUS, size / 2);
    ctx.beginPath();
    ctx.moveTo(offset + radius, offset);
    ctx.arcTo(offset + size, offset, offset + size, offset + size, radius);
    ctx.arcTo(offset + size, offset + size, offset, offset + size, radius);
    ctx.arcTo(offset, offset + size, offset, offset, radius);
    ctx.arcTo(offset, offset, offset + size, offset, radius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = SQUARE_BORDER_WIDTH;
    ctx.stroke();

    return ctx.getImageData(0, 0, canvasSize, canvasSize);
}

type MarkerCause = 'Conflict' | 'Disaster';

interface PointProperties {
    iso3: string;
    name: string;
    cause: MarkerCause;
    value: number;
    radius?: number;
    iconName?: string;
    conflictNew?: number;
    conflictTotal?: number;
    disasterNew?: number;
    disasterTotal?: number;
}

type CountryPointGeoJSON = GeoJSON.FeatureCollection<GeoJSON.Point, PointProperties>;

const countryPointPaint: mapboxgl.CirclePaint = {
    'circle-opacity': 1,
    'circle-color': {
        property: 'cause',
        type: 'categorical',
        stops: [
            ['Conflict', CONFLICT_COLOR],
            ['Disaster', DISASTER_COLOR],
        ],
    },
    'circle-radius': ['get', 'radius'],
    'circle-stroke-width': MARKER_BORDER_WIDTH,
    'circle-stroke-color': '#ffffff',
};

const iconLayerLayout: mapboxgl.SymbolLayout = {
    'icon-image': ['get', 'iconName'],
    'icon-allow-overlap': true,
    'icon-ignore-placement': true,
};

const sourceOption: mapboxgl.GeoJSONSourceRaw = {
    type: 'geojson',
};

const popupOptions: PopupOptions = {
    closeOnClick: true,
    closeButton: false,
    offset: 12,
    className: styles.mapPopup,
    maxWidth: '260px',
};

const hoverPopupOptions: PopupOptions = {
    closeOnClick: false,
    closeButton: false,
    offset: 12,
    className: _cs(styles.mapPopup, styles.hoverPopup),
    maxWidth: '260px',
};

type Cause = 'conflict' | 'disaster';
type Category = 'flow' | 'stock';

interface CountryPopupCardProps {
    properties: PointProperties;
    cause: Cause | undefined;
    category: Category | undefined;
    endYear: number;
    detailed: boolean;
    abbreviate: boolean;
    hazardEntries?: HazardBreakdownItem[];
    violenceEntries?: ViolenceBreakdownItem[];
    onCountryFocus?: (iso3: string) => void;
    onClose?: () => void;
}

function CountryPopupCard(cardProps: CountryPopupCardProps) {
    const {
        properties,
        cause,
        category,
        endYear,
        detailed,
        abbreviate,
        hazardEntries = [],
        violenceEntries = [],
        onCountryFocus,
        onClose,
    } = cardProps;

    const canFocus = isDefined(onCountryFocus);
    const canClose = isDefined(onClose);
    const isStock = category === 'stock';
    const cOn = cause !== 'disaster';
    const dOn = cause !== 'conflict';

    const conflictNew = properties.conflictNew ?? 0;
    const conflictTotal = properties.conflictTotal ?? 0;
    const disasterNew = properties.disasterNew ?? 0;
    const disasterTotal = properties.disasterTotal ?? 0;

    const currentConflict = isStock ? conflictTotal : conflictNew;
    const currentDisaster = isStock ? disasterTotal : disasterNew;
    const currentTotal = (cOn ? currentConflict : 0) + (dOn ? currentDisaster : 0);

    const otherConflict = isStock ? conflictNew : conflictTotal;
    const otherDisaster = isStock ? disasterNew : disasterTotal;
    const otherTotal = (cOn ? otherConflict : 0) + (dOn ? otherDisaster : 0);
    const otherLabel = isStock ? `Internal displacements in ${endYear}` : 'Total IDPs at year end';
    const subtitle = isStock
        ? `IDPs at the end of ${endYear}`
        : `internal displacements in ${endYear}`;

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.title}>
                    {properties.name}
                </div>
                <div className={styles.headerEnd}>
                    <Numeral
                        className={styles.headline}
                        value={currentTotal}
                        abbreviate={abbreviate}
                    />
                    {canClose && (
                        <RawButton
                            name={undefined}
                            className={styles.closeButton}
                            onClick={onClose}
                            title="Close"
                        >
                            <IoClose />
                        </RawButton>
                    )}
                </div>
            </div>
            <div className={styles.subheading}>
                {subtitle}
            </div>
            <div className={styles.breakdown}>
                {cOn && (
                    <div className={_cs(styles.breakdownItem, styles.conflict)}>
                        <span className={styles.dot} />
                        <span className={styles.breakdownLabel}>Conflict and violence</span>
                        <Numeral
                            className={styles.breakdownValue}
                            value={currentConflict}
                            abbreviate={abbreviate}
                        />
                    </div>
                )}
                {dOn && (
                    <div className={_cs(styles.breakdownItem, styles.disaster)}>
                        <span className={styles.dot} />
                        <span className={styles.breakdownLabel}>Disasters</span>
                        <Numeral
                            className={styles.breakdownValue}
                            value={currentDisaster}
                            abbreviate={abbreviate}
                        />
                    </div>
                )}
                <div className={_cs(styles.breakdownItem, styles.neutral)}>
                    <span className={styles.dot} />
                    <span className={styles.breakdownLabel}>{otherLabel}</span>
                    <Numeral
                        className={styles.breakdownValue}
                        value={otherTotal}
                        abbreviate={abbreviate}
                    />
                </div>
            </div>
            {detailed && (
                <>
                    {dOn && hazardEntries.length > 0 && (
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>
                                {`Disasters by hazard type · ${endYear}`}
                            </div>
                            <div className={styles.sectionList}>
                                {hazardEntries.map((hazard) => (
                                    <div key={hazard.id} className={styles.sectionRow}>
                                        <span>{getHazardTypeLabel(hazard)}</span>
                                        <Numeral
                                            className={styles.disaster}
                                            value={hazard.newDisplacements}
                                            abbreviate={abbreviate}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {cOn && violenceEntries.length > 0 && (
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>
                                {`Violence sub types · ${endYear}`}
                            </div>
                            <div className={styles.sectionList}>
                                {violenceEntries.map((violence) => (
                                    <div key={violence.id} className={styles.sectionRow}>
                                        <span>{violence.name}</span>
                                        <Numeral
                                            className={styles.conflict}
                                            value={violence.newDisplacements}
                                            abbreviate={abbreviate}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {canFocus && (
                        <RawButton
                            name={undefined}
                            className={styles.focusButton}
                            onClick={() => {
                                onCountryFocus?.(properties.iso3);
                                onClose?.();
                            }}
                        >
                            <span className={styles.focusButtonLabel}>
                                Focus this country or territory in all charts
                            </span>
                            <IoArrowForward className={styles.focusButtonIcon} />
                        </RawButton>
                    )}
                </>
            )}
        </div>
    );
}

export interface Props {
    className?: string;
    cause: Cause | undefined;
    category: Category | undefined;
    countriesIso3: string[];
    startYear: number;
    endYear: number;
    clientCode: string;
    abbreviate: boolean;
    violenceSubTypeOptions: TypeOption[];
    onCountryFocus?: (iso3: string) => void;
}

function GiddMap(props: Props) {
    const {
        className,
        cause,
        category,
        countriesIso3,
        startYear,
        endYear,
        clientCode,
        abbreviate,
        violenceSubTypeOptions,
        onCountryFocus,
    } = props;

    const [hoverLngLat, setHoverLngLat] = useState<LngLatLike>();
    const [hoverProperties, setHoverProperties] = useState<PointProperties>();
    const [selection, setSelection] = useState<{
        lngLat: LngLatLike;
        properties: PointProperties;
    } | undefined>();

    const selectedIso3 = selection?.properties.iso3;

    const hazardVariables = useMemo(() => ({
        countriesIso3: selectedIso3 ? [selectedIso3] : [],
        startYear,
        endYear,
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [selectedIso3, startYear, endYear, clientCode]);

    const { data: hazardData } = useQuery<
        GiddMapPopupHazardBreakdownQuery,
        GiddMapPopupHazardBreakdownQueryVariables
    >(
        POPUP_HAZARD_BREAKDOWN,
        {
            variables: hazardVariables,
            skip: !selectedIso3 || cause === 'conflict',
            context: {
                clientName: 'helix',
            },
        },
    );

    const hazardEntries = useMemo(() => (
        (hazardData?.giddPublicDisasterStatistics?.displacementsByHazardType ?? [])
            .filter((item) => (item.newDisplacements ?? 0) > 0)
            .sort((a, b) => (b.newDisplacements ?? 0) - (a.newDisplacements ?? 0))
            .slice(0, 6)
    ), [hazardData]);

    const violenceQuery = useMemo(
        () => buildBreakdownQuery('conflict', violenceSubTypeOptions),
        [violenceSubTypeOptions],
    );

    const { data: violenceData } = useQuery<BreakdownQueryResult, BreakdownQueryVariables>(
        violenceQuery,
        {
            variables: hazardVariables,
            skip: !selectedIso3 || cause === 'disaster' || violenceSubTypeOptions.length === 0,
            context: {
                clientName: 'helix',
            },
        },
    );

    const violenceEntries = useMemo(() => (
        violenceSubTypeOptions
            .map((type) => ({
                id: type.id,
                name: type.name,
                newDisplacements: violenceData?.[`t${type.id}`]?.newDisplacements ?? 0,
            }))
            .filter((item) => item.newDisplacements > 0)
            .sort((a, b) => b.newDisplacements - a.newDisplacements)
            .slice(0, 6)
    ), [violenceData, violenceSubTypeOptions]);

    const {
        previousData: previousCountryPointsData,
        data: countryPointsData = previousCountryPointsData,
    } = useQuery<GiddMapCountryPointsQuery, GiddMapCountryPointsQueryVariables>(
        COUNTRY_POINTS,
        {
            variables: { clientId: clientCode },
            context: {
                clientName: 'helix',
            },
        },
    );

    const displacementsVariables = useMemo(() => ({
        countriesIso3,
        startYear,
        endYear,
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [
        countriesIso3,
        startYear,
        endYear,
        clientCode,
    ]);

    const debouncedDisplacementsVariables = useDebouncedValue(displacementsVariables);

    const {
        previousData: previousDisplacementsData,
        data: displacementsData = previousDisplacementsData,
    } = useQuery<GiddMapDisplacementsQuery, GiddMapDisplacementsQueryVariables>(
        MAP_DISPLACEMENTS,
        {
            variables: debouncedDisplacementsVariables,
            context: {
                clientName: 'helix',
            },
        },
    );

    // Rows are already aggregated per country server-side (the year range is
    // collapsed by giddPublicCountryDisplacements), so this is a plain lookup
    // rather than the client-side summing the old paginated query needed.
    const statsByIso3 = useMemo(() => {
        const rows = displacementsData?.giddPublicCountryDisplacements ?? [];
        const map = new Map<string, {
            conflictNew: number;
            conflictTotal: number;
            disasterNew: number;
            disasterTotal: number;
        }>();
        rows.forEach((row) => {
            map.set(row.iso3, {
                conflictNew: row.conflictNewDisplacement ?? 0,
                conflictTotal: row.conflictTotalDisplacement ?? 0,
                disasterNew: row.disasterNewDisplacement ?? 0,
                disasterTotal: row.disasterTotalDisplacement ?? 0,
            });
        });
        return map;
    }, [displacementsData]);

    const showBreakdown = cause !== 'conflict' && cause !== 'disaster';
    const isStockView = category === 'stock';
    let choroplethRamp: ChoroplethRampKey = 'both';
    if (cause === 'conflict') {
        choroplethRamp = 'conflict';
    } else if (cause === 'disaster') {
        choroplethRamp = 'disaster';
    }

    const countryPoints = useMemo(() => (
        (countryPointsData?.giddPublicCountries ?? [])
            .map((country) => {
                const coordinates = getCoordinates(country.centroid);
                if (isNotDefined(coordinates) || isNotDefined(country.iso3)) {
                    return undefined;
                }
                const stats = statsByIso3.get(country.iso3);
                if (!stats) {
                    return undefined;
                }

                const conflictValue = category === 'stock' ? stats.conflictTotal : stats.conflictNew;
                const disasterValue = category === 'stock' ? stats.disasterTotal : stats.disasterNew;

                let value: number;
                let markerCause: MarkerCause;
                let isPie: boolean;
                if (cause === 'conflict') {
                    value = conflictValue;
                    markerCause = 'Conflict';
                    isPie = false;
                } else if (cause === 'disaster') {
                    value = disasterValue;
                    markerCause = 'Disaster';
                    isPie = false;
                } else {
                    value = conflictValue + disasterValue;
                    markerCause = conflictValue >= disasterValue ? 'Conflict' : 'Disaster';
                    isPie = getRadiusForValue(value) >= MIN_PIE_RADIUS;
                }

                if (value <= 0) {
                    return undefined;
                }

                return {
                    id: country.id,
                    iso3: country.iso3,
                    name: country.idmcShortName ?? country.iso3,
                    coordinates,
                    value,
                    radius: getRadiusForValue(value),
                    markerCause,
                    conflictValue,
                    disasterValue,
                    conflictNew: stats.conflictNew,
                    conflictTotal: stats.conflictTotal,
                    disasterNew: stats.disasterNew,
                    disasterTotal: stats.disasterTotal,
                    isPie,
                };
            })
            .filter(isDefined)
    ), [countryPointsData, statsByIso3, cause, category]);

    const circleGeoJson: CountryPointGeoJSON = useMemo(() => ({
        type: 'FeatureCollection',
        features: countryPoints
            .filter((point) => !point.isPie)
            .map((point) => ({
                id: point.id,
                type: 'Feature' as const,
                properties: {
                    iso3: point.iso3,
                    name: point.name,
                    cause: point.markerCause,
                    value: point.value,
                    radius: point.radius,
                    conflictNew: point.conflictNew,
                    conflictTotal: point.conflictTotal,
                    disasterNew: point.disasterNew,
                    disasterTotal: point.disasterTotal,
                },
                geometry: {
                    type: 'Point' as const,
                    coordinates: point.coordinates,
                },
            })),
    }), [countryPoints]);

    const pieCountryPoints = useMemo(
        () => countryPoints.filter((point) => point.isPie),
        [countryPoints],
    );

    const pieGeoJson: CountryPointGeoJSON = useMemo(() => ({
        type: 'FeatureCollection',
        features: pieCountryPoints.map((point) => ({
            id: point.id,
            type: 'Feature' as const,
            properties: {
                iso3: point.iso3,
                name: point.name,
                cause: point.markerCause,
                value: point.value,
                conflictNew: point.conflictNew,
                conflictTotal: point.conflictTotal,
                disasterNew: point.disasterNew,
                disasterTotal: point.disasterTotal,
                iconName: `gidd-pie-${point.iso3}`,
            },
            geometry: {
                type: 'Point' as const,
                coordinates: point.coordinates,
            },
        })),
    }), [pieCountryPoints]);

    const pieIcons = useMemo(() => pieCountryPoints.map((point) => ({
        name: `gidd-pie-${point.iso3}`,
        image: createPieIcon(point.radius, point.conflictValue, point.disasterValue),
    })), [pieCountryPoints]);

    const maxValue = useMemo(
        () => Math.max(0, ...countryPoints.map((point) => point.value)),
        [countryPoints],
    );

    const minValue = useMemo(() => {
        if (countryPoints.length === 0) {
            return 0;
        }
        return Math.min(...countryPoints.map((point) => point.value));
    }, [countryPoints]);

    const squareGeoJson: CountryPointGeoJSON = useMemo(() => ({
        type: 'FeatureCollection',
        features: !isStockView ? [] : countryPoints.map((point) => ({
            id: point.id,
            type: 'Feature' as const,
            properties: {
                iso3: point.iso3,
                name: point.name,
                cause: point.markerCause,
                value: point.value,
                iconName: `gidd-square-${point.iso3}`,
                conflictNew: point.conflictNew,
                conflictTotal: point.conflictTotal,
                disasterNew: point.disasterNew,
                disasterTotal: point.disasterTotal,
            },
            geometry: {
                type: 'Point' as const,
                coordinates: point.coordinates,
            },
        })),
    }), [isStockView, countryPoints]);

    const squareIcons = useMemo(() => {
        if (!isStockView) {
            return [];
        }
        return countryPoints.map((point) => {
            const t = maxValue > 0 ? Math.sqrt(point.value / maxValue) : 0;
            return {
                name: `gidd-square-${point.iso3}`,
                image: createSquareIcon(SQUARE_SIZE, getChoroplethColor(choroplethRamp, t)),
            };
        });
    }, [isStockView, countryPoints, maxValue, choroplethRamp]);

    const handleMouseEnter = useCallback((feature: MapboxGeoJSONFeature, lngLat: LngLat) => {
        setHoverLngLat(lngLat);
        setHoverProperties(feature.properties as PointProperties);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setHoverLngLat(undefined);
        setHoverProperties(undefined);
    }, []);

    const handleClick = useCallback((feature: MapboxGeoJSONFeature, lngLat: LngLat) => {
        setSelection({ lngLat, properties: feature.properties as PointProperties });
        return undefined;
    }, []);

    const handleCloseSelection = useCallback(() => {
        setSelection(undefined);
    }, []);

    // once a bubble is pinned, ignore hover entirely (only one popup at a time)
    const showHoverPreview = isDefined(hoverLngLat)
        && isDefined(hoverProperties)
        && isNotDefined(selection);

    return (
        <div className={_cs(styles.giddMap, className)}>
            <div className={styles.mapWrapper}>
                {isStockView && (
                    <TooltipIcon
                        className={styles.mapBadge}
                        tooltipClassName={styles.mapBadgeTooltip}
                        trigger="click"
                        infoLabel={(
                            <>
                                {`IDPs at the end of ${endYear}`}
                                <IoInformationCircleOutline />
                            </>
                        )}
                        content={(
                            <p className={styles.mapBadgeTooltipText}>
                                This map visualizes one year at a time to
                                avoid overplotting. Change the year filters
                                to see data from different years. Compare
                                years side by side in &apos;Charts&apos; view.
                            </p>
                        )}
                    />
                )}
                <ReMap
                    mapStyle={mapboxStyle}
                    mapOptions={{
                        logoPosition: 'bottom-left',
                        scrollZoom: false,
                        zoom: 1,
                    }}
                    scaleControlShown
                    navControlShown
                >
                    <MapContainer className={styles.mapContainer} />
                    {!isStockView && (
                        <>
                            <MapSource
                                sourceKey="gidd-country-points"
                                sourceOptions={sourceOption}
                                geoJson={circleGeoJson}
                            >
                                <MapLayer
                                    layerKey="gidd-country-point"
                                    layerOptions={{
                                        type: 'circle',
                                        paint: countryPointPaint,
                                    }}
                                    onClick={handleClick}
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={handleMouseLeave}
                                />
                            </MapSource>
                            <MapSource
                                sourceKey="gidd-country-pies"
                                sourceOptions={sourceOption}
                                geoJson={pieGeoJson}
                            >
                                <MapLayer
                                    layerKey="gidd-country-pie"
                                    layerOptions={{
                                        type: 'symbol',
                                        layout: iconLayerLayout,
                                    }}
                                    onClick={handleClick}
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={handleMouseLeave}
                                />
                            </MapSource>
                        </>
                    )}
                    {isStockView && (
                        <MapSource
                            sourceKey="gidd-country-squares"
                            sourceOptions={sourceOption}
                            geoJson={squareGeoJson}
                        >
                            <MapLayer
                                layerKey="gidd-country-square"
                                layerOptions={{
                                    type: 'symbol',
                                    layout: iconLayerLayout,
                                }}
                                onClick={handleClick}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            />
                        </MapSource>
                    )}
                    {(isStockView ? squareIcons : pieIcons).map((icon) => (
                        <MapImage
                            key={icon.name}
                            name={icon.name}
                            image={icon.image}
                        />
                    ))}
                    {selection && (
                        <MapTooltip
                            coordinates={selection.lngLat}
                            tooltipOptions={popupOptions}
                            onHide={handleCloseSelection}
                        >
                            <CountryPopupCard
                                properties={selection.properties}
                                cause={cause}
                                category={category}
                                endYear={endYear}
                                detailed
                                abbreviate={abbreviate}
                                hazardEntries={hazardEntries}
                                violenceEntries={violenceEntries}
                                onCountryFocus={onCountryFocus}
                                onClose={handleCloseSelection}
                            />
                        </MapTooltip>
                    )}
                    {showHoverPreview && hoverLngLat && hoverProperties && (
                        <MapTooltip
                            coordinates={hoverLngLat}
                            tooltipOptions={hoverPopupOptions}
                        >
                            <CountryPopupCard
                                properties={hoverProperties}
                                cause={cause}
                                category={category}
                                endYear={endYear}
                                detailed={false}
                                abbreviate={abbreviate}
                            />
                        </MapTooltip>
                    )}
                </ReMap>
                {isStockView && (
                    <div className={styles.choroplethLegend}>
                        <div
                            className={styles.choroplethBar}
                            style={{
                                background: `linear-gradient(to right, ${
                                    getChoroplethColor(choroplethRamp, 0)
                                }, ${getChoroplethColor(choroplethRamp, 1)})`,
                            }}
                        />
                        <div className={styles.choroplethLabels}>
                            <Numeral value={minValue} abbreviate={abbreviate} />
                            <Numeral value={maxValue} abbreviate={abbreviate} />
                        </div>
                    </div>
                )}
            </div>
            {!isStockView && showBreakdown && (
                <div className={styles.legend}>
                    <div className={styles.legendItem}>
                        <span className={styles.legendDotConflict} />
                        Conflict and violence
                    </div>
                    <div className={styles.legendItem}>
                        <span className={styles.legendDotDisaster} />
                        Disasters
                    </div>
                </div>
            )}
            <p className={styles.disclaimer}>
                The boundaries and names shown and the designations used on
                this map do not imply official endorsement or acceptance by
                IDMC.
            </p>
        </div>
    );
}

export default GiddMap;
