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
    DATA_RELEASE,
    HELIX_CLIENT_ID,
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
        $cause: String,
        $clientId: String!,
    ){
        giddDisplacements(
            ordering: $ordering,
            pageSize: $pageSize,
            countriesIso3: $countriesIso3,
            endYear: $endYear,
            startYear: $startYear,
            page: $page,
            releaseEnvironment: $releaseEnvironment,
            cause: $cause,
            clientId: $clientId,
        ){
            results {
                conflictNewDisplacementRounded
                conflictTotalDisplacementRounded
                countryName
                disasterNewDisplacementRounded
                disasterTotalDisplacementRounded
                id
                iso3
                year
            }
            totalCount
            page
            pageSize
        }
    }
`;

type Cause = 'conflict' | 'disaster';

interface Props {
    className?: string;
    isConflictDataShown?: boolean;
    isDisasterDataShown?: boolean;
    cause: Cause | undefined;
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
        cause,
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
        cause,
        clientId: HELIX_CLIENT_ID,
    }), [
        countriesIso3,
        startYear,
        endYear,
        sorting,
        activePage,
        cause,
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
                'conflictNewDisplacementRounded',
                'Conflict Internal Displacement',
                (item) => item.conflictNewDisplacementRounded,
                {
                    sortable: true,
                    variant: 'conflict',
                },
            ) : undefined,
            isConflictDataShown ? createNumberColumn<DisplacementData, string>(
                'conflictTotalDisplacementRounded',
                'Conflict IDPs',
                (item) => item.conflictTotalDisplacementRounded,
                {
                    sortable: true,
                    variant: 'conflict',
                },
            ) : undefined,
            isDisasterDataShown ? createNumberColumn<DisplacementData, string>(
                'disasterNewDisplacementRounded',
                'Disaster Internal Displacement',
                (item) => item.disasterNewDisplacementRounded,
                {
                    sortable: true,
                    variant: 'disaster',
                },
            ) : undefined,
            isDisasterDataShown ? createNumberColumn<DisplacementData, string>(
                'disasterTotalDisplacementRounded',
                'Disaster IDPs',
                (item) => item.disasterTotalDisplacementRounded,
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
