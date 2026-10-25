import { DEFAULT_SURVEY_SCHEMA } from '../data/defaultSchema';
import { SurveyRecord, SurveySchema } from '../types/survey';

const SCHEMA_KEY = 'salamieh_survey_schema_v3';
const RECORDS_KEY = 'salamieh_survey_records_v2';
const PASSWORD_KEY = 'salamieh_admin_password';
export const DEFAULT_ADMIN_PASSWORD = '11223344';

export function getStoredSchema(): SurveySchema {
  try {
    const raw = localStorage.getItem(SCHEMA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading schema from storage:', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_SURVEY_SCHEMA));
}

export function saveStoredSchema(schema: SurveySchema): void {
  try {
    localStorage.setItem(SCHEMA_KEY, JSON.stringify(schema));
  } catch (e) {
    console.error('Error saving schema:', e);
  }
}

export function getStoredRecords(): SurveyRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading records:', e);
  }
  return [];
}

export function saveStoredRecords(records: SurveyRecord[]): void {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving records:', e);
  }
}

export function getAdminPassword(): string {
  return localStorage.getItem(PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
}

export function setAdminPassword(newPw: string): void {
  localStorage.setItem(PASSWORD_KEY, newPw);
}

export function resetSchemaToDefault(): SurveySchema {
  const def = JSON.parse(JSON.stringify(DEFAULT_SURVEY_SCHEMA));
  saveStoredSchema(def);
  return def;
}
