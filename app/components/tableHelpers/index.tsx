import {
    _cs,
    compareString,
    compareNumber,
} from '@togglecorp/fujs';
import {
    Numeral,
    NumeralProps,
    TableHeaderCell,
    TableHeaderCellProps,
    TableColumn,
    TableSortDirection,
    TableFilterType,
} from '@togglecorp/toggle-ui';

import ExternalLink, { ExternalLinkProps } from './ExternalLink';
import Text, { TextProps } from './Text';

import styles from './styles.css';

export function createExternalLinkColumn<D, K>(
    id: string,
    title: string,
    accessor: (item: D) => {
        title: string | undefined | null,
        link: string | undefined | null,
    } | undefined | null,
    options?: {
        sortable?: boolean,
        defaultSortDirection?: TableSortDirection,
        filterType?: TableFilterType,
        orderable?: boolean;
        hideable?: boolean;
        columnClassName?: string;
        columnStretch?: boolean;
    },
) {
    const item: TableColumn<D, K, ExternalLinkProps, TableHeaderCellProps> & {
        valueSelector: (item: D) => string | undefined | null,
        valueComparator: (foo: D, bar: D) => number,
    } = {
        id,
        title,
        headerCellRenderer: TableHeaderCell,
        columnClassName: options?.columnClassName,
        columnStretch: options?.columnStretch,
        headerCellRendererParams: {
            sortable: options?.sortable,
            filterType: options?.filterType,
            orderable: options?.orderable,
            hideable: options?.hideable,
        },
        cellRenderer: ExternalLink,
        cellRendererParams: (_: K, datum: D): ExternalLinkProps => {
            const value = accessor(datum);
            return {
                title: value?.title,
                link: value?.link,
            };
        },
        valueSelector: (it) => accessor(it)?.title,
        valueComparator: (foo: D, bar: D) => compareString(
            accessor(foo)?.title,
            accessor(bar)?.title,
        ),
    };
    return item;
}

export function createTextColumn<D, K>(
    id: string,
    title: string,
    accessor: (item: D) => string | undefined | null,
    options?: {
        sortable?: boolean,
        defaultSortDirection?: TableSortDirection,
        filterType?: TableFilterType,
        orderable?: boolean;
        hideable?: boolean;
        columnClassName?: string;
        columnWidth?: number;
        cellRendererClassName?: string;
        columnStretch?: boolean;
        headerCellRendererClassName?: string;
    },
) {
    const item: TableColumn<D, K, TextProps, TableHeaderCellProps> & {
        valueSelector: (item: D) => string | undefined | null,
        valueComparator: (foo: D, bar: D) => number,
    } = {
        id,
        title,
        headerCellRenderer: TableHeaderCell,
        columnClassName: options?.columnClassName,
        columnStretch: options?.columnStretch,
        headerCellRendererParams: {
            sortable: options?.sortable,
            filterType: options?.filterType,
            orderable: options?.orderable,
            hideable: options?.hideable,
        },
        cellRenderer: Text,
        columnWidth: options?.columnWidth,
        headerCellRendererClassName: _cs(styles.header, options?.headerCellRendererClassName),
        cellRendererParams: (_: K, datum: D): TextProps => ({
            value: accessor(datum),
        }),
        valueSelector: accessor,
        valueComparator: (foo: D, bar: D) => compareString(accessor(foo), accessor(bar)),
        cellRendererClassName: options?.cellRendererClassName,
    };
    return item;
}

export function createNumberColumn<D, K>(
    id: string,
    title: string,
    accessor: (item: D) => number | undefined | null,
    options?: {
        sortable?: boolean,
        defaultSortDirection?: TableSortDirection,
        filterType?: TableFilterType,
        orderable?: boolean;
        hideable?: boolean;
        variant?: 'conflict' | 'disaster';
        // bold without a cause colour, for neutral columns like combined totals
        emphasize?: boolean;
        abbreviate?: boolean;
        separator?: string;
        placeholder?: string;
        columnClassName?: string;
        columnWidth?: number;
        headerCellRendererClassName?: string;
    },
) {
    const valueClassName = _cs(
        (options?.variant || options?.emphasize) && styles.figure,
        options?.variant && styles[options.variant],
    );
    const item: TableColumn<D, K, NumeralProps, TableHeaderCellProps> & {
        valueSelector: (item: D) => number | undefined | null,
        valueComparator: (foo: D, bar: D) => number,
    } = {
        id,
        title,
        headerCellRenderer: TableHeaderCell,
        columnClassName: options?.columnClassName,
        headerCellRendererParams: {
            sortable: options?.sortable,
            filterType: options?.filterType,
            orderable: options?.orderable,
            hideable: options?.hideable,
        },
        cellRenderer: Numeral,
        columnWidth: options?.columnWidth ?? 160,
        headerCellRendererClassName: _cs(
            styles.header,
            styles.numberHeader,
            options?.variant && styles[options.variant],
            options?.headerCellRendererClassName,
        ),
        cellRendererClassName: styles.number,
        cellRendererParams: (_: K, datum: D): NumeralProps => ({
            value: accessor(datum),
            placeholder: options?.placeholder ?? '',
            separator: options?.separator ?? ',',
            abbreviate: options?.abbreviate,
            valueClassName,
            abbrClassName: valueClassName,
        }),
        valueSelector: accessor,
        valueComparator: (foo: D, bar: D) => compareNumber(accessor(foo), accessor(bar)),
    };
    return item;
}
