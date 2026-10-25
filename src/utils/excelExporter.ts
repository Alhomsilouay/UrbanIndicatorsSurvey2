import * as XLSX from 'xlsx';
import { SurveyRecord, SurveySchema } from '../types/survey';

export function exportSurveyToExcel(records: SurveyRecord[], schema: SurveySchema): boolean {
  if (records.length === 0) {
    return false;
  }

  // Collect active non-photo fields
  const cols: { id: string; label: string }[] = [];
  const seen = new Set<string>();

  schema.sections.forEach((sec) => {
    sec.fields.forEach((f) => {
      if (f.type === 'photo') return;
      if (seen.has(f.id)) return;
      seen.add(f.id);
      cols.push({ id: f.id, label: f.label });
    });
  });

  const header = ['المتسلسل', ...cols.map((c) => c.label)];
  const rows = records.map((r) => [r.seq ?? '', ...cols.map((c) => r[c.id] ?? '')]);

  const dataSheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  dataSheet['!cols'] = header.map((h) => ({ wch: Math.max(14, String(h).length + 4) }));

  // Summary computations
  const total = records.length;
  const cnt = (k: string, v: string) => records.filter((r) => r[k] === v).length;
  const bad = (k: string) => records.filter((r) => ['سيئ', 'سيئ جداً'].includes(r[k])).length;
  const sumN = (k: string) => records.reduce((s, r) => s + (parseFloat(r[k]) || 0), 0);

  const summary = [
    ['المؤشر', 'القيمة'],
    ['إجمالي المقاطع الممسوحة', total],
    ['', ''],
    ['أولوية تدخل عالية (حرجة)', cnt('priority', 'عالية')],
    ['أولوية تدخل متوسطة', cnt('priority', 'متوسطة')],
    ['أولوية تدخل منخفضة (مستقرة)', cnt('priority', 'منخفضة')],
    ['', ''],
    ['حساسية موقع عالية', cnt('sensitivity', 'عالي')],
    ['حساسية موقع متوسطة', cnt('sensitivity', 'متوسط')],
    ['حساسية موقع منخفضة', cnt('sensitivity', 'منخفض')],
    ['', ''],
    ['كثافة حركة مرورية عالية', cnt('traffic', 'عالي')],
    ['كثافة حركة مرورية متوسطة', cnt('traffic', 'متوسط')],
    ['كثافة حركة مرورية منخفضة', cnt('traffic', 'منخفض')],
    ['', ''],
    ['رصف شارع متضرر (سيئ / سيئ جداً)', bad('pavement')],
    ['أرصفة مشاة متضررة (سيئ / سيئ جداً)', bad('sidewalk')],
    ['جودة إنارة ضعيفة (سيئ / سيئ جداً)', bad('lighting')],
    ['نظافة متدنية (سيئ / سيئ جداً)', bad('cleanness')],
    ['تصريف مياه أمطار سيئ', bad('drainage')],
    ['تلوث بصري مرتفع', bad('visual_pollution')],
    ['مستوى ضوضاء مرتفع', cnt('noise_level', 'عالي جداً') + cnt('noise_level', 'عالي')],
    ['جودة هواء وروائح سيئة', bad('air')],
    ['', ''],
    ['مخلفات بناء ونفايات (كثيراً)', cnt('waste', 'يوجد كثيراً')],
    ['مخلفات بناء ونفايات (قليلاً)', cnt('waste', 'يوجد قليلاً')],
    ['لا يوجد مخلفات بناء', cnt('waste', 'لا يوجد')],
    ['', ''],
    ['مقاطع مشمولة بشبكة الصرف الصحي', cnt('sewage', 'يوجد')],
    ['مقاطع تفتقر لشبكة الصرف الصحي', cnt('sewage', 'لا يوجد')],
    ['مقاطع بها دورات مياه عامة', cnt('public_toilets', 'يوجد')],
    ['مقاطع بها مقاعد جلوس عامة', cnt('benches', 'يوجد')],
    ['مقاطع بها نقاط شحن كهربائي', cnt('ev_charging', 'يوجد')],
    ['مقاطع بها مواقف باصات', cnt('bus_stops', 'يوجد')],
    ['', ''],
    ['إجمالي مساحة الإسفلت المتضررة (م²)', sumN('damaged_area')],
    ['إجمالي طول الأرصفة المتضررة (م)', sumN('damaged_sidewalk')],
    ['إجمالي حاويات 240 لتر المطلوبة', sumN('bins_240')],
    ['إجمالي الحاويات الكبيرة المطلوبة', sumN('bins_big')],
    ['إجمالي الحاويات المتوفرة حالياً', sumN('bins_avail')],
    ['متوسط نسبة الظل في الشوارع (%)', total ? (sumN('shade_ratio') / total).toFixed(1) : '0'],
    ['', ''],
    ['تاريخ التصدير', new Date().toLocaleDateString('ar-SY') + ' ' + new Date().toLocaleTimeString('ar-SY')],
    ['الجهة المشرفة', 'المسح الميداني الخدمي — سلمية | ALSUC (alhomsilouay@gmail.com)'],
  ];

  const sumSheet = XLSX.utils.aoa_to_sheet(summary);
  sumSheet['!cols'] = [{ wch: 42 }, { wch: 22 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, dataSheet, 'Data_المسح');
  XLSX.utils.book_append_sheet(wb, sumSheet, 'Summary_الإحصاء');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `salamieh_survey_${dateStr}.xlsx`);
  return true;
}

export function exportSurveyToCSV(records: SurveyRecord[], schema: SurveySchema): boolean {
  if (records.length === 0) return false;

  const cols: { id: string; label: string }[] = [];
  const seen = new Set<string>();

  schema.sections.forEach((sec) =>
    sec.fields.forEach((f) => {
      if (f.type === 'photo') return;
      if (seen.has(f.id)) return;
      seen.add(f.id);
      cols.push({ id: f.id, label: f.label });
    })
  );

  const header = ['المتسلسل', ...cols.map((c) => c.label)];
  const rows = records.map((r) => [r.seq ?? '', ...cols.map((c) => r[c.id] ?? '')]);
  const csvContent = [header, ...rows]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `salamieh_survey_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

export function exportSurveyToBackupJSON(records: SurveyRecord[], schema: SurveySchema): void {
  const backupData = {
    app: 'ALSUC_Salamieh_Survey',
    version: 3,
    exportedAt: new Date().toISOString(),
    schema,
    records,
  };

  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `salamieh_survey_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
