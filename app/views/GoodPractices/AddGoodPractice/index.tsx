import React, { useState, useCallback, useRef } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
    Button,
    Modal,
    MultiSelectInput,
    Checkbox,
    NumberInput,
    TextInput,
} from '@togglecorp/toggle-ui';
import Captcha from '@hcaptcha/react-hcaptcha';

import {
    PartialForm,
    useForm,
    getErrorObject,
    getErrorString,
    createSubmitHandler,
    ObjectSchema,
    requiredStringCondition,
    removeNull,
    requiredCondition,
    requiredListCondition,
    defaultEmptyArrayType,
} from '@togglecorp/toggle-form';

import { hCaptchaKey } from '#base/configs/hCaptcha';
import HCaptcha from '#components/HCaptcha';
import useTranslation from '#hooks/useTranslation';
import TinyMceEditorInput from '#components/TinyMceEditorInput';
import useAlert from '#hooks/useAlert';
import { transformToFormError, ObjectError } from '#utils/errorTransform';
import {
    goodPracticesDashboard,
} from '#base/configs/lang';
import {
    PublicCreateGoodPracticeMutation,
    PublicCreateGoodPracticeMutationVariables,
    OptionsForGoodPracticesQuery,
    OptionsForGoodPracticesQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const PUBLIC_CREATE_GOOD_PRACTICE = gql`
    mutation PublicCreateGoodPractice (
        $titleEn: String,
        $titleFr: String,
        $descriptionEn: String,
        $descriptionFr: String,
        $mediaAndResourceLinksEn: String,
        $mediaAndResourceLinksFr: String,
        $countries: [ID!]!,
        $implementingEntityEn: String,
        $implementingEntityFr: String,
        $contactName: String!,
        $contactEmail: String!,
        $underReview: Boolean,
        $driversOfDisplacement: [ID!],
        $focusArea: [ID!],
        $tags: [ID!],
        $startYear: Int!,
        $endYear: Int,
        $captcha: String!,
        $whatMakesThisPromisingPractice: String,
        $descriptionOfKeyLessonsLearned: String,
    ) {
        publicCreateGoodPractice(
            input: {
                titleEn: $titleEn,
                titleFr: $titleFr,
                descriptionEn: $descriptionEn,
                descriptionFr: $descriptionFr,
                mediaAndResourceLinksEn: $mediaAndResourceLinksEn,
                mediaAndResourceLinksFr: $mediaAndResourceLinksFr,
                countries: $countries,
                contactName: $contactName,
                contactEmail: $contactEmail,
                underReview: $underReview,
                implementingEntityEn: $implementingEntityEn,
                implementingEntityFr: $implementingEntityFr,
                driversOfDisplacement: $driversOfDisplacement,
                focusArea: $focusArea,
                tags: $tags,
                startYear: $startYear,
                endYear: $endYear,
                captcha: $captcha,
                whatMakesThisPromisingPractice: $whatMakesThisPromisingPractice,
                descriptionOfKeyLessonsLearned: $descriptionOfKeyLessonsLearned,
            }
        ) {
            ok
            errors
        }
    }
`;

const OPTIONS_FOR_GOOD_PRACTICES = gql`
    query OptionsForGoodPractices ($search: String) {
        countries (filters: {search: $search}) {
            id
            name
        }
    }
`;

type FormType = PublicCreateGoodPracticeMutationVariables;

type PartialFormType = PartialForm<FormType> & { isFrench?: boolean };
type FormSchema = ObjectSchema<PartialFormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const englishSchema: FormSchemaFields = {
    titleEn: [requiredStringCondition],
    descriptionEn: [requiredStringCondition],
    mediaAndResourceLinksEn: [],
    implementingEntityEn: [requiredStringCondition],

    contactName: [requiredStringCondition],
    contactEmail: [requiredStringCondition],
    driversOfDisplacement: [defaultEmptyArrayType],
    focusArea: [defaultEmptyArrayType],
    tags: [defaultEmptyArrayType],
    countries: [requiredListCondition],
    startYear: [requiredCondition],
    endYear: [],
    captcha: [requiredStringCondition],
    whatMakesThisPromisingPractice: [],
    descriptionOfKeyLessonsLearned: [],
};

const frenchSchema: FormSchemaFields = {
    descriptionFr: [requiredStringCondition],
    titleFr: [requiredStringCondition],
    implementingEntityFr: [requiredStringCondition],
    mediaAndResourceLinksFr: [],

    contactName: [requiredStringCondition],
    contactEmail: [requiredStringCondition],
    driversOfDisplacement: [defaultEmptyArrayType],
    focusArea: [defaultEmptyArrayType],
    tags: [defaultEmptyArrayType],
    countries: [requiredListCondition],
    startYear: [requiredCondition],
    endYear: [],
    captcha: [requiredStringCondition],
    whatMakesThisPromisingPractice: [],
    descriptionOfKeyLessonsLearned: [],
};

const schema: FormSchema = {
    fields: (value): FormSchemaFields => {
        if (value?.isFrench) {
            return { ...frenchSchema };
        }
        return { ...englishSchema };
    },
};

const defaultValues: PartialFormType = {};

type CountryType = NonNullable<OptionsForGoodPracticesQuery['countries']>[number];
const countryKeySelector = (c: CountryType) => c.id;
const countryLabelSelector = (c: CountryType) => c.name;

interface Props {
    onModalClose: () => void;
}

function AddGoodPractice(props: Props) {
    const {
        onModalClose,
    } = props;

    const strings = useTranslation(goodPracticesDashboard);

    const alert = useAlert();
    const elementRef = useRef<Captcha>(null);

    const {
        pristine,
        value,
        error: riskyError,
        setFieldValue,
        validate,
        // setValue,
        setError,
    } = useForm(
        schema,
        defaultValues,
    );

    const [agreeTerms, setAgreeTerms] = useState(false);
    const [ongoing, setOngoing] = useState(false);

    const error = getErrorObject(riskyError);

    const {
        data: optionsResponse,
        loading: optionsLoading,
    } = useQuery<OptionsForGoodPracticesQuery, OptionsForGoodPracticesQueryVariables>(
        OPTIONS_FOR_GOOD_PRACTICES,
    );

    const countries = optionsResponse?.countries;

    const [
        createNewGoodPractice,
        {
            loading: createNewGoodPracticeLoading,
        },
    ] = useMutation<PublicCreateGoodPracticeMutation, PublicCreateGoodPracticeMutationVariables>(
        PUBLIC_CREATE_GOOD_PRACTICE,
        {
            onCompleted: (response) => {
                const responseData = response?.publicCreateGoodPractice;

                const {
                    ok,
                    errors,
                } = responseData;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors) as ObjectError[]);
                    setError(formError);
                    alert.show(
                        'Failed to add good practice',
                        { variant: 'error' },
                    );
                } else if (ok) {
                    alert.show(
                        'Successfully added good practice',
                        { variant: 'success' },
                    );
                    onModalClose();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to add good practice',
                    { variant: 'error' },
                );
            },
        },
    );

    const handleSubmit = useCallback(() => {
        elementRef.current?.resetCaptcha();
        const submit = createSubmitHandler(
            validate,
            setError,
            (val) => {
                createNewGoodPractice({
                    variables: val as FormType,
                    context: { hasUpload: true },
                });
            },
        );
        submit();
    }, [
        validate,
        setError,
        createNewGoodPractice,
    ]);

    return (
        <form
            onSubmit={handleSubmit}
        >
            <Modal
                onClose={onModalClose}
                headingClassName={styles.headingContainer}
                heading={(
                    <div className={styles.heading}>
                        Submit a new Good Practice
                        <Checkbox
                            className={styles.switch}
                            name="isFrench"
                            value={value?.isFrench}
                            onChange={setFieldValue}
                            label={strings.alsoSubmitInFrenchLabel}
                            labelClassName={styles.switchLabel}
                        />
                    </div>
                )}
                footerClassName={styles.footer}
                className={styles.modal}
                footer={(
                    <Button
                        name={undefined}
                        type="submit"
                        variant="accent"
                        onClick={handleSubmit}
                        disabled={pristine || createNewGoodPracticeLoading || !agreeTerms}
                        compact
                    >
                        {strings.submitLabel}
                    </Button>
                )}
                size="cover"
            >
                <div className={styles.inline}>
                    <TextInput
                        className={styles.input}
                        labelContainerClassName={styles.fieldInput}
                        name="contactName"
                        label={
                            value?.isFrench
                                ? strings.contactNameLabelFr
                                : strings.contactNameLabel
                        }
                        value={value?.contactName}
                        error={error?.contactName}
                        onChange={setFieldValue}
                        inputSectionClassName={styles.inputSection}
                    />
                    <TextInput
                        className={styles.input}
                        labelContainerClassName={styles.fieldInput}
                        name="contactEmail"
                        label={
                            value?.isFrench
                                ? strings.contactEmailLabelFr
                                : strings.contactEmailLabel
                        }
                        value={value?.contactEmail}
                        error={error?.contactEmail}
                        onChange={setFieldValue}
                        inputSectionClassName={styles.inputSection}
                    />
                </div>
                <div className={styles.inline}>
                    {!value?.isFrench && (
                        <TextInput
                            className={styles.input}
                            labelContainerClassName={styles.fieldInput}
                            name="implementingEntityEn"
                            label={strings.implementingEntityLabel}
                            value={value?.implementingEntityEn}
                            inputSectionClassName={styles.inputSection}
                            error={error?.implementingEntityEn}
                            onChange={setFieldValue}
                        />
                    )}
                    {value?.isFrench && (
                        <TextInput
                            className={styles.input}
                            labelContainerClassName={styles.fieldInput}
                            name="implementingEntityFr"
                            label={strings.implementingEntityFrLabel}
                            value={value?.implementingEntityFr}
                            inputSectionClassName={styles.inputSection}
                            error={error?.implementingEntityFr}
                            onChange={setFieldValue}
                        />
                    )}
                </div>
                <div className={styles.inline}>
                    {!value?.isFrench && (
                        <TextInput
                            className={styles.input}
                            labelContainerClassName={styles.fieldInput}
                            name="titleEn"
                            label={strings.titleLabel}
                            value={value?.titleEn}
                            error={error?.titleEn}
                            onChange={setFieldValue}
                            inputSectionClassName={styles.inputSection}
                        />
                    )}
                    {value?.isFrench && (
                        <TextInput
                            className={styles.input}
                            labelContainerClassName={styles.fieldInput}
                            name="titleFr"
                            label={strings.titleFrLabel}
                            value={value?.titleFr}
                            error={error?.titleFr}
                            onChange={setFieldValue}
                            inputSectionClassName={styles.inputSection}
                        />
                    )}
                </div>
                {!value?.isFrench && (
                    <TinyMceEditorInput
                        className={styles.input}
                        labelContainerClassName={styles.fieldInput}
                        value={value?.descriptionEn}
                        onChange={setFieldValue}
                        name="descriptionEn"
                        error={error?.descriptionEn}
                        label={strings.descriptionLabel}
                    />
                )}
                {value?.isFrench && (
                    <TinyMceEditorInput
                        className={styles.input}
                        labelContainerClassName={styles.fieldInput}
                        name="descriptionFr"
                        label={strings.descriptionsFrLabel}
                        value={value?.descriptionFr}
                        error={error?.descriptionFr}
                        onChange={setFieldValue}
                    />
                )}
                <div className={styles.inline}>
                    <MultiSelectInput
                        className={styles.input}
                        labelContainerClassName={styles.fieldInput}
                        name="countries"
                        options={countries}
                        inputSectionClassName={styles.inputSection}
                        label={
                            value?.isFrench
                                ? strings.countryLabelFr
                                : strings.countryLabel
                        }
                        value={value?.countries}
                        error={getErrorString(error?.countries)}
                        onChange={setFieldValue}
                        keySelector={countryKeySelector}
                        labelSelector={countryLabelSelector}
                        disabled={optionsLoading}
                    />
                </div>
                <div className={styles.inline}>
                    <NumberInput
                        className={styles.input}
                        labelContainerClassName={styles.fieldInput}
                        name="startYear"
                        label={
                            value?.isFrench
                                ? strings.startYearLabelFr
                                : strings.startYearLabel
                        }
                        value={value?.startYear}
                        error={error?.startYear}
                        onChange={setFieldValue}
                        inputSectionClassName={styles.inputSection}
                    />
                    {!ongoing && (
                        <NumberInput
                            className={styles.input}
                            labelContainerClassName={styles.fieldInput}
                            name="endYear"
                            label={
                                value?.isFrench
                                    ? strings.endYearLabelFr
                                    : strings.endYearLabel
                            }
                            inputSectionClassName={styles.inputSection}
                            value={value?.endYear}
                            error={error?.endYear}
                            onChange={setFieldValue}
                        />
                    )}
                    <Checkbox
                        className={styles.ongoing}
                        name="ongoing"
                        value={ongoing}
                        onChange={setOngoing}
                        label={
                            value?.isFrench
                                ? strings.ongoingLabelFr
                                : strings.ongoingLabel
                        }
                        labelClassName={styles.termsLabel}
                    />
                </div>
                <TinyMceEditorInput
                    className={styles.input}
                    labelContainerClassName={styles.fieldInput}
                    name="whatMakesThisPromisingPractice"
                    label={
                        value?.isFrench
                            ? strings.promisingLabelFr
                            : strings.promisingLabel
                    }
                    value={value?.whatMakesThisPromisingPractice}
                    error={error?.whatMakesThisPromisingPractice}
                    onChange={setFieldValue}
                />
                <TinyMceEditorInput
                    className={styles.input}
                    labelContainerClassName={styles.fieldInput}
                    name="descriptionOfKeyLessonsLearned"
                    label={
                        value?.isFrench
                            ? strings.keyLessonsLabelFr
                            : strings.keyLessonsLabel
                    }
                    value={value?.descriptionOfKeyLessonsLearned}
                    error={error?.descriptionOfKeyLessonsLearned}
                    onChange={setFieldValue}
                />
                {!value?.isFrench && (
                    <TinyMceEditorInput
                        className={styles.input}
                        labelContainerClassName={styles.fieldInput}
                        name="mediaAndResourceLinksEn"
                        label={strings.mediaAndResourceLinksLabel}
                        value={value?.mediaAndResourceLinksEn}
                        error={error?.mediaAndResourceLinksEn}
                        onChange={setFieldValue}
                    />
                )}
                {value?.isFrench && (
                    <TinyMceEditorInput
                        className={styles.input}
                        labelContainerClassName={styles.fieldInput}
                        name="mediaAndResourceLinksFr"
                        label={strings.mediaAndResourceLinksFrLabel}
                        value={value?.mediaAndResourceLinksFr}
                        error={error?.mediaAndResourceLinksFr}
                        onChange={setFieldValue}
                    />
                )}
                <HCaptcha
                    name="captcha"
                    onChange={setFieldValue}
                    label={
                        value?.isFrench
                            ? strings.captchaLabelFr
                            : strings.captchaLabel
                    }
                    error={error?.captcha}
                    elementRef={elementRef}
                    siteKey={hCaptchaKey}
                />
                <Checkbox
                    className={styles.switch}
                    name="agreement"
                    value={agreeTerms}
                    onChange={setAgreeTerms}
                    label={
                        value?.isFrench
                            ? strings.agreementTermsFr
                            : strings.agreementTerms
                    }
                    labelClassName={styles.termsLabel}
                />
            </Modal>
        </form>
    );
}
export default AddGoodPractice;
