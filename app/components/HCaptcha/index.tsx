import React, { useCallback } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { _cs } from '@togglecorp/fujs';

import {
    InputContainer,
    InputContainerProps,
} from '@togglecorp/toggle-ui';

import styles from './styles.css';

export type HCaptchaProps<T> = Omit<InputContainerProps, 'input'> & {
    name: T,
    siteKey: string | undefined;
    onChange: (value: string | undefined, name: T) => void;
    elementRef?: React.RefObject<HCaptcha>;
};

function HCaptchaInput<T extends string>(props: HCaptchaProps<T>) {
    const {
        actions,
        actionsContainerClassName,
        className,
        disabled,
        error,
        errorContainerClassName,
        hint,
        hintContainerClassName,
        icons,
        iconsContainerClassName,
        inputSectionClassName,
        label,
        labelContainerClassName,
        readOnly,
        uiMode,

        name,
        siteKey,
        onChange,
        elementRef,
    } = props;

    const handleVerify = useCallback(
        (token: string) => {
            onChange(token, name);
        },
        [onChange, name],
    );
    const handleError = useCallback(
        (err: string) => {
            // eslint-disable-next-line no-console
            console.error(err);
            onChange(undefined, name);
        },
        [onChange, name],
    );
    const handleExpire = useCallback(
        () => {
            onChange(undefined, name);
        },
        [onChange, name],
    );

    return (
        <InputContainer
            actions={actions}
            actionsContainerClassName={actionsContainerClassName}
            className={_cs(className, styles.hcaptcha)}
            disabled={disabled}
            error={error}
            errorContainerClassName={_cs(styles.error, errorContainerClassName)}
            hint={hint}
            hintContainerClassName={hintContainerClassName}
            icons={icons}
            iconsContainerClassName={iconsContainerClassName}
            inputSectionClassName={_cs(inputSectionClassName, styles.inputSection)}
            label={label}
            inputContainerClassName={styles.inputContainer}
            labelContainerClassName={labelContainerClassName}
            readOnly={readOnly}
            uiMode={uiMode}
            input={siteKey && (
                <HCaptcha
                    ref={elementRef}
                    // disabled={disabled || readOnly}
                    sitekey={siteKey}
                    onVerify={handleVerify}
                    onError={handleError}
                    onExpire={handleExpire}
                />
            )}
        />
    );
}

export default HCaptchaInput;
