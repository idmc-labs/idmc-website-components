import React from 'react';
import { IoClose } from 'react-icons/io5';
import Button from '#components/Button';
import { GoodPracticeFilterChoicesQueryVariables } from '#generated/types';
import styles from './styles.css';

interface Props {
    className?: string;
    keySelector?: string;
    labelSelector?: string;
    options?: [];
    value?: string[];
    onFiltersChange: (filters: Omit<GoodPracticeFilterChoicesQueryVariables, 'goodPracticeFilterChoices'> | undefined) => void;
}

const CountryOptions = [{}];

function DisableListOutput(props: Props) {
    const {
        className,
        options,
        keySelector,
        labelSelector,
        onFiltersChange,
        value,
    } = props;

    const handleClearFilters = React.useCallback(() => {
        onFiltersChange({});
    }, [onFiltersChange]);

    return (
        <div className={styles.footer}>
            <Button
                value={options}
                name={undefined}
                variant="action"
                actions={<IoClose />}
                onClick={handleClearFilters}
                className={styles.clearFilterButton}
            >
                clear
            </Button>
        </div>
    );
}

export default DisableListOutput;
