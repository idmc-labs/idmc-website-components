import React, { useState, useCallback } from 'react';
import { isDefined, isNotDefined, _cs } from '@togglecorp/fujs';
import { InputContainer } from '@togglecorp/toggle-ui';
import 'tinymce/tinymce';
import 'tinymce/icons/default';
import 'tinymce/models/dom';
import 'tinymce/themes/silver';
import 'tinymce/plugins/link';
import 'tinymce/plugins/image';
import 'tinymce/plugins/table';
import 'tinymce/skins/ui/oxide/skin.min.css';
import 'tinymce/skins/ui/oxide/content.min.css';
import 'tinymce/skins/content/default/content.min.css';
import { Editor } from '@tinymce/tinymce-react';

import useTranslation from '#hooks/useTranslation';
import { goodPracticesDashboard } from '#base/configs/lang';

import styles from './styles.css';

interface Props<N extends string> {
    name: N;
    className?: string;
    value: string | undefined | null;
    onChange: (newVal: string | undefined, name: N) => void;
    error?: string;
    label?: string;
    labelContainerClassName?: string;
    textLimit?: number;
}

function TinyMceEditorInput<N extends string>(props: Props<N>) {
    const {
        className,
        label,
        error,
        value,
        name,
        onChange,
        textLimit,
        labelContainerClassName,
    } = props;

    const strings = useTranslation(goodPracticesDashboard);
    const [length, setLength] = useState(0);

    const handleChange = useCallback((newText: string | undefined, editor) => {
        const textLength = editor.getContent({ format: 'text' }).length;
        if (isNotDefined(textLimit) || textLength <= textLimit) {
            onChange(newText, name);
            setLength(textLength);
        }
    }, [
        onChange,
        name,
        textLimit,
    ]);

    return (
        <InputContainer
            label={label}
            labelContainerClassName={labelContainerClassName}
            inputSectionClassName={styles.inputSection}
            className={_cs(styles.tinyMceEditorInput, className)}
            error={error}
            inputContainerClassName={styles.input}
            input={(
                <>
                    <Editor
                        value={value ?? ''}
                        plugins="link"
                        onEditorChange={handleChange}
                        init={{
                            skin: false,
                            content_css: false,
                            menubar: 'edit insert format',
                        }}
                        toolbar="undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | outdent indent | link"
                    />
                    {isDefined(value) && isDefined(textLimit) && (
                        <div className={styles.textLengthSection}>
                            { /* Note: only run when existed form exceed the text limit */ }
                            {length > textLimit && (
                                <span className={styles.textLimit}>
                                    {strings.textLimitExceeded}
                                </span>
                            )}
                            <span>
                                {textLimit - length}
                                /
                                {textLimit}
                            </span>
                        </div>
                    )}
                </>
            )}
        />
    );
}

export default TinyMceEditorInput;
