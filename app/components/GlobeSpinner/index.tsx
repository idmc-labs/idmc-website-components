import {
    useContext,
    useEffect,
    useRef,
} from 'react';
import { MapChildContext } from '@togglecorp/re-map';
import { isNotDefined } from '@togglecorp/fujs';

// @types/mapbox-gl (2.7) predates the globe projection.
type MapWithProjection = mapboxgl.Map & {
    setProjection: (projection: string) => void;
};

const SECONDS_PER_REVOLUTION = 120;
const MAX_SPIN_ZOOM = 5;

export interface GlobeSpinnerProps {
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

export default GlobeSpinner;
