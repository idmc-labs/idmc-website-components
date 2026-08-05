import { requireRuntimeConfig } from '#utils/runtimeConfig';

export const mapboxToken = requireRuntimeConfig('REACT_APP_MAPBOX_ACCESS_TOKEN', process.env.REACT_APP_MAPBOX_ACCESS_TOKEN);
export const mapboxStyle = requireRuntimeConfig('REACT_APP_MAPBOX_STYLE', process.env.REACT_APP_MAPBOX_STYLE);
