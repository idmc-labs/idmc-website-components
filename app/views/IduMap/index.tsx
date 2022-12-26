import React from 'react';
import useIduMap from '#components/IduMap/useIduMap';

import styles from './styles.css';

function IduMap() {
    const { widget } = useIduMap();

    return (
        <div
            className={styles.page}
        >
            <div>
                Hover over and click on the coloured bubbles to see near real-time
                snapshots of situations of internal displacement.
            </div>
            {widget}
        </div>
    );
}
export default IduMap;
