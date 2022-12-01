import React, { useContext, useCallback } from 'react';
import { _cs } from '@togglecorp/fujs';

import LanguageContext, {
    langOptions,
    LangOption,
    Lang,
    langKeySelector,
    langLabelSelector,
} from '#context/LanguageContext';

import { commonLabels } from '#base/configs/lang';
import useTranslation from '#hooks/useTranslation';

import ListView from '../ListView';
import RawButton from '../RawButton';

import styles from './styles.css';

interface Props {
    className?: string;
}

function LanguageSelectionInput(props: Props) {
    const {
        className,
    } = props;

    const {
        lang,
        setLang,
    } = useContext(LanguageContext);

    const buttonRendererParams = useCallback((langKey: Lang, datum: LangOption) => ({
        name: langKey,
        className: _cs(
            lang === langKey && styles.active,
            styles.button,
        ),
        children: <div className={styles.label}>{langLabelSelector(datum)}</div>,
        onClick: setLang,
    }), [
        setLang,
        lang,
    ]);
    const commonStrings = useTranslation(commonLabels);

    return (
        <div className={_cs(styles.languageSelectionInput, className)}>
            <div className={styles.selectionLabel}>
                {`${commonStrings.alsoAvailableInLabel}:`}
            </div>
            <ListView
                keySelector={langKeySelector}
                data={langOptions}
                className={styles.list}
                renderer={RawButton}
                rendererParams={buttonRendererParams}
                errored={false}
                pending={false}
                filtered={false}
            />
        </div>
    );
}

export default LanguageSelectionInput;
