import React, { useState } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    Button,
    Switch,
    SelectInput,
    MultiSelectInput,
} from '@togglecorp/toggle-ui';
import {
    START_YEAR,
    END_YEAR,
} from '#utils/common';
import {
    gql,
    useQuery,
} from '@apollo/client';

import SliderInput from '#components/SliderInput';
import Heading from '#components/Heading';
import Header from '#components/Header';
import NumberBlock from '#components/NumberBlock';
import useInputState from '#hooks/useInputState';
import GridFilterInputContainer from '#components/GridFilterInputContainer';
import useDebouncedValue from '#hooks/useDebouncedValue';
import {
    CountryFilterChoicesQuery,
    CountryFilterChoicesQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
const lorem2 = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const COUNTRY_FILTER_CHOICES = gql`
query CountryFilterChoices {
    goodPracticeFilterChoices {
        countries {
            id
            name
        }
    }
}
`;

function idSelector(d: { id: string }) {
    return d.id;
}

function nameSelector(d: { name: string }) {
    return d.name;
}

type Cause = 'conflict' | 'disaster';
type CauseOption = {
    key: Cause;
    label: string;
};
const causeKeySelector = (option: CauseOption) => option.key;
const causeLabelSelector = (option: CauseOption) => option.label;

const displacementCauseOptions: CauseOption[] = [
    {
        key: 'conflict',
        label: 'Conflict',
    },
    {
        key: 'disaster',
        label: 'Disaster',
    },
];

type Category = 'flow' | 'stock';
type CategoryOption = {
    key: Category;
    label: string;
};
const categoryKeySelector = (option: CategoryOption) => option.key;
const categoryLabelSelector = (option: CategoryOption) => option.label;
const displacementCategoryOptions: CategoryOption[] = [
    {
        key: 'flow',
        label: 'Internal Displacement',
    },
    {
        key: 'stock',
        label: 'Total Number of IDPs',
    },
];

type GoodPracticeFilter = NonNullable<CountryFilterChoicesQuery>['goodPracticeFilterChoices'];
type CountryType = NonNullable<GoodPracticeFilter['countries']>[number]['name'];

function Gidd() {
    const [disasterTimeRangeActual, setDisasterTimeRange] = useState([START_YEAR, END_YEAR]);
    const [displacementCause, setDisplacementCause] = useState<Cause | undefined>();
    const [displacementCategory, setDisplacementCategory] = useState<Category | undefined>();
    const disasterTimeRange = useDebouncedValue(disasterTimeRangeActual);
    const [disasterFiltersShown, setDisasterFilterVisibility] = useState(false);
    const [
        countries,
        setCountries,
    ] = useInputState<CountryType[]>([]);

    const { data: countryFilterResponse } = useQuery<
        CountryFilterChoicesQuery,
        CountryFilterChoicesQueryVariables
    >(
        COUNTRY_FILTER_CHOICES,
    );

    const countriesOptions = countryFilterResponse?.goodPracticeFilterChoices?.countries;

    console.warn('here', disasterTimeRange);

    return (
        <div className={styles.bodyContainer}>
            <div className={styles.gidd}>
                <div className={styles.filterContainer}>
                    <Heading darkMode>
                        IDMC Query Tool
                    </Heading>
                    <div className={styles.filterBodyContainer}>
                        <div className={_cs(styles.left, styles.filterSection)}>
                            <p className={styles.headingDescription}>{lorem}</p>
                            <div className={styles.downloadSection}>
                                <p className={styles.downloadDescription}>{lorem2}</p>
                                <Button
                                    name={undefined}
                                    variant="primary"
                                >
                                    Download Dataset
                                </Button>
                            </div>
                        </div>
                        <div className={styles.right}>
                            <div className={styles.top}>
                                <div className={_cs(styles.filterSection)}>
                                    <GridFilterInputContainer
                                        label="Internal Displacement or Total Number of IDPs"
                                        helpText="Select internal displacement or total number of IDPs"
                                        input={(
                                            <SelectInput
                                                className={styles.selectInput}
                                                inputSectionClassName={styles.inputSection}
                                                keySelector={categoryKeySelector}
                                                labelSelector={categoryLabelSelector}
                                                value={displacementCategory}
                                                onChange={setDisplacementCategory}
                                                options={displacementCategoryOptions}
                                            />
                                        )}
                                    />
                                    <GridFilterInputContainer
                                        label="Regions, Countries, and/or Territories"
                                        labelDescription="*In compared view, up to 3 countries, regions, or territories can be selected"
                                        input={(
                                            <MultiSelectInput
                                                name="country"
                                                className={styles.selectInput}
                                                value={countries}
                                                options={countriesOptions}
                                                keySelector={idSelector}
                                                labelSelector={nameSelector}
                                                onChange={setCountries}
                                                inputSectionClassName={styles.inputSection}
                                            />
                                        )}
                                    />
                                </div>
                                <div className={_cs(styles.filterSection)}>
                                    <GridFilterInputContainer
                                        label="Conflict and Violence or Disaster"
                                        helpText="Select Conflict and Violence or Disaster"
                                        input={(
                                            <SelectInput
                                                className={styles.selectInput}
                                                inputSectionClassName={styles.inputSection}
                                                keySelector={causeKeySelector}
                                                labelSelector={causeLabelSelector}
                                                value={displacementCause}
                                                onChange={setDisplacementCause}
                                                options={displacementCauseOptions}
                                            />
                                        )}
                                    />
                                    <GridFilterInputContainer
                                        label="Timescale"
                                        labelDescription={`${disasterTimeRangeActual[0]} - ${disasterTimeRangeActual[1]}`}
                                        helpText="Select Timescale"
                                        input={(
                                            <SliderInput
                                                className={_cs(styles.sliderInput, styles.input)}
                                                hideValues
                                                min={START_YEAR}
                                                max={END_YEAR}
                                                step={1}
                                                minDistance={0}
                                                value={disasterTimeRangeActual}
                                                onChange={setDisasterTimeRange}
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                            <div className={styles.border} />
                            <Switch
                                className={styles.switch}
                                labelClassName={styles.switchLabel}
                                name="additionalFilters"
                                value={displacementCause === 'disaster' && disasterFiltersShown}
                                onChange={setDisasterFilterVisibility}
                                label="Additional Disaster Filters"
                                disabled={displacementCause !== 'disaster'}
                            />
                            {disasterFiltersShown && displacementCause === 'disaster' && (
                                <div className={styles.disasterFilters}>
                                    <GridFilterInputContainer
                                        label="Disaster Hazard Type"
                                        input={(
                                            <MultiSelectInput
                                                name="disasterHazard"
                                                className={styles.selectInput}
                                                value={countries}
                                                options={countriesOptions}
                                                keySelector={idSelector}
                                                labelSelector={nameSelector}
                                                onChange={setCountries}
                                                inputSectionClassName={styles.inputSection}
                                            />
                                        )}
                                    />
                                    <GridFilterInputContainer
                                        label="Disaster Event Name"
                                        input={(
                                            <MultiSelectInput
                                                name="eventName"
                                                className={styles.selectInput}
                                                value={countries}
                                                options={countriesOptions}
                                                keySelector={idSelector}
                                                labelSelector={nameSelector}
                                                onChange={setCountries}
                                                inputSectionClassName={styles.inputSection}
                                            />
                                        )}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className={styles.statsContainer}>
                    {displacementCategory !== 'flow' && (
                        <div className={styles.statBox}>
                            <Header
                                heading="Internal Displacement Data"
                                headingDescription={lorem}
                            />
                            <div className={styles.border} />
                            {!displacementCause && (
                                <NumberBlock
                                    label="Total"
                                    size="large"
                                    subLabel="In XX countries and territories"
                                    value={400000000}
                                />
                            )}
                            <div className={styles.causesBlock}>
                                {displacementCause !== 'disaster' && (
                                    <NumberBlock
                                        label="Total by Conflict and Violence"
                                        size={displacementCause ? 'large' : 'medium'}
                                        variant="conflict"
                                        subLabel="In XX countries and territories"
                                        value={30000000}
                                    />
                                )}
                                {displacementCause !== 'conflict' && (
                                    <NumberBlock
                                        label="Total by Disasters"
                                        size={displacementCause ? 'large' : 'medium'}
                                        variant="disaster"
                                        subLabel="In XX countries and territories"
                                        value={2000000}
                                    />
                                )}
                            </div>
                            <div className={styles.border} />
                        </div>
                    )}
                    {displacementCategory !== 'stock' && (
                        <div className={styles.statBox}>
                            <Header
                                heading="Total Number of IDPs Data"
                                headingDescription={lorem}
                            />
                            <div className={styles.border} />
                            {!displacementCause && (
                                <NumberBlock
                                    label="Total"
                                    size="large"
                                    subLabel="In XX countries and territories"
                                    value={400000000}
                                />
                            )}
                            <div className={styles.causesBlock}>
                                {displacementCause !== 'disaster' && (
                                    <NumberBlock
                                        label="Total by Conflict and Violence"
                                        variant="conflict"
                                        size={displacementCause ? 'large' : 'medium'}
                                        subLabel="In XX countries and territories"
                                        value={30000000}
                                    />
                                )}
                                {displacementCause !== 'conflict' && (
                                    <NumberBlock
                                        label="Total by Disasters"
                                        size={displacementCause ? 'large' : 'medium'}
                                        variant="disaster"
                                        subLabel="In XX countries and territories"
                                        value={2000000}
                                    />
                                )}
                            </div>
                            <div className={styles.border} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
export default Gidd;
