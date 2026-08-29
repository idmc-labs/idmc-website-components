import { setMapboxToken } from '@togglecorp/re-map';

import { mapboxToken } from '#base/configs/mapbox';

import 'mapbox-gl/dist/mapbox-gl.css';

// NOTE: importing this module is what pulls mapbox-gl in, so every module that
// renders a map imports it and nothing else does. Doing the same from the app
// root would put the largest dependency in the bundle every page loads, for the
// sake of the three that draw a map.
setMapboxToken(mapboxToken);
