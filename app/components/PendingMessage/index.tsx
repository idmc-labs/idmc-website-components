import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    PendingMessage as TuiPendingMessage,
    PendingMessageProps,
} from '@togglecorp/toggle-ui';

import styles from './styles.css';

export interface Props extends PendingMessageProps {
    noDelay?: boolean;
}

function PendingMessage(props: Props) {
    const {
        noDelay,
        className,
        ...others
    } = props;

    return (
        <TuiPendingMessage
            {...others}
            className={_cs(className, noDelay && styles.noDelay)}
        />
    );
}

export default PendingMessage;
