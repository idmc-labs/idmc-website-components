import React from 'react';
import { IoClose } from 'react-icons/io5';
import { listToMap } from '@togglecorp/fujs';
import { Tag } from '@the-deep/deep-ui';

import Button from '#components/Button';

import styles from './styles.css';

type Key = string | number;

interface Props<V, O> {
    // className?: string;
    label?: React.ReactNode;
    keySelector: (item: O) => string | number;
    labelSelector: (item: O) => React.ReactNode;
    options?: O[] | null;
    value?: V[] | null;
    onChange: (newValue: V[]) => void;
}

function DisableListOutput<
    V extends Key | null | undefined,
    O extends Record<Key, unknown>
>(props: Props<V, O>) {
    const {
        label,
        options = [],
        keySelector,
        labelSelector,
        value,
        onChange,
    } = props;

    const optionsMap = React.useMemo(() => (
        listToMap(options, keySelector, labelSelector)
    ), [options, keySelector, labelSelector]);

    const handleRemoveButtonClick = React.useCallback((v: V) => {
        if (value) {
            const index = value.findIndex((i) => i === v);

            if (index !== -1) {
                const newValue = [...value];
                newValue.splice(index, 1);

                if (onChange) {
                    onChange(newValue);
                }
            }
        }
    }, [value, onChange]);

    return (
        <div className={styles.dismissableListOutput}>
            {label && (
                <div className={styles.label}>
                    {label}
                </div>
            )}
            <div className={styles.valueList}>
                {value?.map((v) => (
                    <Tag
                        key={v}
                        actions={(
                            <Button
                                name={v}
                                variant="action"
                                onClick={handleRemoveButtonClick}
                            >
                                <IoClose />
                            </Button>
                        )}
                    >
                        {optionsMap?.[v as string]}
                    </Tag>
                ))}
            </div>
        </div>
    );
}

export default DisableListOutput;
