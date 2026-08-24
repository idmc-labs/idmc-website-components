import React, { memo } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    RawButton,
} from '@togglecorp/toggle-ui';

import useModalState from '#hooks/useModalState';
import { Crisis_Type as CrisisType } from '#generated/types';

import Modal from './Modal';

import styles from './styles.css';

export type Props = {
    className?: string;
    title?: string;
    label: React.ReactNode;
    eventId: string | undefined;
    clientId: string;
    // forwarded to the modal: the event details query exposes neither field
    cause?: CrisisType | null;
    violenceSubTypeName?: string | null;
}

function EventTitle(props: Props) {
    const {
        className,
        label,
        title,
        eventId,
        clientId,
        cause,
        violenceSubTypeName,
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
                            cause={cause}
                            violenceSubTypeName={violenceSubTypeName}
                            onCloseButtonClick={hideModal}
                        />
                    )}
                </>
            )}
        </>
    );
}

export default memo(EventTitle);
