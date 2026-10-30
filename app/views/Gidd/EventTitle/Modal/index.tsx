import React, { memo, useMemo, useCallback } from 'react';
import {
    _cs,
    isDefined,
    isTruthyString,
    compareNumber,
} from '@togglecorp/fujs';
import { Modal } from '@togglecorp/toggle-ui';
import { removeNull } from '@togglecorp/toggle-form';
import {
    gql,
    useQuery,
} from '@apollo/client';

import ProgressLine from '#components/ProgressLine';
import TextOutput from '#components/TextOutput';
import NumberBlock from '#components/NumberBlock';
import Message from '#components/Message';
import ListView from '#components/ListView';
import {
    DATA_RELEASE,
} from '#utils/common';
import {
    GiddEventDetailsQuery,
    GiddEventDetailsQueryVariables,
    Crisis_Type as CrisisType,
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
            totalDisplacementRounded
        }
        endDate
        eventName
        eventCodes
        hazardTypes {
            id
            name
        }
        newDisplacementRounded
        totalDisplacementRounded
        startDate
    }
}
`;

type Country = NonNullable<NonNullable<GiddEventDetailsQuery['giddPublicEvent']>['affectedCountries']>[number];

const countryKeySelector = (item: Country) => item?.iso3 ?? '';

interface CountryFiguresProps {
    countryName: string | undefined;
    newDisplacement: number | null | undefined;
    totalDisplacement: number | null | undefined;
    maxNewDisplacement: number | undefined;
    maxTotalDisplacement: number | undefined;
    isFlowShown: boolean;
    isStockShown: boolean;
    progressClassName: string | undefined;
}

function CountryFigures(props: CountryFiguresProps) {
    const {
        countryName,
        newDisplacement,
        totalDisplacement,
        maxNewDisplacement,
        maxTotalDisplacement,
        isFlowShown,
        isStockShown,
        progressClassName,
    } = props;

    if (!isStockShown) {
        return (
            <ProgressLine
                title={countryName}
                value={newDisplacement ?? 0}
                total={maxNewDisplacement}
                progressClassName={progressClassName}
            />
        );
    }
    if (!isFlowShown) {
        return (
            <ProgressLine
                title={countryName}
                value={totalDisplacement ?? 0}
                total={maxTotalDisplacement}
                progressClassName={progressClassName}
            />
        );
    }

    return (
        <div className={styles.countryFigures}>
            <div className={styles.countryName}>
                {countryName}
            </div>
            {isDefined(newDisplacement) && (
                <ProgressLine
                    title="Internal Displacements"
                    value={newDisplacement}
                    total={maxNewDisplacement}
                    progressClassName={progressClassName}
                />
            )}
            {isDefined(totalDisplacement) && (
                <ProgressLine
                    title="IDPs"
                    value={totalDisplacement}
                    total={maxTotalDisplacement}
                    progressClassName={progressClassName}
                />
            )}
        </div>
    );
}

export type Props = {
    className?: string;
    title?: string;
    onCloseButtonClick: () => void;
    eventId: string;
    clientCode: string;
    // giddPublicEvent exposes neither the cause nor any violence field, so
    // both come from the events table row that opened this modal
    cause?: CrisisType | null;
    violenceSubTypeName?: string | null;
    category?: 'flow' | 'stock';
}

function EventModal(props: Props) {
    const {
        className,
        title,
        eventId,
        onCloseButtonClick,
        clientCode,
        cause,
        violenceSubTypeName,
        category,
    } = props;

    const isFlowShown = category !== 'stock';
    const isStockShown = category !== 'flow';

    const eventVariables = useMemo((): GiddEventDetailsQueryVariables => ({
        eventId,
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [eventId, clientCode]);

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
        const tempCountries = (event?.affectedCountries ?? []).filter(
            (country) => (
                (isFlowShown && isDefined(country?.newDisplacementRounded))
                || (isStockShown && isDefined(country?.totalDisplacementRounded))
            ),
        );

        tempCountries.sort(
            (foo, bar) => (
                isFlowShown
                    ? compareNumber(
                        foo?.newDisplacementRounded,
                        bar?.newDisplacementRounded,
                        -1,
                    )
                    : compareNumber(
                        foo?.totalDisplacementRounded,
                        bar?.totalDisplacementRounded,
                        -1,
                    )
            ),
        );

        return removeNull(tempCountries.filter(isDefined));
    }, [event?.affectedCountries, isFlowShown, isStockShown]);

    const maxNewDisplacement = useMemo(() => (
        Math.max(0, ...sortedCountries.map((country) => country.newDisplacementRounded ?? 0))
    ), [sortedCountries]);

    const maxTotalDisplacement = useMemo(() => (
        Math.max(0, ...sortedCountries.map((country) => country.totalDisplacementRounded ?? 0))
    ), [sortedCountries]);

    // conflict events carry no hazard types; their taxonomy is the violence
    // sub-type, which only the events table row knows about
    const isConflict = cause === 'CONFLICT';
    const isDisaster = cause === 'DISASTER';
    let figureVariant: 'conflict' | 'disaster' | 'normal' = 'normal';
    if (isConflict) {
        figureVariant = 'conflict';
    } else if (isDisaster) {
        figureVariant = 'disaster';
    }
    const progressClassName = isConflict ? styles.conflictProgress : undefined;

    const subTypeLabel = isConflict ? 'Conflict Subtypes' : 'Hazard Subtypes';
    const subTypeValue = isConflict
        ? violenceSubTypeName
        : event?.hazardTypes?.map((hazard) => hazard?.name).join(' / ');

    const countryRendererParams = useCallback((_: string, country: Country) => ({
        countryName: country?.countryName,
        newDisplacement: country?.newDisplacementRounded,
        totalDisplacement: country?.totalDisplacementRounded,
        maxNewDisplacement,
        maxTotalDisplacement,
        isFlowShown,
        isStockShown,
        progressClassName,
    }), [
        maxNewDisplacement,
        maxTotalDisplacement,
        isFlowShown,
        isStockShown,
        progressClassName,
    ]);

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
                <div className={styles.figures}>
                    {isFlowShown && (
                        <NumberBlock
                            label="Internal Displacements"
                            size="medium"
                            variant={figureVariant}
                            value={event?.newDisplacementRounded}
                            abbreviated={false}
                            hiddenIfNoValue
                        />
                    )}
                    {isStockShown && (
                        <NumberBlock
                            label="IDPs"
                            size="medium"
                            variant={figureVariant}
                            value={event?.totalDisplacementRounded}
                            abbreviated={false}
                            hiddenIfNoValue
                        />
                    )}
                </div>
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
                {isTruthyString(subTypeValue) && (
                    <TextOutput
                        label={subTypeLabel}
                        value={subTypeValue}
                        displayType="block"
                    />
                )}
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
                {(event?.eventCodes?.length ?? 0) > 0 && (
                    <TextOutput
                        label="Event Codes"
                        value={event?.eventCodes.join(', ')}
                        displayType="block"
                    />
                )}
            </div>
            <div className={styles.border} />
            <div className={styles.right}>
                <ListView
                    rendererParams={countryRendererParams}
                    renderer={CountryFigures}
                    keySelector={countryKeySelector}
                    data={sortedCountries}
                    pending={loading && !data}
                    errored={false}
                    filtered={false}
                    messageShown
                    compactPendingMessage
                    emptyMessage="No affected countries recorded for this event."
                />
            </div>
        </Modal>
    );
}

export default memo(EventModal);
