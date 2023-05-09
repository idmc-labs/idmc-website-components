import React, { useMemo } from 'react';
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
import {
    roundAndRemoveZero,
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

type DisplacementData = NonNullable<NonNullable<GiddDisplacementsQuery['giddDisplacements']>['results']>[number];
const displacementItemKeySelector = (item: { id: string }) => item.id;
const DISPLACEMENTS_TABLE_PAGE_SIZE = 10;

const GIDD_DISPLACEMENTS = gql`
    query GiddDisplacements(
        $page: Int,
        $ordering: String,
        $pageSize: Int,
        $endYear: Float,
        $startYear: Float,
        $countriesIso3: [String!],
        $releaseEnvironment: String!,
    ){
        giddDisplacements(
            ordering: $ordering,
            pageSize: $pageSize,
            countriesIso3: $countriesIso3,
            endYear: $endYear,
            startYear: $startYear,
            page: $page,
            releaseEnvironment: $releaseEnvironment,
        ){
            results {
                conflictNewDisplacement
                conflictTotalDisplacement
                countryName
                disasterNewDisplacement
                disasterTotalDisplacement
                id
                iso3
                totalInternalDisplacement
                totalNewDisplacement
                year
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
    startYear: number;
    endYear: number;
    countriesIso3: string[] | undefined;
    activePage: number;
    onActivePageChange: (newVal: number) => void;
}

function DataTable(props: Props) {
    const {
        className,
        isConflictDataShown,
        isDisasterDataShown,
        startYear,
        endYear,
        countriesIso3,
        activePage,
        onActivePageChange,
    } = props;

    const overallDataSortState = useSortState({ name: 'year', direction: 'dsc' });
    const { sorting } = overallDataSortState;

    const giddDisplacementsVariables = useMemo(() => ({
        ordering: `${sorting?.direction === 'asc' ? '' : '-'}${sorting?.name}`,
        page: activePage,
        countriesIso3,
        startYear,
        endYear,
        pageSize: DISPLACEMENTS_TABLE_PAGE_SIZE,
        releaseEnvironment: DATA_RELEASE,
    }), [
        countriesIso3,
        startYear,
        endYear,
        sorting,
        activePage,
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

    const columns = useMemo(
        () => ([
            createTextColumn<DisplacementData, string>(
                'countryName',
                'Country / Territory',
                (item) => item.countryName,
                { sortable: true },
            ),
            createNumberColumn<DisplacementData, string>(
                'year',
                'Year',
                (item) => item.year,
                {
                    sortable: true,
                    separator: '',
                    columnWidth: 64,
                },
            ),
            isConflictDataShown ? createNumberColumn<DisplacementData, string>(
                'conflictNewDisplacement',
                'Conflict Internal Displacement',
                (item) => roundAndRemoveZero(item.conflictNewDisplacement ?? undefined),
                {
                    sortable: true,
                    variant: 'conflict',
                },
            ) : undefined,
            isConflictDataShown ? createNumberColumn<DisplacementData, string>(
                'conflictTotalDisplacement',
                'Conflict IDPs',
                (item) => roundAndRemoveZero(item.conflictTotalDisplacement ?? undefined),
                {
                    sortable: true,
                    variant: 'conflict',
                },
            ) : undefined,
            isDisasterDataShown ? createNumberColumn<DisplacementData, string>(
                'disasterNewDisplacement',
                'Disaster Internal Displacement',
                (item) => roundAndRemoveZero(item.disasterNewDisplacement ?? undefined),
                {
                    sortable: true,
                    variant: 'disaster',
                },
            ) : undefined,
            isDisasterDataShown ? createNumberColumn<DisplacementData, string>(
                'disasterTotalDisplacement',
                'Disaster IDPs',
                (item) => roundAndRemoveZero(item.disasterTotalDisplacement ?? undefined),
                {
                    sortable: true,
                    variant: 'disaster',
                },
            ) : undefined,
        ]).filter(isDefined),
        [
            isConflictDataShown,
            isDisasterDataShown,
        ],
    );

    return (
        <div className={_cs(className, styles.dataTable)}>
            <SortContext.Provider value={overallDataSortState}>
                <Pager
                    className={styles.pager}
                    activePage={activePage}
                    itemsCount={displacementsResponse?.giddDisplacements?.totalCount ?? 0}
                    maxItemsPerPage={DISPLACEMENTS_TABLE_PAGE_SIZE}
                    onActivePageChange={onActivePageChange}
                    itemsPerPageControlHidden
                />
                <Table
                    containerClassName={styles.table}
                    keySelector={displacementItemKeySelector}
                    data={displacementsResponse?.giddDisplacements?.results}
                    columns={columns}
                />
            </SortContext.Provider>
        </div>
    );
}

export default DataTable;
