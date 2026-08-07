import { requireRuntimeConfig } from '#utils/runtimeConfig';

// NOTE: required, not optional -- the widget only renders when a sitekey is present
// (see #components/HCaptcha) and the good-practice form marks `captcha` as a
// required field, so without a sitekey that form can never be submitted.
// eslint-disable-next-line import/prefer-default-export
export const hCaptchaKey = requireRuntimeConfig('REACT_APP_HCAPTCHA_SITEKEY', process.env.REACT_APP_HCAPTCHA_SITEKEY);
