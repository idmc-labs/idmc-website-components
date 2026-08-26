import React, {
    useMemo,
    useState,
    useEffect,
    useCallback,
} from 'react';
import {
    _cs,
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import { gql, useQuery, useLazyQuery } from '@apollo/client';
import ReMap, {
    MapContainer,
    MapSource,
    MapLayer,
    MapImage,
    MapTooltip,
    MapCenter,
    MapBounds,
} from '@togglecorp/re-map';
import {
    MapboxGeoJSONFeature,
    LngLat,
    LngLatLike,
    LngLatBoundsLike,
    PopupOptions,
} from 'mapbox-gl';
import { IoInformationCircleOutline } from 'react-icons/io5';

import { mapboxStyle } from '#base/configs/mapbox';
import Numeral from '#components/Numeral';
import TooltipIcon from '#components/TooltipIcon';
import BubbleSizeLegend from '#components/BubbleSizeLegend';
import {
    DATA_RELEASE,
    getLogRadius,
    BUBBLE_RADIUS_MIN,
    BUBBLE_RADIUS_MAX,
} from '#utils/common';
import useDebouncedValue from '#hooks/useDebouncedValue';
import {
    GiddMapCountryPointsQuery,
    GiddMapCountryPointsQueryVariables,
    GiddMapDisplacementsQuery,
    GiddMapDisplacementsQueryVariables,
    GiddHazardBreakdownQuery,
    GiddViolenceBreakdownQuery,
} from '#generated/types';

import {
    HAZARD_BREAKDOWN_QUERY,
    VIOLENCE_BREAKDOWN_QUERY,
    BreakdownQueryVariables,
} from '../utils';

import CountryPopupCard from './CountryPopupCard';
import {
    MarkerCause,
    PointProperties,
    Cause,
    Category,
} from './types';

import styles from './styles.css';

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

const MAP_DISPLACEMENTS = gql`
    query GiddMapDisplacements(
        $endYear: Float,
        $startYear: Float,
        $countriesIso3: [String!],
        $hazardTypes: [ID!],
        $violenceSubTypes: [ID!],
        $releaseEnvironment: String!,
        $clientId: String!,
    ){
        giddPublicCountryDisplacements(
            countriesIso3: $countriesIso3,
            endYear: $endYear,
            startYear: $startYear,
            hazardTypes: $hazardTypes,
            violenceSubTypes: $violenceSubTypes,
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

const CONFLICT_COLOR = 'rgb(239, 125, 0)';
const DISASTER_COLOR = 'rgb(1, 142, 202)';

const MIN_PIE_RADIUS = 6;

// Hardcoded no-filter ceiling for GIDD flow (new displacement, all causes): the
// largest country-year value with no filters applied (CHN, 2025 ≈ 103.9M).
// Filters only ever shrink values, so a fixed domain keeps bubbles from
// rescaling as filters change. Stock renders a choropleth (no bubbles), so this
// only affects the flow map.
const GIDD_FLOW_VALUE_MAX = 103_859_782;

const MARKER_BORDER_WIDTH = 1.5;

function getCoordinates(
    centroid: (number | null | undefined)[] | null | undefined,
): [number, number] | undefined {
    if (isNotDefined(centroid) || centroid.length < 2) {
        return undefined;
    }
    const [lng, lat] = centroid;
    if (isNotDefined(lng) || isNotDefined(lat)) {
        return undefined;
    }
    return [lng, lat];
}

function getFeatureCoordinates(
    feature: MapboxGeoJSONFeature,
    lngLat: LngLat,
): [number, number] {
    if (feature.geometry.type === 'Point') {
        const [lng, lat] = feature.geometry.coordinates;
        return [lng, lat];
    }
    return [lngLat.lng, lngLat.lat];
}

function toCursorWorldCopy(
    coordinates: [number, number],
    lngLat: LngLat,
): [number, number] {
    const [lng, lat] = coordinates;
    return [lng + Math.round((lngLat.lng - lng) / 360) * 360, lat];
}

const SINGLE_COUNTRY_ZOOM = 4;
const FLY_TO_OPTIONS = { zoom: SINGLE_COUNTRY_ZOOM };
const WORLD_BOUNDS: LngLatBoundsLike = [[-140, -52], [165, 75]];

function computeBounds(points: [number, number][]): LngLatBoundsLike | undefined {
    if (points.length === 0) {
        return undefined;
    }
    let minLng = points[0][0];
    let maxLng = points[0][0];
    let minLat = points[0][1];
    let maxLat = points[0][1];
    points.forEach(([lng, lat]) => {
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
    });
    return [[minLng, minLat], [maxLng, maxLat]];
}

interface CameraTarget {
    flyTo: LngLatLike | undefined;
    fitBounds: LngLatBoundsLike | undefined;
}

function computeCameraForCountries(
    countriesIso3: string[],
    countryCentroidByIso3: Map<string, [number, number]>,
): CameraTarget | undefined {
    if (countriesIso3.length === 0) {
        return { flyTo: undefined, fitBounds: WORLD_BOUNDS };
    }
    const coordinatesList = countriesIso3
        .map((iso3) => countryCentroidByIso3.get(iso3))
        .filter(isDefined);
    if (coordinatesList.length === 0) {
        return undefined;
    }
    if (coordinatesList.length === 1) {
        return { flyTo: coordinatesList[0], fitBounds: undefined };
    }
    return { flyTo: undefined, fitBounds: computeBounds(coordinatesList) };
}

function getRadiusForValue(value: number) {
    return getLogRadius(value, 1, GIDD_FLOW_VALUE_MAX, BUBBLE_RADIUS_MIN, BUBBLE_RADIUS_MAX);
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
    maxWidth: 'unset',
};

const hoverPopupOptions: PopupOptions = {
    closeOnClick: false,
    closeButton: false,
    offset: 12,
    className: _cs(styles.mapPopup, styles.hoverPopup),
    maxWidth: 'unset',
};

export interface Props {
    className?: string;
    cause: Cause | undefined;
    category: Category | undefined;
    countriesIso3: string[];
    hazardTypes?: string[];
    violenceSubTypes?: string[];
    startYear: number;
    endYear: number;
    clientCode: string;
    abbreviate: boolean;
    onCountryFocus?: (iso3: string) => void;
}

function GiddMap(props: Props) {
    const {
        className,
        cause,
        category,
        countriesIso3,
        hazardTypes,
        violenceSubTypes,
        startYear,
        endYear,
        clientCode,
        abbreviate,
        onCountryFocus,
    } = props;

    const isStockView = category === 'stock';

    const [hoverLngLat, setHoverLngLat] = useState<LngLatLike>();
    const [hoverProperties, setHoverProperties] = useState<PointProperties>();
    const [selection, setSelection] = useState<{
        lngLat: LngLatLike;
        properties: PointProperties;
    } | undefined>();

    const [flyTo, setFlyTo] = useState<LngLatLike>();
    const [fitBounds, setFitBounds] = useState<LngLatBoundsLike>();

    const [fetchHazardBreakdown, { data: hazardData }] = useLazyQuery<
        GiddHazardBreakdownQuery,
        BreakdownQueryVariables
    >(
        HAZARD_BREAKDOWN_QUERY,
        {
            context: {
                clientName: 'helix',
            },
        },
    );

    const hazardEntries = useMemo(() => (
        (hazardData?.giddPublicDisasterStatistics?.displacementsByHazardType ?? [])
            .map((item) => ({
                ...item,
                value: (isStockView ? item.totalDisplacements : item.newDisplacements) ?? 0,
            }))
            .filter((item) => item.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 6)
    ), [hazardData, isStockView]);

    const [fetchViolenceBreakdown, { data: violenceData }] = useLazyQuery<
        GiddViolenceBreakdownQuery,
        BreakdownQueryVariables
    >(
        VIOLENCE_BREAKDOWN_QUERY,
        {
            context: {
                clientName: 'helix',
            },
        },
    );

    const violenceEntries = useMemo(() => (
        (violenceData?.giddPublicConflictStatistics?.displacementsByViolenceSubType ?? [])
            .map((item) => ({
                ...item,
                value: (isStockView ? item.totalDisplacements : item.newDisplacements) ?? 0,
            }))
            .filter((item) => item.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 6)
    ), [violenceData, isStockView]);

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
        hazardTypes,
        violenceSubTypes,
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [
        countriesIso3,
        startYear,
        endYear,
        hazardTypes,
        violenceSubTypes,
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

    const stockDisplacementsVariables = useMemo(() => ({
        countriesIso3,
        startYear: endYear,
        endYear,
        hazardTypes,
        violenceSubTypes,
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [
        countriesIso3,
        endYear,
        hazardTypes,
        violenceSubTypes,
        clientCode,
    ]);

    const debouncedStockDisplacementsVariables = useDebouncedValue(stockDisplacementsVariables);

    const {
        previousData: previousStockDisplacementsData,
        data: stockDisplacementsData = previousStockDisplacementsData,
    } = useQuery<GiddMapDisplacementsQuery, GiddMapDisplacementsQueryVariables>(
        MAP_DISPLACEMENTS,
        {
            variables: debouncedStockDisplacementsVariables,
            context: {
                clientName: 'helix',
            },
        },
    );

    const statsByIso3 = useMemo(() => {
        const newRows = displacementsData?.giddPublicCountryDisplacements ?? [];
        const totalRows = stockDisplacementsData?.giddPublicCountryDisplacements ?? [];
        const totalByIso3 = new Map(totalRows.map((row) => [row.iso3, row]));
        const map = new Map<string, {
            conflictNew: number;
            conflictTotal: number;
            disasterNew: number;
            disasterTotal: number;
        }>();
        newRows.forEach((row) => {
            const totalRow = totalByIso3.get(row.iso3);
            map.set(row.iso3, {
                conflictNew: row.conflictNewDisplacement ?? 0,
                conflictTotal: totalRow?.conflictTotalDisplacement ?? 0,
                disasterNew: row.disasterNewDisplacement ?? 0,
                disasterTotal: totalRow?.disasterTotalDisplacement ?? 0,
            });
        });
        return map;
    }, [displacementsData, stockDisplacementsData]);

    const showBreakdown = cause !== 'conflict' && cause !== 'disaster';
    let choroplethRamp: ChoroplethRampKey = 'both';
    if (cause === 'conflict') {
        choroplethRamp = 'conflict';
    } else if (cause === 'disaster') {
        choroplethRamp = 'disaster';
    }

    // unfiltered by value (unlike countryPoints below) — a country selected
    // in the filter with zero displacement this year still needs to be
    // zoomable to
    const countryCentroidByIso3 = useMemo(() => {
        const map = new Map<string, [number, number]>();
        (countryPointsData?.giddPublicCountries ?? []).forEach((country) => {
            const coordinates = getCoordinates(country.centroid);
            if (isDefined(coordinates) && isDefined(country.iso3)) {
                map.set(country.iso3, coordinates);
            }
        });
        return map;
    }, [countryPointsData]);

    useEffect(() => {
        const camera = computeCameraForCountries(countriesIso3, countryCentroidByIso3);
        if (!camera) {
            return;
        }
        setFlyTo(camera.flyTo);
        setFitBounds(camera.fitBounds);
    }, [countriesIso3, countryCentroidByIso3]);

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
                // encodes what the icon actually looks like (radius is
                // dropped: it's just getRadiusForValue(conflict + disaster),
                // fully implied by these two) — MapImage never repaints an
                // existing name (see pieIcons below), so a stale iso3-only
                // name would keep showing a previous filter's pie forever
                iconName: `gidd-pie-${point.iso3}-${Math.round(point.conflictValue)}-${Math.round(point.disasterValue)}`,
            },
            geometry: {
                type: 'Point' as const,
                coordinates: point.coordinates,
            },
        })),
    }), [pieCountryPoints]);

    // NOTE: @togglecorp/re-map's <MapImage> registers its image once at
    // mount and never updates it (it snapshots name/image via useState and
    // console.error+skips if the name already exists) — so this name MUST
    // change whenever the rendered pie's size/split would change, or the
    // old icon just keeps showing under a new filter selection.
    const pieIcons = useMemo(() => pieCountryPoints.map((point) => {
        const name = `gidd-pie-${point.iso3}-${Math.round(point.conflictValue)}-${Math.round(point.disasterValue)}`;
        return {
            name,
            image: createPieIcon(point.radius, point.conflictValue, point.disasterValue),
        };
    }), [pieCountryPoints]);

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
                // choroplethRamp is included so switching cause (which swaps
                // the whole ramp) never reuses a stale, wrong-colored icon —
                // see the NOTE above pieIcons for why this matters
                iconName: `gidd-square-${point.iso3}-${choroplethRamp}`,
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
    }), [isStockView, countryPoints, choroplethRamp]);

    const squareIcons = useMemo(() => {
        if (!isStockView) {
            return [];
        }
        return countryPoints.map((point) => {
            const t = maxValue > 0 ? Math.sqrt(point.value / maxValue) : 0;
            return {
                name: `gidd-square-${point.iso3}-${choroplethRamp}`,
                image: createSquareIcon(SQUARE_SIZE, getChoroplethColor(choroplethRamp, t)),
            };
        });
    }, [isStockView, countryPoints, maxValue, choroplethRamp]);

    const handleMouseEnter = useCallback((feature: MapboxGeoJSONFeature, lngLat: LngLat) => {
        const properties = feature.properties as PointProperties;
        setHoverLngLat(toCursorWorldCopy(
            countryCentroidByIso3.get(properties.iso3)
            ?? getFeatureCoordinates(feature, lngLat),
            lngLat,
        ));
        setHoverProperties(properties);
    }, [countryCentroidByIso3]);

    const handleMouseLeave = useCallback(() => {
        setHoverLngLat(undefined);
        setHoverProperties(undefined);
    }, []);

    const handleClick = useCallback((feature: MapboxGeoJSONFeature, lngLat: LngLat) => {
        const properties = feature.properties as PointProperties;
        const clickedCoordinates = countryCentroidByIso3.get(properties.iso3);
        const anchor = toCursorWorldCopy(
            clickedCoordinates ?? getFeatureCoordinates(feature, lngLat),
            lngLat,
        );

        // the popup and the camera must use the same coordinate, otherwise the
        // fly-to zoom pulls them apart
        setSelection({
            lngLat: anchor,
            properties,
        });

        if (isDefined(clickedCoordinates)) {
            setFlyTo(anchor);
            setFitBounds(undefined);
        }

        const breakdownVariables = {
            countriesIso3: [properties.iso3],
            startYear,
            endYear,
            releaseEnvironment: DATA_RELEASE,
            clientId: clientCode,
        };

        if (cause !== 'conflict') {
            fetchHazardBreakdown({ variables: breakdownVariables });
        }
        if (cause !== 'disaster') {
            fetchViolenceBreakdown({ variables: breakdownVariables });
        }

        return undefined;
    }, [
        cause,
        startYear,
        endYear,
        clientCode,
        countryCentroidByIso3,
        fetchHazardBreakdown,
        fetchViolenceBreakdown,
    ]);

    const handleCloseSelection = useCallback(() => {
        setSelection(undefined);
        // zoom back out to whatever the active country/region filter implies
        // (or the world view if none), same as clearing the filter would —
        // rather than leaving the camera wherever the marker click zoomed to
        const camera = computeCameraForCountries(countriesIso3, countryCentroidByIso3);
        if (camera) {
            setFlyTo(camera.flyTo);
            setFitBounds(camera.fitBounds);
        }
    }, [countriesIso3, countryCentroidByIso3]);

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
                        logoPosition: 'bottom-right',
                        scrollZoom: false,
                        renderWorldCopies: false,
                        zoom: 1,
                    }}
                    scaleControlShown
                    navControlShown
                >
                    <MapContainer className={styles.mapContainer} />
                    <MapCenter center={flyTo} centerOptions={FLY_TO_OPTIONS} />
                    <MapBounds
                        bounds={fitBounds}
                        padding={40}
                        duration={countriesIso3.length > 0 ? 1000 : 0}
                    />
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
                                startYear={startYear}
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
                                startYear={startYear}
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
                {!isStockView && (
                    <div className={styles.mapLegend}>
                        {showBreakdown && (
                            <div className={styles.causeLegend}>
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
                        <BubbleSizeLegend
                            domainMin={1}
                            domainMax={GIDD_FLOW_VALUE_MAX}
                        />
                    </div>
                )}
            </div>
            <p className={styles.disclaimer}>
                The boundaries and names shown and the designations used on
                this map do not imply official endorsement or acceptance by
                IDMC.
            </p>
        </div>
    );
}

export default GiddMap;
