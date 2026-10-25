/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  ClipboardList, 
  Map, 
  Settings, 
  Smartphone, 
  Download, 
  FileSpreadsheet, 
  WifiOff, 
  CheckCircle2, 
  Mail, 
  Plus, 
  FileText,
  Upload,
  HardDrive
} from 'lucide-react';

import { SurveyRecord, SurveySchema } from './types/survey';
import { 
  getStoredSchema, 
  saveStoredSchema, 
  getStoredRecords, 
  saveStoredRecords 
} from './utils/storage';
import { 
  exportSurveyToExcel, 
  exportSurveyToCSV, 
  exportSurveyToBackupJSON 
} from './utils/excelExporter';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { usePWAInstall } from './hooks/usePWAInstall';

import { SurveyForm } from './components/SurveyForm';
import { RecordsList } from './components/RecordsList';
import { SchemaManagerModal } from './components/SchemaManagerModal';
import { AndroidApkModal } from './components/AndroidApkModal';
import { InteractiveMapModal } from './components/InteractiveMapModal';

export default function App() {
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const [schema, setSchema] = useState<SurveySchema>(getStoredSchema);
  const [records, setRecords] = useState<SurveyRecord[]>(() => {
    const saved = getStoredRecords();
    if (saved.length > 0) return saved;
    // Seed initial record from Salamieh sample
    const initialSample: SurveyRecord = {
      _id: 1791265273626,
      seq: 1,
      _created: new Date().toISOString(),
      sector: 'غربي',
      neighborhood: 'مسكن',
      street_name: 'شارع الشهداء الرئيسي',
      street_type: 'رئيسيّ',
      survey_date: new Date().toISOString().slice(0, 10),
      priority: 'منخفضة',
      pavement: 'جيد',
      sidewalk: 'جيد',
      lighting: 'جيد جداً',
      cleanness: 'جيد جداً',
      sewage: 'يوجد',
      water_network: 'يوجد',
    };
    saveStoredRecords([initialSample]);
    return [initialSample];
  });

  const [activeTab, setActiveTab] = useState<'form' | 'records' | 'map'>('form');
  const [editingRecord, setEditingRecord] = useState<SurveyRecord | null>(null);

  // Modals
  const [showApkModal, setShowApkModal] = useState(false);
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (toastMessage) {
      const tm = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(tm);
    }
  }, [toastMessage]);

  // Handle save from SurveyForm
  const handleSaveRecord = (formData: Record<string, any>, isUpdate: boolean) => {
    if (isUpdate && editingRecord) {
      const updatedList = records.map((r) => {
        if (r._id === editingRecord._id) {
          return {
            ...formData,
            _id: editingRecord._id,
            seq: editingRecord.seq,
            _created: editingRecord._created,
            _updated: new Date().toISOString(),
          } as SurveyRecord;
        }
        return r;
      });
      setRecords(updatedList);
      saveStoredRecords(updatedList);
      setEditingRecord(null);
      showToast(`✅ تم تحديث المقطع رقم ${editingRecord.seq} بنجاح`);
    } else {
      // New record
      const newSeq = records.length + 1;
      const newRecord: SurveyRecord = {
        ...formData,
        _id: Date.now(),
        seq: newSeq,
        _created: new Date().toISOString(),
      };
      const updatedList = [...records, newRecord];
      setRecords(updatedList);
      saveStoredRecords(updatedList);
      setEditingRecord(null);

      // Trigger celebratory confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });

      showToast(`✅ تم حفظ مقطع الشارع رقم ${newSeq} في السجل المحلي`);
    }
  };

  const handleEditRecord = (record: SurveyRecord) => {
    setEditingRecord(record);
    setActiveTab('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`✏️ تم تحميل المقطع رقم ${record.seq} للتحرير`);
  };

  const handleDeleteRecord = (id: number) => {
    const updated = records.filter((r) => r._id !== id);
    // Recalculate seq numbers
    updated.forEach((r, i) => {
      r.seq = i + 1;
    });
    setRecords(updated);
    saveStoredRecords(updated);
    if (editingRecord && editingRecord._id === id) {
      setEditingRecord(null);
    }
    showToast('✅ تم حذف المقطع من السجل');
  };

  const handleSaveSchema = (newSchema: SurveySchema) => {
    setSchema(newSchema);
    saveStoredSchema(newSchema);
    showToast('✅ تم حفظ تعديلات المخطط بنجاح');
  };

  const handleWipeAll = () => {
    setRecords([]);
    saveStoredRecords([]);
    setEditingRecord(null);
    showToast('✅ تم مسح جميع السجلات');
  };

  const handleExcelExport = () => {
    const success = exportSurveyToExcel(records, schema);
    if (success) {
      showToast(`✅ تم تصدير ملف Excel بنجاح (${records.length} مقطع)`);
    } else {
      showToast('⚠ لا توجد بيانات للتصدير بعد');
    }
  };

  const handleCsvExport = () => {
    const success = exportSurveyToCSV(records, schema);
    if (success) {
      showToast('✅ تم تصدير ملف CSV بنجاح');
    } else {
      showToast('⚠ لا توجد بيانات للتصدير');
    }
  };

  const handleBackupExport = () => {
    exportSurveyToBackupJSON(records, schema);
    showToast('✅ تم تنزيل النسخة الاحتياطية (JSON)');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const importedRecords: SurveyRecord[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.records)
          ? parsed.records
          : [];

        if (importedRecords.length === 0) {
          showToast('⚠ لم يتم العثور على سجلات في الملف');
          return;
        }

        const existingIds = new Set(records.map((r) => r._id));
        const merged = [...records];
        let addedCount = 0;

        importedRecords.forEach((r) => {
          if (!existingIds.has(r._id)) {
            merged.push(r);
            addedCount++;
          }
        });

        merged.forEach((r, idx) => {
          r.seq = idx + 1;
        });

        setRecords(merged);
        saveStoredRecords(merged);

        if (parsed.schema && parsed.schema.sections) {
          setSchema(parsed.schema);
          saveStoredSchema(parsed.schema);
        }

        showToast(`✅ تم استيراد ${addedCount} سجل جديد بنجاح`);
      } catch {
        showToast('⚠ فشل قراءة الملف، تأكد من الصيغة');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-24 text-slate-800" dir="rtl">
      
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-blue-900/20 bg-gradient-to-r from-blue-700 via-blue-800 to-sky-900 text-white shadow-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          
          {/* Logo & City Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md shadow-inner border border-white/20">
              <span className="text-lg sm:text-xl font-black text-amber-300">AL</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-white/20 px-1.5 py-0.2 text-[10px] font-black tracking-widest text-blue-100">
                  ALSUC
                </span>
                <span className="text-xs text-blue-200 hidden sm:inline">وحدة المسح = مقطع شارع واحد</span>
              </div>
              <h1 className="text-sm sm:text-base font-black leading-snug">
                المسح الميداني الخدمي — سلمية
              </h1>
              <a
                href="mailto:alhomsilouay@gmail.com"
                className="inline-flex items-center gap-1 text-[11px] text-blue-200/90 hover:text-white transition"
              >
                <Mail className="h-3 w-3" />
                alhomsilouay@gmail.com
              </a>
            </div>
          </div>

          {/* Quick Header Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Install on Android Button (High visibility) */}
            <button
              onClick={() => setShowApkModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-1.5 text-xs font-bold text-slate-900 shadow-sm hover:from-amber-300 hover:to-amber-400 transition"
              title="تثبيت كـ تطبيق أندرويد APK"
            >
              <Smartphone className="h-4 w-4" />
              <span className="hidden sm:inline">تطبيق أندرويد APK</span>
              <span className="sm:hidden">APK</span>
            </button>

            {/* Schema Management */}
            <button
              onClick={() => setShowSchemaModal(true)}
              className="rounded-xl bg-white/10 p-2 text-white hover:bg-white/20 transition"
              title="إدارة الحقول والمخطط (Admin)"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>

        </div>

        {/* Offline Status Bar */}
        {!isOnline && (
          <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-xs font-bold text-amber-950">
            <WifiOff className="h-3.5 w-3.5 animate-pulse" />
            <span>أنت في وضع العمل دون اتصال (Offline) — البيانات تُحفظ في ذاكرة هاتفك بأمان</span>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-3 sm:px-6 pt-4">
        
        {/* Navigation Tabs */}
        <div className="mb-4 flex rounded-2xl bg-white p-1.5 shadow-sm border border-slate-200">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition ${
              activeTab === 'form'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="h-4 w-4" />
            استمارة المسح
          </button>

          <button
            onClick={() => setActiveTab('records')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition ${
              activeTab === 'records'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            سجل المقاطع
            <span
              className={`rounded-full px-2 py-0.2 text-[10px] font-black ${
                activeTab === 'records' ? 'bg-white text-blue-600' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {records.length}
            </span>
          </button>

          <button
            onClick={() => setShowMapModal(true)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <Map className="h-4 w-4 text-blue-600" />
            خريطة GIS
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'form' && (
          <SurveyForm
            schema={schema}
            editingRecord={editingRecord}
            onSaveRecord={handleSaveRecord}
            onCancelEdit={() => setEditingRecord(null)}
            onToast={showToast}
          />
        )}

        {activeTab === 'records' && (
          <RecordsList
            records={records}
            schema={schema}
            editingRecordId={editingRecord?._id || null}
            onEditRecord={handleEditRecord}
            onDeleteRecord={handleDeleteRecord}
            onExportExcel={handleExcelExport}
            onExportCSV={handleCsvExport}
          />
        )}

      </main>

      {/* Floating Bottom Toolbar (matching the original functionality) */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 overflow-x-auto">
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExcelExport}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition"
              title="تصدير جدول المسح والإحصائيات"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>تصدير Excel</span>
            </button>

            <button
              onClick={handleCsvExport}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              title="تصدير بصيغة CSV"
            >
              <FileText className="h-4 w-4" />
              <span>CSV</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleBackupExport}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              title="تنزيل نسخة احتياطية كاملة"
            >
              <HardDrive className="h-4 w-4" />
              <span className="hidden sm:inline">نسخة احتياطية</span>
            </button>

            <label
              className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
              title="استيراد نسخة احتياطية"
            >
              <Upload className="h-4 w-4" />
              <span>استيراد</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setShowApkModal(true)}
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
              title="تحويل وتثبيت كـ APK للأندرويد"
            >
              <Smartphone className="h-4 w-4" />
              <span className="hidden sm:inline">تثبيت APK</span>
            </button>
          </div>

        </div>
      </div>

      {/* Modals */}
      <AndroidApkModal
        isOpen={showApkModal}
        onClose={() => setShowApkModal(false)}
      />

      <SchemaManagerModal
        isOpen={showSchemaModal}
        onClose={() => setShowSchemaModal(false)}
        schema={schema}
        onSaveSchema={handleSaveSchema}
        onWipeAllRecords={handleWipeAll}
      />

      <InteractiveMapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        records={records}
        onSelectRecord={handleEditRecord}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-slate-900/95 px-5 py-3 text-xs font-bold text-white shadow-2xl backdrop-blur-md animate-bounce-subtle border border-slate-700 max-w-[90%] text-center">
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
