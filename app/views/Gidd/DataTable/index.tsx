import React, {
    useMemo,
    useCallback,
    useEffect,
} from 'react';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';
import {
    Table,
    Pager,
    SortContext,
    useSortState,
} from '@togglecorp/toggle-ui';
import { DATA_RELEASE } from '#utils/common';
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
import useDebouncedValue from '#hooks/useDebouncedValue';
import {
    GiddDisplacementsQuery,
    GiddDisplacementsQueryVariables,
} from '#generated/types';

import { CAUSE_BY_KEY } from '../utils';

import styles from './styles.css';

type DisplacementData = NonNullable<
    NonNullable<GiddDisplacementsQuery['giddPublicCountryYearDisplacements']>['results']
>[number];

const displacementItemKeySelector = (item: DisplacementData) => `${item.iso3}-${item.year}`;
const DISPLACEMENTS_TABLE_PAGE_SIZE = 10;
const DEFAULT_SORTING = { name: 'year', direction: 'dsc' as const };
const TOTAL_COLUMN_IDS = ['totalInternalDisplacements', 'totalIdps'];

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
                conflictNewDisplacement
                conflictNewDisplacementRounded
                conflictTotalDisplacement
                conflictTotalDisplacementRounded
                disasterNewDisplacement
                disasterNewDisplacementRounded
                disasterTotalDisplacement
                disasterTotalDisplacementRounded
                totalInternalDisplacements
                totalInternalDisplacementsRounded
                totalIdps
                totalIdpsRounded
            }
            totalCount
            page
            pageSize
        }
    }
`;

type Category = 'flow' | 'stock';
type Cause = 'conflict' | 'disaster';

interface Props {
    className?: string;
    isConflictDataShown?: boolean;
    isDisasterDataShown?: boolean;
    category: Category | undefined;
    cause: Cause | undefined;
    startYear: number;
    endYear: number;
    countriesIso3: string[] | undefined;
    hazardTypes?: string[];
    violenceSubTypes?: string[];
    activePage: number;
    onActivePageChange: (newVal: number) => void;
    clientCode: string;
    abbreviate: boolean;
    active?: boolean;
}

function DataTable(props: Props) {
    const {
        className,
        isConflictDataShown,
        isDisasterDataShown,
        category,
        cause,
        startYear,
        endYear,
        countriesIso3,
        hazardTypes,
        violenceSubTypes,
        activePage,
        onActivePageChange,
        clientCode,
        abbreviate,
        active = true,
    } = props;

    const overallDataSortState = useSortState(DEFAULT_SORTING);
    const { sorting, setSorting } = overallDataSortState;

    const sortedHeaderClassName = useCallback((columnId: string) => (
        sorting?.name === columnId ? styles.sortedHeader : undefined
    ), [sorting]);

    const giddDisplacementsVariables = useMemo(() => ({
        ordering: `${sorting?.direction === 'asc' ? '' : '-'}${sorting?.name}`,
        page: activePage,
        pageSize: DISPLACEMENTS_TABLE_PAGE_SIZE,
        countriesIso3,
        cause: cause ? CAUSE_BY_KEY[cause] : undefined,
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
        cause,
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
        loading,
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
            isFlowShown && bothCauses ? createNumberColumn<DisplacementData, string>(
                'totalInternalDisplacements',
                'Total Internal Displacement',
                (item) => item.totalInternalDisplacementsRounded,
                {
                    sortable: true,
                    emphasize: true,
                    abbreviate,
                    columnWidth: largeNumberWidth,
                    headerCellRendererClassName: sortedHeaderClassName(
                        'totalInternalDisplacements',
                    ),
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
            isStockShown && bothCauses ? createNumberColumn<DisplacementData, string>(
                'totalIdps',
                'Total IDPs',
                (item) => item.totalIdpsRounded,
                {
                    sortable: true,
                    emphasize: true,
                    abbreviate,
                    columnWidth: mediumNumberWidth,
                    headerCellRendererClassName: sortedHeaderClassName('totalIdps'),
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

    // total columns are only shown when both causes are, so ordering
    // falls back to the default if the column being sorted by gets hidden
    useEffect(() => {
        if (
            sorting
            && TOTAL_COLUMN_IDS.includes(sorting.name)
            && !columns.some((column) => column.id === sorting.name)
        ) {
            setSorting(DEFAULT_SORTING);
        }
    }, [sorting, columns, setSorting]);

    const rows = displacementsResponse?.giddPublicCountryYearDisplacements?.results;
    const isEmpty = (rows ?? []).length === 0;

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
