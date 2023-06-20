import React, { memo, useMemo, useCallback } from 'react';
import {
    _cs,
    isDefined,
    compareNumber,
} from '@togglecorp/fujs';
import {
    Modal,
    List,
} from '@togglecorp/toggle-ui';
import { removeNull } from '@togglecorp/toggle-form';
import {
    gql,
    useQuery,
} from '@apollo/client';

import ProgressLine from '#components/ProgressLine';
import TextOutput from '#components/TextOutput';
import NumberBlock from '#components/NumberBlock';
import Message from '#components/Message';
import {
    DATA_RELEASE,
    HELIX_CLIENT_ID,
} from '#utils/common';
import {
    GiddEventDetailsQuery,
    GiddEventDetailsQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const GIDD_EVENT_DETAILS = gql`
query GiddEventDetails(
    $eventId: ID!,
    $releaseEnvironment: String,
    $clientId: String!,
){
    giddPublicEvent(
        eventId: $eventId,
        releaseEnvironment: $releaseEnvironment,
        clientId: $clientId,
    ) {
        affectedCountries {
            countryName
            iso3
            newDisplacementRounded
        }
        endDate
        eventName
        glideNumbers
        hazardTypes {
            id
            name
        }
        newDisplacementRounded
        startDate
    }
}
`;

type Country = NonNullable<NonNullable<GiddEventDetailsQuery['giddPublicEvent']>['affectedCountries']>[number];

const countryKeySelector = (item: Country) => item?.iso3 ?? '';

export type Props = {
    className?: string;
    title?: string;
    onCloseButtonClick: () => void;
    eventId: string;
}

function EventModal(props: Props) {
    const {
        className,
        title,
        eventId,
        onCloseButtonClick,
    } = props;

    const eventVariables = useMemo(() => ({
        eventId,
        releaseEnvironment: DATA_RELEASE,
        clientId: HELIX_CLIENT_ID,
    }), [eventId]);

    const {
        previousData,
        data = previousData,
        loading,
    } = useQuery<GiddEventDetailsQuery, GiddEventDetailsQueryVariables>(
        GIDD_EVENT_DETAILS,
        {
            variables: eventVariables,
            context: {
                clientName: 'helix',
            },
        },
    );

    const event = data?.giddPublicEvent;

    const sortedCountries = useMemo(() => {
        const tempCountries = [...event?.affectedCountries ?? []];

        tempCountries.sort(
            (foo, bar) => compareNumber(
                foo?.newDisplacementRounded,
                bar?.newDisplacementRounded,
                -1,
            ),
        );

        return removeNull(tempCountries.filter(isDefined));
    }, [event?.affectedCountries]);

    const countryRendererParams = useCallback((_: string, country: Country) => ({
        total: sortedCountries?.[0]?.newDisplacementRounded,
        value: country?.newDisplacementRounded ?? 0,
        title: country?.countryName,
    }), [sortedCountries]);

    return (
        <Modal
            className={_cs(className, styles.eventModal)}
            heading={title}
            size="large"
            onClose={onCloseButtonClick}
            bodyClassName={styles.content}
        >
            <Message
                pending={loading}
                pendingMessage="Loading"
            />
            <div className={styles.left}>
                <NumberBlock
                    label="Internal Displacements"
                    size="medium"
                    value={event?.newDisplacementRounded}
                    abbreviated={false}
                />
                <TextOutput
                    label="Event Name"
                    value={event?.eventName}
                    displayType="block"
                />
                <TextOutput
                    label="Affected Countries"
                    value={event?.affectedCountries?.map((country) => country?.countryName).join(', ')}
                    displayType="block"
                />
                <TextOutput
                    label="Hazard Subtypes"
                    value={event?.hazardTypes?.map((hazard) => hazard?.name).join(' / ')}
                    displayType="block"
                />
                <TextOutput
                    label="Start Date"
                    value={event?.startDate}
                    displayType="block"
                />
                <TextOutput
                    label="End Date"
                    value={event?.endDate}
                    displayType="block"
                />
                {(event?.glideNumbers?.length ?? 0) > 0 && (
                    <TextOutput
                        label="Glide No"
                        value={event?.glideNumbers.join(', ')}
                        displayType="block"
                    />
                )}
            </div>
            <div className={styles.border} />
            <div className={styles.right}>
                <List
                    rendererParams={countryRendererParams}
                    renderer={ProgressLine}
                    keySelector={countryKeySelector}
                    data={sortedCountries}
                />
            </div>
        </Modal>
    );
}

export default memo(EventModal);
