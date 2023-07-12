import React from 'react';
import useIduMap from '#components/IduMap/useIduMap';

import styles from './styles.css';

interface Props {
    clientCode: string;
}

function IduMap(props: Props) {
    const { clientCode } = props;
    const { widget } = useIduMap(clientCode);

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
