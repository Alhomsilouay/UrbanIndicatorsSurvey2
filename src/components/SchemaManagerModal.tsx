import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  KeyRound, 
  Download, 
  Upload, 
  RotateCcw, 
  X, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { FieldType, SurveyField, SurveySchema, SurveySection } from '../types/survey';
import { getAdminPassword, setAdminPassword, resetSchemaToDefault } from '../utils/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  schema: SurveySchema;
  onSaveSchema: (newSchema: SurveySchema) => void;
  onWipeAllRecords: () => void;
}

export const SchemaManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  schema,
  onSaveSchema,
  onWipeAllRecords,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Password change state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwChangeMessage, setPwChangeMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Field editing/adding state
  const [selectedSecId, setSelectedSecId] = useState<string>(schema.sections[0]?.id || '');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<FieldType>('text');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldOptionsText, setFieldOptionsText] = useState('');
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  // Section editing/adding state
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const stored = getAdminPassword();
    if (passwordInput === stored) {
      setIsAuthenticated(true);
      setPasswordError('');
      setPasswordInput('');
    } else {
      setPasswordError('❌ كلمة السر غير صحيحة. الافتراضية: 11223344');
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    const stored = getAdminPassword();
    if (currentPw !== stored) {
      setPwChangeMessage({ text: '❌ كلمة السر الحالية غير صحيحة', isError: true });
      return;
    }
    if (newPw.length < 4) {
      setPwChangeMessage({ text: '❌ كلمة السر يجب أن تتكون من 4 أرقام على الأقل', isError: true });
      return;
    }
    if (newPw !== confirmPw) {
      setPwChangeMessage({ text: '❌ كلمتا السر الجديدتان غير متطابقتين', isError: true });
      return;
    }
    setAdminPassword(newPw);
    setPwChangeMessage({ text: '✅ تم تغيير كلمة السر بنجاح', isError: false });
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setTimeout(() => setPwChangeMessage(null), 3000);
  };

  const handleSaveField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldLabel.trim()) return;

    let options: string[] | undefined = undefined;
    if (fieldType === 'select') {
      options = fieldOptionsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (fieldType === 'scale') {
      options = ['جيد جداً', 'جيد', 'متوسط', 'سيئ', 'سيئ جداً'];
    } else if (fieldType === 'scale_ext') {
      options = ['جيد جداً', 'جيد', 'متوسط', 'سيئ', 'سيئ جداً', 'لا يوجد', 'لا ينطبق'];
    } else if (fieldType === 'yesno') {
      options = ['يوجد', 'لا يوجد'];
    }

    const updatedSchema = JSON.parse(JSON.stringify(schema)) as SurveySchema;
    const targetSec = updatedSchema.sections.find((s) => s.id === selectedSecId);
    if (!targetSec) return;

    if (editingFieldId) {
      // Editing existing field
      const f = targetSec.fields.find((x) => x.id === editingFieldId);
      if (f) {
        f.label = fieldLabel.trim();
        f.type = fieldType;
        f.required = fieldRequired;
        if (options) f.options = options;
        else delete f.options;
      }
    } else {
      // Create new field
      const fieldIdSlug =
        fieldLabel
          .trim()
          .toLowerCase()
          .replace(/[^\w\u0600-\u06FF]+/g, '_')
          .slice(0, 30) || 'field_' + Date.now();
      
      const newField: SurveyField = {
        id: fieldIdSlug,
        label: fieldLabel.trim(),
        type: fieldType,
        required: fieldRequired,
        ...(options ? { options } : {}),
      };
      targetSec.fields.push(newField);
    }

    onSaveSchema(updatedSchema);
    resetFieldForm();
  };

  const handleStartEditField = (secId: string, field: SurveyField) => {
    setSelectedSecId(secId);
    setEditingFieldId(field.id);
    setFieldLabel(field.label);
    setFieldType(field.type);
    setFieldRequired(!!field.required);
    setFieldOptionsText((field.options || []).join('\n'));
  };

  const handleDeleteField = (secId: string, fieldId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحقل؟')) return;
    const updatedSchema = JSON.parse(JSON.stringify(schema)) as SurveySchema;
    const sec = updatedSchema.sections.find((s) => s.id === secId);
    if (sec) {
      sec.fields = sec.fields.filter((f) => f.id !== fieldId);
      onSaveSchema(updatedSchema);
      if (editingFieldId === fieldId) resetFieldForm();
    }
  };

  const resetFieldForm = () => {
    setEditingFieldId(null);
    setFieldLabel('');
    setFieldType('text');
    setFieldRequired(false);
    setFieldOptionsText('');
  };

  const handleSaveSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;

    const updatedSchema = JSON.parse(JSON.stringify(schema)) as SurveySchema;

    if (editingSectionId) {
      const sec = updatedSchema.sections.find((s) => s.id === editingSectionId);
      if (sec) {
        sec.title = newSectionTitle.trim();
      }
    } else {
      const id = 'sec_' + Date.now();
      updatedSchema.sections.push({
        id,
        title: newSectionTitle.trim(),
        fields: [],
      });
    }

    onSaveSchema(updatedSchema);
    setEditingSectionId(null);
    setNewSectionTitle('');
  };

  const handleDeleteSection = (secId: string) => {
    if (!confirm('حذف هذا القسم بجميع حقوله؟ لن تتمكن من التراجع.')) return;
    const updatedSchema = JSON.parse(JSON.stringify(schema)) as SurveySchema;
    updatedSchema.sections = updatedSchema.sections.filter((s) => s.id !== secId);
    onSaveSchema(updatedSchema);
  };

  const exportSchemaFile = () => {
    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salamieh_schema_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSchemaFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.sections)) {
          onSaveSchema(parsed);
          alert('✅ تم استيراد المخطط وتحديث النموذج بنجاح');
        } else {
          alert('الملف المحدد لا يحتوي على بنية مخطط صحيحة');
        }
      } catch {
        alert('فشل قراءة ملف الـ JSON');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefault = () => {
    if (confirm('هل تريد استعادة حقول مخطط سلمية الافتراضية؟ (السجلات المحفوظة لن تُحذف)')) {
      const def = resetSchemaToDefault();
      onSaveSchema(def);
      alert('✅ تمت استعادة المخطط الافتراضي لمدينة سلمية');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" dir="rtl">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-2 text-slate-800">
            <Settings className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold">إدارة نموذج المسح والمخطط (Admin)</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lock Screen */}
        {!isAuthenticated ? (
          <div className="p-8 text-center max-w-sm mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
              <Lock className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">منطقة المشرف</h3>
            <p className="text-xs text-slate-500 mb-6">
              يرجى إدخال كلمة سر المشرف للوصول إلى إدارة أقسام وحقول المسح الميداني
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                inputMode="numeric"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full text-center text-xl tracking-widest font-mono p-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                autoFocus
              />
              {passwordError && (
                <p className="text-xs text-rose-600 font-semibold">{passwordError}</p>
              )}
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 transition"
              >
                <Unlock className="h-4 w-4" />
                دخول للإدارة
              </button>
              <p className="text-[11px] text-slate-400">
                كلمة السر الافتراضية: <strong>11223344</strong>
              </p>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Management */
          <div className="p-6 space-y-6">
            
            {/* Field Form */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
              <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center justify-between">
                <span>{editingFieldId ? `✏️ تعديل الحقل: ${fieldLabel}` : '➕ إضافة حقل جديد للنموذج'}</span>
                {editingFieldId && (
                  <button
                    type="button"
                    onClick={resetFieldForm}
                    className="text-xs text-slate-600 hover:text-slate-900 underline"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </h3>

              <form onSubmit={handleSaveField} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">القسم المستهدف:</label>
                    <select
                      value={selectedSecId}
                      onChange={(e) => setSelectedSecId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
                    >
                      {schema.sections.map((s) => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الحقل (بالعربية):</label>
                    <input
                      type="text"
                      value={fieldLabel}
                      onChange={(e) => setFieldLabel(e.target.value)}
                      placeholder="مثال: عدد الحاويات"
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">نوع الحقل:</label>
                    <select
                      value={fieldType}
                      onChange={(e) => setFieldType(e.target.value as FieldType)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
                    >
                      <option value="text">نص عادي</option>
                      <option value="integer">رقم صحيح (عداد)</option>
                      <option value="number">رقم عشري</option>
                      <option value="select">قائمة منسدلة مخصصة</option>
                      <option value="scale">مقياس (جيد جداً ... سيئ جداً)</option>
                      <option value="scale_ext">مقياس موسع (+لا يوجد/لا ينطبق)</option>
                      <option value="yesno">يوجد / لا يوجد</option>
                      <option value="date">تاريخ</option>
                      <option value="textarea">نص طويل (ملاحظات)</option>
                      <option value="photo">صورة بالكاميرا</option>
                      <option value="gps">إحداثيات GPS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">هل هو حقل إلزامي؟</label>
                    <select
                      value={fieldRequired ? 'yes' : 'no'}
                      onChange={(e) => setFieldRequired(e.target.value === 'yes')}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
                    >
                      <option value="no">اختياري</option>
                      <option value="yes">إلزامي مطلوب</option>
                    </select>
                  </div>
                </div>

                {fieldType === 'select' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      خيارات القائمة المنسدلة (سطر لكل خيار):
                    </label>
                    <textarea
                      rows={3}
                      value={fieldOptionsText}
                      onChange={(e) => setFieldOptionsText(e.target.value)}
                      placeholder="خيار أول&#10;خيار ثاني&#10;خيار ثالث"
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
                >
                  {editingFieldId ? '💾 حفظ تعديل الحقل' : '➕ إضافة الحقل إلى المخطط'}
                </button>
              </form>
            </div>

            {/* Section Add Form */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <h3 className="text-sm font-bold text-amber-900 mb-2">
                {editingSectionId ? '✏️ تعديل عنوان القسم' : '➕ إضافة قسم جديد للمسح'}
              </h3>
              <form onSubmit={handleSaveSection} className="flex gap-2">
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="مثال: ١١. مؤشرات التراث العمراني"
                  className="flex-1 rounded-lg border border-slate-300 bg-white p-2 text-xs"
                  required
                />
                <button
                  type="submit"
                  className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition"
                >
                  {editingSectionId ? 'حفظ' : 'إضافة القسم'}
                </button>
              </form>
            </div>

            {/* List of existing sections and fields */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                الأقسام والحقول الحالية ({schema.sections.length} أقسام)
              </h4>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {schema.sections.map((sec) => (
                  <div key={sec.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800">{sec.title}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSectionId(sec.id);
                            setNewSectionTitle(sec.title);
                          }}
                          className="rounded p-1 text-slate-500 hover:text-blue-600 hover:bg-white"
                          title="تعديل العنوان"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(sec.id)}
                          className="rounded p-1 text-slate-500 hover:text-rose-600 hover:bg-white"
                          title="حذف القسم"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {sec.fields.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 text-xs border border-slate-100"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-700">{f.label}</span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                              {f.type}
                            </span>
                            {f.required && (
                              <span className="text-rose-500 text-[10px] font-bold">مطلوب</span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditField(sec.id, f)}
                              className="text-slate-400 hover:text-blue-600 p-0.5"
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteField(sec.id, f.id)}
                              className="text-slate-400 hover:text-rose-600 p-0.5"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {sec.fields.length === 0 && (
                        <p className="text-[11px] text-slate-400 italic">لا توجد حقول في هذا القسم</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Change Password */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-3">
                <KeyRound className="h-4 w-4 text-blue-600" />
                تغيير كلمة سر المشرف
              </h4>
              <form onSubmit={handlePasswordChange} className="grid gap-2 sm:grid-cols-3">
                <input
                  type="password"
                  inputMode="numeric"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="كلمة السر الحالية"
                  className="rounded-lg border border-slate-300 bg-white p-2 text-xs"
                />
                <input
                  type="password"
                  inputMode="numeric"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="كلمة السر الجديدة"
                  className="rounded-lg border border-slate-300 bg-white p-2 text-xs"
                />
                <input
                  type="password"
                  inputMode="numeric"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="تأكيد الجديدة"
                  className="rounded-lg border border-slate-300 bg-white p-2 text-xs"
                />
                <div className="sm:col-span-3 flex items-center justify-between mt-1">
                  {pwChangeMessage && (
                    <span className={`text-xs ${pwChangeMessage.isError ? 'text-rose-600' : 'text-emerald-600 font-bold'}`}>
                      {pwChangeMessage.text}
                    </span>
                  )}
                  <button
                    type="submit"
                    className="ml-auto rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-900"
                  >
                    حفظ كلمة السر الجديدة
                  </button>
                </div>
              </form>
            </div>

            {/* Export / Import / Reset / Wipe Actions */}
            <div className="pt-2 flex flex-wrap gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={exportSchemaFile}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5" />
                تصدير المخطط (JSON)
              </button>

              <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                استيراد مخطط
                <input
                  type="file"
                  accept=".json"
                  onChange={importSchemaFile}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleResetDefault}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                استعادة المخطط الافتراضي
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('تحذير: سيتم مسح جميع سجلات المقاطع الممسوحة نهائياً. هل أنت متأكد؟')) {
                    if (confirm('تأكيد أخير: حذف كل البيانات؟')) {
                      onWipeAllRecords();
                      alert('✅ تم مسح جميع السجلات');
                    }
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 mr-auto"
              >
                <Trash2 className="h-3.5 w-3.5" />
                مسح كل السجلات
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
