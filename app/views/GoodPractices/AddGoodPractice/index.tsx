import React, { useState, useCallback, useRef } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';

import {
    Button,
    Modal,
    MultiSelectInput,
    Checkbox,
    NumberInput,
    SelectInput,
    TextArea,
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
} from '@togglecorp/toggle-form';

import { hCaptchaKey } from '#base/configs/hCaptcha';
import HCaptcha from '#components/HCaptcha';
import FileInput from '#components/FileInput';
// import useAlert from '#hooks/useAlert';
import { transformToFormError, ObjectError } from '#utils/errorTransform';
import {
    StageTypeEnum,
    TypeEnum,
    CreateGoodPracticeMutation,
    CreateGoodPracticeMutationVariables,
    OptionsForGoodPracticesQuery,
    OptionsForGoodPracticesQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const CREATE_GOOD_PRACTICE = gql`
    mutation CreateGoodPractice (
        $titleEn: String,
        $titleFr: String,
        $descriptionEn: String,
        $descriptionFr: String,
        $mediaAndResourceLinksEn: String,
        $mediaAndResourceLinksFr: String,
        $countries: [ID!]!,
        $type: TypeEnum!,
        $implementingEntityEn: String,
        $implementingEntityFr: String,
        $stage: StageTypeEnum!,
        $driversOfDisplacement: [ID!]!,
        $focusArea: [ID!]!,
        $tags: [ID!]!,
        $image: Upload,
        $startYear: Int!,
        $endYear: Int!,
        $captcha: String!,
    ) {
        createGoodPractice(
            input: {
                titleEn: $titleEn,
                titleFr: $titleFr,
                descriptionEn: $descriptionEn,
                descriptionFr: $descriptionFr,
                mediaAndResourceLinksEn: $mediaAndResourceLinksEn,
                mediaAndResourceLinksFr: $mediaAndResourceLinksFr,
                countries: $countries,
                type: $type,
                implementingEntityEn: $implementingEntityEn,
                implementingEntityFr: $implementingEntityFr,
                stage: $stage,
                driversOfDisplacement: $driversOfDisplacement,
                focusArea: $focusArea,
                tags: $tags,
                image: $image,
                startYear: $startYear,
                endYear: $endYear,
                captcha: $captcha,
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
        driversOfDisplacements {
            id
            name
        }
        focusAreas {
            id
            name
        }
        tags {
            id
            name
        }
        type: __type(name: "TypeEnum") {
            enumValues {
                name
                description
            }
        }
        stages: __type(name: "StageTypeEnum") {
            enumValues {
                name
                description
            }
        }
    }
`;

type FormType = CreateGoodPracticeMutationVariables;

type PartialFormType = PartialForm<FormType> & { image?: File | undefined | null };
type FormSchema = ObjectSchema<PartialFormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        titleEn: [],
        titleFr: [],
        descriptionEn: [],
        descriptionFr: [],
        mediaAndResourceLinksEn: [],
        mediaAndResourceLinksFr: [],
        countries: [requiredListCondition],
        type: [requiredCondition],
        implementingEntityEn: [],
        implementingEntityFr: [],
        stage: [requiredStringCondition],
        driversOfDisplacement: [requiredListCondition],
        focusArea: [requiredListCondition],
        tags: [requiredListCondition],
        startYear: [requiredCondition],
        endYear: [requiredCondition],
        captcha: [requiredStringCondition],
        image: [],
    }),
};

const defaultValues: PartialFormType = {};

type CountryType = NonNullable<OptionsForGoodPracticesQuery['countries']>[number];
const countryKeySelector = (c: CountryType) => c.id;
const countryLabelSelector = (c: CountryType) => c.name;

type TypeType = NonNullable<NonNullable<OptionsForGoodPracticesQuery['type']>['enumValues']>[number];
const typeEnumKeySelector = (t: TypeType) => t.name as TypeEnum;
// FIXME: use description instead of name
const typeEnumLabelSelector = (t: TypeType) => t.name;

type StageType = NonNullable<NonNullable<OptionsForGoodPracticesQuery['stages']>['enumValues']>[number];
const stageKeySelector = (s: StageType) => s.name as StageTypeEnum;
// FIXME: use description instead of name
const stageLabelSelector = (s: StageType) => s.name;

type FocusAreaType = NonNullable<OptionsForGoodPracticesQuery['focusAreas']>[number];
const focusAreaKeySelector = (fa: FocusAreaType) => fa.id;
const focusAreaLabelSelector = (fa: FocusAreaType) => fa.name;

