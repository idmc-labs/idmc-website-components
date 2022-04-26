import React from 'react';
import {
    Header,
} from '@the-deep/deep-ui';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

const countryDescription = `
<p>Afghanistan faces one of the world’s most acute internal displacement crises as it suffers protracted conflict and insecurity as well as recurring disasters, including droughts, floods, storms and earthquakes. Displacement has become a common coping strategy for many Afghans and, in some cases, an inevitable feature of life for multiple generations. <a href="https://www.humanitarianresponse.info/sites/www.humanitarianresponse.info/files/documents/files/afghanistan_humanitarian_needs_overview_2021.pdfhttps://reliefweb.int/sites/reliefweb.int/files/resources/AFG_REACH_WoAA_MSNI-Analysis-Report_September-2019_final-2.pdf">Humanitarian needs</a> are high and the situation is further complicated by widespread poverty, unemployment, and lack of access to basic services.&nbsp;</p>
<p>Over 404,000 new displacements associated with conflict and violence were recorded in 2020, and there were 3.5 million people internally displaced as a result at the end of the year. This latter figure is an 18 per cent increase compared with 2019 and the highest figure in more than a decade. Disasters throughout 2020 triggered more than 46,000 new displacements, with most displacements caused by flooding in March, May, and August, particularly affecting the eastern provinces.</p>
`;

interface Props {
    className?: string;
}

function CountryProfile(props: Props) {
    const {
        className,
    } = props;

    return (
        <div className={_cs(styles.countryProfile, className)}>
            <div className={styles.mainContent}>
                <Header
                    headingSize="extraLarge"
                    heading="Country Profile"
                />
                <div
                    className={styles.description}
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{
                        __html: countryDescription,
                    }}
                />
            </div>
        </div>
    );
}

export default CountryProfile;
