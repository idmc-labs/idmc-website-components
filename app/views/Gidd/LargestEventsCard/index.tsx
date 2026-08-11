import React, { useMemo } from 'react';
import { _cs, isDefined } from '@togglecorp/fujs';
import { gql, useQuery } from '@apollo/client';

import Header from '#components/Header';
import EventListItem from '#components/IduMap/EventListItem';
import useDebouncedValue from '#hooks/useDebouncedValue';
import { DATA_RELEASE } from '#utils/common';
import {
    GiddEventsQuery,
    GiddEventsQueryVariables,
} from '#generated/types';

import styles from './styles.css';

// Reuses GiddEventsQuery/GiddEventsQueryVariables (generated for
// EventsTable's GiddEvents operation) since the field selection here is a
// subset of that operation's — no codegen access from this environment to
// generate a dedicated type for a differently-named operation.
const GIDD_TOP_DISASTER_EVENTS = gql`
    query GiddTopDisasterEvents(
        $page: Int,
        $ordering: String,
        $pageSize: Int,
        $endYear: Float,
        $startYear: Float,
        $hazardTypes: [ID!],
        $countriesIso3: [String!],
        $releaseEnvironment: String!,
        $clientId: String!,
    ){
        giddPublicDisasters(
            ordering: $ordering,
            pageSize: $pageSize,
            page: $page,
            filters: {
                countriesIso3: $countriesIso3,
                endYear: $endYear,
                startYear: $startYear,
                hazardTypes: $hazardTypes,
                releaseEnvironment: $releaseEnvironment,
            },
            clientId: $clientId,
        ){
            results {
                id
                countryName
                endDate
                eventId
                eventName
                hazardCategoryName
                hazardSubCategoryName
                hazardSubTypeName
                hazardTypeId
                hazardTypeName
                iso3
                newDisplacementRounded
                eventCodes
                startDate
                year
            }
            totalCount
            page
            pageSize
        }
    }
`;

const PAGE_SIZE = 5;

export interface Props {
    className?: string;
    countriesIso3: string[];
    hazardTypes: string[];
    startYear: number;
    endYear: number;
    clientCode: string;
    onViewEvents: () => void;
    abbreviate: boolean;
}

function LargestEventsCard(props: Props) {
    const {
        className,
        countriesIso3,
        hazardTypes,
        startYear,
        endYear,
        clientCode,
        onViewEvents,
        abbreviate,
    } = props;

    const variables = useMemo(() => ({
        countriesIso3,
        hazardTypes,
        startYear,
        endYear,
        ordering: '-newDisplacementRounded',
        page: 1,
        pageSize: PAGE_SIZE,
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [
        countriesIso3,
        hazardTypes,
        startYear,
        endYear,
        clientCode,
    ]);

    const debouncedVariables = useDebouncedValue(variables);

    const {
        previousData,
        data = previousData,
    } = useQuery<GiddEventsQuery, GiddEventsQueryVariables>(
        GIDD_TOP_DISASTER_EVENTS,
        {
            variables: debouncedVariables,
        },
    );

    const events = data?.giddPublicDisasters?.results ?? [];

    return (
        <div className={_cs(styles.largestEventsCard, className)}>
            <Header
                heading="Largest disaster events"
                headingSize="medium"
            />
            <div className={styles.list}>
                {events.map((event) => (
                    <EventListItem
                        key={event.id}
                        title={event.eventName}
                        subtitle={[event.countryName, event.startDate]
                            .filter(isDefined).join(' · ')}
                        displacementType="disaster"
                        value={event.newDisplacementRounded ?? 0}
                        abbreviate={abbreviate}
                        onClick={onViewEvents}
                    />
                ))}
            </div>
        </div>
    );
}

export default LargestEventsCard;
