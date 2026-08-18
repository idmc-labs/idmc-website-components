import React, {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import Map, {
    MapContainer,
    MapCenter,
    MapBounds,
    MapSource,
    MapLayer,
    MapTooltip,
    MapChildContext,
} from '@togglecorp/re-map';
import {
    MapboxGeoJSONFeature,
    LngLat,
    LngLatBoundsLike,
    PopupOptions,
    LngLatLike,
} from 'mapbox-gl';
import {
    isDefined,
    isNotDefined,
    isTruthyString,
    compareDate,
    _cs,
} from '@togglecorp/fujs';
import { IoClose, IoArrowForward } from 'react-icons/io5';

import { mapboxStyle } from '#base/configs/mapbox';
import HTMLOutput from '#components/HTMLOutput';
import RawButton from '#components/RawButton';
import Numeral from '#components/Numeral';
import {
    IduDataQuery,
} from '#generated/types';

import styles from './styles.css';

export interface PopupProperties {
    id: number,
    eventId: number | null | undefined,
    type: 'Disaster' | 'Conflict' | 'Other',
    value: number,
    date: string | null | undefined,
    description: string | null | undefined,
    eventName: string | null | undefined,
    eventCode: string | null | undefined,
    source: string | null | undefined,
    country: string,
    iso3: string,
}

// A currently-open map popup: its coordinates and the card(s) to show. When the
// popup was opened from an event row, eventId is set so the pane can highlight it.
export interface MapSelection {
    lngLat: LngLatLike;
    properties: PopupProperties[];
    eventId?: number;
    // the specific record whose popup is open (for record-level row highlight)
    recordId?: number;
}

// Build the popup card data from an IDU record (shared by the map source and by
// event-row clicks that open the popup).
export function iduToPopupProperties(
    idu: NonNullable<IduDataQuery['idu']>[number],
): PopupProperties {
    return {
        id: idu.id,
        eventId: idu.event_id,
        type: (idu.displacement_type ?? 'Other') as PopupProperties['type'],
        value: idu.figure,
        date: idu.displacement_date,
        description: idu.standard_popup_text,
        eventName: idu.event_name,
        eventCode: idu.event_codes,
        source: idu.sources,
        country: idu.country,
        iso3: idu.iso3,
    };
}

type IduGeoJSON = GeoJSON.FeatureCollection<
    GeoJSON.Point,
    PopupProperties
>;

const typeLabels: Record<PopupProperties['type'], string> = {
    Disaster: 'Disasters',
    Conflict: 'Conflict and violence',
    Other: 'Other',
};

const CONFLICT_COLOR = 'rgb(239, 125, 0)';
const DISASTER_COLOR = 'rgb(1, 142, 202)';
const OTHER_COLOR = 'rgb(51, 149, 62)';
const GREY_COLOR = 'rgba(180, 180, 180, 0.4)';

const TYPE_COLOR_EXPR = [
    'match', ['get', 'type'],
    'Conflict', CONFLICT_COLOR,
    'Disaster', DISASTER_COLOR,
    OTHER_COLOR,
];

const circleRadius: mapboxgl.CirclePaint['circle-radius'] = {
    property: 'value',
    base: 1.75,
    stops: [
        [0, 5],
        [100, 9],
        [1000, 13],
    ],
};

export type MapFocus =
    | { type: 'country'; iso3: string }
    | { type: 'event'; eventId: number };

function buildCircleColor(focus: MapFocus | undefined): mapboxgl.CirclePaint['circle-color'] {
    if (!focus) {
        return TYPE_COLOR_EXPR as mapboxgl.CirclePaint['circle-color'];
    }
    const condition = focus.type === 'country'
        ? ['==', ['get', 'iso3'], focus.iso3]
        : ['==', ['get', 'eventId'], focus.eventId];
    return [
        'case', condition, TYPE_COLOR_EXPR, GREY_COLOR,
    ] as mapboxgl.CirclePaint['circle-color'];
}

function buildCircleOpacity(focus: MapFocus | undefined): mapboxgl.CirclePaint['circle-opacity'] {
    if (!focus) {
        return 0.6;
    }
    const condition = focus.type === 'country'
        ? ['==', ['get', 'iso3'], focus.iso3]
        : ['==', ['get', 'eventId'], focus.eventId];
    return ['case', condition, 0.8, 0.25] as mapboxgl.CirclePaint['circle-opacity'];
}

const popupOptions: PopupOptions = {
    closeOnClick: true,
    closeButton: false,
    offset: 12,
    className: styles.mapPopup,
    maxWidth: 'unset',
};

// the hover preview shouldn't capture the pointer (so it doesn't steal hover
// from the point and flicker) and shouldn't be dismissable by clicking
const hoverPopupOptions: PopupOptions = {
    closeOnClick: false,
    closeButton: false,
    offset: 12,
    className: _cs(styles.mapPopup, styles.hoverPopup),
    maxWidth: 'unset',
};

const sourceOption: mapboxgl.GeoJSONSourceRaw = {
    type: 'geojson',
};

const lightStyle = mapboxStyle;

// @types/mapbox-gl (2.7) predates the globe projection.
type MapWithProjection = mapboxgl.Map & {
    setProjection: (projection: string) => void;
};

const SECONDS_PER_REVOLUTION = 120;
const MAX_SPIN_ZOOM = 5;

interface GlobeSpinnerProps {
    // pause spinning while true (e.g. a popup is open)
    paused: boolean;
}

function GlobeSpinner(props: GlobeSpinnerProps) {
    const { paused } = props;
    const { map } = useContext(MapChildContext);

    const stateRef = useRef({ paused, hovered: false });
    const spinRef = useRef<() => void>();

    useEffect(() => {
        if (isNotDefined(map)) {
            return undefined;
        }

        const applyGlobe = () => {
            try {
                (map as MapWithProjection).setProjection('globe');
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Failed to enable globe projection', error);
            }
        };
        if (map.isStyleLoaded()) {
            applyGlobe();
        } else {
            map.once('style.load', applyGlobe);
        }

        let active = true;
        const spin = () => {
            if (
                !active
                || stateRef.current.paused
                || stateRef.current.hovered
                || map.getZoom() >= MAX_SPIN_ZOOM
            ) {
                return;
            }
            const center = map.getCenter();
            center.lng -= 360 / SECONDS_PER_REVOLUTION;
            map.easeTo({ center, duration: 1000, easing: (t) => t });
        };
        spinRef.current = spin;

        const container = map.getContainer();
        const handleEnter = () => { stateRef.current.hovered = true; };
        const handleLeave = () => {
            stateRef.current.hovered = false;
            spin();
        };

        map.on('moveend', spin);
        container.addEventListener('mouseenter', handleEnter);
        container.addEventListener('mouseleave', handleLeave);

        if (map.loaded()) {
            spin();
        } else {
            map.once('load', spin);
        }

        return () => {
            active = false;
            map.off('style.load', applyGlobe);
            map.off('moveend', spin);
            map.off('load', spin);
            container.removeEventListener('mouseenter', handleEnter);
            container.removeEventListener('mouseleave', handleLeave);
        };
    }, [map]);

    useEffect(() => {
        stateRef.current.paused = paused;
        if (!paused) {
            spinRef.current?.();
        }
    }, [paused]);

    return null;
}

function formatDate(date: string | null | undefined) {
    if (isNotDefined(date)) {
        return undefined;
    }
    return new Date(date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

interface EventPopupCardProps {
    item: PopupProperties;
    // the click popup shows the full detail + focus CTA; the hover preview stops
    // after the headline figure
    detailed: boolean;
    onCountryFocus?: (iso3: string) => void;
    onClose?: () => void;
}

function EventPopupCard(props: EventPopupCardProps) {
    const {
        item,
        detailed,
        onCountryFocus,
        onClose,
    } = props;

    const isDisaster = item.type === 'Disaster';
    const accentClassName = isDisaster ? styles.disaster : styles.conflict;
    const typeLabelClassName = _cs(styles.typeLabel, accentClassName);
    const footerText = [item.source, formatDate(item.date)]
        .filter(isTruthyString)
        .join(' · ');
    const canFocus = isDefined(onCountryFocus) && isTruthyString(item.iso3);
    const focusButtonClassName = _cs(styles.focusButton, accentClassName);

    return (
        <div className={styles.card}>
            <div className={typeLabelClassName}>
                <span className={styles.dot} />
                {typeLabels[item.type]}
            </div>
            {isTruthyString(item.eventName) && (
                <div className={styles.title}>
                    {item.eventName}
                </div>
            )}
            {isTruthyString(item.eventCode) && (
                <div className={styles.code}>
                    {item.eventCode}
                </div>
            )}
            <div className={styles.divider} />
            <div className={styles.figureRow}>
                <Numeral
                    className={styles.figure}
                    value={item.value}
                    abbreviate
                    valueClassName={accentClassName}
                    abbrClassName={accentClassName}
                />
                <span className={styles.figureLabel}>
                    internal displacements
                </span>
            </div>
            {detailed && (
                <>
                    <HTMLOutput
                        className={styles.description}
                        value={item.description}
                    />
                    {isTruthyString(footerText) && (
                        <div className={styles.footer}>
                            {footerText}
                        </div>
                    )}
                    {canFocus && (
                        <RawButton
                            name={undefined}
                            className={focusButtonClassName}
                            onClick={() => {
                                onCountryFocus?.(item.iso3);
                                onClose?.();
                            }}
                        >
                            {`Focus ${item.country} in all views`}
                            <IoArrowForward />
                        </RawButton>
                    )}
                </>
            )}
        </div>
    );
}

interface Props {
    idus: IduDataQuery['idu'] | undefined;
    onCountryFocus?: (iso3: string) => void;
    // the currently-open popup (owned by the parent, so filters/events can drive it)
    selection: MapSelection | undefined;
    // center to ease the map to when a popup is opened from an event row
    flyTo: LngLatLike | undefined;
    // fit the map to a country bounding box
    fitBounds: LngLatBoundsLike | undefined;
    // grey out all dots except those matching this focus
    focus: MapFocus | undefined;
    onPointClick: (lngLat: LngLatLike, properties: PopupProperties) => void;
    onClose: () => void;
}

function RawIduMap(props: Props) {
    const {
        idus,
        onCountryFocus,
        selection,
        flyTo,
        fitBounds,
        focus,
        onPointClick,
        onClose,
    } = props;

    const iduPointPaint = useMemo<mapboxgl.CirclePaint>(() => ({
        'circle-opacity': buildCircleOpacity(focus),
        'circle-color': buildCircleColor(focus),
        'circle-radius': circleRadius,
    }), [focus]);

    const handleMapPointClick = useCallback((feature: MapboxGeoJSONFeature, lngLat: LngLat) => {
        if (feature.properties) {
            onPointClick(lngLat, feature.properties as PopupProperties);
        } else {
            onClose();
        }
        return false;
    }, [onPointClick, onClose]);

    // the hover preview is transient and map-local, so it stays as local state
    const [hovered, setHovered] = useState<{
        lngLat: LngLatLike;
        properties: PopupProperties;
    } | undefined>();

    const handleMapPointEnter = useCallback((feature: MapboxGeoJSONFeature, lngLat: LngLat) => {
        if (isNotDefined(feature.properties)) {
            return;
        }
        // anchor to the point's own coordinates, not the cursor
        const coordinates = feature.geometry.type === 'Point'
            ? (feature.geometry.coordinates as [number, number])
            : [lngLat.lng, lngLat.lat] as [number, number];
        setHovered({ lngLat: coordinates, properties: feature.properties as PopupProperties });
    }, []);

    const handleMapPointLeave = useCallback(() => {
        setHovered(undefined);
    }, []);

    const iduGeojson: IduGeoJSON = useMemo(
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

                    return {
                        id: idu.id,
                        type: 'Feature' as const,
                        properties: iduToPopupProperties(idu),
                        geometry: {
                            type: 'Point' as const,
                            coordinates: [
                                idu.longitude,
                                idu.latitude,
                            ],
                        },
                    };
                })
                .filter(isDefined)
                // NOTE: show newer on top
                .sort((a, b) => compareDate(a.properties.date, b.properties.date)) ?? [],
        }),
        [idus],
    );

    // once a marker is pinned, ignore hover entirely (only one popup at a time)
    const showHoverPreview = isDefined(hovered) && isNotDefined(selection);

    return (
        <Map
            mapStyle={lightStyle}
            mapOptions={{
                logoPosition: 'bottom-right',
                scrollZoom: false,
                zoom: 1,
                // projection isn't in @types 2.7; applied at construction for globe
                projection: { name: 'globe' },
            } as Omit<mapboxgl.MapboxOptions, 'style' | 'container'>}
            scaleControlShown
            navControlShown
        >
            <MapContainer
                className={styles.mapContainer}
            />
            <div className={styles.mapOverlay}>
                <div className={styles.legend}>
                    <div className={styles.legendItem}>
                        <span className={_cs(styles.legendDot, styles.conflict)} />
                        Conflict and violence
                    </div>
                    <div className={styles.legendItem}>
                        <span className={_cs(styles.legendDot, styles.disaster)} />
                        Disasters
                    </div>
                    <div className={styles.legendNote}>
                        Size relative to the number of internal displacements
                    </div>
                </div>
                <div className={styles.disclaimer}>
                    {/* eslint-disable-next-line max-len */}
                    The boundaries and names shown and the designations used on this map do not imply official endorsement or acceptance by IDMC.
                </div>
            </div>
            <GlobeSpinner paused={isDefined(selection)} />
            <MapCenter center={flyTo} centerOptions={{}} />
            <MapBounds bounds={fitBounds} padding={40} duration={1000} />
            <MapSource
                sourceKey="idu-points"
                sourceOptions={sourceOption}
                geoJson={iduGeojson}
            >
                <MapLayer
                    layerKey="idu-point"
                    layerOptions={{
                        type: 'circle',
                        paint: iduPointPaint,
                    }}
                    onClick={handleMapPointClick}
                    onMouseEnter={handleMapPointEnter}
                    onMouseLeave={handleMapPointLeave}
                />
                {selection && (
                    <MapTooltip
                        coordinates={selection.lngLat}
                        tooltipOptions={popupOptions}
                        onHide={onClose}
                    >
                        <>
                            <RawButton
                                name={undefined}
                                className={styles.closeButton}
                                onClick={onClose}
                                title="Close"
                            >
                                <IoClose />
                            </RawButton>
                            <div className={styles.list}>
                                {selection.properties.map((item, index) => (
                                    <React.Fragment key={item.id}>
                                        {index > 0 && <div className={styles.separator} />}
                                        <EventPopupCard
                                            item={item}
                                            detailed
                                            onCountryFocus={onCountryFocus}
                                            onClose={onClose}
                                        />
                                    </React.Fragment>
                                ))}
                            </div>
                        </>
                    </MapTooltip>
                )}
                {showHoverPreview && hovered && (
                    <MapTooltip
                        coordinates={hovered.lngLat}
                        tooltipOptions={hoverPopupOptions}
                    >
                        <EventPopupCard
                            item={hovered.properties}
                            detailed={false}
                        />
                    </MapTooltip>
                )}
            </MapSource>
        </Map>
    );
}
export default RawIduMap;
