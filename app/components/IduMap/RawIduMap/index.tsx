import React, { useState, useCallback, useMemo } from 'react';
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
import { isDefined, isNotDefined } from '@togglecorp/fujs';

import HTMLOutput from '#components/HTMLOutput';
import {
    IduDataQuery,
} from '#generated/types';

import styles from './styles.css';

interface PopupProperties {
    type: 'Disaster' | 'Conflict' | 'Other',
    value: number,
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
    maxWidth: '480px',
};

const sourceOption: mapboxgl.GeoJSONSourceRaw = {
    type: 'geojson',
};

const lightStyle = process.env.REACT_APP_MAPBOX_STYLE || 'mapbox://styles/mapbox/light-v10';

interface Props {
    idus: IduDataQuery['idu'] | undefined;
    boundingBox: LngLatBounds | undefined;
}

function RawIduMap(props: Props) {
    const {
        idus,
        boundingBox,
    } = props;

    const [mapHoverLngLat, setMapHoverLngLat] = useState<LngLatLike>();
    const [
        mapHoverFeatureProperties,
        setMapHoverFeatureProperties,
    ] = useState<PopupProperties | undefined>(undefined);

    const handleMapPointClick = useCallback((feature: MapboxGeoJSONFeature, lngLat: LngLat) => {
        if (feature.properties) {
            setMapHoverLngLat(lngLat);
            setMapHoverFeatureProperties(feature.properties as PopupProperties);
        } else {
            setMapHoverFeatureProperties(undefined);
        }
        return true;
    }, []);

    const handleMapPopupClose = useCallback(() => {
        setMapHoverLngLat(undefined);
        setMapHoverFeatureProperties(undefined);
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
                {mapHoverLngLat && mapHoverFeatureProperties && (
                    <MapTooltip
                        coordinates={mapHoverLngLat}
                        tooltipOptions={popupOptions}
                        onHide={handleMapPopupClose}
                    >
                        <HTMLOutput
                            value={mapHoverFeatureProperties.description}
                        />
                    </MapTooltip>
                )}
            </MapSource>
        </Map>
    );
}
export default RawIduMap;
