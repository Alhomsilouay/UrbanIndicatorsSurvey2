import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, X, Check, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentValue: string;
  onSelectCoordinates: (coords: string) => void;
}

export const GpsHelperModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentValue,
  onSelectCoordinates,
}) => {
  const [manualInput, setManualInput] = useState(currentValue || '');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleApply = () => {
    setErrorMsg('');
    const trimmed = manualInput.trim();
    if (!trimmed) {
      onSelectCoordinates('');
      onClose();
      return;
    }

    // Match "35.0116, 37.0530" or "35.0116 37.0530"
    const match = trimmed.match(/^(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)$/);
    if (!match) {
      setErrorMsg('الصيغة غير صحيحة. يجب أن تكون: خط العرض, خط الطول (مثال: 35.011600, 37.053000)');
      return;
    }

    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);

    if (lat < -90 || lat > 90) {
      setErrorMsg('خط العرض يجب أن يكون بين -90 و 90');
      return;
    }
    if (lng < -180 || lng > 180) {
      setErrorMsg('خط الطول يجب أن يكون بين -180 و 180');
      return;
    }

    onSelectCoordinates(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    onClose();
  };

  const openGoogleMaps = () => {
    // Default center on Salamieh city coordinates: 35.0116, 37.0530
    let url = 'https://www.google.com/maps/@35.0116,37.0530,15z';
    if (manualInput.includes(',')) {
      const parts = manualInput.split(',');
      if (parts.length === 2) {
        url = `https://www.google.com/maps?q=${parts[0].trim()},${parts[1].trim()}`;
      }
    }
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" dir="rtl">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2 text-blue-700">
            <MapPin className="h-5 w-5" />
            <h3 className="font-bold text-base">إدخال إحداثيات GPS يدوياً</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            يمكنك إدخال الإحداثيات الجغرافية لمقطع الشارع يدوياً أو نسخها مباشرة من تطبيق الخرائط (Google Maps).
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              الإحداثيات (خط العرض، خط الطول):
            </label>
            <input
              type="text"
              dir="ltr"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="35.011600, 37.053000"
              className="w-full rounded-xl border border-slate-300 p-3 text-sm font-mono text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
            {errorMsg && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <Navigation className="h-3.5 w-3.5 text-blue-600" />
              طريقة النسخ من Google Maps:
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              ١. افتح Google Maps واضغط مطولاً على موقع الشارع.<br />
              ٢. انسخ الأرقام الظاهرة في شريط البحث أو أسفل الشاشة.<br />
              ٣. الصقها هنا واضغط «تأكيد الإحداثيات».
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={openGoogleMaps}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              فتح Google Maps
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition"
            >
              <Check className="h-3.5 w-3.5" />
              تأكيد الإحداثيات
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
