import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import {
  Archive,
  Edit,
  Layers,
  Package,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

// =============================================
// نوع نموذج الصنف الكامل (6 تبويبات)
// =============================================
type ProductForm = {
  // التبويب 1 - النافذة الرئيسية
  name: string;
  name2: string;
  sku: string;
  itemType: string;
  groupId: string;
  categoryId: string;
  parentItem: string;
  // وحدات
  unit: string;
  unit2: string;
  unit3: string;
  conversionFactor: string;
  convFactor2: string;
  convFactor3: string;
  barcode: string;
  barcode2: string;
  barcode3: string;
  // فئات
  category1: string;
  category2: string;
  category3: string;
  // مواصفات
  distinguishNo: string;
  weight: string;
  size: string;
  colorCode: string;
  itemSize: string;
  // ضريبة
  taxType: string;
  prevTaxType: string;
  taxable: boolean;
  vatRate: string;
  // حقول قديمة
  nameEn: string;
  brand: string;
  model: string;
  description: string;
  purchaseUnit: string;
  saleUnit: string;
  minStock: string;
  maxStock: string;
  reorderPoint: string;
  trackBatch: boolean;
  trackSerial: boolean;
  hasBOM: boolean;
  // التبويب 2 - وصف إضافي
  extDesc1: string; extVal1: string;
  extDesc2: string; extVal2: string;
  extDesc3: string; extVal3: string;
  extDesc4: string; extVal4: string;
  extDesc5: string; extVal5: string;
  extDesc6: string; extVal6: string;
  // التبويب 3 - الأسعار
  purchasePrice: string;
  costPrice: string;
  salePrice: string;
  salePrice2: string;
  salePrice3: string;
  salePrice4: string;
  salePrice5: string;
  wholesalePrice: string;
  priceIncludesTax: boolean;
  pricingPlan: string;
  // التبويب 4 - التكاليف
  stdCost: string;
  defaultSupplier: string;
  lastSupplier1: string;
  lastSupplier2: string;
  defaultOrderQty: string;
};

const emptyForm: ProductForm = {
  name: "", name2: "", sku: "", itemType: "مخزون",
  groupId: "", categoryId: "", parentItem: "",
  unit: "قطعة", unit2: "", unit3: "",
  conversionFactor: "1", convFactor2: "1", convFactor3: "1",
  barcode: "", barcode2: "", barcode3: "",
  category1: "", category2: "", category3: "",
  distinguishNo: "", weight: "", size: "", colorCode: "", itemSize: "",
  taxType: "", prevTaxType: "", taxable: true, vatRate: "15",
  nameEn: "", brand: "", model: "", description: "",
  purchaseUnit: "", saleUnit: "", minStock: "0", maxStock: "0", reorderPoint: "0",
  trackBatch: false, trackSerial: false, hasBOM: false,
  extDesc1: "", extVal1: "", extDesc2: "", extVal2: "",
  extDesc3: "", extVal3: "", extDesc4: "", extVal4: "",
  extDesc5: "", extVal5: "", extDesc6: "", extVal6: "",
  purchasePrice: "0", costPrice: "0", salePrice: "0",
  salePrice2: "0", salePrice3: "0", salePrice4: "0", salePrice5: "0",
  wholesalePrice: "0", priceIncludesTax: false, pricingPlan: "",
  stdCost: "0", defaultSupplier: "", lastSupplier1: "", lastSupplier2: "",
  defaultOrderQty: "0",
};

// =============================================
// حقل نموذج كلاسيكي
// =============================================
function CField({
  label,
  children,
  required,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
        {label}{required && <span className="text-red-500 mr-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// حقل نص كلاسيكي
function CInput({
  value,
  onChange,
  placeholder = "",
  type = "text",
  dir,
  readOnly,
  className = "",
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  dir?: "rtl" | "ltr";
  readOnly?: boolean;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      dir={dir}
      readOnly={readOnly}
      className={`h-7 text-sm border border-slate-300 dark:border-slate-600 rounded px-2 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${readOnly ? "bg-slate-50 dark:bg-slate-700 text-slate-500" : ""} ${className}`}
    />
  );
}

// =============================================
// بطاقة الصنف - 6 تبويبات كلاسيكية
// =============================================
function ProductCard({
  form,
  setForm,
  categories,
  groups,
}: {
  form: ProductForm;
  setForm: (f: ProductForm) => void;
  categories: Array<{ id: number; name: string }> | undefined;
  groups: Array<{ id: number; groupCode?: string | null; name: string }> | undefined;
}) {
  const [activeTab, setActiveTab] = useState<string>("main");
  const set = (key: keyof ProductForm, val: string | boolean) =>
    setForm({ ...form, [key]: val });

  const tabs = [
    { id: "main", label: "النافذة الرئيسية" },
    { id: "extra", label: "وصف إضافي" },
    { id: "prices", label: "الأسعار" },
    { id: "costs", label: "التكاليف" },
    { id: "qty", label: "كميات" },
    { id: "stats", label: "إحصائيات" },
  ];

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* شريط التبويبات الكلاسيكي */}
      <div className="flex border-b border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-l border-slate-300 dark:border-slate-600 transition-colors
              ${activeTab === tab.id
                ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 border-b-2 border-b-blue-600 -mb-px"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* محتوى التبويبات */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* ===== التبويب 1: النافذة الرئيسية ===== */}
        {activeTab === "main" && (
          <div className="space-y-4">
            {/* الصف الأول: معلومات أساسية */}
            <div className="border border-slate-200 dark:border-slate-700 rounded">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">بيانات الصنف الأساسية</span>
              </div>
              <div className="p-3 grid grid-cols-4 gap-3">
                <CField label="رقم الصنف / الكود" required>
                  <CInput value={form.sku} onChange={(v) => set("sku", v)} placeholder="SKU-001" />
                </CField>
                <CField label="اسم الصنف 1" required className="col-span-2">
                  <CInput value={form.name} onChange={(v) => set("name", v)} placeholder="اسم الصنف بالعربية" />
                </CField>
                <CField label="نوع السجل">
                  <select
                    value={form.itemType}
                    onChange={(e) => set("itemType", e.target.value)}
                    className="h-7 text-sm border border-slate-300 dark:border-slate-600 rounded px-2 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="مخزون">مخزون</option>
                    <option value="خدمة">خدمة</option>
                    <option value="مجموعة">مجموعة</option>
                    <option value="مركّب">مركّب</option>
                  </select>
                </CField>
                <CField label="اسم الصنف 2 (إنجليزي)">
                  <CInput value={form.name2} onChange={(v) => set("name2", v)} placeholder="English name" dir="ltr" />
                </CField>
                <CField label="رقم المجموعة">
                  <select
                    value={form.groupId || "none"}
                    onChange={(e) => set("groupId", e.target.value === "none" ? "" : e.target.value)}
                    className="h-7 text-sm border border-slate-300 dark:border-slate-600 rounded px-2 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="none">-- بدون مجموعة --</option>
                    {groups?.map((g) => (
                      <option key={g.id} value={String(g.id)}>
                        {g.groupCode ? `[${g.groupCode}] ` : ""}{g.name}
                      </option>
                    ))}
                  </select>
                </CField>
                <CField label="التصنيف">
                  <select
                    value={form.categoryId || "none"}
                    onChange={(e) => set("categoryId", e.target.value === "none" ? "" : e.target.value)}
                    className="h-7 text-sm border border-slate-300 dark:border-slate-600 rounded px-2 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="none">-- بدون تصنيف --</option>
                    {categories?.map((c) => (
                      <option key={c.id} value={String(c.id)}>{c.name}</option>
                    ))}
                  </select>
                </CField>
                <CField label="الصنف الرئيسي">
                  <CInput value={form.parentItem} onChange={(v) => set("parentItem", v)} placeholder="رقم الصنف الرئيسي" />
                </CField>
              </div>
            </div>

            {/* جدول الوحدات */}
            <div className="border border-slate-200 dark:border-slate-700 rounded">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">وحدات القياس</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="text-right px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 w-8">#</th>
                    <th className="text-right px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">الوحدة</th>
                    <th className="text-right px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">معامل التحويل</th>
                    <th className="text-right px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">الباركود</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 dark:border-slate-700/50">
                    <td className="px-3 py-1.5 text-xs text-slate-500">1</td>
                    <td className="px-3 py-1.5">
                      <CInput value={form.unit} onChange={(v) => set("unit", v)} placeholder="قطعة" className="w-full" />
                    </td>
                    <td className="px-3 py-1.5">
                      <CInput value="1" readOnly className="w-full bg-slate-50 dark:bg-slate-700" />
                    </td>
                    <td className="px-3 py-1.5">
                      <CInput value={form.barcode} onChange={(v) => set("barcode", v)} placeholder="باركود 1" dir="ltr" className="w-full" />
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-700/50">
                    <td className="px-3 py-1.5 text-xs text-slate-500">2</td>
                    <td className="px-3 py-1.5">
                      <CInput value={form.unit2} onChange={(v) => set("unit2", v)} placeholder="وحدة 2" className="w-full" />
                    </td>
                    <td className="px-3 py-1.5">
                      <CInput value={form.convFactor2} onChange={(v) => set("convFactor2", v)} type="number" className="w-full" />
                    </td>
                    <td className="px-3 py-1.5">
                      <CInput value={form.barcode2} onChange={(v) => set("barcode2", v)} placeholder="باركود 2" dir="ltr" className="w-full" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1.5 text-xs text-slate-500">3</td>
                    <td className="px-3 py-1.5">
                      <CInput value={form.unit3} onChange={(v) => set("unit3", v)} placeholder="وحدة 3" className="w-full" />
                    </td>
                    <td className="px-3 py-1.5">
                      <CInput value={form.convFactor3} onChange={(v) => set("convFactor3", v)} type="number" className="w-full" />
                    </td>
                    <td className="px-3 py-1.5">
                      <CInput value={form.barcode3} onChange={(v) => set("barcode3", v)} placeholder="باركود 3" dir="ltr" className="w-full" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* الفئات والمواصفات */}
            <div className="grid grid-cols-2 gap-4">
              {/* الفئات */}
              <div className="border border-slate-200 dark:border-slate-700 rounded">
                <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">الفئات</span>
                </div>
                <div className="p-3 space-y-2">
                  <CField label="فئة 1">
                    <CInput value={form.category1} onChange={(v) => set("category1", v)} placeholder="الفئة الأولى" />
                  </CField>
                  <CField label="فئة 2">
                    <CInput value={form.category2} onChange={(v) => set("category2", v)} placeholder="الفئة الثانية" />
                  </CField>
                  <CField label="فئة 3">
                    <CInput value={form.category3} onChange={(v) => set("category3", v)} placeholder="الفئة الثالثة" />
                  </CField>
                </div>
              </div>

              {/* المواصفات */}
              <div className="border border-slate-200 dark:border-slate-700 rounded">
                <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">المواصفات</span>
                </div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  <CField label="الرقم المميز">
                    <CInput value={form.distinguishNo} onChange={(v) => set("distinguishNo", v)} placeholder="" />
                  </CField>
                  <CField label="الوزن">
                    <CInput value={form.weight} onChange={(v) => set("weight", v)} type="number" placeholder="0.000" />
                  </CField>
                  <CField label="المقاس">
                    <CInput value={form.size} onChange={(v) => set("size", v)} placeholder="" />
                  </CField>
                  <CField label="نوع الكود / اللون">
                    <CInput value={form.colorCode} onChange={(v) => set("colorCode", v)} placeholder="" />
                  </CField>
                  <CField label="الحجم" className="col-span-2">
                    <CInput value={form.itemSize} onChange={(v) => set("itemSize", v)} placeholder="" />
                  </CField>
                </div>
              </div>
            </div>

            {/* نوع الضريبة */}
            <div className="border border-slate-200 dark:border-slate-700 rounded">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">الضريبة</span>
              </div>
              <div className="p-3 grid grid-cols-4 gap-3">
                <CField label="نوع الضريبة">
                  <select
                    value={form.taxType}
                    onChange={(e) => set("taxType", e.target.value)}
                    className="h-7 text-sm border border-slate-300 dark:border-slate-600 rounded px-2 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- اختر --</option>
                    <option value="خاضع">خاضع للضريبة</option>
                    <option value="معفي">معفي من الضريبة</option>
                    <option value="صفري">صفري</option>
                  </select>
                </CField>
                <CField label="نوع الضريبة السابق">
                  <CInput value={form.prevTaxType} onChange={(v) => set("prevTaxType", v)} placeholder="" />
                </CField>
                <CField label="نسبة الضريبة (%)">
                  <CInput value={form.vatRate} onChange={(v) => set("vatRate", v)} type="number" placeholder="15" />
                </CField>
                <div className="flex items-end gap-2 pb-0.5">
                  <Switch
                    checked={form.taxable}
                    onCheckedChange={(v) => set("taxable", v)}
                    id="taxable"
                  />
                  <label htmlFor="taxable" className="text-sm cursor-pointer">
                    {form.taxable ? "خاضع للضريبة" : "غير خاضع"}
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== التبويب 2: وصف إضافي ===== */}
        {activeTab === "extra" && (
          <div className="space-y-4">
            {/* الوصف العام */}
            <div className="border border-slate-200 dark:border-slate-700 rounded">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">الوصف العام</span>
              </div>
              <div className="p-3 grid grid-cols-2 gap-3">
                <CField label="الوصف">
                  <textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={3}
                    className="text-sm border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="وصف الصنف..."
                  />
                </CField>
                <CField label="الماركة / الموديل">
                  <CInput value={form.brand} onChange={(v) => set("brand", v)} placeholder="الماركة" className="mb-1" />
                  <CInput value={form.model} onChange={(v) => set("model", v)} placeholder="الموديل" />
                </CField>
              </div>
            </div>

            {/* جدول الأوصاف الإضافية */}
            <div className="border border-slate-200 dark:border-slate-700 rounded">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">أوصاف إضافية</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="text-right px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 w-8">#</th>
                    <th className="text-right px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">الوصف الإضافي</th>
                    <th className="text-right px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">القيمة</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                      <td className="px-3 py-1.5 text-xs text-slate-500">{i}</td>
                      <td className="px-3 py-1.5">
                        <CInput
                          value={(form as any)[`extDesc${i}`]}
                          onChange={(v) => set(`extDesc${i}` as keyof ProductForm, v)}
                          placeholder={`وصف إضافي ${i}`}
                          className="w-full"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <CInput
                          value={(form as any)[`extVal${i}`]}
                          onChange={(v) => set(`extVal${i}` as keyof ProductForm, v)}
                          placeholder="القيمة"
                          className="w-full"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* خيارات المخزون */}
            <div className="border border-slate-200 dark:border-slate-700 rounded">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">خيارات المخزون</span>
              </div>
              <div className="p-3 grid grid-cols-3 gap-3">
                <CField label="الحد الأدنى">
                  <CInput value={form.minStock} onChange={(v) => set("minStock", v)} type="number" />
                </CField>
                <CField label="الحد الأقصى">
                  <CInput value={form.maxStock} onChange={(v) => set("maxStock", v)} type="number" />
                </CField>
                <CField label="نقطة إعادة الطلب">
                  <CInput value={form.reorderPoint} onChange={(v) => set("reorderPoint", v)} type="number" />
                </CField>
                <div className="flex items-center gap-2">
                  <Switch checked={form.trackBatch} onCheckedChange={(v) => set("trackBatch", v)} id="trackBatch" />
                  <label htmlFor="trackBatch" className="text-sm cursor-pointer">تتبع الدفعات</label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.trackSerial} onCheckedChange={(v) => set("trackSerial", v)} id="trackSerial" />
                  <label htmlFor="trackSerial" className="text-sm cursor-pointer">تتبع التسلسلي</label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.hasBOM} onCheckedChange={(v) => set("hasBOM", v)} id="hasBOM" />
                  <label htmlFor="hasBOM" className="text-sm cursor-pointer">قائمة مواد (BOM)</label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== التبويب 3: الأسعار ===== */}
        {activeTab === "prices" && (
          <div className="space-y-4">
            {/* جدول الأسعار */}
            <div className="border border-slate-200 dark:border-slate-700 rounded">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">جدول الأسعار</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="text-right px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">نوع السعر</th>
                    <th className="text-right px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 w-40">السعر</th>
                    <th className="text-right px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 w-32">الوحدة</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "سعر الشراء", field: "purchasePrice" },
                    { label: "سعر التكلفة", field: "costPrice" },
                    { label: "سعر البيع 1 (الأساسي)", field: "salePrice" },
                    { label: "سعر البيع 2", field: "salePrice2" },
                    { label: "سعر البيع 3", field: "salePrice3" },
                    { label: "سعر البيع 4", field: "salePrice4" },
                    { label: "سعر البيع 5", field: "salePrice5" },
                    { label: "سعر الجملة", field: "wholesalePrice" },
                  ].map((row) => (
                    <tr key={row.field} className="border-b border-slate-100 dark:border-slate-700/50">
                      <td className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300">{row.label}</td>
                      <td className="px-3 py-1.5">
                        <CInput
                          value={(form as any)[row.field]}
                          onChange={(v) => set(row.field as keyof ProductForm, v)}
                          type="number"
                          className="w-full"
                        />
                      </td>
                      <td className="px-3 py-1.5 text-xs text-slate-500">{form.unit || "قطعة"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* قواعد التسعير */}
            <div className="border border-slate-200 dark:border-slate-700 rounded">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">قواعد التسعير</span>
              </div>
              <div className="p-3 grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.priceIncludesTax}
                    onCheckedChange={(v) => set("priceIncludesTax", v)}
                    id="priceIncludesTax"
                  />
                  <label htmlFor="priceIncludesTax" className="text-sm cursor-pointer">السعر يشمل الضريبة</label>
                </div>
                <CField label="خطة التسعير">
                  <CInput value={form.pricingPlan} onChange={(v) => set("pricingPlan", v)} placeholder="اختياري" />
                </CField>
              </div>
            </div>
          </div>
        )}

        {/* ===== التبويب 4: التكاليف ===== */}
        {activeTab === "costs" && (
          <div className="space-y-4">
            {/* بيانات الموردين */}
            <div className="border border-slate-200 dark:border-slate-700 rounded">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">بيانات الموردين</span>
              </div>
              <div className="p-3 grid grid-cols-2 gap-3">
                <CField label="المورد الافتراضي">
                  <CInput value={form.defaultSupplier} onChange={(v) => set("defaultSupplier", v)} placeholder="اسم المورد الافتراضي" />
                </CField>
                <CField label="آخر مورد 1">
                  <CInput value={form.lastSupplier1} onChange={(v) => set("lastSupplier1", v)} placeholder="آخر مورد" />
                </CField>
                <CField label="آخر مورد 2">
                  <CInput value={form.lastSupplier2} onChange={(v) => set("lastSupplier2", v)} placeholder="مورد بديل" />
                </CField>
                <CField label="كمية الطلب الافتراضية">
                  <CInput value={form.defaultOrderQty} onChange={(v) => set("defaultOrderQty", v)} type="number" placeholder="0" />
                </CField>
              </div>
            </div>

            {/* جدول التكاليف */}
            <div className="border border-slate-200 dark:border-slate-700 rounded">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">التكاليف</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="text-right px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">نوع التكلفة</th>
                    <th className="text-right px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 w-40">القيمة</th>
                    <th className="text-right px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 w-24">الوحدة</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 dark:border-slate-700/50">
                    <td className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300">سعر الشراء</td>
                    <td className="px-3 py-1.5">
                      <CInput value={form.purchasePrice} onChange={(v) => set("purchasePrice", v)} type="number" className="w-full" />
                    </td>
                    <td className="px-3 py-1.5 text-xs text-slate-500">{form.unit || "قطعة"}</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-700/50">
                    <td className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300">سعر التكلفة</td>
                    <td className="px-3 py-1.5">
                      <CInput value={form.costPrice} onChange={(v) => set("costPrice", v)} type="number" className="w-full" />
                    </td>
                    <td className="px-3 py-1.5 text-xs text-slate-500">{form.unit || "قطعة"}</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-700/50">
                    <td className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300">التكلفة القياسية</td>
                    <td className="px-3 py-1.5">
                      <CInput value={form.stdCost} onChange={(v) => set("stdCost", v)} type="number" className="w-full" />
                    </td>
                    <td className="px-3 py-1.5 text-xs text-slate-500">{form.unit || "قطعة"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== التبويب 5: كميات ===== */}
        {activeTab === "qty" && (
          <div className="space-y-4">
            <div className="border border-slate-200 dark:border-slate-700 rounded">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">الكميات بالمخازن</span>
              </div>
              <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">
                <p>تُعرض الكميات بعد حفظ الصنف وربطه بالمخازن.</p>
                <p className="text-xs mt-1">يمكن إدارة الكميات من شاشة <strong>المخازن</strong> أو <strong>سندات المخزون</strong>.</p>
              </div>
            </div>

            {/* حدود المخزون */}
            <div className="border border-slate-200 dark:border-slate-700 rounded">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">حدود المخزون</span>
              </div>
              <div className="p-3 grid grid-cols-3 gap-3">
                <CField label="الحد الأدنى">
                  <CInput value={form.minStock} onChange={(v) => set("minStock", v)} type="number" />
                </CField>
                <CField label="الحد الأقصى">
                  <CInput value={form.maxStock} onChange={(v) => set("maxStock", v)} type="number" />
                </CField>
                <CField label="نقطة إعادة الطلب">
                  <CInput value={form.reorderPoint} onChange={(v) => set("reorderPoint", v)} type="number" />
                </CField>
              </div>
            </div>
          </div>
        )}

        {/* ===== التبويب 6: إحصائيات ===== */}
        {activeTab === "stats" && (
          <div className="space-y-4">
            <div className="border border-slate-200 dark:border-slate-700 rounded">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">الإحصائيات الشهرية</span>
              </div>
              <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">
                <p>تُعرض الإحصائيات بعد تسجيل حركات المبيعات والمشتريات.</p>
                <p className="text-xs mt-1">الجدول الشهري: الفترة، مبيعات كميات/قيمة، مشتريات كميات/قيمة، هدف، %.</p>
              </div>
            </div>
            <div className="border border-slate-200 dark:border-slate-700 rounded">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">ملخص الحركة</span>
              </div>
              <div className="p-3 grid grid-cols-3 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">آخر مشتريات</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">—</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded p-3 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">آخر مبيعات</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">—</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded p-3 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">الكمية الآنية</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">—</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// =============================================
// المكوّن الرئيسي
// =============================================
export default function Products() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [sortField, setSortField] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [viewTab, setViewTab] = useState<"products" | "categories">("products");
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const utils = trpc.useUtils();

  const { data: products, isLoading } = trpc.products.list.useQuery(
    {
      search: search || undefined,
      categoryId: categoryFilter !== "all" ? Number(categoryFilter) : undefined,
    },
    { staleTime: 10000 }
  );

  const { data: categories } = trpc.categories.list.useQuery(undefined, { staleTime: 60000 });
  const { data: groups } = trpc.productGroups.list.useQuery(undefined, { staleTime: 60000 });
  const { data: catProducts, isLoading: loadingCatProducts } = trpc.products.list.useQuery(
    { categoryId: selectedCatId ?? undefined },
    { staleTime: 10000, enabled: viewTab === "categories" }
  );

  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("تم إضافة الصنف بنجاح");
      setIsOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("تم تحديث الصنف بنجاح");
      setIsOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("تم حذف الصنف");
    },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setIsOpen(true);
  };

  const openEdit = (p: any) => {
    setEditId(p.id);
    setForm({
      name: p.name ?? "",
      name2: p.name2 ?? "",
      sku: p.sku ?? "",
      itemType: p.itemType ?? "مخزون",
      groupId: p.groupId ? String(p.groupId) : "",
      categoryId: p.categoryId ? String(p.categoryId) : "",
      parentItem: p.parentItem ? String(p.parentItem) : "",
      unit: p.unit ?? "قطعة",
      unit2: p.unit2 ?? "",
      unit3: p.unit3 ?? "",
      conversionFactor: p.conversionFactor ?? "1",
      convFactor2: p.convFactor2 ?? "1",
      convFactor3: p.convFactor3 ?? "1",
      barcode: p.barcode ?? "",
      barcode2: p.barcode2 ?? "",
      barcode3: p.barcode3 ?? "",
      category1: p.category1 ?? "",
      category2: p.category2 ?? "",
      category3: p.category3 ?? "",
      distinguishNo: p.distinguishNo ?? "",
      weight: p.weight ?? "",
      size: p.size ?? "",
      colorCode: p.colorCode ?? "",
      itemSize: p.itemSize ?? "",
      taxType: p.taxType ?? "",
      prevTaxType: p.prevTaxType ?? "",
      taxable: p.taxable ?? true,
      vatRate: p.vatRate ?? "15",
      nameEn: p.nameEn ?? "",
      brand: p.brand ?? "",
      model: p.model ?? "",
      description: p.description ?? "",
      purchaseUnit: p.purchaseUnit ?? "",
      saleUnit: p.saleUnit ?? "",
      minStock: String(p.minStock ?? 0),
      maxStock: String(p.maxStock ?? 0),
      reorderPoint: String(p.reorderPoint ?? 0),
      trackBatch: p.trackBatch ?? false,
      trackSerial: p.trackSerial ?? false,
      hasBOM: p.hasBOM ?? false,
      extDesc1: p.extDesc1 ?? "", extVal1: p.extVal1 ?? "",
      extDesc2: p.extDesc2 ?? "", extVal2: p.extVal2 ?? "",
      extDesc3: p.extDesc3 ?? "", extVal3: p.extVal3 ?? "",
      extDesc4: p.extDesc4 ?? "", extVal4: p.extVal4 ?? "",
      extDesc5: p.extDesc5 ?? "", extVal5: p.extVal5 ?? "",
      extDesc6: p.extDesc6 ?? "", extVal6: p.extVal6 ?? "",
      purchasePrice: p.purchasePrice ?? "0",
      costPrice: p.costPrice ?? "0",
      salePrice: p.salePrice ?? "0",
      salePrice2: p.salePrice2 ?? "0",
      salePrice3: p.salePrice3 ?? "0",
      salePrice4: p.salePrice4 ?? "0",
      salePrice5: p.salePrice5 ?? "0",
      wholesalePrice: p.wholesalePrice ?? "0",
      priceIncludesTax: p.priceIncludesTax ?? false,
      pricingPlan: p.pricingPlan ?? "",
      stdCost: p.stdCost ?? "0",
      defaultSupplier: p.defaultSupplier ?? "",
      lastSupplier1: p.lastSupplier1 ?? "",
      lastSupplier2: p.lastSupplier2 ?? "",
      defaultOrderQty: p.defaultOrderQty ?? "0",
    });
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("اسم الصنف مطلوب");
      return;
    }
    if (form.salePrice === "" || Number(form.salePrice) < 0) {
      toast.error("سعر البيع مطلوب");
      return;
    }

    const data = {
      name: form.name.trim(),
      name2: form.name2.trim() || undefined,
      nameEn: form.nameEn.trim() || undefined,
      sku: form.sku.trim() || undefined,
      barcode: form.barcode.trim() || undefined,
      barcode2: form.barcode2.trim() || undefined,
      barcode3: form.barcode3.trim() || undefined,
      categoryId: form.categoryId ? Number(form.categoryId) : undefined,
      groupId: form.groupId ? Number(form.groupId) : undefined,
      parentItem: form.parentItem ? Number(form.parentItem) : undefined,
      brand: form.brand.trim() || undefined,
      model: form.model.trim() || undefined,
      description: form.description.trim() || undefined,
      itemType: form.itemType || "مخزون",
      unit: form.unit || "قطعة",
      unit2: form.unit2.trim() || undefined,
      unit3: form.unit3.trim() || undefined,
      purchaseUnit: form.purchaseUnit.trim() || undefined,
      saleUnit: form.saleUnit.trim() || undefined,
      conversionFactor: form.conversionFactor || "1",
      convFactor2: form.convFactor2 || "1",
      convFactor3: form.convFactor3 || "1",
      category1: form.category1.trim() || undefined,
      category2: form.category2.trim() || undefined,
      category3: form.category3.trim() || undefined,
      distinguishNo: form.distinguishNo.trim() || undefined,
      weight: form.weight.trim() || undefined,
      size: form.size.trim() || undefined,
      colorCode: form.colorCode.trim() || undefined,
      itemSize: form.itemSize.trim() || undefined,
      taxType: form.taxType.trim() || undefined,
      prevTaxType: form.prevTaxType.trim() || undefined,
      minStock: Number(form.minStock) || 0,
      maxStock: Number(form.maxStock) || 0,
      reorderPoint: Number(form.reorderPoint) || 0,
      trackBatch: form.trackBatch,
      trackSerial: form.trackSerial,
      hasBOM: form.hasBOM,
      extDesc1: form.extDesc1.trim() || undefined, extVal1: form.extVal1.trim() || undefined,
      extDesc2: form.extDesc2.trim() || undefined, extVal2: form.extVal2.trim() || undefined,
      extDesc3: form.extDesc3.trim() || undefined, extVal3: form.extVal3.trim() || undefined,
      extDesc4: form.extDesc4.trim() || undefined, extVal4: form.extVal4.trim() || undefined,
      extDesc5: form.extDesc5.trim() || undefined, extVal5: form.extVal5.trim() || undefined,
      extDesc6: form.extDesc6.trim() || undefined, extVal6: form.extVal6.trim() || undefined,
      purchasePrice: form.purchasePrice || "0",
      costPrice: form.costPrice || "0",
      salePrice: form.salePrice || "0",
      salePrice2: form.salePrice2 || "0",
      salePrice3: form.salePrice3 || "0",
      salePrice4: form.salePrice4 || "0",
      salePrice5: form.salePrice5 || "0",
      wholesalePrice: form.wholesalePrice || "0",
      priceIncludesTax: form.priceIncludesTax,
      pricingPlan: form.pricingPlan.trim() || undefined,
      stdCost: form.stdCost || "0",
      defaultSupplier: form.defaultSupplier.trim() || undefined,
      lastSupplier1: form.lastSupplier1.trim() || undefined,
      lastSupplier2: form.lastSupplier2.trim() || undefined,
      defaultOrderQty: form.defaultOrderQty || "0",
      vatRate: form.vatRate || "15",
      taxable: form.taxable,
    };

    if (editId) {
      updateProduct.mutate({ id: editId, ...data });
    } else {
      createProduct.mutate(data);
    }
  };

  const formatCurrency = (val: string | number | null) =>
    new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR" }).format(
      Number(val ?? 0)
    );

  const getCategoryName = (id: number | null) =>
    categories?.find((c) => c.id === id)?.name ?? "—";
  const getGroupName = (id: number | null) => {
    const g = (groups as any[])?.find((g: any) => g.id === id);
    return g ? (g.groupCode ? `[${g.groupCode}] ${g.name}` : g.name) : "—";
  };

  const sortedProducts = useMemo(() => {
    let list = [...(products ?? [])];
    if (groupFilter !== "all") list = list.filter((p: any) => String(p.groupId ?? "") === groupFilter);
    list.sort((a: any, b: any) => {
      let av = a[sortField] ?? "";
      let bv = b[sortField] ?? "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [products, groupFilter, sortField, sortDir]);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            دليل الأصناف
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            إدارة وتنظيم أصناف المخزون
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة صنف جديد
        </Button>
      </div>

      {/* تبويبات العرض */}
      <div className="flex border-b border-border bg-muted/10">
        <button
          onClick={() => setViewTab("products")}
          className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            viewTab === "products" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="w-4 h-4" />
          حسب الأصناف
          {products && (
            <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px]">
              {products.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setViewTab("categories")}
          className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            viewTab === "categories" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Tag className="w-4 h-4" />
          حسب الفئات
          {categories && (
            <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px]">
              {categories.length}
            </span>
          )}
        </button>
      </div>

      {/* ===== تبويب حسب الأصناف ===== */}
      {viewTab === "products" && (
        <>
      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو الباركود أو الكود..."
                className="pr-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="كل التصنيفات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل التصنيفات</SelectItem>
                {categories?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="كل المجموعات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المجموعات</SelectItem>
                {(groups as any[])?.map((g: any) => (
                  <SelectItem key={g.id} value={String(g.id)}>
                    {g.groupCode ? `[${g.groupCode}] ` : ""}{g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Archive className="w-4 h-4 text-primary" />
            قائمة الأصناف
            {products && (
              <Badge variant="secondary" className="mr-auto text-xs">
                {products.length} صنف
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => toggleSort("sku")}>
                  <span className="flex items-center gap-1">الكود {sortField === "sku" ? (sortDir === "asc" ? "↑" : "↓") : ""}</span>
                </TableHead>
                <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => toggleSort("name")}>
                  <span className="flex items-center gap-1">اسم الصنف {sortField === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}</span>
                </TableHead>
                <TableHead className="text-right">الباركود</TableHead>
                <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => toggleSort("categoryId")}>
                  <span className="flex items-center gap-1">التصنيف {sortField === "categoryId" ? (sortDir === "asc" ? "↑" : "↓") : ""}</span>
                </TableHead>
                <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => toggleSort("groupId")}>
                  <span className="flex items-center gap-1">المجموعة {sortField === "groupId" ? (sortDir === "asc" ? "↑" : "↓") : ""}</span>
                </TableHead>
                <TableHead className="text-right">الوحدة</TableHead>
                <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => toggleSort("costPrice")}>
                  <span className="flex items-center gap-1">التكلفة {sortField === "costPrice" ? (sortDir === "asc" ? "↑" : "↓") : ""}</span>
                </TableHead>
                <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => toggleSort("salePrice")}>
                  <span className="flex items-center gap-1">سعر البيع {sortField === "salePrice" ? (sortDir === "asc" ? "↑" : "↓") : ""}</span>
                </TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right w-20">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !products?.length ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p>لا توجد أصناف</p>
                    <p className="text-xs mt-1">اضغط "إضافة صنف جديد" للبدء</p>
                  </TableCell>
                </TableRow>
              ) : (
                sortedProducts.map((p: any) => (
                  <TableRow key={p.id} className="hover:bg-muted/30">
                    <TableCell
                      className="font-mono text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                      onClick={() => openEdit(p)}
                    >
                      {p.sku ?? "—"}
                    </TableCell>
                    <TableCell
                      className="font-medium cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={() => openEdit(p)}
                    >
                      <div>
                        <p>{p.name}</p>
                        {p.name2 && (
                          <p className="text-xs text-muted-foreground font-normal" dir="ltr">{p.name2}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {p.barcode ?? "—"}
                    </TableCell>
                    <TableCell>{getCategoryName(p.categoryId)}</TableCell>
                    <TableCell className="text-xs">{getGroupName(p.groupId)}</TableCell>
                    <TableCell>{p.unit}</TableCell>
                    <TableCell>{formatCurrency(p.costPrice ?? 0)}</TableCell>
                    <TableCell className="font-semibold text-primary">
                      {formatCurrency(p.salePrice)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={p.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {p.isActive ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(p)}
                          title="تعديل"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("هل تريد حذف هذا الصنف؟")) {
                              deleteProduct.mutate({ id: p.id });
                            }
                          }}
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      </>
      )}

      {/* ===== تبويب حسب الفئات ===== */}
      {viewTab === "categories" && (
        <div className="flex gap-4">
          {/* قائمة الفئات */}
          <div className="w-56 shrink-0 border border-border rounded-lg overflow-hidden bg-card">
            <div className="px-3 py-2 border-b border-border bg-muted/30">
              <span className="text-xs font-bold">الفئات</span>
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              <button
                onClick={() => setSelectedCatId(null)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-right ${
                  selectedCatId === null ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <Package className="w-3.5 h-3.5 shrink-0" />
                الكل
                {products && (
                  <span className="mr-auto text-[10px] bg-muted rounded-full px-1.5">{products.length}</span>
                )}
              </button>
              {categories?.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-right ${
                    selectedCatId === cat.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }`}
                >
                  <Tag className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
          {/* جدول الأصناف حسب الفئة */}
          <div className="flex-1">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Archive className="w-4 h-4 text-primary" />
                  {selectedCatId === null
                    ? "جميع الأصناف"
                    : categories?.find((c: any) => c.id === selectedCatId)?.name ?? "الفئة المختارة"}
                  <Badge variant="secondary" className="mr-auto text-xs">
                    {(selectedCatId === null ? products : catProducts)?.length ?? 0} صنف
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-right">الكود</TableHead>
                      <TableHead className="text-right">اسم الصنف</TableHead>
                      <TableHead className="text-right">الوحدة</TableHead>
                      <TableHead className="text-right">التكلفة</TableHead>
                      <TableHead className="text-right">سعر البيع</TableHead>
                      <TableHead className="text-right w-20">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingCatProducts ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 6 }).map((_, j) => (
                            <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : !(selectedCatId === null ? products : catProducts)?.length ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">لا توجد أصناف في هذه الفئة</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      (selectedCatId === null ? products : catProducts)?.map((p: any) => (
                        <TableRow key={p.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => openEdit(p)}>
                          <TableCell className="font-mono text-xs text-blue-600 dark:text-blue-400">{p.sku ?? "—"}</TableCell>
                          <TableCell className="font-medium">
                            <div>
                              <p>{p.name}</p>
                              {p.name2 && <p className="text-xs text-muted-foreground">{p.name2}</p>}
                            </div>
                          </TableCell>
                          <TableCell>{p.unit}</TableCell>
                          <TableCell>{formatCurrency(p.costPrice ?? 0)}</TableCell>
                          <TableCell className="font-semibold text-primary">{formatCurrency(p.salePrice)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); openEdit(p); }} title="تعديل">
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={e => { e.stopPropagation(); if (confirm("هل تريد حذف هذا الصنف؟")) deleteProduct.mutate({ id: p.id }); }} title="حذف">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ===== Dialog كارت الصنف (محدود الأبعاد) ===== */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && setIsOpen(false)}>
        <DialogContent
          className="max-w-[95vw] w-[1100px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden"
          dir="rtl"
        >
          <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between px-4 py-2.5 border-b border-border bg-slate-100 dark:bg-slate-800 rounded-t-lg">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-slate-700 dark:text-slate-200">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              {editId ? `تعديل بيانات الصنف${form.sku ? ` - ${form.sku}` : ""}` : "إضافة صنف جديد"}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={createProduct.isPending || updateProduct.isPending}
                className="gap-1 h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createProduct.isPending || updateProduct.isPending
                  ? "جارِ الحفظ..."
                  : editId ? "حفظ التعديلات" : "إضافة الصنف"}
              </Button>
              <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => setIsOpen(false)}>
                <X className="w-3.5 h-3.5" />
                إغلاق
              </Button>
            </div>
          </DialogHeader>
          {/* محتوى الكارت */}
          <div className="flex-1 overflow-hidden">
            <ProductCard
              form={form}
              setForm={setForm}
              categories={categories}
              groups={groups as any}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