type DriversOfDisplacementType = NonNullable<OptionsForGoodPracticesQuery['driversOfDisplacements']>[number];
const driversOfDisplacementKeySelector = (dod: DriversOfDisplacementType) => dod.id;
const driversOfDisplacementLabelSelector = (dod: DriversOfDisplacementType) => dod.name;

type TagType= NonNullable<OptionsForGoodPracticesQuery['tags']>[number];
const tagsKeySelector = (tag: TagType) => tag.id;
const tagsLabelSelector = (tag: TagType) => tag.name;

interface Props {
    onModalClose: () => void;
}

function AddGoodPractice(props: Props) {
    const {
        onModalClose,
    } = props;

    // const alert = useAlert();
    const elementRef = useRef<Captcha>(null);

    const {
        pristine,
        value,
        error: riskyError,
        setFieldValue,
        validate,
        // setValue,
        setError,
    } = useForm(schema, defaultValues);

    const [frenchAvailable, setFrenchAvailable] = useState(false);

    const error = getErrorObject(riskyError);

    const {
        data: optionsResponse,
        loading: optionsLoading,
    } = useQuery<OptionsForGoodPracticesQuery, OptionsForGoodPracticesQueryVariables>(
        OPTIONS_FOR_GOOD_PRACTICES,
    );

    const countries = optionsResponse?.countries;
    const types = optionsResponse?.type?.enumValues;
    const driversOfDisplacements = optionsResponse?.driversOfDisplacements;
    const stages = optionsResponse?.stages?.enumValues;
    const focusAreas = optionsResponse?.focusAreas;
    const tags = optionsResponse?.tags;

    const [
        createNewGoodPractice,
        {
            loading: createNewGoodPracticeLoading,
        },
    ] = useMutation<CreateGoodPracticeMutation, CreateGoodPracticeMutationVariables>(
        CREATE_GOOD_PRACTICE,
        {
            onCompleted: (response) => {
                const responseData = response?.createGoodPractice;

                const {
                    // ok,
                    errors,
                } = responseData;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors) as ObjectError[]);
                    setError(formError);
                    /* FIXME: alert needs to be fixed
                    alert.show(
                        'Failed to add good practice',
                        { variant: 'error' },
                    );
                     */
                } /* else if (ok) {
                    alert.show(
                        'Successfully added good practice',
                        { variant: 'success' },
                    );
                }
                   */
            },
            /* FIXME: alert needs to be fixed
            onError: () => {
                alert.show(
                    'Failed to add good practice',
                    { variant: 'error' },
                );
            },
             */
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
                        Add new good practice
                        <Checkbox
                            className={styles.switch}
                            name="french"
                            value={frenchAvailable}
                            onChange={setFrenchAvailable}
                            label="Also submit in French"
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
                        disabled={pristine || createNewGoodPracticeLoading}
                        compact
                    >
                        Submit
                    </Button>
                )}
                size="cover"
            >
                <div className={styles.inline}>
                    <TextInput
                        className={styles.input}
                        name="titleEn"
                        label="Title"
                        value={value?.titleEn}
                        error={error?.titleEn}
                        onChange={setFieldValue}
                        inputSectionClassName={styles.inputSection}
                    />
                    {frenchAvailable && (
                        <TextInput
                            className={styles.input}
                            name="titleFr"
                            label="Title (French)"
                            value={value?.titleFr}
                            error={error?.titleFr}
                            onChange={setFieldValue}
                            inputSectionClassName={styles.inputSection}
                        />
                    )}
                </div>
                <div className={styles.inline}>
                    <TextArea
                        className={styles.input}
                        name="descriptionEn"
                        label="Description"
                        value={value?.descriptionEn}
                        error={error?.descriptionEn}
                        onChange={setFieldValue}
                    />
                    {frenchAvailable && (
                        <TextArea
                            className={styles.input}
                            name="descriptionFr"
                            label="Description(French)"
                            value={value?.descriptionFr}
                            error={error?.descriptionFr}
                            onChange={setFieldValue}
                        />
                    )}
                </div>
                <div className={styles.inline}>
                    <TextArea
                        className={styles.input}
                        name="mediaAndResourceLinksEn"
                        label="Media and Resource Links"
                        value={value?.mediaAndResourceLinksEn}
                        error={error?.mediaAndResourceLinksEn}
                        onChange={setFieldValue}
                        height="auto"
                    />
                    {frenchAvailable && (
                        <TextArea
                            className={styles.input}
                            name="mediaAndResourceLinksFr"
                            label="Media and Resource Links (French)"
                            value={value?.mediaAndResourceLinksFr}
                            error={error?.mediaAndResourceLinksFr}
                            onChange={setFieldValue}
                        />
                    )}
                </div>
                <div className={styles.inline}>
                    <TextInput
                        className={styles.input}
                        name="implementingEntityEn"
                        label="Implementing Entity"
                        value={value?.implementingEntityEn}
                        inputSectionClassName={styles.inputSection}
                        error={error?.implementingEntityEn}
                        onChange={setFieldValue}
                    />
                    {frenchAvailable && (
                        <TextInput
                            className={styles.input}
                            name="implementingEntityFr"
                            label="Implementing Entity (French)"
                            value={value?.implementingEntityFr}
                            inputSectionClassName={styles.inputSection}
                            error={error?.implementingEntityFr}
                            onChange={setFieldValue}
                        />
                    )}
                </div>
                <div className={styles.inline}>
                    <MultiSelectInput
                        className={styles.input}
                        name="countries"
                        options={countries}
                        inputSectionClassName={styles.inputSection}
                        label="Countries"
                        value={value?.countries}
                        error={getErrorString(error?.countries)}
                        onChange={setFieldValue}
                        keySelector={countryKeySelector}
                        labelSelector={countryLabelSelector}
                        disabled={optionsLoading}
                    />
                    <SelectInput
                        className={styles.input}
                        name="type"
                        label="Type"
                        inputSectionClassName={styles.inputSection}
                        options={types}
                        value={value?.type}
                        error={error?.type}
                        onChange={setFieldValue}
                        keySelector={typeEnumKeySelector}
                        labelSelector={typeEnumLabelSelector}
                    />
                </div>
                <div className={styles.inline}>
                    <MultiSelectInput
                        className={_cs(styles.input, styles.multiSelect)}
                        name="driversOfDisplacement"
                        label="Drivers of displacement"
                        inputSectionClassName={styles.inputSection}
                        options={driversOfDisplacements}
                        keySelector={driversOfDisplacementKeySelector}
                        labelSelector={driversOfDisplacementLabelSelector}
                        value={value?.driversOfDisplacement}
                        error={getErrorString(error?.driversOfDisplacement)}
                        onChange={setFieldValue}
                        disabled={optionsLoading}
                    />
                    <SelectInput
                        className={_cs(styles.input, styles.multiSelect)}
                        name="stage"
                        label="Stage"
                        options={stages}
                        inputSectionClassName={styles.inputSection}
                        value={value?.stage}
                        error={error?.stage}
                        keySelector={stageKeySelector}
                        labelSelector={stageLabelSelector}
                        onChange={setFieldValue}
                        disabled={optionsLoading}
                    />
                </div>
                <MultiSelectInput
                    name="focusArea"
                    label="Focus Area"
                    options={focusAreas}
                    value={value?.focusArea}
                    inputSectionClassName={styles.inputSection}
                    error={getErrorString(error?.focusArea)}
                    keySelector={focusAreaKeySelector}
                    labelSelector={focusAreaLabelSelector}
                    className={_cs(styles.input, styles.multiSelect)}
                    onChange={setFieldValue}
                    disabled={optionsLoading}
                />
                <MultiSelectInput
                    name="tags"
                    label="Tags"
                    options={tags}
                    value={value?.tags}
                    inputSectionClassName={styles.inputSection}
                    error={getErrorString(error?.tags)}
                    keySelector={tagsKeySelector}
                    className={_cs(styles.input, styles.multiSelect)}
                    labelSelector={tagsLabelSelector}
                    onChange={setFieldValue}
                    disabled={optionsLoading}
                />
                <div className={styles.inline}>
                    <NumberInput
                        className={styles.input}
                        name="startYear"
                        label="Start date"
                        value={value?.startYear}
                        error={error?.startYear}
                        onChange={setFieldValue}
                        inputSectionClassName={styles.inputSection}
                    />
                    <NumberInput
                        className={styles.input}
                        name="endYear"
                        label="End year"
                        inputSectionClassName={styles.inputSection}
                        value={value?.endYear}
                        error={error?.endYear}
                        onChange={setFieldValue}
                    />
                </div>
                <FileInput
                    name="image"
                    label="Cover Image"
                    title="Upload a cover image"
                    value={value?.image}
                    error={error?.image}
                    onChange={setFieldValue}
                    accept="image/*"
                    overrideStatus
                >
                    Select Cover Image
                </FileInput>
                <HCaptcha
                    name="captcha"
                    onChange={setFieldValue}
                    label="Captcha"
                    error={error?.captcha}
                    elementRef={elementRef}
                    siteKey={hCaptchaKey}
                />
            </Modal>
        </form>
    );
}
export default AddGoodPractice;
