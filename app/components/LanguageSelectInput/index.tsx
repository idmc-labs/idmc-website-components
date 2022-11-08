import React, { useContext, useCallback } from 'react';
import { _cs } from '@togglecorp/fujs';

import LanguageContext, {
    langOptions,
    LangOption,
    Lang,
    langKeySelector,
} from '#context/LanguageContext';

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
        children: <div className={styles.label}>{langKeySelector(datum)}</div>,
        onClick: setLang,
    }), [
        setLang,
        lang,
    ]);

    return (
        <ListView
            keySelector={langKeySelector}
            data={langOptions}
            className={_cs(styles.languageSelectionInput, className)}
            renderer={RawButton}
            rendererParams={buttonRendererParams}
            errored={false}
            pending={false}
            filtered={false}
        />
    );
}

export default LanguageSelectionInput;
