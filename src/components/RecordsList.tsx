import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  Edit3, 
  MapPin, 
  Calendar, 
  Image as ImageIcon, 
  Download, 
  AlertTriangle, 
  Layers, 
  X,
  ExternalLink,
  SlidersHorizontal,
  FileSpreadsheet
} from 'lucide-react';
import { SurveyRecord, SurveySchema } from '../types/survey';

interface Props {
  records: SurveyRecord[];
  schema: SurveySchema;
  editingRecordId: number | null;
  onEditRecord: (record: SurveyRecord) => void;
  onDeleteRecord: (id: number) => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
}

export const RecordsList: React.FC<Props> = ({
  records,
  schema,
  editingRecordId,
  onEditRecord,
  onDeleteRecord,
  onExportExcel,
  onExportCSV,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [activeDetailRecord, setActiveDetailRecord] = useState<SurveyRecord | null>(null);

  // Extract unique sectors
  const sectors = Array.from(
    new Set(records.map((r) => r.sector).filter(Boolean))
  ) as string[];

  const filtered = records.filter((r) => {
    // Priority filter
    if (selectedPriority !== 'all' && r.priority !== selectedPriority) return false;
    // Sector filter
    if (selectedSector !== 'all' && r.sector !== selectedSector) return false;
    // Search text
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = (r.street_name || '').toLowerCase().includes(term);
      const matchNeighbor = (r.neighborhood || '').toLowerCase().includes(term);
      const matchSector = (r.sector || '').toLowerCase().includes(term);
      const matchSeq = String(r.seq).includes(term);
      if (!matchName && !matchNeighbor && !matchSector && !matchSeq) return false;
    }
    return true;
  });

  // KPI stats
  const totalCount = records.length;
  const highPriorityCount = records.filter((r) => r.priority === 'عالية').length;
  const damagedAreaSum = records.reduce((acc, r) => acc + (parseFloat(r.damaged_area) || 0), 0);
  const binsNeededSum = records.reduce(
    (acc, r) => acc + (parseInt(r.bins_240, 10) || 0) + (parseInt(r.bins_big, 10) || 0),
    0
  );

  return (
    <div className="space-y-4">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-blue-200 bg-white p-3.5 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 block">إجمالي المقاطع</span>
          <span className="text-xl sm:text-2xl font-black text-blue-700">{totalCount}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">مقطع شارع ممسوح</span>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-white p-3.5 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 block">أولوية عالية</span>
          <span className="text-xl sm:text-2xl font-black text-rose-600">{highPriorityCount}</span>
          <span className="text-[10px] text-rose-500 font-semibold block mt-0.5">تتطلب تدخلاً عاجلاً</span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-white p-3.5 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 block">إسفلت متضرر</span>
          <span className="text-xl sm:text-2xl font-black text-amber-700">{damagedAreaSum.toFixed(0)}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">متر مربع (م²)</span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-white p-3.5 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 block">حاويات مطلوبة</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-700">{binsNeededSum}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">حاوية نظافة</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث باسم الشارع، الحي، القطاع، أو رقم السجل..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pr-9 pl-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
            >
              <option value="all">كل الأولويات</option>
              <option value="عالية">عالية</option>
              <option value="متوسطة">متوسطة</option>
              <option value="منخفضة">منخفضة</option>
            </select>

            {sectors.length > 0 && (
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <option value="all">كل القطاعات</option>
                {sectors.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={onExportExcel}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition shrink-0"
              title="تصدير إلى Excel"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>نتائج العرض: <strong>{filtered.length}</strong> من أصل {totalCount} مقطع</span>
          <span>💡 اضغط على أي مقطع لعرض كامل تفاصيله أو تعديله</span>
        </div>
      </div>

      {/* Street Records List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 shadow-sm">
          <Layers className="mx-auto h-12 w-12 text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-600">لا توجد مقاطع مسجلة تطابق البحث</p>
          <p className="text-xs text-slate-400 mt-1">
            {records.length === 0
              ? 'قم بتعبئة استمارة المسح واضغط حفظ لتسجيل مقاطع الشوارع هنا'
              : 'جرّب تعديل مصطلحات البحث أو إزالة التصفية'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((record) => {
            const isEditing = editingRecordId === record._id;
            const priorityBadge =
              record.priority === 'عالية'
                ? 'bg-rose-100 text-rose-800 border-rose-200'
                : record.priority === 'متوسطة'
                ? 'bg-amber-100 text-amber-800 border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border-emerald-200';

            return (
              <div
                key={record._id}
                onClick={() => setActiveDetailRecord(record)}
                className={`group relative rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md cursor-pointer ${
                  isEditing
                    ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-300'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  
                  {/* Street & Location Details */}
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-mono font-bold text-xs shrink-0 mt-0.5">
                      #{record.seq}
                    </span>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">
                          {record.street_name || `شارع غير مسمى (${record.street_type || 'مقطع'})`}
                        </h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityBadge}`}>
                          {record.priority || 'منخفضة'}
                        </span>
                        {record.street_type && (
                          <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                            {record.street_type}
                          </span>
                        )}
                        {isEditing && (
                          <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-md animate-pulse">
                            قيد التحرير
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 mt-1.5">
                        {record.sector && <span>القطاع: <strong className="text-slate-700">{record.sector}</strong></span>}
                        {record.neighborhood && <span>الحي: <strong className="text-slate-700">{record.neighborhood}</strong></span>}
                        {record.survey_date && (
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {record.survey_date}
                          </span>
                        )}
                        {record.gps && (
                          <span className="flex items-center gap-1 font-mono text-blue-600">
                            <MapPin className="h-3 w-3" />
                            GPS
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Photo thumbnail & Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {record.photo && (
                      <img
                        src={record.photo}
                        alt="صورة المقطع"
                        className="h-11 w-11 rounded-lg object-cover border border-slate-200 shadow-sm"
                      />
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditRecord(record);
                      }}
                      className="rounded-lg p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                      title="تحرير السجل في النموذج"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`هل أنت متأكد من حذف المقطع رقم ${record.seq}؟`)) {
                          onDeleteRecord(record._id);
                        }
                      }}
                      className="rounded-lg p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="حذف المقطع"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record Full Details Modal */}
      {activeDetailRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" dir="rtl">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
            
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-mono font-bold text-sm">
                  #{activeDetailRecord.seq}
                </span>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {activeDetailRecord.street_name || 'مقطع شارع'}
                  </h3>
                  <span className="text-xs text-slate-500">
                    تاريخ المسح: {activeDetailRecord.survey_date || 'غير محدد'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onEditRecord(activeDetailRecord);
                    setActiveDetailRecord(null);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  تحرير
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailRecord(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              
              {/* Photo Zoom */}
              {activeDetailRecord.photo && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner">
                  <img
                    src={activeDetailRecord.photo}
                    alt="صورة مقطع الشارع"
                    className="w-full max-h-72 object-contain"
                  />
                </div>
              )}

              {/* Priority & Coordinates badge */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">أولوية التدخل:</span>
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                      activeDetailRecord.priority === 'عالية'
                        ? 'bg-rose-100 text-rose-800'
                        : activeDetailRecord.priority === 'متوسطة'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {activeDetailRecord.priority || 'منخفضة'}
                  </span>
                </div>

                {activeDetailRecord.gps && (
                  <a
                    href={`https://www.google.com/maps?q=${activeDetailRecord.gps}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {activeDetailRecord.gps}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Detailed Schema Sections & Values */}
              <div className="space-y-4">
                {schema.sections.map((sec) => {
                  const filledFields = sec.fields.filter(
                    (f) =>
                      f.type !== 'photo' &&
                      activeDetailRecord[f.id] !== undefined &&
                      activeDetailRecord[f.id] !== ''
                  );

                  if (filledFields.length === 0) return null;

                  return (
                    <div key={sec.id} className="rounded-xl border border-slate-200 bg-white p-3.5">
                      <h4 className="text-xs font-bold text-blue-700 border-b border-slate-100 pb-1.5 mb-2.5">
                        {sec.title}
                      </h4>
                      <div className="grid gap-2 sm:grid-cols-2 text-xs">
                        {filledFields.map((f) => (
                          <div key={f.id} className="flex justify-between gap-2 border-b border-slate-50 py-1">
                            <span className="text-slate-500 font-medium">{f.label}:</span>
                            <span className="font-bold text-slate-800 text-left">
                              {String(activeDetailRecord[f.id])}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-3.5 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveDetailRecord(null)}
                className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-bold text-white hover:bg-slate-900"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
