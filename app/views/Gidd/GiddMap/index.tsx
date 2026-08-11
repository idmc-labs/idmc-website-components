import React, { useMemo, useState, useCallback } from 'react';
import {
    _cs,
    isDefined,
    isNotDefined,
    isTruthyString,
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
import Header from '#components/Header';
import Numeral from '#components/Numeral';
import RawButton from '#components/RawButton';
import TooltipIcon from '#components/TooltipIcon';
import { DATA_RELEASE, getHazardTypeLabel } from '#utils/common';
import useDebouncedValue from '#hooks/useDebouncedValue';
import {
    GoodPracticeMapQuery,
    GoodPracticeMapQueryVariables,
    GiddDisplacementsQuery,
    GiddDisplacementsQueryVariables,
    GiddCountryPfaQuery,
    GiddCountryPfaQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const COUNTRY_POINTS = gql`
    query GiddMapCountryPoints {
        countryProfiles {
            id
            iso3
            name
            centerPoint
            goodPracticesCount
        }
    }
`;

// TODO: To be changed after the pageSize cap is removed from server
const MAP_DISPLACEMENTS_PAGE_SIZE = 100;

const MAP_DISPLACEMENTS = gql`
    query GiddMapDisplacements(
        $page: Int!,
        $pageSize: Int!,
        $endYear: Float,
        $startYear: Float,
        $countriesIso3: [String!],
        $releaseEnvironment: String!,
        $cause: String,
        $clientId: String!,
    ){
        giddPublicDisplacements(
            page: $page,
            pageSize: $pageSize,
            filters: {
                countriesIso3: $countriesIso3,
                endYear: $endYear,
                startYear: $startYear,
                releaseEnvironment: $releaseEnvironment,
                cause: $cause,
            },
            clientId: $clientId,
        ){
            results {
                conflictNewDisplacementRounded
                conflictTotalDisplacementRounded
                countryName
                disasterNewDisplacementRounded
                disasterTotalDisplacementRounded
                id
                iso3
                year
            }
            totalCount
            page
            pageSize
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
                newDisplacementsRounded
            }
        }
    }
`;

interface HazardBreakdownItem {
    id: string;
    label: string;
    newDisplacementsRounded?: number | null;
}

interface PopupHazardBreakdownQueryResult {
    giddPublicDisasterStatistics?: {
        displacementsByHazardType?: HazardBreakdownItem[] | null;
    } | null;
}

interface PopupHazardBreakdownQueryVariables {
    countriesIso3: string[];
    startYear: number;
    endYear: number;
    releaseEnvironment: string;
    clientId: string;
}

const POPUP_FIGURE_ANALYSIS = gql`
    query GiddMapPopupFigureAnalysis(
        $iso3: String!,
        $year: Int!,
        $releaseEnvironment: String!,
        $clientId: String!,
    ){
        giddPublicFigureAnalysisList(
            filters: {
                iso3: $iso3,
                year: $year,
                releaseEnvironment: $releaseEnvironment,
            },
            clientId: $clientId,
        ) {
            results {
                id
                description
                figureCategory
                figureCategoryDisplay
                figureCause
                figureCauseDisplay
                figuresRounded
                iso3
                year
            }
        }
    }
`;

function truncateDescription(text: string, maxLength = 280): string {
    const cleaned = text.replace(/^Methodology and Sources\s*/i, '').replace(/\s+/g, ' ').trim();
    if (cleaned.length <= maxLength) {
        return cleaned;
    }
    return `${cleaned.slice(0, maxLength).replace(/\s\S*$/, '')}…`;
}

const CONFLICT_COLOR = 'rgb(239, 125, 0)';
const DISASTER_COLOR = 'rgb(1, 142, 202)';

const RADIUS_MIN = 4;
const RADIUS_MAX = 32;
const RADIUS_SCALE_FACTOR = 0.05;

const MIN_PIE_RADIUS = 10;

function getRadiusForValue(value: number) {
    if (value <= 0) {
        return RADIUS_MIN;
    }
    const radius = RADIUS_MIN + Math.sqrt(value) * RADIUS_SCALE_FACTOR;
    return Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, radius));
}

