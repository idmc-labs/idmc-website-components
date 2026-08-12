import React, { useCallback, useMemo, useReducer } from 'react';
import Map, {
    MapContainer,
    MapBounds,
    MapSource,
    MapLayer,
    MapTooltip,
} from '@togglecorp/re-map';
import {
    MapboxGeoJSONFeature,
    LngLat,
    PopupOptions,
    LngLatLike,
    LngLatBounds,
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

interface DeselectAction {
    type: 'deselect';
}

interface SelectAction {
    type: 'select';
    lngLat: LngLatLike;
    properties: PopupProperties;
}

type MapActions = DeselectAction | SelectAction;

interface MapState {
    lngLat: LngLatLike | undefined;
    properties: PopupProperties[];
}

type Reducer = (prevState: MapState, action: MapActions) => MapState;

interface PopupProperties {
    id: number,
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

type IduGeoJSON = GeoJSON.FeatureCollection<
    GeoJSON.Point,
    PopupProperties
>;

const iduPointColor: mapboxgl.CirclePaint = {
    'circle-opacity': 0.6,
    'circle-stroke-width': 1,
    'circle-stroke-color': '#fff',
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
    className: styles.mapPopup,
    maxWidth: 'unset',
};

const sourceOption: mapboxgl.GeoJSONSourceRaw = {
    type: 'geojson',
};

const lightStyle = mapboxStyle;

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

interface Props {
    idus: IduDataQuery['idu'] | undefined;
    boundingBox: LngLatBounds | undefined;
    onCountryFocus?: (iso3: string) => void;
}

function RawIduMap(props: Props) {
    const {
        idus,
        boundingBox,
        onCountryFocus,
    } = props;

    const [state, dispatch] = useReducer<Reducer>(
        (prevState, action) => {
            if (action.type === 'deselect') {
                return {
                    lngLat: undefined,
                    properties: [],
                };
            }
            if (action.type === 'select') {
                if (action.lngLat === prevState.lngLat) {
                    return {
                        ...prevState,
                        properties: [
                            ...prevState.properties,
                            action.properties,
                        ],
                    };
                }
                return {
                    lngLat: action.lngLat,
                    properties: [action.properties],
                };
            }
            return prevState;
        },
        { lngLat: undefined, properties: [] },
    );
    const handleMapPointClick = useCallback((feature: MapboxGeoJSONFeature, lngLat: LngLat) => {
        if (feature.properties) {
            dispatch({
                type: 'select',
                lngLat,
                properties: feature.properties as PopupProperties,
            });
        } else {
            dispatch({
                type: 'deselect',
            });
        }
        return false;
    }, []);

    const handleMapPopupClose = useCallback(() => {
        dispatch({
            type: 'deselect',
        });
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
                        properties: {
                            id: idu.id,
                            type: idu.displacement_type,
                            value: idu.figure,
                            date: idu.displacement_date,
                            description: idu.standard_popup_text,
                            eventName: idu.event_name,
                            eventCode: idu.event_codes,
                            source: idu.sources,
                            country: idu.country,
                            iso3: idu.iso3,
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
                // NOTE: show newer on top
                .sort((a, b) => compareDate(a.properties.date, b.properties.date)) ?? [],
        }),
        [idus],
    );

    return (
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
            <MapContainer
                className={styles.mapContainer}
            />
            <MapBounds
                bounds={boundingBox}
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
                    onClick={handleMapPointClick}
                />
                {state.lngLat && (
                    <MapTooltip
                        coordinates={state.lngLat}
                        tooltipOptions={popupOptions}
                        onHide={handleMapPopupClose}
                    >
                        <>
                            <RawButton
                                name={undefined}
                                className={styles.closeButton}
                                onClick={handleMapPopupClose}
                                title="Close"
                            >
                                <IoClose />
                            </RawButton>
                            <div className={styles.list}>
                                {state.properties.map((item, index) => {
                                    const isDisaster = item.type === 'Disaster';
                                    const accentClassName = isDisaster
                                        ? styles.disaster
                                        : styles.conflict;
                                    const typeLabelClassName = _cs(
                                        styles.typeLabel,
                                        accentClassName,
                                    );
                                    const footerText = [item.source, formatDate(item.date)]
                                        .filter(isTruthyString)
                                        .join(' · ');
                                    const canFocus = isDefined(onCountryFocus)
                                        && isTruthyString(item.iso3);
                                    const focusButtonClassName = _cs(
                                        styles.focusButton,
                                        accentClassName,
                                    );
                                    return (
                                        <React.Fragment key={item.id}>
                                            {index > 0 && <div className={styles.separator} />}
                                            <div className={styles.card}>
                                                <div className={typeLabelClassName}>
                                                    <span className={styles.dot} />
                                                    {isDisaster ? 'Disasters' : 'Conflict'}
                                                </div>
                                                {isTruthyString(item.eventCode) && (
                                                    <div className={styles.code}>
                                                        {item.eventCode}
                                                    </div>
                                                )}
                                                <div className={styles.figureRow}>
                                                    <Numeral
                                                        className={styles.figure}
                                                        value={item.value}
                                                        abbreviate
                                                        valueClassName={accentClassName}
                                                        abbrClassName={accentClassName}
                                                    />
                                                    <span className={styles.figureLabel}>
                                                        Internal displacements
                                                    </span>
                                                </div>
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
                                                            handleMapPopupClose();
                                                        }}
                                                    >
                                                        {`Focus ${item.country} in all views`}
                                                        <IoArrowForward />
                                                    </RawButton>
                                                )}
                                            </div>
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </>
                    </MapTooltip>
                )}
            </MapSource>
        </Map>
    );
}
export default RawIduMap;
