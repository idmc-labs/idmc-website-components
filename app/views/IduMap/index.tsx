import React from 'react';

import PendingMessage from '#components/PendingMessage';
import useIduMap from '#components/IduMap/useIduMap';

import styles from './styles.css';

interface Props {
    clientCode: string;
}

function IduMap(props: Props) {
    const { clientCode } = props;
    const { widget, pending } = useIduMap(clientCode);

    return (
        <div
            className={styles.page}
        >
            {pending && <PendingMessage noDelay />}
            {widget}
        </div>
    );
}
export default IduMap;
