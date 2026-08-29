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
import BubbleSizeLegend from '#components/BubbleSizeLegend';
import {
    getLogRadius,
    BUBBLE_RADIUS_MIN,
    BUBBLE_RADIUS_MAX,
} from '#utils/common';
import {
    IduDataQuery,
} from '#generated/types';

import styles from './styles.css';

export interface PopupProperties {
    id: number,
    eventId: number | null | undefined,
    type: 'Disaster' | 'Conflict' | 'Other',
    // datum.type for disasters, datum.subtype for conflicts (used for trigger focus grey-out)
    triggerKey: string | null | undefined,
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
        triggerKey: idu.displacement_type === 'Disaster' ? idu.type : idu.subtype,
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
    PopupProperties & { radius: number }
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

export type MapFocus =
    | { type: 'country'; iso3: string }
    | { type: 'event'; eventId: number }
    | { type: 'trigger'; triggerType: string };

function buildFocusCondition(focus: MapFocus): unknown[] {
    if (focus.type === 'country') {
        return ['==', ['get', 'iso3'], focus.iso3];
    }
    if (focus.type === 'event') {
        return ['==', ['get', 'eventId'], focus.eventId];
    }
    return ['==', ['get', 'triggerKey'], focus.triggerType];
}

export function isFeatureInFocus(properties: PopupProperties, focus: MapFocus): boolean {
    if (focus.type === 'country') {
        return properties.iso3 === focus.iso3;
    }
    if (focus.type === 'event') {
        return properties.eventId === focus.eventId;
    }
    return properties.triggerKey === focus.triggerType;
}

function buildCircleColor(focus: MapFocus | undefined): mapboxgl.CirclePaint['circle-color'] {
    if (!focus) {
        return TYPE_COLOR_EXPR as mapboxgl.CirclePaint['circle-color'];
    }
    return [
        'case', buildFocusCondition(focus), TYPE_COLOR_EXPR, GREY_COLOR,
    ] as mapboxgl.CirclePaint['circle-color'];
}

function buildCircleOpacity(focus: MapFocus | undefined): mapboxgl.CirclePaint['circle-opacity'] {
    if (!focus) {
        return 0.6;
    }
    return ['case', buildFocusCondition(focus), 0.8, 0.25] as mapboxgl.CirclePaint['circle-opacity'];
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

const INITIAL_CENTER: [number, number] = [0, 20];
const INITIAL_ZOOM = 2;

interface MapResetProps {
    trigger: number;
}

function MapReset({ trigger }: MapResetProps) {
    const { map } = useContext(MapChildContext);
    useEffect(() => {
        if (!map || trigger === 0) return;
        map.easeTo({ center: INITIAL_CENTER, zoom: INITIAL_ZOOM, duration: 1000 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trigger]);
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
    onEventFocus?: (eventId: number) => void;
    onClose?: () => void;
    abbreviate?: boolean;
}

function EventPopupCard(props: EventPopupCardProps) {
    const {
        item,
        detailed,
        onCountryFocus,
        onEventFocus,
        onClose,
        abbreviate = true,
    } = props;

    const isDisaster = item.type === 'Disaster';
    const accentClassName = isDisaster ? styles.disaster : styles.conflict;
    const typeLabelClassName = _cs(styles.typeLabel, accentClassName);
    const footerText = [item.source, formatDate(item.date)]
        .filter(isTruthyString)
        .join(' · ');
    const canFocusCountry = isDefined(onCountryFocus) && isTruthyString(item.iso3);
    const canFocusEvent = isDefined(onEventFocus) && isDefined(item.eventId);
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
                    abbreviate={abbreviate}
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
                    {canFocusEvent && (
                        <RawButton
                            name={undefined}
                            className={focusButtonClassName}
                            onClick={() => {
                                onEventFocus?.(item.eventId as number);
                                onClose?.();
                            }}
                        >
                            Focus event on map
                            <IoArrowForward />
                        </RawButton>
                    )}
                    {canFocusCountry && (
                        <RawButton
                            name={undefined}
                            className={focusButtonClassName}
                            onClick={() => {
                                onCountryFocus?.(item.iso3);
                                onClose?.();
                            }}
                        >
                            {`Focus ${item.country} on map`}
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
    // largest figure across the unfiltered data — anchors the bubble scale so
    // sizes stay stable as filters change
    maxValue: number;
    onCountryFocus?: (iso3: string) => void;
    onEventFocus?: (eventId: number) => void;
    // the currently-open popup (owned by the parent, so filters/events can drive it)
    selection: MapSelection | undefined;
    // center to ease the map to when a popup is opened from an event row
    flyTo: LngLatLike | undefined;
    // fit the map to a country bounding box
    fitBounds: LngLatBoundsLike | undefined;
    // grey out all dots except those matching this focus
    focus: MapFocus | undefined;
    // true while any filter is applied (keeps the globe from spinning off the view)
    filtersActive: boolean;
    // increment to animate back to the initial globe view
    resetTrigger: number;
    abbreviate?: boolean;
    onPointClick: (lngLat: LngLatLike, properties: PopupProperties) => void;
    onClose: () => void;
    onRemoveFocus: () => void;
}

function RawIduMap(props: Props) {
    const {
        idus,
        maxValue,
        onCountryFocus,
        onEventFocus,
        selection,
        flyTo,
        fitBounds,
        focus,
        filtersActive,
        resetTrigger,
        abbreviate = true,
        onPointClick,
        onClose,
        onRemoveFocus,
    } = props;

    const focusLabel = useMemo(() => {
        if (isNotDefined(focus)) {
            return undefined;
        }
        if (focus.type === 'country') {
            return (idus ?? []).find((d) => d.iso3 === focus.iso3)?.country ?? focus.iso3;
        }
        if (focus.type === 'event') {
            const match = (idus ?? []).find((d) => d.event_id === focus.eventId);
            return match?.event_name ?? `Event ${focus.eventId}`;
        }
        return focus.triggerType;
    }, [focus, idus]);

    const iduPointPaint = useMemo<mapboxgl.CirclePaint>(() => ({
        'circle-opacity': buildCircleOpacity(focus),
        'circle-color': buildCircleColor(focus),
        'circle-radius': ['get', 'radius'],
    }), [focus]);

    const handleMapPointClick = useCallback((feature: MapboxGeoJSONFeature, lngLat: LngLat) => {
        if (isNotDefined(feature.properties)) {
            onClose();
            return false;
        }
        const properties = feature.properties as PopupProperties;
        // in focus mode, only the focused bubbles are interactive
        if (isDefined(focus) && !isFeatureInFocus(properties, focus)) {
            return false;
        }
        onPointClick(lngLat, properties);
        return false;
    }, [onPointClick, onClose, focus]);

    // the hover preview is transient and map-local, so it stays as local state
    const [hovered, setHovered] = useState<{
        lngLat: LngLatLike;
        properties: PopupProperties;
    } | undefined>();

    const handleMapPointEnter = useCallback((feature: MapboxGeoJSONFeature, lngLat: LngLat) => {
        if (isNotDefined(feature.properties)) {
            return;
        }
        const properties = feature.properties as PopupProperties;
        // in focus mode, only the focused bubbles are interactive
        if (isDefined(focus) && !isFeatureInFocus(properties, focus)) {
            return;
        }
        // anchor to the point's own coordinates, not the cursor
        const coordinates = feature.geometry.type === 'Point'
            ? (feature.geometry.coordinates as [number, number])
            : [lngLat.lng, lngLat.lat] as [number, number];
        setHovered({ lngLat: coordinates, properties });
    }, [focus]);

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
                        || idu.displacement_type === 'Other'
                    ) {
                        return undefined;
                    }

                    return {
                        id: idu.id,
                        type: 'Feature' as const,
                        properties: {
                            ...iduToPopupProperties(idu),
                            radius: getLogRadius(
                                idu.figure,
                                1,
                                maxValue,
                                BUBBLE_RADIUS_MIN,
                                BUBBLE_RADIUS_MAX,
                            ),
                        },
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
                .sort((a, b) => compareDate(a.properties.date, b.properties.date)) ?? [],
        }),
        [idus, maxValue],
    );

    // once a marker is pinned, ignore hover entirely (only one popup at a time)
    const showHoverPreview = isDefined(hovered) && isNotDefined(selection);

    return (
        <Map
            mapStyle={lightStyle}
            mapOptions={{
                logoPosition: 'bottom-right',
                scrollZoom: false,
                zoom: INITIAL_ZOOM,
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
                    <BubbleSizeLegend
                        className={styles.sizeLegend}
                        title="Size by number of internal displacements"
                        domainMin={1}
                        domainMax={maxValue}
                        abbreviate={abbreviate}
                    />
                </div>
                <div className={styles.disclaimer}>
                    {/* eslint-disable-next-line max-len */}
                    The boundaries and names shown and the designations used on this map do not imply official endorsement or acceptance by IDMC.
                </div>
            </div>
            <GlobeSpinner paused={isDefined(selection) || isDefined(focus) || filtersActive} />
            {isDefined(focus) && (
                <RawButton
                    name={undefined}
                    className={styles.removeFocusButton}
                    onClick={onRemoveFocus}
                    title="Remove focus"
                >
                    <span className={styles.removeFocusLabel}>
                        {`Focused: ${focusLabel}`}
                    </span>
                    <IoClose />
                </RawButton>
            )}
            <MapReset trigger={resetTrigger} />
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
                            <div className={styles.header}>
                                <RawButton
                                    name={undefined}
                                    className={styles.closeButton}
                                    onClick={onClose}
                                    title="Close"
                                >
                                    <IoClose />
                                </RawButton>
                            </div>
                            <div className={styles.list}>
                                {selection.properties.map((item, index) => (
                                    <React.Fragment key={item.id}>
                                        {index > 0 && <div className={styles.separator} />}
                                        <EventPopupCard
                                            item={item}
                                            detailed
                                            abbreviate={abbreviate}
                                            onCountryFocus={onCountryFocus}
                                            onEventFocus={onEventFocus}
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
                            abbreviate={abbreviate}
                        />
                    </MapTooltip>
                )}
            </MapSource>
        </Map>
    );
}
export default RawIduMap;
