import React, { useState, useMemo } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from '@apollo/client';

import {
    GiddCountryPfaQuery,
    GiddCountryPfaQueryVariables,
} from '#generated/types';
import Message from '#components/Message';
import TextOutput from '#components/TextOutput';
import MarkdownViewer from '#components/MarkdownViewer';
import {
    DATA_RELEASE,
} from '#utils/common';
import Container from '#components/Container';
import CollapsibleContent from '#components/CollapsibleContent';

import styles from './styles.css';

// const yearKeySelector = (item: { year: number }) => String(item.year);

const GIDD_COUNTRY_PFA = gql`
query GiddCountryPfa(
    $iso3: String!,
    $year: Int!,
    $releaseEnvironment: String!,
    $clientId: String!,
){
    giddPublicFigureAnalysisList(
        iso3: $iso3,
        year: $year,
        releaseEnvironment: $releaseEnvironment,
        clientId: $clientId,
    ) {
        results {
            id
            description
            figureCategory
            figureCategoryDisplay
            figureCause
            figureCauseDisplay
            figuresRounded
            iso3
            year
        }
    }
}
`;

interface Props {
    className?: string;
    cause: 'CONFLICT' | 'DISASTER';
    iso3: string;
    endYear: number;
    clientCode: string;
}

function FigureAnalysis(props: Props) {
    const {
        className,
        cause,
        iso3,
        endYear: year,
        clientCode,
    } = props;

    const [selectedYear] = useState(String(year));
    /*
    const timeRangeArray = useMemo(
        () => (
            Array.from(
                { length: (year - START_YEAR) + 1 },
                (_, index) => ({ year: START_YEAR + index }),
            )
        ),
        [year],
    );
    */

    const pfaVariables = useMemo((): GiddCountryPfaQueryVariables => ({
        iso3,
        year: Number(selectedYear),
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [
        selectedYear,
        iso3,
        clientCode,
    ]);

    const {
        previousData,
        data: pfaResponse = previousData,
        loading,
    } = useQuery<GiddCountryPfaQuery, GiddCountryPfaQueryVariables>(
        GIDD_COUNTRY_PFA,
        {
            variables: pfaVariables,
            context: {
                clientName: 'helix',
            },
        },
    );

    const finalResults = useMemo(
        () => (
            pfaResponse?.giddPublicFigureAnalysisList?.results?.filter(
                (item) => item.figureCause === cause,
            )
        ),
        [
            pfaResponse,
            cause,
        ],
    );

    if ((finalResults?.length ?? 0) === 0) {
        return null;
    }

    return (
        <Container
            className={_cs(className, styles.figureAnalysis)}
            headerClassName={_cs(
                styles.headerContainer,
                cause === 'CONFLICT' ? styles.conflict : styles.disaster,
            )}
            heading={(
                cause === 'CONFLICT'
                    ? 'Figure Analysis - Displacement Associated with Conflict and Violence'
                    : 'Figure Analysis - Displacement Associated with Disaster'
            )}
            headingClassName={styles.heading}
            headingSize="small"
            childrenClassName={styles.children}
        >
            {/*
            <SelectInput
                name="year"
                className={styles.selectInput}
                inputSectionClassName={styles.inputSection}
                label="Selected Year"
                keySelector={yearKeySelector}
                labelSelector={yearKeySelector}
                value={selectedYear}
                onChange={setSelectedYear}
                options={timeRangeArray}
                nonClearable
            />
            */}
            <Message
                pending={loading}
                pendingMessage="Loading"
                empty={(finalResults?.length ?? 0) === 0}
                emptyMessage="Looks like there are no public figure analysis for this country for the selected year"
            />
            {finalResults?.map((details) => (
                <CollapsibleContent
                    className={styles.details}
                    name={details.id}
                    header={`Total number of ${details.figureCategoryDisplay} as of ${selectedYear}`}
                    childrenClassName={styles.collapsibleChildren}
                    key={details.id}
                    uncontrolled
                >
                    <TextOutput
                        label="Figure"
                        displayType="block"
                        valueType="number"
                        value={details.figuresRounded}
                    />
                    <MarkdownViewer
                        markdown={details.description ?? 'N/A'}
                    />
                </CollapsibleContent>
            ))}
        </Container>
    );
}

export default FigureAnalysis;
