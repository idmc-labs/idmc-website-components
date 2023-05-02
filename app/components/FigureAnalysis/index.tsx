import React, { useState, useMemo } from 'react';
import { _cs, randomString } from '@togglecorp/fujs';
import { SelectInput } from '@togglecorp/toggle-ui';
import {
    gql,
    useQuery,
} from '@apollo/client';

import {
    GiddCountryPfaQuery,
    GiddCountryPfaQueryVariables,
} from '#generated/types';
import Heading from '#components/Heading';
import Message from '#components/Message';
import TextOutput from '#components/TextOutput';
import MarkdownViewer from '#components/MarkdownViewer';
import {
    START_YEAR,
    END_YEAR,
    DATA_RELEASE,
} from '#utils/common';
import CollapsibleContent from '#components/CollapsibleContent';

import styles from './styles.css';

const timeRangeArray = (
    Array.from(
        { length: (END_YEAR - START_YEAR) + 1 },
        (_, index) => ({ year: START_YEAR + index }),
    )
);

const yearKeySelector = (item: { year: number }) => String(item.year);

const GIDD_COUNTRY_PFA = gql`
query GiddCountryPfa(
    $iso3: String!,
    $year: Int!,
    $releaseEnvironment: String!,
){
    giddPublicFigureAnalysisList(
        iso3: $iso3,
        year: $year,
        releaseEnvironment: $releaseEnvironment,
    ) {
        results {
            description
            figureCategory
            figureCategoryDisplay
            figureCause
            figureCauseDisplay
            figures
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
}

function FigureAnalysis(props: Props) {
    const {
        className,
        cause,
        iso3,
    } = props;

    const [selectedYear, setSelectedYear] = useState(String(END_YEAR));
    const [isExpanded, setContentExpansion] = useState(false);

    const pfaVariables = useMemo(() => ({
        iso3,
        year: Number(selectedYear),
        releaseEnvironment: DATA_RELEASE,
    }), [
        selectedYear,
        iso3,
    ]);

    const {
        data: pfaResponse,
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

    const finalResults = pfaResponse?.giddPublicFigureAnalysisList?.results?.filter(
        (item) => item.figureCause === cause,
    );

    console.warn('here', finalResults);
    return (
        <CollapsibleContent
            name={undefined}
            className={_cs(className, styles.figureAnalysis)}
            isExpanded={isExpanded}
            headerContainerClassName={_cs(
                styles.headerContainer,
                cause === 'CONFLICT' ? styles.conflict : styles.disaster,
            )}
            header={(
                cause === 'CONFLICT'
                    ? 'Figure Analysis - Displacement Associated with Conflict and Violence'
                    : 'Figure Analysis - Displacement Associated with Disaster'
            )}
            headerClassName={styles.header}
            childrenClassName={styles.children}
            onExpansionChange={setContentExpansion}
        >
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
            <div className={styles.separator} />
            <Message
                pending={loading}
                pendingMessage="Loading"
                empty={(finalResults?.length ?? 0) === 0}
                emptyMessage="Looks like there are no public figure analysis for this country for the selected year"
            />
            {finalResults?.map((details) => (
                <div
                    className={styles.details}
                    key={randomString()}
                >
                    <Heading size="small">
                        {`Total number of ${details.figureCategoryDisplay} as of ${selectedYear}`}
                    </Heading>
                    <TextOutput
                        label="Figure"
                        displayType="block"
                        valueType="number"
                        value={details.figures}
                    />
                    <MarkdownViewer
                        markdown={details.description ?? 'N/A'}
                    />
                    <div className={styles.separator} />
                </div>
            ))}
        </CollapsibleContent>
    );
}

export default FigureAnalysis;
