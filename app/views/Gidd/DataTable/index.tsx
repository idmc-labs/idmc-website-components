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
    useSortState,
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
import useDebouncedValue from '#hooks/useDebouncedValue';
import {
    GiddDisplacementsQuery,
    GiddDisplacementsQueryVariables,
} from '#generated/types';

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
        $endYear: Float,
        $startYear: Float,
        $countriesIso3: [String!],
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
                conflictNewDisplacement
                conflictTotalDisplacement
                disasterNewDisplacement
                disasterTotalDisplacement
            }
            totalCount
            page
            pageSize
        }
    }
`;

type Category = 'flow' | 'stock';

interface Props {
    className?: string;
    isConflictDataShown?: boolean;
    isDisasterDataShown?: boolean;
    category: Category | undefined;
    startYear: number;
    endYear: number;
    countriesIso3: string[] | undefined;
    hazardTypes?: string[];
    violenceSubTypes?: string[];
    activePage: number;
    onActivePageChange: (newVal: number) => void;
    clientCode: string;
    abbreviate: boolean;
}

function DataTable(props: Props) {
    const {
        className,
        isConflictDataShown,
        isDisasterDataShown,
        category,
        startYear,
        endYear,
        countriesIso3,
        hazardTypes,
        violenceSubTypes,
        activePage,
        onActivePageChange,
        clientCode,
        abbreviate,
    } = props;

    const overallDataSortState = useSortState({ name: 'year', direction: 'dsc' });
    const { sorting } = overallDataSortState;

    const sortedHeaderClassName = useCallback((columnId: string) => (
        sorting?.name === columnId ? styles.sortedHeader : undefined
    ), [sorting]);

    const giddDisplacementsVariables = useMemo(() => ({
        ordering: `${sorting?.direction === 'asc' ? '' : '-'}${sorting?.name}`,
        page: activePage,
        pageSize: DISPLACEMENTS_TABLE_PAGE_SIZE,
        countriesIso3,
        startYear,
        endYear,
        hazardTypes,
        violenceSubTypes,
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [
        sorting,
        activePage,
        countriesIso3,
        startYear,
        endYear,
        hazardTypes,
        violenceSubTypes,
        clientCode,
    ]);

    const debouncedVariables = useDebouncedValue(giddDisplacementsVariables);

    const {
        previousData: previousDisplacementsResponse,
        data: displacementsResponse = previousDisplacementsResponse,
    } = useQuery<
        GiddDisplacementsQuery,
        GiddDisplacementsQueryVariables
    >(
        GIDD_DISPLACEMENTS,
        {
            variables: debouncedVariables,
            context: {
                clientName: 'helix',
            },
        },
    );

    const isFlowShown = category !== 'stock';
    const isStockShown = category !== 'flow';
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
                (item) => item.conflictNewDisplacement,
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
                (item) => item.disasterNewDisplacement,
                {
                    sortable: true,
                    variant: 'disaster',
                    abbreviate,
                    columnWidth: largeNumberWidth,
                    headerCellRendererClassName: sortedHeaderClassName('disasterNewDisplacement'),
                },
            ) : undefined,
            // not sortable: this is a client-side sum of two fields with no
            // single backing field the server can order by, and the table
            // is now server-paginated — sorting it would only reorder
            // whatever happens to be on the current page
            isFlowShown && bothCauses ? createNumberColumn<DisplacementData, string>(
                'totalNewDisplacement',
                'Total Internal Displacement',
                (item) => getCombinedTotal(
                    item.conflictNewDisplacement,
                    item.disasterNewDisplacement,
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
                (item) => item.conflictTotalDisplacement,
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
                (item) => item.disasterTotalDisplacement,
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
                    item.conflictTotalDisplacement,
                    item.disasterTotalDisplacement,
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
    const isEmpty = (rows ?? []).length === 0;

    return (
        <div className={_cs(className, styles.dataTable)}>
            {isEmpty ? (
                <Message
                    empty
                    messageIconHidden
                    emptyMessage="No data available for the selected filters."
                />
            ) : (
                <SortContext.Provider value={overallDataSortState}>
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
                        activePage={activePage}
                        itemsCount={
                            displacementsResponse
                                ?.giddPublicCountryYearDisplacements?.totalCount ?? 0
                        }
                        maxItemsPerPage={DISPLACEMENTS_TABLE_PAGE_SIZE}
                        onActivePageChange={onActivePageChange}
                        itemsPerPageControlHidden
                    />
                </SortContext.Provider>
            )}
        </div>
    );
}

export default DataTable;
