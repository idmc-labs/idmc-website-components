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
            {widget}
        </div>
    );
}
export default IduMap;