function createPieIcon(radius: number, conflictValue: number, disasterValue: number): ImageData {
    const size = Math.ceil(radius * 2) + 2;
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

    ctx.globalAlpha = 0.75;

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
    'circle-opacity': 0.6,
    'circle-color': {
        property: 'cause',
        type: 'categorical',
        stops: [
            ['Conflict', CONFLICT_COLOR],
            ['Disaster', DISASTER_COLOR],
        ],
    },
    'circle-radius': ['get', 'radius'],
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
    hazardEntries?: HazardBreakdownItem[];
    conflictDescription?: string;
    disasterDescription?: string;
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
        hazardEntries = [],
        conflictDescription,
        disasterDescription,
        onCountryFocus,
        onClose,
    } = cardProps;

    const canFocus = isDefined(onCountryFocus);
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

    const hasSources = (cOn && conflictDescription) || (dOn && disasterDescription);

    return (
        <div className={styles.card}>
            <div className={styles.title}>
                {properties.name}
            </div>
            <Numeral
                className={styles.headline}
                value={currentTotal}
                abbreviate
            />
            <div className={styles.breakdown}>
                {cOn && (
                    <div className={_cs(styles.breakdownItem, styles.conflict)}>
                        <span className={styles.dot} />
                        <span className={styles.breakdownLabel}>Conflict and violence</span>
                        <Numeral
                            className={styles.breakdownValue}
                            value={currentConflict}
                            abbreviate
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
                            abbreviate
                        />
                    </div>
                )}
                <div className={_cs(styles.breakdownItem, styles.neutral)}>
                    <span className={styles.dot} />
                    <span className={styles.breakdownLabel}>{otherLabel}</span>
                    <Numeral className={styles.breakdownValue} value={otherTotal} abbreviate />
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
                                            value={hazard.newDisplacementsRounded}
                                            abbreviate
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {hasSources && (
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>
                                Sources and methodology
                            </div>
                            {cOn && conflictDescription && (
                                <p className={styles.sectionText}>
                                    {conflictDescription}
                                </p>
                            )}
                            {dOn && disasterDescription && (
                                <p className={styles.sectionText}>
                                    {disasterDescription}
                                </p>
                            )}
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
        PopupHazardBreakdownQueryResult,
        PopupHazardBreakdownQueryVariables
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
            .filter((item) => (item.newDisplacementsRounded ?? 0) > 0)
            .sort((a, b) => (b.newDisplacementsRounded ?? 0) - (a.newDisplacementsRounded ?? 0))
            .slice(0, 6)
    ), [hazardData]);

    const figureAnalysisVariables = useMemo(() => ({
        iso3: selectedIso3 ?? '',
        year: endYear,
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [selectedIso3, endYear, clientCode]);

    const { data: figureAnalysisData } = useQuery<
        GiddCountryPfaQuery,
        GiddCountryPfaQueryVariables
    >(
        POPUP_FIGURE_ANALYSIS,
        {
            variables: figureAnalysisVariables,
            skip: !selectedIso3,
            context: {
                clientName: 'helix',
            },
        },
    );

    const { conflictDescription, disasterDescription } = useMemo(() => {
        const results = figureAnalysisData?.giddPublicFigureAnalysisList?.results ?? [];
        const conflictEntry = results.find(
            (item) => item.figureCause === 'CONFLICT' && isTruthyString(item.description),
        );
        const disasterEntry = results.find(
            (item) => item.figureCause === 'DISASTER' && isTruthyString(item.description),
        );
        return {
            conflictDescription: conflictEntry
                ? truncateDescription(conflictEntry.description as string)
                : undefined,
            disasterDescription: disasterEntry
                ? truncateDescription(disasterEntry.description as string)
                : undefined,
        };
    }, [figureAnalysisData]);

    const {
        previousData: previousCountryPointsData,
        data: countryPointsData = previousCountryPointsData,
    } = useQuery<GoodPracticeMapQuery, GoodPracticeMapQueryVariables>(COUNTRY_POINTS);

    const displacementsVariables = useMemo(() => ({
        countriesIso3,
        startYear,
        endYear,
        cause,
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [
        countriesIso3,
        startYear,
        endYear,
        cause,
        clientCode,
    ]);

    const debouncedDisplacementsVariables = useDebouncedValue(displacementsVariables);

    const {
        previousData: previousDisplacementsData,
        data: displacementsData = previousDisplacementsData,
    } = useQuery<GiddDisplacementsQuery, GiddDisplacementsQueryVariables>(
        MAP_DISPLACEMENTS,
        {
            variables: {
                ...debouncedDisplacementsVariables,
                page: 1,
                pageSize: MAP_DISPLACEMENTS_PAGE_SIZE,
            },
            context: {
                clientName: 'helix',
            },
        },
    );

    const statsByIso3 = useMemo(() => {
        const rows = displacementsData?.giddPublicDisplacements?.results ?? [];
        const map = new Map<string, {
            conflictNew: number;
            conflictTotal: number;
            disasterNew: number;
            disasterTotal: number;
        }>();
        rows.forEach((row) => {
            const existing = map.get(row.iso3) ?? {
                conflictNew: 0,
                conflictTotal: 0,
                disasterNew: 0,
                disasterTotal: 0,
            };
            existing.conflictNew += row.conflictNewDisplacementRounded ?? 0;
            existing.conflictTotal += row.conflictTotalDisplacementRounded ?? 0;
            existing.disasterNew += row.disasterNewDisplacementRounded ?? 0;
            existing.disasterTotal += row.disasterTotalDisplacementRounded ?? 0;
            map.set(row.iso3, existing);
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
        (countryPointsData?.countryProfiles ?? [])
            .map((country) => {
                if (isNotDefined(country.centerPoint) || isNotDefined(country.iso3)) {
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
                    name: country.name,
                    coordinates: country.centerPoint,
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

    const flowTooltip = 'The internal displacements figure refers to the number of forced '
        + 'movements of people within the borders of their country recorded during the year.';

    return (
        <div className={_cs(styles.giddMap, className)}>
            {!isStockView && (
                <Header
                    heading={`Internal displacements reported in ${endYear}`}
                    headingSize="small"
                    headingTooltip={flowTooltip}
                />
            )}
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
                            <>
                                <RawButton
                                    name={undefined}
                                    className={styles.closeButton}
                                    onClick={handleCloseSelection}
                                    title="Close"
                                >
                                    <IoClose />
                                </RawButton>
                                <CountryPopupCard
                                    properties={selection.properties}
                                    cause={cause}
                                    category={category}
                                    endYear={endYear}
                                    detailed
                                    hazardEntries={hazardEntries}
                                    conflictDescription={conflictDescription}
                                    disasterDescription={disasterDescription}
                                    onCountryFocus={onCountryFocus}
                                    onClose={handleCloseSelection}
                                />
                            </>
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
                            <Numeral value={minValue} abbreviate />
                            <Numeral value={maxValue} abbreviate />
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
