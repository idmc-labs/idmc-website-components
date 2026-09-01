import React, { useMemo, useState, useEffect } from 'react';
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
import Message from '#components/Message';
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
    abbreviate?: boolean;
}

function IduTable(props: Props) {
    const {
        className,
        idus,
        onRecordSelect,
        abbreviate = true,
    } = props;

    const [activePage, setActivePage] = useState(1);
    const sortState = useSortState();
    const { sorting } = sortState;

    // reset pagination when the filtered dataset changes
    useEffect(() => {
        setActivePage(1);
    }, [idus]);

    const columns = useMemo(() => {
        const sortedHeaderClassName = (columnId: string) => (
            sorting?.name === columnId ? styles.sortedHeader : undefined
        );

        const triggerTypeColumn: TableColumn<
            IduRow, number, HazardTypeProps, TableHeaderCellProps> & {
            valueComparator: (a: IduRow, b: IduRow) => number,
        } = {
            id: 'type',
            title: 'Trigger Type',
            headerCellRenderer: TableHeaderCell,
            headerCellRendererParams: { sortable: true },
            headerCellRendererClassName: _cs(styles.header, sortedHeaderClassName('type')),
            cellRenderer: HazardType,
            cellRendererParams: (_, datum) => ({
                value: datum.type,
                category: datum.subtype,
            }),
            columnWidth: 148,
            valueComparator: (a, b) => compareString(a.type, b.type),
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
            headerCellRendererClassName: _cs(styles.header, sortedHeaderClassName('figure')),
            cellRenderer: Numeral,
            cellRendererParams: (_, datum) => ({
                value: datum.figure,
                abbreviate,
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
            columnWidth: 148,
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
            headerCellRendererParams: { sortable: true },
            headerCellRendererClassName: _cs(styles.header, sortedHeaderClassName('event_name')),
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
                    sortable: true,
                    columnWidth: 80,
                    separator: '',
                    headerCellRendererClassName: sortedHeaderClassName('year'),
                },
            ),
            eventColumn,
            createTextColumn<IduRow, number>(
                'event_codes',
                'Event Codes',
                (item) => item.event_codes ?? '-',
                {
                    sortable: true,
                    columnWidth: 110,
                    cellRendererClassName: styles.ellipsis,
                    headerCellRendererClassName: sortedHeaderClassName('event_codes'),
                },
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
            triggerTypeColumn,
        ];
    }, [sorting, onRecordSelect, abbreviate]);

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

    const isEmpty = (idus ?? []).length === 0;

    return (
        <div className={_cs(styles.iduTable, className)}>
            {isEmpty ? (
                <Message
                    empty
                    messageIconHidden
                    emptyMessage="No data available for the selected filters."
                />
            ) : (
                <>
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
                </>
            )}
        </div>
    );
}

export default IduTable;
