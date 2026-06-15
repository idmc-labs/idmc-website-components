import { useMemo } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';

import { DATA_RELEASE } from '#utils/common';
import {
    GiddYearQuery,
    GiddYearQueryVariables,
} from '#generated/types';

const GIDD_YEAR = gql`
    query GiddYear(
        $releaseEnvironment: String!,
        $clientId: String!,
    ){
        giddPublicYear(
            releaseEnvironment: $releaseEnvironment,
            clientId: $clientId,
        ) {
            year
        }
    }
`;

function useYear(clientCode: string) {
    const variables = useMemo((): GiddYearQueryVariables => ({
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [clientCode]);

    const {
        previousData,
        data = previousData,
        loading,
        error,
    } = useQuery<GiddYearQuery, GiddYearQueryVariables>(
        GIDD_YEAR,
        {
            variables,
            context: {
                clientName: 'helix',
            },
        },
    );

    const giddYear = data?.giddPublicYear?.year;

    return { loading, year: giddYear, error };
}

export default useYear;
