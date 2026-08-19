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
import useDebouncedValue from '#hooks/useDebouncedValue';
import {
    GiddDisplacementsQuery,
    GiddDisplacementsQueryVariables,
} from '#generated/types';

import styles from './styles.css';

type DisplacementData = NonNullable<
    GiddDisplacementsQuery['giddPublicCountryYearDisplacements']
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
const largeNumberWidth = 200;

const mediumTextWidth = 220;

const GIDD_DISPLACEMENTS = gql`
    query GiddDisplacements(
        $endYear: Float,
        $startYear: Float,
        $countriesIso3: [String!],
        $releaseEnvironment: String!,
        $clientId: String!,
    ){
        giddPublicCountryYearDisplacements(
            countriesIso3: $countriesIso3,
            endYear: $endYear,
            startYear: $startYear,
            releaseEnvironment: $releaseEnvironment,
            clientId: $clientId,
        ){
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
        countriesIso3,
        startYear,
        endYear,
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [
        countriesIso3,
        startYear,
        endYear,
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
                'conflictNewDisplacementRounded',
                'Conflict Internal Displacement',
                (item) => item.conflictNewDisplacement,
                {
                    sortable: true,
                    variant: 'conflict',
                    abbreviate,
                    columnWidth: largeNumberWidth,
                    headerCellRendererClassName: sortedHeaderClassName('conflictNewDisplacementRounded'),
                },
            ) : undefined,
            isFlowShown && isDisasterDataShown ? createNumberColumn<DisplacementData, string>(
                'disasterNewDisplacementRounded',
                'Disaster Internal Displacement',
                (item) => item.disasterNewDisplacement,
                {
                    sortable: true,
                    variant: 'disaster',
                    abbreviate,
                    columnWidth: largeNumberWidth,
                    headerCellRendererClassName: sortedHeaderClassName('disasterNewDisplacementRounded'),
                },
            ) : undefined,
            isFlowShown && bothCauses ? createNumberColumn<DisplacementData, string>(
                'totalNewDisplacement',
                'Total Internal Displacement',
                (item) => getCombinedTotal(
                    item.conflictNewDisplacement,
                    item.disasterNewDisplacement,
                ),
                {
                    sortable: true,
                    emphasize: true,
                    abbreviate,
                    columnWidth: largeNumberWidth,
                    headerCellRendererClassName: sortedHeaderClassName('totalNewDisplacement'),
                },
            ) : undefined,
            isStockShown && isConflictDataShown ? createNumberColumn<DisplacementData, string>(
                'conflictTotalDisplacementRounded',
                'Conflict IDPs',
                (item) => item.conflictTotalDisplacementRounded,
                {
                    sortable: true,
                    variant: 'conflict',
                    abbreviate,
                    columnWidth: largeNumberWidth,
                    headerCellRendererClassName: sortedHeaderClassName('conflictTotalDisplacementRounded'),
                },
            ) : undefined,
            isStockShown && isDisasterDataShown ? createNumberColumn<DisplacementData, string>(
                'disasterTotalDisplacementRounded',
                'Disaster IDPs',
                (item) => item.disasterTotalDisplacement,
                {
                    sortable: true,
                    variant: 'disaster',
                    abbreviate,
                    columnWidth: largeNumberWidth,
                    headerCellRendererClassName: sortedHeaderClassName('disasterTotalDisplacementRounded'),
                },
            ) : undefined,
            isStockShown && bothCauses ? createNumberColumn<DisplacementData, string>(
                'totalIDPs',
                'Total IDPs',
                (item) => getCombinedTotal(
                    item.conflictTotalDisplacement,
                    item.disasterTotalDisplacement,
                ),
                {
                    sortable: true,
                    emphasize: true,
                    abbreviate,
                    columnWidth: largeNumberWidth,
                    headerCellRendererClassName: sortedHeaderClassName('totalIDPs'),
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

    const allRows = displacementsResponse?.giddPublicCountryYearDisplacements;

    const sortedRows = useMemo(() => {
        const data = allRows ?? [];
        if (!sorting) {
            return data;
        }
        const column = columns.find((col) => col.id === sorting.name);
        if (!column?.valueComparator) {
            return data;
        }
        const sorted = [...data].sort(column.valueComparator);
        return sorting.direction === 'dsc' ? sorted.reverse() : sorted;
    }, [allRows, sorting, columns]);

    const paginatedRows = useMemo(() => {
        const start = (activePage - 1) * DISPLACEMENTS_TABLE_PAGE_SIZE;
        return sortedRows.slice(start, start + DISPLACEMENTS_TABLE_PAGE_SIZE);
    }, [sortedRows, activePage]);

    return (
        <div className={_cs(className, styles.dataTable)}>
            <SortContext.Provider value={overallDataSortState}>
                <Table
                    // using dynamic key to reset the column width caching
                    key={columns.map((column) => column.id).join(',')}
                    containerClassName={styles.table}
                    keySelector={displacementItemKeySelector}
                    data={paginatedRows}
                    columns={columns}
                    resizableColumn
                />
                <Pager
                    className={styles.pager}
                    activePage={activePage}
                    itemsCount={sortedRows.length}
                    maxItemsPerPage={DISPLACEMENTS_TABLE_PAGE_SIZE}
                    onActivePageChange={onActivePageChange}
                    itemsPerPageControlHidden
                />
            </SortContext.Provider>
        </div>
    );
}

export default DataTable;
