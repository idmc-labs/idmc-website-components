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
import { isDefined, isNotDefined, compareDate, _cs } from '@togglecorp/fujs';

import { mapboxStyle } from '#base/configs/mapbox';
import HTMLOutput from '#components/HTMLOutput';
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
    description: string,
}

type IduGeoJSON = GeoJSON.FeatureCollection<
    GeoJSON.Point,
    { type: 'Disaster' | 'Conflict' | 'Other', value: number, description: string | null | undefined }
>;

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
    className: styles.mapPopup,
    maxWidth: 'unset',
};

const sourceOption: mapboxgl.GeoJSONSourceRaw = {
    type: 'geojson',
};

const lightStyle = mapboxStyle || 'mapbox://styles/mapbox/light-v10';

interface Props {
    idus: IduDataQuery['idu'] | undefined;
    boundingBox: LngLatBounds | undefined;
}

function RawIduMap(props: Props) {
    const {
        idus,
        boundingBox,
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
                            {state.properties.map((item) => (
                                <div
                                    className={styles.item}
                                    key={item.id}
                                >
                                    <div
                                        className={_cs(
                                            styles.icon,
                                            item.type === 'Disaster' && styles.disaster,
                                            item.type === 'Conflict' && styles.conflict,
                                        )}
                                    />
                                    <HTMLOutput
                                        className={styles.description}
                                        value={item.description}
                                    />
                                </div>
                            ))}
                        </>
                    </MapTooltip>
                )}
            </MapSource>
        </Map>
    );
}
export default RawIduMap;
