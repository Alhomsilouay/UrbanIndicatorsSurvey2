import React, { useState } from 'react';
import { 
  Download, 
  Smartphone, 
  Share2, 
  CheckCircle2, 
  ExternalLink, 
  X, 
  Sparkles, 
  Layers, 
  Terminal, 
  Copy, 
  Check
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidApkModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'instant' | 'apk' | 'capacitor'>('instant');
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const currentUrl = window.location.href;

  const copyAppUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const downloadApkConfigZip = () => {
    // Generate a downloadable instructions & configuration bundle
    const manifestJson = {
      name: 'المسح الميداني الخدمي — سلمية | ALSUC',
      short_name: 'مسح سلمية',
      description: 'تطبيق المسح الميداني الخدمي لمدينة سلمية لتوثيق مقاطع الشوارع والبنية التحتية',
      start_url: '/',
      display: 'standalone',
      background_color: '#f4f6fa',
      theme_color: '#1d6fb8',
      orientation: 'portrait',
      icons: [
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
    };

    const configText = `دليل بناء ملف APK لتطبيق مسح سلمية الميداني:
==========================================
الرابط المباشر للتطبيق: ${currentUrl}

خطوات تحويل التطبيق لملف APK خلال دقيقة واحدة:
1. افتح موقع https://www.pwabuilder.com
2. الصق رابط التطبيق أعلاه واضغط Start.
3. اضغط على زر "Package for Android" ثم اختر "Generate APK".
4. ستحصل فوراً على ملف تثبيت بصيغة .apk جاهز للنقل عبر واتساب وتثبيته على أي جهاز أندرويد.

بيانات الـ Manifest:
${JSON.stringify(manifestJson, null, 2)}
`;

    const blob = new Blob([configText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'salamieh_apk_instructions.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-blue-700 to-blue-900 px-6 py-4 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">تثبيت التطبيق على هاتف أندرويد (Android APK)</h2>
              <p className="text-xs text-blue-100">تحويل المسح الميداني لسلمية إلى تطبيق أندرويد يعمل أوفلاين</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-blue-200 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3">
          <button
            onClick={() => setActiveTab('instant')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'instant'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            التثبيت المباشر الفوري (WebAPK)
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'apk'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="h-4 w-4" />
            توليد ملف APK قابل للإرسال
          </button>

          <button
            onClick={() => setActiveTab('capacitor')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'capacitor'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="h-4 w-4" />
            بناء Capacitor
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'instant' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-sm leading-relaxed">
                    <strong className="block font-bold mb-1">الخيار الأسرع والأنسب لأجهزة أندرويد (نظام WebAPK):</strong>
                    يدعم التطبيق معيار الـ PWA الرسمي للأندرويد، حيث يقوم نظام أندرويد ومتصفح Chrome تلقائياً ببناء وتثبيت حزمة <strong>APK أصلية</strong> على الهاتف بضغطة واحدة، تظهر في درج التطبيقات والشاشة الرئيسية وتعمل بدون إنترنت بالكامل!
                  </div>
                </div>
              </div>

              {isInstalled ? (
                <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
                  <CheckCircle2 className="h-6 w-6 text-blue-600" />
                  <div>
                    <h4 className="font-bold">التطبيق مثبت حالياً على هذا الجهاز!</h4>
                    <p className="text-xs text-blue-700">أنت تعمل الآن في وضع التطبيق المستقل بنجاح.</p>
                  </div>
                </div>
              ) : isInstallable ? (
                <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 text-center">
                  <h4 className="text-base font-bold text-blue-950 mb-2">جهازك جاهز للتثبيت الفوري</h4>
                  <p className="text-xs text-blue-700 mb-4">اضغط على الزر أدناه وسيطلب منك أندرويد تثبيت تطبيق مسح سلمية فوراً:</p>
                  <button
                    onClick={install}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition"
                  >
                    <Smartphone className="h-5 w-5" />
                    تثبيت التطبيق على هاتف أندرويد الآن
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm">خطوات التثبيت من الهاتف عبر متصفح Chrome:</h4>
                  <ol className="list-decimal list-inside space-y-2.5 text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <li className="leading-relaxed">
                      افتح رابط التطبيق على هاتفك الأندرويد في متصفح <strong>Google Chrome</strong>.
                    </li>
                    <li className="leading-relaxed">
                      اضغط على قائمة المتصفح <strong>( الثلاث نقاط ⋮ في الزاوية العلوية )</strong>.
                    </li>
                    <li className="leading-relaxed">
                      اختر <strong>«تثبيت التطبيق» (Install app)</strong> أو <strong>«إضافة إلى الشاشة الرئيسية»</strong>.
                    </li>
                    <li className="leading-relaxed">
                      سيقوم نظام أندرويد بتثبيته كـ تطبيق كامل بأيقونة الشعار الرسمية.
                    </li>
                  </ol>
                </div>
              )}

              {/* Share link box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">رابط التطبيق لفتحه على الهاتف:</span>
                  <button
                    onClick={copyAppUrl}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedUrl ? 'تم النسخ!' : 'نسخ الرابط'}
                  </button>
                </div>
                <div className="rounded-lg bg-white border border-slate-200 p-2.5 text-xs font-mono text-slate-600 break-all select-all">
                  {currentUrl}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'apk' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 text-sm leading-relaxed">
                <strong className="block font-bold mb-1">توليد ملف (.apk) مستقل للتوزيع المباشر:</strong>
                إذا أردت الحصول على ملف <strong>salamieh-survey.apk</strong> مستقل لنسخه على فلاشة أو إرساله عبر واتساب لفريق المسح الميداني دون الحاجة لمتجر، يمكنك استخدام أداة <strong>PWABuilder</strong> المعتمدة مجاناً خلال 60 ثانية.
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-sm">خطوات استخراج ملف الـ APK:</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm text-center">
                    <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs mb-2">1</div>
                    <p className="text-xs text-slate-700 font-medium">انسخ رابط التطبيق الحالي</p>
                    <button
                      onClick={copyAppUrl}
                      className="mt-2 text-xs text-blue-600 font-bold hover:underline"
                    >
                      {copiedUrl ? '✓ تم النسخ' : 'اضغط للنسخ'}
                    </button>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm text-center">
                    <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs mb-2">2</div>
                    <p className="text-xs text-slate-700 font-medium">افتح موقع PWABuilder والصق الرابط</p>
                    <a
                      href="https://www.pwabuilder.com"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 font-bold hover:underline"
                    >
                      فتح الموقع <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm text-center">
                    <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs mb-2">3</div>
                    <p className="text-xs text-slate-700 font-medium">اضغط "Package for Android" وحمل الـ APK</p>
                    <span className="mt-2 inline-block text-[11px] text-emerald-600 font-bold">جاهز للتثبيت فوراً</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <a
                  href={`https://www.pwabuilder.com/?url=${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white shadow-md hover:bg-blue-700 transition text-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  فتح PWABuilder لبناء ملف APK الآن
                </a>

                <button
                  onClick={downloadApkConfigZip}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition text-sm"
                >
                  <Download className="h-4 w-4" />
                  تحميل ملف التعليمات والـ Manifest
                </button>
              </div>
            </div>
          )}

          {activeTab === 'capacitor' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                للمطورين الراغبين في بناء تطبيق أصلي مخصص بالكامل عبر <strong>Android Studio</strong> أو <strong>Capacitor</strong>:
              </p>

              <div className="rounded-xl bg-slate-900 p-4 text-slate-200 font-mono text-xs overflow-x-auto" dir="ltr">
                <div className="text-slate-400 mb-2"># Install Capacitor for Android</div>
                <div className="text-emerald-400">npm install @capacitor/core @capacitor/cli @capacitor/android</div>
                <div className="text-emerald-400 mt-2">npx cap init "مسح سلمية" "org.alsuc.salamieh.survey" --web-dir dist</div>
                <div className="text-emerald-400 mt-2">npm run build</div>
                <div className="text-emerald-400 mt-2">npx cap add android</div>
                <div className="text-emerald-400 mt-2">npx cap open android</div>
                <div className="text-slate-400 mt-2"># From Android Studio, click: Build &gt; Build APK</div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Layers className="h-4 w-4 text-blue-600" />
                <span>حزمة المشروع تدعم React و Vite و Tailwind CSS بالكامل وجاهزة للبناء.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3.5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-900 transition"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
