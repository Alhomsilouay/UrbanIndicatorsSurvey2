export type FieldType =
  | 'text'
  | 'integer'
  | 'number'
  | 'select'
  | 'scale'
  | 'scale_ext'
  | 'yesno'
  | 'date'
  | 'textarea'
  | 'gps'
  | 'photo';

export interface SurveyField {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
}

export interface SurveySection {
  id: string;
  title: string;
  fields: SurveyField[];
}

export interface SurveySchema {
  version: number;
  sections: SurveySection[];
}

export interface SurveyRecord {
  _id: number;
  seq: number;
  _created: string;
  _updated?: string;
  priority?: 'عالية' | 'متوسطة' | 'منخفضة' | string;
  [key: string]: any;
}

export const SCALE_OPTIONS = [
  'جيد جداً',
  'جيد',
  'متوسط',
  'سيئ',
  'سيئ جداً',
];

export const SCALE_EXT_OPTIONS = [
  'جيد جداً',
  'جيد',
  'متوسط',
  'سيئ',
  'سيئ جداً',
  'لا يوجد',
  'لا ينطبق',
];

export const YESNO_OPTIONS = ['يوجد', 'لا يوجد'];

export const PRIORITY_OPTIONS = ['عالية', 'متوسطة', 'منخفضة'];
