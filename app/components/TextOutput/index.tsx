import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Numeral, { Props as NumeralProps } from '#components/Numeral';
import DateOutput, { Props as DateOutputProps } from '#components/DateOutput';

import styles from './styles.css';

type DisplayType = 'inline' | 'block' | 'table';

interface BaseProps {
    className?: string;
    label?: React.ReactNode;
    labelContainerClassName?: string;
    description?: React.ReactNode;
    descriptionContainerClassName?: string;
    valueContainerClassName?: string;
    hideLabelColon?: boolean;
    displayType?: DisplayType;
    strongValue?: boolean;
}

const displayTypeToStyleMap: {
    [key in DisplayType]: string;
} = {
    inline: styles.inlineType,
    block: '',
    // block: styles.blockType,
    table: styles.tableType,
};

export type Props = BaseProps & ({
    valueType: 'number';
    valueProps?: Omit<NumeralProps, 'value'>;
    value?: NumeralProps['value'] | null;
} | {
    valueType: 'date';
    valueProps?: Omit<DateOutputProps, 'value'>;
    value?: DateOutputProps['value'] | null;
} | {
    valueType?: 'text' | never;
    valueProps?: never | undefined;
    value?: React.ReactNode;
});

function TextOutput(props: Props) {
    const {
        className,
        label,
        labelContainerClassName,
        valueContainerClassName,
        description,
        descriptionContainerClassName,
        hideLabelColon,
        displayType = 'inline',
        strongValue,
    } = props;

    // eslint-disable-next-line prefer-destructuring, react/destructuring-assignment
    let value: React.ReactNode = props.value;

    // eslint-disable-next-line react/destructuring-assignment
    if (props.valueType === 'number') {
        value = (
            <Numeral
                // eslint-disable-next-line react/destructuring-assignment
                value={props.value}
                // eslint-disable-next-line react/destructuring-assignment
                {...props.valueProps}
            />
        );
    // eslint-disable-next-line react/destructuring-assignment
    } else if (props.valueType === 'date') {
        // eslint-disable-next-line react/destructuring-assignment
        value = props.value ? (
            <DateOutput
                // eslint-disable-next-line react/destructuring-assignment
                value={props.value}
                // eslint-disable-next-line react/destructuring-assignment
                {...props.valueProps}
            />
        ) : null;
    }

    return (
        <div
            className={_cs(
                styles.textOutput,
                className,
                !hideLabelColon && styles.withLabelColon,
                displayTypeToStyleMap[displayType],
                strongValue && styles.strongValue,
            )}
        >
            {label && (
                <div className={_cs(styles.label, labelContainerClassName)}>
                    {label}
                </div>
            )}
            <div className={_cs(styles.value, valueContainerClassName)}>
                {value}
            </div>
            {description && (
                <div className={_cs(styles.description, descriptionContainerClassName)}>
                    {description}
                </div>
            )}
        </div>
    );
}

export default TextOutput;
