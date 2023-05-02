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
    GiddEventDetailsQuery,
    GiddEventDetailsQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const GIDD_EVENT_DETAILS = gql`
query GiddEventDetails(
    $eventId: ID!,
){
    giddEvent(
        eventId: $eventId,
    ) {
        affectedCountries {
            countryName
            iso3
            newDisplacement
        }
        endDate
        eventName
        glideNumbers
        hazardSubTypes {
            id
            name
        }
        newDisplacement
        startDate
    }
}
`;

type Country = NonNullable<NonNullable<GiddEventDetailsQuery['giddEvent']>['affectedCountries']>[number];

const hazardKeySelector = (item: Country) => item?.iso3 ?? '';

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
    }), [eventId]);

    const {
        data,
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

    const event = data?.giddEvent;

    const sortedCountries = useMemo(() => {
        const tempCountries = [...event?.affectedCountries ?? []];

        tempCountries.sort(
            (foo, bar) => compareNumber(foo?.newDisplacement, bar?.newDisplacement, -1),
        );

        return removeNull(tempCountries.filter(isDefined));
    }, [event?.affectedCountries]);

    const countryRendererParams = useCallback((_: string, country: Country) => ({
        total: sortedCountries?.[0]?.newDisplacement,
        value: country?.newDisplacement ?? 0,
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
                    value={event?.newDisplacement}
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
                    value={event?.hazardSubTypes?.map((hazard) => hazard?.name).join(' / ')}
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
                    keySelector={hazardKeySelector}
                    data={sortedCountries}
                />
            </div>
        </Modal>
    );
}

export default memo(EventModal);
