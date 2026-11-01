// Shared constants: this file must be IDENTICAL in edu-backend/src/constants and edu-frontend/src/constants.
// A server test fails if the two copies differ, so change both together.

export const GENDERS = Object.freeze({
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
});

export const GENDER_LIST = Object.values(GENDERS);
