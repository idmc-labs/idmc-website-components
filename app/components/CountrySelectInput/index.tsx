import React, { useState, useMemo } from 'react';
import {
    SearchSelectInput,
    SearchSelectInputProps,
} from '@the-deep/deep-ui';
import {
    useQuery,
    gql,
} from '@apollo/client';
import {
    CountriesQuery,
    CountriesQueryVariables,
    CountryListType,
} from '#generated/types';

import useDebouncedValue from '../../hooks/useDebouncedValue';

export type SearchCountryType = Pick<CountryListType, | 'iso3' | 'name'>;

const COUNTRIES = gql`
    query Countries($iso3: String) {
        countries(filters: {iso3: {contains: $iso3}}, pagination: {limit: 10, offset: 0}) {
            id
            iso3
            name
        }
    }
`;

type Def = { containerClassName?: string };
type CountrySelectInputProps<K extends string> = SearchSelectInputProps<
    string,
    K,
    SearchCountryType,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount' | 'onShowDropdownChange'
>;

const keySelector = (d: SearchCountryType) => d.iso3;

export function countryTitleSelector(country: SearchCountryType) {
    return country.name;
}

function CountrySelectInput<K extends string>(props: CountrySelectInputProps<K>) {
    const {
        className,
        onOptionsChange,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState<string>('');
    const debouncedSearchText = useDebouncedValue(searchText);

    const variables = useMemo(() => ({
        iso3: debouncedSearchText?.toUpperCase(),
    }), [debouncedSearchText]);

    const {
        previousData,
        data = previousData,
        loading,
    } = useQuery<CountriesQuery, CountriesQueryVariables>(
        COUNTRIES,
        {
            variables,
            onCompleted: (response) => {
                if (onOptionsChange) {
                    onOptionsChange(response.countries);
                }
            },
        },
    );

    return (
        <SearchSelectInput
            {...otherProps}
            className={className}
            keySelector={keySelector}
            labelSelector={countryTitleSelector}
            onSearchValueChange={setSearchText}
            searchOptions={data?.countries}
            optionsPending={loading}
        />
    );
}

export default CountrySelectInput;
