import React, { useMemo, useState } from 'react';
import {
    IoChevronDown,
    IoChevronUp,
} from 'react-icons/io5';
import {
    _cs,
    listToGroupList,
    compareNumber,
} from '@togglecorp/fujs';

import Button from '#components/Button';
import useModalState from '#hooks/useModalState';
import Tabs from '#components/Tabs';
import Tab from '#components/Tabs/Tab';
import TabList from '#components/Tabs/TabList';
import TabPanel from '#components/Tabs/TabPanel';
import Container from '#components/Container';
import HTMLOutput from '#components/HTMLOutput';
import Numeral from '#components/Numeral';
import {
    CountryProfileQuery,
} from '#generated/types';

import styles from './styles.css';

const pendingInfo = 'Pending further information and evidence, those who are in a situation of displacement, but progressing towards a durable solution have not been included.';

type FigureAnalysisItem = NonNullable<NonNullable<CountryProfileQuery['country']>['figureAnalysis']>[number];

interface ItemTableProps extends FigureAnalysisItem {
    className?: string;
    selectedYear: string;
}

function ItemTable(props: ItemTableProps) {
    const {
        className,
        idpCaveatsAndChallenges,
        selectedYear,
        idpFigures,
        idpMethodologyAndSources,
        ndMethodologyAndSources,
        ndCaveatsAndChallenges,
        ndFigures,
    } = props;

    return (
        <table className={_cs(className, styles.itemTable)}>
            <tr>
                <td />
                <th>
                    Figure
                </th>
                <th>
                    Methodology and Sources
                </th>
                <th>
                    Caveats and Challenges
                </th>
            </tr>
            <tr>
                <td className={styles.header}>
                    Internal Displacement
                </td>
                <td><Numeral value={ndFigures} /></td>
                <td>
                    <HTMLOutput value={ndMethodologyAndSources} />
                </td>
                <td>
                    <HTMLOutput value={ndCaveatsAndChallenges} />
                </td>
            </tr>
            <tr>
                <td>
                    <div className={styles.header}>{`Total Number of IDPs as of 31 December ${selectedYear}`}</div>
                    <div className={styles.description}>
                        {pendingInfo}
                    </div>
                </td>
                <td>
                    <Numeral value={idpFigures} />
                </td>
                <td>
                    <HTMLOutput value={idpMethodologyAndSources} />
                </td>
                <td>
                    <HTMLOutput value={idpCaveatsAndChallenges} />
                </td>
            </tr>
        </table>
    );
}

interface Props {
    className?: string;
    data: FigureAnalysisItem[] | undefined | null;
    year: number;
}

function FigureAnalysis(props: Props) {
    const {
        className,
        data,
        year,
    } = props;

    const [
        figureAnalysisShown,
        , ,
        handleFigureAnalysisToggleClick,
    ] = useModalState(false);

    const [
        figureAnalysisActiveYear,
        setFigureAnalysisActiveYear,
    ] = useState<string>(String(year));

    const figureAnalysisByYear = useMemo(() => {
        if (!data) {
            return undefined;
        }
        return listToGroupList(
            data,
            (figureAnalysis) => figureAnalysis.year,
            (figureAnalysis) => figureAnalysis,
        );
    }, [data]);

    const sortedYears = useMemo(() => {
        if (!figureAnalysisByYear) {
            return undefined;
        }
        const years = Object.keys(figureAnalysisByYear);
        years.sort((a, b) => compareNumber(Number(a), Number(b), -1));

        return years;
    }, [figureAnalysisByYear]);

    const {
        selectedConflictData,
        selectedDisasterData,
    } = useMemo(() => {
        const selectedData = figureAnalysisByYear?.[figureAnalysisActiveYear];

        return {
            selectedConflictData: selectedData?.find((item) => item.crisisType === 'CONFLICT'),
            selectedDisasterData: selectedData?.find((item) => item.crisisType === 'DISASTER'),
        };
    }, [
        figureAnalysisByYear,
        figureAnalysisActiveYear,
    ]);

    return (
        <div className={_cs(className, styles.figureAnalysis)}>
            {(sortedYears?.length ?? 0) > 0 && (
                <Button
                    name={undefined}
                    onClick={handleFigureAnalysisToggleClick}
                    actions={figureAnalysisShown ? <IoChevronUp /> : <IoChevronDown />}
                    variant="transparent"
                >
                    Show Figure Analysis
                </Button>
            )}
            {figureAnalysisShown && (
                <Tabs
                    value={figureAnalysisActiveYear}
                    onChange={setFigureAnalysisActiveYear}
                    variant="primary"
                >
                    <TabList
                        className={styles.tabList}
                        position="left"
                    >
                        {sortedYears?.map((year) => (
                            <Tab
                                key={year}
                                name={String(year)}
                            >
                                {year}
                            </Tab>
                        ))}
                    </TabList>
                    {sortedYears?.map((year) => (
                        <TabPanel
                            key={year}
                            name={String(year)}
                            className={styles.tabPanel}
                        >
                            {selectedConflictData && (
                                <Container
                                    headingSize="small"
                                    heading="Displacement Associated with Conflict & Violence"
                                >
                                    <ItemTable
                                        {...selectedConflictData}
                                        selectedYear={figureAnalysisActiveYear}
                                    />
                                </Container>
                            )}
                            {selectedDisasterData && (
                                <Container
                                    headingSize="small"
                                    heading="Displacement Associated with Disaster"
                                >
                                    <ItemTable
                                        {...selectedDisasterData}
                                        selectedYear={figureAnalysisActiveYear}
                                    />
                                </Container>
                            )}
                        </TabPanel>
                    ))}
                </Tabs>
            )}
        </div>
    );
}

export default FigureAnalysis;
