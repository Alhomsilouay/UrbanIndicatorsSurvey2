import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  MapPin, 
  Save, 
  RotateCcw, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Image as ImageIcon, 
  Trash2, 
  ExternalLink,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { SurveyField, SurveyRecord, SurveySchema } from '../types/survey';
import { compressImageFile } from '../utils/imageCompressor';
import { computePriority } from '../utils/priority';
import { GpsHelperModal } from './GpsHelperModal';

interface Props {
  schema: SurveySchema;
  editingRecord: SurveyRecord | null;
  onSaveRecord: (data: Record<string, any>, isUpdate: boolean) => void;
  onCancelEdit: () => void;
  onToast: (msg: string) => void;
}

export const SurveyForm: React.FC<Props> = ({
  schema,
  editingRecord,
  onSaveRecord,
  onCancelEdit,
  onToast,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [activeSecIndex, setActiveSecIndex] = useState(0);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [showGpsHelper, setShowGpsHelper] = useState(false);
  const [photoInfo, setPhotoInfo] = useState<{ origKB: number; compKB: number; saved: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize or restore form data
  useEffect(() => {
    if (editingRecord) {
      setFormData({ ...editingRecord });
      if (editingRecord.photo) {
        const compKB = Math.round((editingRecord.photo.length * 0.75) / 1024);
        setPhotoInfo({ origKB: compKB, compKB, saved: 0 });
      } else {
        setPhotoInfo(null);
      }
    } else {
      // New record defaults
      const initial: Record<string, any> = {
        survey_date: new Date().toISOString().slice(0, 10),
      };
      setFormData(initial);
      setPhotoInfo(null);
      setGpsAccuracy(null);
    }
  }, [editingRecord]);

  const handleChange = (fieldId: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [fieldId]: value };
      // If priority is not explicitly set, calculate it automatically
      const autoPriority = computePriority(updated);
      return {
        ...updated,
        computed_priority: autoPriority,
      };
    });
  };

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      onToast('⚠ جهازك أو المتصفح لا يدعم GPS، استخدم الإدخال اليدوي');
      setShowGpsHelper(true);
      return;
    }

    setIsGpsLoading(true);
    onToast('⏳ جارٍ الاتصال بالأقمار الصناعية وتحديد الموقع...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGpsLoading(false);
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        const acc = Math.round(pos.coords.accuracy);
        setGpsAccuracy(acc);

        handleChange('gps', `${lat}, ${lng}`);

        if (acc <= 20) {
          onToast(`✅ تم التقاط الموقع بدقة عالية (${acc}م)`);
        } else if (acc <= 80) {
          onToast(`✅ تم التقاط الموقع (دقة متوسطة: ${acc}م)`);
        } else {
          onToast(`⚠ الموقع تقريبي (دقة: ${acc}م). يفضل الوقوف في مكان مكشوف.`);
        }
      },
      (err) => {
        setIsGpsLoading(false);
        let msg = '⚠ تعذر تحديد الموقع: ';
        if (err.code === 1) msg += 'يرجى السماح بصلاحية الموقع (Location Permission).';
        else if (err.code === 2) msg += 'إشارة GPS غير متوفرة.';
        else msg += 'انتهت المهلة.';
        onToast(msg);
        setShowGpsHelper(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onToast('⏳ جارٍ ضغط الصورة ومعالجتها...');
    try {
      const res = await compressImageFile(file, 1280, 0.72);
      handleChange('photo', res.dataUrl);

      const origKB = Math.round(res.originalSize / 1024);
      const compKB = Math.round(res.compressedSize / 1024);
      setPhotoInfo({
        origKB,
        compKB,
        saved: res.savedPercentage,
      });

      if (res.savedPercentage > 5) {
        onToast(`✅ تم ضغط الصورة: ${origKB}KB ← ${compKB}KB (توفير ${res.savedPercentage}%)`);
      } else {
        onToast(`✅ تم حفظ الصورة (${compKB}KB)`);
      }
    } catch {
      onToast('⚠ تعذر معالجة الصورة');
    }
  };

  const handleRemovePhoto = () => {
    handleChange('photo', '');
    setPhotoInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onToast('تم حذف الصورة من النموذج');
  };

  const handleSave = (isSeparateNew: boolean = false) => {
    if (!formData.street_type) {
      onToast('⚠ يرجى اختيار نوع الشارع في القسم الأول');
      setActiveSecIndex(0);
      return;
    }

    const payload = { ...formData };
    if (!payload.priority) {
      payload.priority = computePriority(payload);
    }

    onSaveRecord(payload, editingRecord !== null && !isSeparateNew);
    
    // Reset local state if not editing
    if (!editingRecord || isSeparateNew) {
      setFormData({ survey_date: new Date().toISOString().slice(0, 10) });
      setPhotoInfo(null);
      setGpsAccuracy(null);
    }
  };

  const handleClear = () => {
    if (editingRecord) {
      if (confirm('هل تريد إلغاء تحرير هذا السجل وتفريغ النموذج؟')) {
        onCancelEdit();
        setFormData({ survey_date: new Date().toISOString().slice(0, 10) });
        setPhotoInfo(null);
        setGpsAccuracy(null);
        onToast('تم إلغاء التحرير');
      }
      return;
    }
    setFormData({ survey_date: new Date().toISOString().slice(0, 10) });
    setPhotoInfo(null);
    setGpsAccuracy(null);
    onToast('تم تفريغ النموذج');
  };

  const currentSection = schema.sections[activeSecIndex] || schema.sections[0];
  const autoPriority = computePriority(formData);

  return (
    <div className="space-y-4">
      
      {/* Edit Mode Alert Banner */}
      {editingRecord && (
        <div className="sticky top-16 z-20 rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-lg shadow-amber-500/10 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white font-mono text-xs">
                #{editingRecord.seq}
              </span>
              <span>أنت في وضع التحرير — السجل رقم {editingRecord.seq}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSave(false)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700 shadow-sm transition"
              >
                <Save className="h-3.5 w-3.5" />
                تحديث السجل
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-50 shadow-sm transition"
              >
                حفظ كـ جديد
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                className="rounded-xl bg-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300 transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Section Jump Tabs */}
      <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm overflow-x-auto">
        <div className="flex gap-1.5 min-w-max">
          {schema.sections.map((sec, idx) => {
            const isActive = idx === activeSecIndex;
            // Check if section has some filled data
            const hasData = sec.fields.some((f) => formData[f.id] && formData[f.id] !== '');

            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSecIndex(idx)}
                className={`relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : hasData
                    ? 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{sec.title.split('.')[0] || idx + 1}</span>
                <span className="hidden sm:inline">{sec.title.split('. ')[1] || sec.title}</span>
                {hasData && !isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        
        {/* Section Title & Progress */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
          <div>
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
              القسم {activeSecIndex + 1} من {schema.sections.length}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              {currentSection.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={activeSecIndex === 0}
              onClick={() => setActiveSecIndex((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
              title="القسم السابق"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={activeSecIndex === schema.sections.length - 1}
              onClick={() => setActiveSecIndex((p) => Math.min(schema.sections.length - 1, p + 1))}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
              title="القسم التالي"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Section Fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          {currentSection.fields.map((field) => (
            <div
              key={field.id}
              className={field.type === 'textarea' || field.type === 'photo' || field.type === 'gps' ? 'sm:col-span-2' : ''}
            >
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {field.label}
                {field.required && <span className="text-rose-500 mr-1">*</span>}
              </label>

              {/* GPS Field */}
              {field.type === 'gps' && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      dir="ltr"
                      readOnly
                      placeholder="خط العرض, خط الطول"
                      value={formData[field.id] || ''}
                      className="flex-1 min-w-[180px] rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs font-mono text-slate-800"
                    />
                    <button
                      type="button"
                      disabled={isGpsLoading}
                      onClick={handleCaptureGPS}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition disabled:opacity-60"
                    >
                      <MapPin className="h-4 w-4" />
                      {isGpsLoading ? 'جارٍ الالتقاط...' : 'التقاط GPS'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowGpsHelper(true)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      ✏️ يدوي
                    </button>
                    {formData[field.id] && (
                      <a
                        href={`https://www.google.com/maps?q=${formData[field.id]}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-slate-50 transition"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        الخريطة
                      </a>
                    )}
                  </div>
                  {gpsAccuracy !== null && (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span>دقة الإشارة المقاسة: {gpsAccuracy} متر</span>
                    </div>
                  )}
                </div>
              )}

              {/* Photo Field */}
              {field.type === 'photo' && (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoSelect}
                    className="hidden"
                    id={`photo_input_${field.id}`}
                  />

                  {!formData[field.id] ? (
                    <label
                      htmlFor={`photo_input_${field.id}`}
                      className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-6 hover:bg-blue-50/50 hover:border-blue-300 cursor-pointer transition"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <Camera className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        التقاط صورة المقطع بالكاميرا أو اختيار من المعرض
                      </span>
                      <span className="text-[11px] text-slate-400">
                        تُضغط الصورة تلقائياً لسرعة الأداء وتوفير سعة التخزين
                      </span>
                    </label>
                  ) : (
                    <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-2 overflow-hidden max-w-sm">
                      <img
                        src={formData[field.id]}
                        alt="معاينة المقطع"
                        className="rounded-xl w-full h-48 object-cover shadow-inner"
                      />
                      <div className="mt-2 flex items-center justify-between px-1">
                        {photoInfo && (
                          <span className="text-[11px] text-slate-600 font-mono">
                            📷 {photoInfo.compKB} KB {photoInfo.saved > 0 && `(توفير ${photoInfo.saved}%)`}
                          </span>
                        )}
                        <div className="flex gap-2">
                          <label
                            htmlFor={`photo_input_${field.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            تبديل
                          </label>
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Select or Scale or YesNo */}
              {(field.type === 'select' ||
                field.type === 'scale' ||
                field.type === 'scale_ext' ||
                field.type === 'yesno') && (
                <select
                  value={formData[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="">— اختر القيمة —</option>
                  {(field.options || []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}

              {/* Textarea */}
              {field.type === 'textarea' && (
                <textarea
                  rows={2}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  placeholder={`اكتب ملاحظاتك حول ${field.label}...`}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              )}

              {/* Integer */}
              {field.type === 'integer' && (
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={formData[field.id] ?? ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              )}

              {/* Decimal Number */}
              {field.type === 'number' && (
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  value={formData[field.id] ?? ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  placeholder="0.0"
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              )}

              {/* Date */}
              {field.type === 'date' && (
                <input
                  type="date"
                  value={formData[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              )}

              {/* Standard text */}
              {field.type === 'text' && (
                <input
                  type="text"
                  value={formData[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  placeholder={`أدخل ${field.label}`}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              )}
            </div>
          ))}
        </div>

        {/* Priority Assistant indicator box */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-700">أولوية التدخل المحسوبة تلقائياً:</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                autoPriority === 'عالية'
                  ? 'bg-rose-100 text-rose-800'
                  : autoPriority === 'متوسطة'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {autoPriority}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            تحسب بناءً على حالة الرصف، الأرصفة، الإنارة، النظافة، الحساسية، والشبكات.
          </span>
        </div>

        {/* Section Navigation Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            disabled={activeSecIndex === 0}
            onClick={() => setActiveSecIndex((p) => Math.max(0, p - 1))}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="h-4 w-4" />
            القسم السابق
          </button>

          {activeSecIndex < schema.sections.length - 1 ? (
            <button
              type="button"
              onClick={() => setActiveSecIndex((p) => Math.min(schema.sections.length - 1, p + 1))}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-800 px-5 py-2 text-xs font-bold text-white hover:bg-slate-900 shadow-sm"
            >
              التالي: {schema.sections[activeSecIndex + 1]?.title.split('. ')[1] || 'القسم التالي'}
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : (
            <span className="text-xs font-semibold text-emerald-600">✓ وصلت لنهاية أقسام المسح</span>
          )}
        </div>

      </div>

      {/* Main Action Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => handleSave(false)}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 px-6 font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition"
        >
          <Save className="h-5 w-5" />
          {editingRecord ? '💾 تحديث المقطع الممسوح' : '💾 حفظ مقطع الشارع في السجل'}
        </button>

        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 py-3.5 px-5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
        >
          <RotateCcw className="h-4 w-4" />
          {editingRecord ? 'إلغاء التحرير' : 'تفريغ الاستمارة'}
        </button>
      </div>

      {/* Manual GPS Input Modal */}
      <GpsHelperModal
        isOpen={showGpsHelper}
        onClose={() => setShowGpsHelper(false)}
        currentValue={formData.gps || ''}
        onSelectCoordinates={(coords) => handleChange('gps', coords)}
      />

    </div>
  );
};
