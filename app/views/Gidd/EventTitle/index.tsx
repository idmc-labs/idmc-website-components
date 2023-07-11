import React, { memo } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    RawButton,
} from '@togglecorp/toggle-ui';

import useModalState from '#hooks/useModalState';

import Modal from './Modal';

import styles from './styles.css';

export type Props = {
    className?: string;
    title?: string;
    label: React.ReactNode;
    eventId: string | undefined;
    clientId: string;
}

function EventTitle(props: Props) {
    const {
        className,
        label,
        title,
        eventId,
        clientId,
    } = props;

    const [
        isModalVisible,
        showModal,
        hideModal,
    ] = useModalState(false);

    return (
        <>
            {!eventId ? (
                label
            ) : (
                <>
                    <RawButton
                        name={undefined}
                        className={_cs(className, styles.button)}
                        onClick={showModal}
                        title="Show event details"
                    >
                        {label}
                    </RawButton>
                    {isModalVisible && (
                        <Modal
                            clientCode={clientId}
                            eventId={eventId}
                            title={title}
                            onCloseButtonClick={hideModal}
                        />
                    )}
                </>
            )}
        </>
    );
}

export default memo(EventTitle);
