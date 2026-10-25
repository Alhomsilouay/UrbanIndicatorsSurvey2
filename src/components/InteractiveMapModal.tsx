import React, { useState } from 'react';
import { Map, MapPin, Navigation, ExternalLink, X, Filter } from 'lucide-react';
import { SurveyRecord } from '../types/survey';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  records: SurveyRecord[];
  onSelectRecord: (record: SurveyRecord) => void;
}

export const InteractiveMapModal: React.FC<Props> = ({
  isOpen,
  onClose,
  records,
  onSelectRecord,
}) => {
  const [filterPriority, setFilterPriority] = useState<string>('all');

  if (!isOpen) return null;

  // Filter records that have GPS coordinates
  const gpsRecords = records.filter((r) => {
    if (!r.gps || typeof r.gps !== 'string') return false;
    const parts = r.gps.split(',');
    return parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]));
  });

  const filtered = gpsRecords.filter((r) => {
    if (filterPriority === 'all') return true;
    return r.priority === filterPriority;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" dir="rtl">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-2 text-slate-800">
            <Map className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-base font-bold">خريطة مقاطع مسح سلمية (GIS)</h2>
              <p className="text-xs text-slate-500">
                عرض المقاطع الميدانية ذات الإحداثيات ({filtered.length} مقطع مسجل)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700">تصفية حسب الأولوية:</span>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs"
              >
                <option value="all">جميع المقاطع ({gpsRecords.length})</option>
                <option value="عالية">أولوية عالية فقط</option>
                <option value="متوسطة">أولوية متوسطة فقط</option>
                <option value="منخفضة">أولوية منخفضة فقط</option>
              </select>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 font-medium text-rose-700">
                <span className="h-3 w-3 rounded-full bg-rose-500 inline-block"></span>
                عالية
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-amber-700">
                <span className="h-3 w-3 rounded-full bg-amber-500 inline-block"></span>
                متوسطة
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block"></span>
                منخفضة
              </span>
            </div>
          </div>

          {/* List of Street Points with Map links */}
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <MapPin className="mx-auto h-12 w-12 text-slate-300 mb-2" />
              <p className="text-sm font-semibold">لا توجد مقاطع بإحداثيات GPS مسجلة تطابق التصفية</p>
              <p className="text-xs mt-1">التقط إحداثيات الشارع عند تعبئة استمارة المسح لعرضها هنا</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map((r) => {
                const [lat, lng] = r.gps.split(',').map((s: string) => s.trim());
                const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

                const priorityColor =
                  r.priority === 'عالية'
                    ? 'border-rose-200 bg-rose-50/50 hover:border-rose-300'
                    : r.priority === 'متوسطة'
                    ? 'border-amber-200 bg-amber-50/50 hover:border-amber-300'
                    : 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-300';

                const badgeColor =
                  r.priority === 'عالية'
                    ? 'bg-rose-100 text-rose-800'
                    : r.priority === 'متوسطة'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800';

                return (
                  <div
                    key={r._id}
                    className={`rounded-xl border p-4 transition shadow-sm ${priorityColor}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">
                            {r.street_name || `مقطع #${r.seq}`}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                            {r.priority || 'غير محدد'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {r.sector ? `القطاع: ${r.sector}` : ''} {r.neighborhood ? `• الحي: ${r.neighborhood}` : ''}
                        </p>
                      </div>

                      <span className="text-xs font-mono font-bold text-slate-400">
                        #{r.seq}
                      </span>
                    </div>

                    <div className="rounded-lg bg-white/80 p-2 text-xs font-mono text-slate-600 mb-3 flex items-center justify-between border border-slate-200/60" dir="ltr">
                      <span>{lat}, {lng}</span>
                      <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        فتح في الخرائط
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectRecord(r);
                          onClose();
                        }}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        عرض وتحرير
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
