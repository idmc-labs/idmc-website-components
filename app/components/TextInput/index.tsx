import React from 'react';
import { _cs } from '@togglecorp/fujs';

import { genericMemo } from '../../utils/common';
import InputContainer, { Props as InputContainerProps } from '../InputContainer';
import RawInput, { Props as RawInputProps } from '../RawInput';

import styles from './styles.css';

type NameType = string | number | undefined;

type InheritedProps<T extends NameType> = (Omit<InputContainerProps, 'input'> & RawInputProps<T>);

export interface Props<T extends NameType> extends InheritedProps<T> {
    inputElementRef?: React.RefObject<HTMLInputElement>;
    inputClassName?: string;
}

function TextInput<T extends NameType>(props: Props<T>) {
    const {
        name,
        onChange,
        actions,
        className,
        disabled,
        error,
        icons,
        label,
        readOnly,
        inputElementRef,
        inputClassName,
        type = 'text',
        ...textInputProps
    } = props;

    return (
        <InputContainer
            actions={actions}
            className={className}
            // disabled={disabled}
            error={error}
            icons={icons}
            label={label}
            // readOnly={readOnly}
            input={(
                <RawInput<T>
                    {...textInputProps}
                    name={name}
                    onChange={onChange}
                    className={_cs(
                        styles.input,
                        !!error && styles.errored,
                        inputClassName,
                    )}
                    elementRef={inputElementRef}
                    readOnly={readOnly}
                    disabled={disabled}
                    type={type}
                />
            )}
        />
    );
}

export default genericMemo(TextInput);
