import React, { useMemo, useState } from 'react';
import {
    _cs,
    compareString,
    compareNumber,
} from '@togglecorp/fujs';
import {
    Table,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    Pager,
    SortContext,
    useSortState,
} from '@togglecorp/toggle-ui';

import {
    createTextColumn,
    createNumberColumn,
} from '#components/tableHelpers';
import Numeral from '#components/Numeral';
import RawButton from '#components/RawButton';
import { IduDataQuery } from '#generated/types';

import HazardType, { Props as HazardTypeProps } from './HazardType';

import styles from './styles.css';

type IduRow = NonNullable<IduDataQuery['idu']>[number];
type NumeralProps = React.ComponentProps<typeof Numeral>;

const keySelector = (item: IduRow) => item.id;

const PAGE_SIZE = 10;

interface EventNameCellProps {
    className?: string;
    // NOTE: the Table injects its own `name` (the column id), so the event name
    // value is passed under a different prop
    eventTitle: string | undefined | null;
    recordId: number;
    // when set, the event name becomes a button that opens the record on the map
    onSelect?: (recordId: number) => void;
}

function EventNameCell(props: EventNameCellProps) {
    const {
        className,
        eventTitle,
        recordId,
        onSelect,
    } = props;

    if (!onSelect) {
        return <span className={className}>{eventTitle}</span>;
    }

    return (
        <RawButton
            name={recordId}
            className={_cs(className, styles.eventNameButton)}
            onClick={onSelect}
            title={eventTitle ?? undefined}
        >
            {eventTitle}
        </RawButton>
    );
}

interface Props {
    className?: string;
    idus: IduRow[] | undefined;
    onRecordSelect?: (recordId: number) => void;
}

function IduTable(props: Props) {
    const {
        className,
        idus,
        onRecordSelect,
    } = props;

    const [activePage, setActivePage] = useState(1);
    const sortState = useSortState();
    const { sorting } = sortState;

    const columns = useMemo(() => {
        const sortedHeaderClassName = (columnId: string) => (
            sorting?.name === columnId ? styles.sortedHeader : undefined
        );

        const hazardColumn: TableColumn<IduRow, number, HazardTypeProps, TableHeaderCellProps> & {
            valueComparator: (a: IduRow, b: IduRow) => number,
        } = {
            id: 'category',
            title: 'Hazard type',
            headerCellRenderer: TableHeaderCell,
            headerCellRendererParams: { sortable: false },
            cellRenderer: HazardType,
            cellRendererParams: (_, datum) => ({
                value: datum.type,
                category: datum.category,
            }),
            columnWidth: 116,
            valueComparator: (a, b) => compareString(a.subtype, b.subtype),
        };

        const displacementsColumn: TableColumn<
            IduRow,
            number,
            NumeralProps,
            TableHeaderCellProps> & {
            valueComparator: (a: IduRow, b: IduRow) => number,
        } = {
            id: 'figure',
            title: 'Displacements',
            headerCellRenderer: TableHeaderCell,
            headerCellRendererParams: { sortable: true },
            headerCellRendererClassName: sortedHeaderClassName('figure'),
            cellRenderer: Numeral,
            cellRendererParams: (_, datum) => ({
                value: datum.figure,
                abbreviate: true,
                valueClassName: _cs(
                    styles.figure,
                    datum.displacement_type === 'Conflict' && styles.conflict,
                    datum.displacement_type === 'Disaster' && styles.disaster,
                ),
                abbrClassName: _cs(
                    styles.figure,
                    datum.displacement_type === 'Conflict' && styles.conflict,
                    datum.displacement_type === 'Disaster' && styles.disaster,
                ),
            }),
            columnWidth: 116,
            valueComparator: (a, b) => compareNumber(a.figure, b.figure),
        };

        const eventColumn: TableColumn<
            IduRow,
            number,
            EventNameCellProps,
            TableHeaderCellProps> & {
            valueComparator: (a: IduRow, b: IduRow) => number,
        } = {
            id: 'event_name',
            title: 'Event',
            headerCellRenderer: TableHeaderCell,
            headerCellRendererParams: { sortable: false },
            cellRenderer: EventNameCell,
            cellRendererParams: (_, datum) => ({
                eventTitle: datum.event_name,
                recordId: datum.id,
                onSelect: onRecordSelect,
            }),
            columnWidth: 120,
            columnStretch: true,
            cellRendererClassName: styles.ellipsis,
            valueComparator: (a, b) => compareString(a.event_name, b.event_name),
        };

        return [
            createNumberColumn<IduRow, number>(
                'year',
                'Year',
                (item) => item.year,
                {
                    columnWidth: 48,
                    separator: '',
                },
            ),
            eventColumn,
            createTextColumn<IduRow, number>(
                'event_codes',
                'Event Codes',
                (item) => item.event_codes,
                { columnWidth: 112, cellRendererClassName: styles.ellipsis },
            ),
            createTextColumn<IduRow, number>(
                'displacement_start_date',
                'Start date',
                (item) => item.displacement_start_date,
                {
                    sortable: true,
                    columnWidth: 104,
                    headerCellRendererClassName: sortedHeaderClassName('displacement_start_date'),
                },
            ),
            displacementsColumn,
            hazardColumn,
        ];
    }, [sorting, onRecordSelect]);

    const sortedData = useMemo(() => {
        const data = idus ?? [];
        if (!sorting) {
            return data;
        }
        const column = columns.find((col) => col.id === sorting.name);
        if (!column?.valueComparator) {
            return data;
        }
        const sorted = [...data].sort(column.valueComparator);
        return sorting.direction === 'dsc' ? sorted.reverse() : sorted;
    }, [idus, sorting, columns]);

    const paginatedData = useMemo(() => {
        const start = (activePage - 1) * PAGE_SIZE;
        return sortedData.slice(start, start + PAGE_SIZE);
    }, [sortedData, activePage]);

    return (
        <div className={_cs(styles.iduTable, className)}>
            <SortContext.Provider value={sortState}>
                <Table
                    containerClassName={styles.table}
                    keySelector={keySelector}
                    data={paginatedData}
                    columns={columns}
                />
            </SortContext.Provider>
            <Pager
                className={styles.pager}
                activePage={activePage}
                itemsCount={sortedData.length}
                maxItemsPerPage={PAGE_SIZE}
                onActivePageChange={setActivePage}
                itemsPerPageControlHidden
            />
        </div>
    );
}

export default IduTable;
