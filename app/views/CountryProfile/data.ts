interface CountryMetadata {
    description: string | undefined;
    displacementData: string | undefined;
}

export const countryMetadata: CountryMetadata = {
    description: `
<p>Afghanistan faces one of the world’s most acute internal displacement crises as it suffers protracted conflict and insecurity as well as recurring disasters, including droughts, floods, storms and earthquakes. Displacement has become a common coping strategy for many Afghans and, in some cases, an inevitable feature of life for multiple generations. <a href="https://www.humanitarianresponse.info/sites/www.humanitarianresponse.info/files/documents/files/afghanistan_humanitarian_needs_overview_2021.pdfhttps://reliefweb.int/sites/reliefweb.int/files/resources/AFG_REACH_WoAA_MSNI-Analysis-Report_September-2019_final-2.pdf">Humanitarian needs</a> are high and the situation is further complicated by widespread poverty, unemployment, and lack of access to basic services.&nbsp;</p>
<p>Over 404,000 new displacements associated with conflict and violence were recorded in 2020, and there were 3.5 million people internally displaced as a result at the end of the year. This latter figure is an 18 per cent increase compared with 2019 and the highest figure in more than a decade. Disasters throughout 2020 triggered more than 46,000 new displacements, with most displacements caused by flooding in March, May, and August, particularly affecting the eastern provinces.</p>
    `,
    displacementData: `
<p>The compounding impacts of conflict and disasters have exacted a <a href="https://reliefweb.int/sites/reliefweb.int/files/resources/AFG_REACH_WoAA_MSNI-Analysis-Report_September-2019_final-2.pdf">heavy toll</a> on the population. In 2020, <a href="http://www.ipcinfo.org/ipc-country-analysis/details-map/en/c/1152907/#:~:text=Between%20November%202020%20and%20March,Phase%203)%20and%20nearly%204.3">11.15 million people</a> were estimated to be experiencing high levels of acute food insecurity (IPC Phase 3 or above). This is particularly <a href="https://www.humanitarianresponse.info/sites/www.humanitarianresponse.info/files/documents/files/afghanistan_humanitarian_needs_overview_2021.pdf">true for IDP</a>s, whose ability to maintain adequate food consumption and nutrition is hindered by tenure insecurity and unemployment. &nbsp;</p>
<p>Shelter needs are particularly acute, with a recent assessment indicating shelter needs as the second priority need after food. The majority of IDPs live in <a href="https://www.nrc.no/perspectives/2020/how-ana-got-a-roof-over-her-head/">informal settlements</a> and makeshift shelters. IDPs who settle on government or private land are at heightened <a href="https://www.internal-displacement.org/global-report/grid2019/downloads/background_papers/HirschHolland_FinalPaper.pdf">risk of eviction</a> and inadequate shelter also makes people more vulnerable to the impacts of sudden-onset disasters such as floods and avalanches, heightening their <a href="https://www.humanitarianresponse.info/sites/www.humanitarianresponse.info/files/documents/files/afghanistan_humanitarian_needs_overview_2021.pdf">risk of secondary displacement</a>. Conditions in informal settlements are dire and IDPs often lack access to water and sanitation facilities and face acute protection concerns. IDP and refugee households report high levels of early marriage, gender-based violence, and exploitation.</p><p></p>
    `,
};

interface CountryOverview {
    year: string;
    lastModified: string;
    description: string;
}

export const countryOverviews: CountryOverview[] = [
    {
        year: '2021',
        lastModified: '2021-04-26T09:55:13.093Z',
        description: `
<p>
The history of conflict displacement in Afghanistan goes back to the late 1970s. War between the Soviet-backed government and mujahideen fighters and the Soviet occupation triggered large-scale internal displacement and refugee flows in the 1980s. The fall of the government in 1992, ensuing ethnic conflict between mujahideen factions and the rise of the Taliban in the late 1990s displaced millions more.
</p>
        `,
    },
    {
        year: '2020',
        lastModified: '2020-04-26T09:55:13.093Z',
        description: `
<p>
<p>Every year, India has some of the highest levels of disaster displacement in South Asia and globally. The majority of the displacements are triggered by flooding during the monsoon seasons. The country is also prone to other sudden and slow-onset hazards including earthquakes, tsunamis, cyclones, storm surges and drought. Protracted conflict in Indian-administered Kashmir, and localised inter-communal violence also trigger displacement every year, but to a much lesser extent.&nbsp;</p>

<p>There were 3.9 million new disaster displacements in India in 2020, the result of a combination of increasing hazard intensity, high population exposure and high levels of social and economic vulnerability. Most displacements took the form of pre-emptive evacuations before Cyclone Amphan made landfall in May 2020. Amphan triggered more than 2.4 million evacuations in the states of West Bengal and Odisha. Cyclone Nisarga prompted another 170,000 evacuations in the western states of Maharashtra and Gujarat just two weeks later. Such extreme weather events are no longer exceptional, and severe cyclones are only <a href="https://indiaclimatedialogue.net/2020/06/05/cyclones-rise-as-climate-change-heats-up-indian-ocean/">expected to increase</a> in number and intensity on both the east and west coasts of the Indian subcontinent.</p>

<p>In recent years, displacement has been reported in Indian-controlled Kashmir and other areas in the country, but figures are hard to come by due to access constraints and lack of reporting. Tensions between Hindu and Muslim communities have been rising since the Citizenship Amendment Act was passed in 2019. They led to widespread violent protests in 2020, notably in Delhi in February, when more than 1,800 people were forced to shelter in camps.</p>
</p>
        `,
    },
];

interface Statistics {
    startYear: number;
    endYear: number;
    conflict?: {
        newDisplacements: number;
        newDisplacementsLabel: string;
        newDisplacementsTimeseries: {
        }[];
        noOfIdpsLabel: string;
        noOfIdps: number;
        noOfIdpsTimeseries: {
        }[];
    },
    disaster?: {
        newDisplacements: number;
        newDisplacementsLabel: string;
        noOfEvents: number;
        noOfEventsLabel: string;
        newDisplacementsTimeseries: {
        }[];
        newDisplacementsByDisasterType: {
        }[];
    },
}

export const statistics: Statistics = {
    startYear: 2008,
    endYear: 2020,
    conflict: {
        newDisplacements: 11200,
        newDisplacementsLabel: 'New Displacements',

        noOfIdps: 1200,
        noOfIdpsLabel: 'Total number of IDPs',

        newDisplacementsTimeseries: [],
        noOfIdpsTimeseries: [],
    },
    disaster: {
        newDisplacements: 11200,
        newDisplacementsLabel: 'New Displacements',

        noOfEvents: 10,
        noOfEventsLabel: 'Disaster events reported',

        newDisplacementsTimeseries: [],
        newDisplacementsByDisasterType: [],
    },
};
