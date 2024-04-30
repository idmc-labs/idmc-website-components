import React from 'react';
import { IoClose } from 'react-icons/io5';
import { listToMap } from '@togglecorp/fujs';
import { Button, Chip } from '@togglecorp/toggle-ui';

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

    const handleRemoveButtonClick = React.useCallback((val) => {
        if (value) {
            const index = value.findIndex((i) => i === val);

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
                    <Chip
                        key={v}
                        actionClassName={styles.chipAction}
                        childrenClassName={styles.chipContent}
                        action={(
                            <Button
                                className={styles.chipRemoveButton}
                                title="Remove"
                                name={v ?? undefined}
                                onClick={handleRemoveButtonClick}
                                transparent
                                icons={(
                                    <IoClose />
                                )}
                                iconsClassName={styles.chipActionIcons}

                            />
                        )}
                    >
                        {optionsMap?.[v as string]}
                    </Chip>
                ))}
            </div>
        </div>
    );
}

export default DisableListOutput;
