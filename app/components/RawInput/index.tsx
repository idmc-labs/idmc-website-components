import React from 'react';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';

import useTextInputChangeDebouncing from '../../hooks/useTextInputChangeDebouncing';
import { genericMemo } from '../../utils/common';

import styles from './styles.css';

type NameType = string | number | undefined;

export interface Props<N extends NameType> extends Omit<React.HTMLProps<HTMLInputElement>, 'ref' | 'onChange' | 'value' | 'name' | 'label'> {
    className?: string;
    name: N;
    value: string | undefined | null;
    onChange?: (
        value: string | undefined,
        name: N,
        e?: React.ChangeEvent<HTMLInputElement> | undefined,
    ) => void;
    elementRef?: React.Ref<HTMLInputElement>;
    autoComplete?: string;
}

function RawInput<N extends NameType>(
    {
        className,
        onChange,
        elementRef,
        value,
        name,
        autoComplete = 'off',
        ...otherProps
    }: Props<N>,
) {
    const {
        value: immediateValue,
        onInputChange: handleInputChange,
        onInputBlur: handleInputBlur,
    } = useTextInputChangeDebouncing({
        name,
        value,
        onChange,
    });

    return (
        <input
            ref={elementRef}
            className={_cs(className, styles.rawInput)}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            value={immediateValue ?? ''}
            name={isDefined(name) ? String(name) : undefined}
            autoComplete={autoComplete}
            {...otherProps}
        />
    );
}

export default genericMemo(RawInput);
