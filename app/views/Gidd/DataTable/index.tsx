import React, { useMemo, useCallback } from 'react';
import {
    _cs,
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import {
    Table,
    Pager,
    SortContext,
} from '@togglecorp/toggle-ui';
import {
    DATA_RELEASE,
} from '#utils/common';
import {
    gql,
    useQuery,
} from '@apollo/client';

import {
    createTextColumn,
    createNumberColumn,
} from '#components/tableHelpers';
import Message from '#components/Message';
import PendingMessage from '#components/PendingMessage';
import useActiveVariables from '#hooks/useActiveVariables';
import useFilterState from '#hooks/useFilterState';
import useSyncedFilter from '#hooks/useSyncedFilter';
import {
    GiddDisplacementsQuery,
    GiddDisplacementsQueryVariables,
} from '#generated/types';

import { CAUSE_BY_KEY } from '../utils';
import { GiddTableFilter } from '../types';

import styles from './styles.css';

type DisplacementData = NonNullable<
    NonNullable<GiddDisplacementsQuery['giddPublicCountryYearDisplacements']>['results']
>[number];

const displacementItemKeySelector = (item: DisplacementData) => `${item.iso3}-${item.year}`;
const DISPLACEMENTS_TABLE_PAGE_SIZE = 10;

function getCombinedTotal(
    a: number | null | undefined,
    b: number | null | undefined,
) {
    if (isNotDefined(a) && isNotDefined(b)) {
        return undefined;
    }
    return (a ?? 0) + (b ?? 0);
}

const smallNumberWidth = 80;
// the IDPs headers are far shorter than the displacement ones, so they need less room
const mediumNumberWidth = 120;
const largeNumberWidth = 160;

const mediumTextWidth = 150;

const GIDD_DISPLACEMENTS = gql`
    query GiddDisplacements(
        $page: Int,
        $ordering: String,
        $pageSize: Int,
        $endYear: Int,
        $startYear: Int,
        $countriesIso3: [String!],
        $cause: CRISIS_TYPE,
        $hazardTypes: [ID!],
        $violenceSubTypes: [ID!],
        $releaseEnvironment: String!,
        $clientId: String!,
    ){
        giddPublicCountryYearDisplacements(
            ordering: $ordering,
            pageSize: $pageSize,
            page: $page,
            countriesIso3: $countriesIso3,
            cause: $cause,
            endYear: $endYear,
            startYear: $startYear,
            hazardTypes: $hazardTypes,
            violenceSubTypes: $violenceSubTypes,
            releaseEnvironment: $releaseEnvironment,
            clientId: $clientId,
        ){
            results {
                iso3
                countryName
                countryId
                year
                conflictNewDisplacementRounded
                conflictTotalDisplacementRounded
                disasterNewDisplacementRounded
                disasterTotalDisplacementRounded
            }
            totalCount
            page
            pageSize
        }
    }
`;

interface Props {
    className?: string;
    isConflictDataShown?: boolean;
    isDisasterDataShown?: boolean;
    filter: GiddTableFilter;
    clientCode: string;
    abbreviate: boolean;
    /**
     * False while the pane is mounted but hidden: its loading overlay stays out of the visible
     * view, and its query holds the variables it last fetched with.
     */
    active?: boolean;
}

function DataTable(props: Props) {
    const {
        className,
        isConflictDataShown,
        isDisasterDataShown,
        filter: sharedFilter,
        clientCode,
        abbreviate,
        active = true,
    } = props;

    const {
        filter,
        page,
        setPage,
        rawPage,
        pageSize,
        ordering,
        sortState,
        setFilter,
    } = useFilterState<GiddTableFilter>({
        filter: sharedFilter,
        ordering: { name: 'year', direction: 'dsc' },
        pageSize: DISPLACEMENTS_TABLE_PAGE_SIZE,
    });

    useSyncedFilter(sharedFilter, setFilter);

    const { sorting } = sortState;

    const sortedHeaderClassName = useCallback((columnId: string) => (
        sorting?.name === columnId ? styles.sortedHeader : undefined
    ), [sorting]);

    const giddDisplacementsVariables = useMemo(() => ({
        ordering,
        page,
        pageSize,
        countriesIso3: filter.countriesIso3,
        cause: filter.cause ? CAUSE_BY_KEY[filter.cause] : undefined,
        startYear: filter.startYear,
        endYear: filter.endYear,
        hazardTypes: filter.hazardTypes,
        violenceSubTypes: filter.violenceSubTypes,
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [
        ordering,
        page,
        pageSize,
        filter,
        clientCode,
    ]);

    const activeVariables = useActiveVariables(giddDisplacementsVariables, active);

    const {
        previousData: previousDisplacementsResponse,
        data: displacementsResponse = previousDisplacementsResponse,
        loading,
    } = useQuery<
        GiddDisplacementsQuery,
        GiddDisplacementsQueryVariables
    >(
        GIDD_DISPLACEMENTS,
        {
            variables: activeVariables,
            context: {
                clientName: 'helix',
            },
        },
    );

    const isFlowShown = filter.category !== 'stock';
    const isStockShown = filter.category !== 'flow';
    const bothCauses = !!isConflictDataShown && !!isDisasterDataShown;

    const columns = useMemo(
        () => ([
            createTextColumn<DisplacementData, string>(
                'countryName',
                'Country / Territory',
                (item) => item.countryName,
                {
                    sortable: true,
                    columnWidth: mediumTextWidth,
                    columnStretch: true,
                    headerCellRendererClassName: sortedHeaderClassName('countryName'),
                },
            ),
            createNumberColumn<DisplacementData, string>(
                'year',
                'Year',
                (item) => item.year,
                {
                    sortable: true,
                    separator: '',
                    columnWidth: smallNumberWidth,
                    headerCellRendererClassName: sortedHeaderClassName('year'),
                },
            ),
            isFlowShown && isConflictDataShown ? createNumberColumn<DisplacementData, string>(
                'conflictNewDisplacement',
                'Conflict Displacements',
                (item) => item.conflictNewDisplacementRounded,
                {
                    sortable: true,
                    variant: 'conflict',
                    abbreviate,
                    columnWidth: largeNumberWidth,
                    headerCellRendererClassName: sortedHeaderClassName('conflictNewDisplacement'),
                },
            ) : undefined,
            isFlowShown && isDisasterDataShown ? createNumberColumn<DisplacementData, string>(
                'disasterNewDisplacement',
                'Disaster Displacements',
                (item) => item.disasterNewDisplacementRounded,
                {
                    sortable: true,
                    variant: 'disaster',
                    abbreviate,
                    columnWidth: largeNumberWidth,
                    headerCellRendererClassName: sortedHeaderClassName('disasterNewDisplacement'),
                },
            ) : undefined,
            // summed from the two published figures, so it can sit up to 1,000 away from a
            // figure rounded once from the raw total -- the server has no combined column yet
            // not sortable: this is a client-side sum of two fields with no
            // single backing field the server can order by, and the table
            // is now server-paginated — sorting it would only reorder
            // whatever happens to be on the current page
            isFlowShown && bothCauses ? createNumberColumn<DisplacementData, string>(
                'totalNewDisplacement',
                'Total Internal Displacement',
                (item) => getCombinedTotal(
                    item.conflictNewDisplacementRounded,
                    item.disasterNewDisplacementRounded,
                ),
                {
                    emphasize: true,
                    abbreviate,
                    columnWidth: largeNumberWidth,
                },
            ) : undefined,
            isStockShown && isConflictDataShown ? createNumberColumn<DisplacementData, string>(
                'conflictTotalDisplacement',
                'Conflict IDPs',
                (item) => item.conflictTotalDisplacementRounded,
                {
                    sortable: true,
                    variant: 'conflict',
                    abbreviate,
                    columnWidth: mediumNumberWidth,
                    headerCellRendererClassName: sortedHeaderClassName('conflictTotalDisplacement'),
                },
            ) : undefined,
            isStockShown && isDisasterDataShown ? createNumberColumn<DisplacementData, string>(
                'disasterTotalDisplacement',
                'Disaster IDPs',
                (item) => item.disasterTotalDisplacementRounded,
                {
                    sortable: true,
                    variant: 'disaster',
                    abbreviate,
                    columnWidth: mediumNumberWidth,
                    headerCellRendererClassName: sortedHeaderClassName('disasterTotalDisplacement'),
                },
            ) : undefined,
            // not sortable — see the "Total Internal Displacement" column above
            isStockShown && bothCauses ? createNumberColumn<DisplacementData, string>(
                'totalIDPs',
                'Total IDPs',
                (item) => getCombinedTotal(
                    item.conflictTotalDisplacementRounded,
                    item.disasterTotalDisplacementRounded,
                ),
                {
                    emphasize: true,
                    abbreviate,
                    columnWidth: mediumNumberWidth,
                },
            ) : undefined,
        ]).filter(isDefined),
        [
            sortedHeaderClassName,
            isConflictDataShown,
            isDisasterDataShown,
            isFlowShown,
            isStockShown,
            bothCauses,
            abbreviate,
        ],
    );

    const rows = displacementsResponse?.giddPublicCountryYearDisplacements?.results;
    // A pane that has just been shown has an in-flight query and no rows yet; the empty
    // message belongs to a finished query, not that gap.
    const isEmpty = !loading && (rows ?? []).length === 0;

    return (
        <div className={_cs(className, styles.dataTable)}>
            {active && loading && <PendingMessage noDelay />}
            {isEmpty ? (
                <Message
                    empty
                    messageIconHidden
                    emptyMessage="No data available for the selected filters."
                />
            ) : (
                <SortContext.Provider value={sortState}>
                    <Table
                        // using dynamic key to reset the column width caching
                        key={columns.map((column) => column.id).join(',')}
                        containerClassName={styles.table}
                        keySelector={displacementItemKeySelector}
                        data={rows}
                        columns={columns}
                        resizableColumn
                    />
                    <Pager
                        className={styles.pager}
                        activePage={rawPage}
                        itemsCount={
                            displacementsResponse
                                ?.giddPublicCountryYearDisplacements?.totalCount ?? 0
                        }
                        maxItemsPerPage={pageSize}
                        onActivePageChange={setPage}
                        itemsPerPageControlHidden
                    />
                </SortContext.Provider>
            )}
        </div>
    );
}

export default DataTable;
