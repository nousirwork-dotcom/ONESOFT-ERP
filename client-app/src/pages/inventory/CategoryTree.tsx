import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus, Edit, Package, Tag, RefreshCw, ChevronDown, ChevronLeft, ChevronRight,
  FolderTree, Layers, BookOpen, Ruler, Archive, Receipt, Factory, Barcode, Trash2,
  LayoutList, Pin, PinOff
} from "lucide-react";

// ─── أنواع البيانات ────────────────────────────────────────────
type Category = {
  id: number; uuid: string; name: string;
  parentId?: number | null; description?: string | null;
  color?: string | null; isActive: boolean;
};
type Product = {
  id: number; uuid: string; name: string; nameEn?: string | null;
  sku?: string | null; barcode?: string | null; brand?: string | null; model?: string | null;
  description?: string | null; categoryId?: number | null;
  unit?: string | null; purchaseUnit?: string | null; saleUnit?: string | null; conversionFactor?: string | null;
  minStock?: number | null; maxStock?: number | null; reorderPoint?: number | null;
  trackBatch?: boolean | null; trackSerial?: boolean | null;
  purchasePrice?: string | null; costPrice?: string | null;
  salePrice: string; salePrice2?: string | null; wholesalePrice?: string | null;
  vatRate?: string | null; taxable?: boolean | null; hasBOM?: boolean | null;
  isActive: boolean;
};
type ProductForm = {
  name: string; nameEn: string; sku: string; barcode: string;
  categoryId: string; brand: string; model: string; description: string;
  unit: string; purchaseUnit: string; saleUnit: string; conversionFactor: string;
  minStock: string; maxStock: string; reorderPoint: string;
  trackBatch: boolean; trackSerial: boolean;
  purchasePrice: string; costPrice: string; salePrice: string;
  salePrice2: string; wholesalePrice: string;
  vatRate: string; taxable: boolean; hasBOM: boolean;
};

const emptyForm: ProductForm = {
  name: "", nameEn: "", sku: "", barcode: "", categoryId: "", brand: "", model: "", description: "",
  unit: "قطعة", purchaseUnit: "", saleUnit: "", conversionFactor: "1",
  minStock: "0", maxStock: "0", reorderPoint: "0",
  trackBatch: false, trackSerial: false,
  purchasePrice: "0", costPrice: "0", salePrice: "0", salePrice2: "0", wholesalePrice: "0",
  vatRate: "15", taxable: true, hasBOM: false,
};

const FOLDER_COLORS = ["#f59e0b", "#6366f1", "#10b981", "#f43f5e", "#0ea5e9", "#8b5cf6", "#ec4899"];
type ViewMode = "classic" | "progressive";
const STORAGE_KEY = "onesoft_category_view_mode";

// ─── شريط تبديل طريقة العرض ────────────────────────────────────
function ViewModeBar({ mode, onChangeMode }: { mode: ViewMode; onChangeMode: (m: ViewMode) => void }) {
  const [pinned, setPinned] = useState<ViewMode | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as ViewMode) || null;
  });
  const handlePin = () => {
    if (pinned === mode) {
      localStorage.removeItem(STORAGE_KEY);
      setPinned(null);
      toast.success("تم إلغاء التثبيت");
    } else {
      localStorage.setItem(STORAGE_KEY, mode);
      setPinned(mode);
      toast.success(`تم تثبيت طريقة العرض: ${mode === "classic" ? "الكلاسيكية" : "التدريجية"}`);
    }
  };
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30" dir="rtl">
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        <button
          onClick={() => onChangeMode("classic")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
            ${mode === "classic"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"}`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          شجرة كلاسيكية
        </button>
        <button
          onClick={() => onChangeMode("progressive")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
            ${mode === "progressive"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"}`}
        >
          <LayoutList className="w-3.5 h-3.5" />
          تنقل تدريجي
        </button>
      </div>
      <button
        onClick={handlePin}
        title={pinned === mode ? "إلغاء التثبيت" : "تثبيت هذه الطريقة"}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all border
          ${pinned === mode
            ? "bg-primary/10 text-primary border-primary/30 font-medium"
            : "text-muted-foreground border-border hover:text-foreground hover:bg-accent/50"}`}
      >
        {pinned === mode ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
        {pinned === mode ? "مثبّت" : "تثبيت"}
      </button>
    </div>
  );
}

// ─── مكوّن حقل النموذج ────────────────────────────────────────
function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}{required && <span className="text-destructive mr-1">*</span>}</Label>
      {children}
    </div>
  );
}

// ─── تبويبات بطاقة الصنف ──────────────────────────────────────
function ProductFormTabs({
  form, setForm, categories,
}: {
  form: ProductForm; setForm: (f: ProductForm) => void;
  categories: Array<{ id: number; name: string }> | undefined;
}) {
  const set = (key: keyof ProductForm, val: string | boolean) => setForm({ ...form, [key]: val });
  const margin = Number(form.salePrice) > 0 && Number(form.costPrice) > 0
    ? (((Number(form.salePrice) - Number(form.costPrice)) / Number(form.salePrice)) * 100).toFixed(1)
    : null;

  return (
    <Tabs defaultValue="basic" dir="rtl" className="w-full">
      <TabsList className="grid w-full grid-cols-5 h-9 mb-4">
        <TabsTrigger value="basic" className="text-xs gap-1"><BookOpen className="w-3 h-3" />البيانات الأساسية</TabsTrigger>
        <TabsTrigger value="units" className="text-xs gap-1"><Ruler className="w-3 h-3" />وحدات القياس</TabsTrigger>
        <TabsTrigger value="stock" className="text-xs gap-1"><Archive className="w-3 h-3" />المخزون</TabsTrigger>
        <TabsTrigger value="prices" className="text-xs gap-1"><Receipt className="w-3 h-3" />الأسعار</TabsTrigger>
        <TabsTrigger value="tax" className="text-xs gap-1"><Factory className="w-3 h-3" />الضرائب والتصنيع</TabsTrigger>
      </TabsList>

      {/* البيانات الأساسية */}
      <TabsContent value="basic" className="space-y-4 mt-0">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="اسم الصنف (عربي)" required>
            <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="مثال: لابتوب ديل" />
          </FormField>
          <FormField label="اسم الصنف (إنجليزي)">
            <Input value={form.nameEn} onChange={e => set("nameEn", e.target.value)} placeholder="e.g. Dell Laptop" dir="ltr" />
          </FormField>
          <FormField label="كود الصنف (SKU)">
            <Input value={form.sku} onChange={e => set("sku", e.target.value)} placeholder="مثال: DELL-001" dir="ltr" />
          </FormField>
          <FormField label="الباركود">
            <div className="relative">
              <Barcode className="absolute right-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input value={form.barcode} onChange={e => set("barcode", e.target.value)} className="pr-9" placeholder="6281234567890" dir="ltr" />
            </div>
          </FormField>
          <FormField label="التصنيف">
            <Select value={form.categoryId || "none"} onValueChange={v => set("categoryId", v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="اختر تصنيفاً" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون تصنيف</SelectItem>
                {categories?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="الماركة / العلامة التجارية">
            <Input value={form.brand} onChange={e => set("brand", e.target.value)} placeholder="مثال: Dell, Samsung" />
          </FormField>
          <FormField label="الموديل">
            <Input value={form.model} onChange={e => set("model", e.target.value)} placeholder="مثال: XPS 15 9530" />
          </FormField>
        </div>
        <FormField label="الوصف">
          <textarea value={form.description} onChange={e => set("description", e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background resize-none h-20"
            placeholder="وصف تفصيلي للصنف..." />
        </FormField>
      </TabsContent>

      {/* وحدات القياس */}
      <TabsContent value="units" className="space-y-4 mt-0">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="الوحدة الأساسية" required>
            <Select value={form.unit} onValueChange={v => set("unit", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["قطعة", "كيلو", "لتر", "متر", "صندوق", "كرتون", "دزينة", "طن", "جرام"].map(u =>
                  <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="وحدة الشراء">
            <Input value={form.purchaseUnit} onChange={e => set("purchaseUnit", e.target.value)} placeholder="مثال: كرتون" />
          </FormField>
          <FormField label="وحدة البيع">
            <Input value={form.saleUnit} onChange={e => set("saleUnit", e.target.value)} placeholder="مثال: قطعة" />
          </FormField>
          <FormField label="معامل التحويل">
            <Input type="number" value={form.conversionFactor} onChange={e => set("conversionFactor", e.target.value)} placeholder="مثال: 12" />
          </FormField>
        </div>
        {form.purchaseUnit && form.saleUnit && Number(form.conversionFactor) > 1 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              1 {form.purchaseUnit} = {form.conversionFactor} {form.saleUnit}
            </p>
          </div>
        )}
      </TabsContent>

      {/* المخزون */}
      <TabsContent value="stock" className="space-y-4 mt-0">
        <div className="grid grid-cols-3 gap-4">
          <FormField label="الحد الأدنى للمخزون">
            <Input type="number" value={form.minStock} onChange={e => set("minStock", e.target.value)} min="0" />
          </FormField>
          <FormField label="الحد الأقصى للمخزون">
            <Input type="number" value={form.maxStock} onChange={e => set("maxStock", e.target.value)} min="0" />
          </FormField>
          <FormField label="نقطة إعادة الطلب">
            <Input type="number" value={form.reorderPoint} onChange={e => set("reorderPoint", e.target.value)} min="0" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <p className="text-sm font-medium">تتبع الدفعات (Batch)</p>
              <p className="text-xs text-muted-foreground">تتبع الصنف حسب دفعات الإنتاج</p>
            </div>
            <Switch checked={form.trackBatch} onCheckedChange={v => set("trackBatch", v)} />
          </div>
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <p className="text-sm font-medium">تتبع الأرقام التسلسلية</p>
              <p className="text-xs text-muted-foreground">تتبع كل وحدة برقم تسلسلي</p>
            </div>
            <Switch checked={form.trackSerial} onCheckedChange={v => set("trackSerial", v)} />
          </div>
        </div>
      </TabsContent>

      {/* الأسعار */}
      <TabsContent value="prices" className="space-y-4 mt-0">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="سعر الشراء">
            <Input type="number" value={form.purchasePrice} onChange={e => set("purchasePrice", e.target.value)} step="0.001" min="0" />
          </FormField>
          <FormField label="سعر التكلفة">
            <Input type="number" value={form.costPrice} onChange={e => set("costPrice", e.target.value)} step="0.001" min="0" />
          </FormField>
          <FormField label="سعر البيع 1" required>
            <Input type="number" value={form.salePrice} onChange={e => set("salePrice", e.target.value)} step="0.001" min="0" />
          </FormField>
          <FormField label="سعر البيع 2">
            <Input type="number" value={form.salePrice2} onChange={e => set("salePrice2", e.target.value)} step="0.001" min="0" />
          </FormField>
          <FormField label="سعر الجملة">
            <Input type="number" value={form.wholesalePrice} onChange={e => set("wholesalePrice", e.target.value)} step="0.001" min="0" />
          </FormField>
        </div>
        {margin !== null && (
          <div className={`p-3 rounded-lg border ${Number(margin) >= 20 ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"}`}>
            <p className={`text-xs font-medium ${Number(margin) >= 20 ? "text-green-700 dark:text-green-300" : "text-amber-700 dark:text-amber-300"}`}>
              هامش الربح: {margin}%
            </p>
          </div>
        )}
      </TabsContent>

      {/* الضرائب والتصنيع */}
      <TabsContent value="tax" className="space-y-4 mt-0">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="نسبة ضريبة القيمة المضافة (%)">
            <Select value={form.vatRate} onValueChange={v => set("vatRate", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0% - معفى</SelectItem>
                <SelectItem value="5">5%</SelectItem>
                <SelectItem value="15">15% - القياسية</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <p className="text-sm font-medium">خاضع للضريبة</p>
              <p className="text-xs text-muted-foreground">تطبيق ضريبة القيمة المضافة</p>
            </div>
            <Switch checked={form.taxable} onCheckedChange={v => set("taxable", v)} />
          </div>
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <p className="text-sm font-medium">قائمة المواد (BOM)</p>
              <p className="text-xs text-muted-foreground">الصنف يحتوي على مكونات تصنيع</p>
            </div>
            <Switch checked={form.hasBOM} onCheckedChange={v => set("hasBOM", v)} />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

// ─── مكوّن عقدة الشجرة ────────────────────────────────────────
function TreeNode({ cat, allCats, level, selectedId, onSelect, onEdit }: {
  cat: Category; allCats: Category[]; level: number;
  selectedId: number | null; onSelect: (id: number) => void; onEdit: (cat: Category) => void;
}) {
  const children = allCats.filter(c => c.parentId === cat.id);
  const hasChildren = children.length > 0;
  const [open, setOpen] = useState(true);
  const isSelected = selectedId === cat.id;
  const color = cat.color || FOLDER_COLORS[cat.id % FOLDER_COLORS.length];

  return (
    <div>
      <div
        className={`flex items-center gap-0.5 cursor-pointer select-none group rounded
          ${isSelected ? "bg-blue-600 text-white" : "hover:bg-accent/50"}`}
        style={{ paddingRight: `${level * 14 + 4}px`, paddingLeft: "4px", paddingTop: "2px", paddingBottom: "2px" }}
        onClick={() => onSelect(cat.id)}
      >
        <button className="w-4 h-4 flex items-center justify-center shrink-0"
          onClick={e => { e.stopPropagation(); setOpen(o => !o); }}>
          {hasChildren
            ? (open ? <ChevronDown className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />)
            : <span className="w-3 h-3" />}
        </button>
        {hasChildren
          ? <span className="text-sm shrink-0" style={{ color: open ? "#f59e0b" : color }}>{open ? "📂" : "📁"}</span>
          : <span className="text-sm shrink-0">🗂️</span>}
        <span className={`text-xs flex-1 px-1 truncate ${isSelected ? "text-white font-semibold" : "text-foreground"}`}>
          {cat.name}
        </span>
        {!isSelected && (
          <button className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
            onClick={e => { e.stopPropagation(); onEdit(cat); }}>
            <Edit className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
      {open && hasChildren && children.map(child => (
        <TreeNode key={child.id} cat={child} allCats={allCats} level={level + 1}
          selectedId={selectedId} onSelect={onSelect} onEdit={onEdit} />
      ))}
    </div>
  );
}

// ─── جدول الأصناف مع إمكانية فتح البطاقة ─────────────────────
function ProductsTable({
  products, loading, onOpenProduct,
}: {
  products: Product[]; loading: boolean; onOpenProduct: (p: Product) => void;
}) {
  if (loading) return (
    <div className="h-full flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
        <p className="text-sm">جاري تحميل الأصناف...</p>
      </div>
    </div>
  );
  if (products.length === 0) return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
      <Package className="w-12 h-12 text-muted-foreground/20" />
      <p className="text-sm font-medium">لا توجد أصناف</p>
    </div>
  );
  return (
    <table className="w-full text-sm" dir="rtl">
      <thead className="bg-muted/40 sticky top-0">
        <tr>
          <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border">#</th>
          <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border">كود الصنف</th>
          <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border">اسم الصنف</th>
          <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border">الباركود</th>
          <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border">الوحدة</th>
          <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border">سعر البيع</th>
          <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border">الحالة</th>
        </tr>
      </thead>
      <tbody>
        {products.map((p, idx) => (
          <tr key={p.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
            <td className="px-4 py-2.5 text-xs text-muted-foreground">{idx + 1}</td>
            <td className="px-4 py-2.5">
              <button
                onClick={() => onOpenProduct(p)}
                className="flex items-center gap-1 group"
                title="فتح بطاقة الصنف"
              >
                <Tag className="w-3 h-3 text-muted-foreground" />
                <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded group-hover:bg-primary/10 group-hover:text-primary transition-colors cursor-pointer">
                  {p.sku || `#${String(p.id).padStart(4, "0")}`}
                </code>
              </button>
            </td>
            <td className="px-4 py-2.5">
              <button
                onClick={() => onOpenProduct(p)}
                className="font-medium text-sm text-right hover:text-primary hover:underline transition-colors cursor-pointer"
                title="فتح بطاقة الصنف"
              >
                {p.name}
              </button>
            </td>
            <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">{p.barcode || "—"}</td>
            <td className="px-4 py-2.5">
              <Badge variant="outline" className="text-[10px] h-5">{p.unit ?? "قطعة"}</Badge>
            </td>
            <td className="px-4 py-2.5 text-left">
              <span className="font-semibold text-primary tabular-nums text-sm">
                {Number(p.salePrice).toLocaleString("ar-SA", { minimumFractionDigits: 2 })}
              </span>
            </td>
            <td className="px-4 py-2.5">
              <Badge variant={p.isActive ? "default" : "secondary"} className="text-[10px] h-5">
                {p.isActive ? "نشط" : "موقوف"}
              </Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── جدول الفئات ──────────────────────────────────────────────
function CategoriesTable({
  categories, loading, onEdit,
}: {
  categories: Category[]; loading: boolean; onEdit: (c: Category) => void;
}) {
  if (loading) return (
    <div className="flex items-center justify-center py-16 text-muted-foreground">
      <div className="text-center">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
        <p className="text-sm">جاري تحميل الفئات...</p>
      </div>
    </div>
  );
  if (categories.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
      <Layers className="w-12 h-12 text-muted-foreground/20" />
      <p className="text-sm font-medium">لا توجد فئات</p>
    </div>
  );
  return (
    <table className="w-full text-sm" dir="rtl">
      <thead className="bg-muted/40 sticky top-0">
        <tr>
          <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border">#</th>
          <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border">اللون</th>
          <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border">اسم الفئة</th>
          <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border">الفئة الأم</th>
          <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border">الوصف</th>
          <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border">الحالة</th>
          <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border">إجراءات</th>
        </tr>
      </thead>
      <tbody>
        {categories.map((cat, idx) => {
          const parent = categories.find(c => c.id === cat.parentId);
          return (
            <tr key={cat.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
              <td className="px-4 py-2.5 text-xs text-muted-foreground">{idx + 1}</td>
              <td className="px-4 py-2.5">
                <div className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: cat.color || "#6366f1" }} />
              </td>
              <td className="px-4 py-2.5 font-medium">{cat.name}</td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">{parent ? parent.name : "—"}</td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[200px] truncate">{cat.description || "—"}</td>
              <td className="px-4 py-2.5">
                <Badge variant={cat.isActive ? "default" : "secondary"} className="text-[10px] h-5">
                  {cat.isActive ? "نشطة" : "موقوفة"}
                </Badge>
              </td>
              <td className="px-4 py-2.5">
                <Button variant="ghost" size="sm" className="h-7 w-7" onClick={() => onEdit(cat)} title="تعديل">
                  <Edit className="w-3.5 h-3.5" />
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── طريقة العرض التدريجية ─────────────────────────────────────
function ProgressiveView({ allCategories, onEdit, openCreate, onOpenProduct }: {
  allCategories: Category[]; onEdit: (c: Category) => void; openCreate: () => void;
  onOpenProduct: (p: Product) => void;
}) {
  const [path, setPath] = useState<Category[]>([]);
  const currentParentId = path.length > 0 ? path[path.length - 1].id : null;
  const currentItems = allCategories.filter(c =>
    currentParentId === null ? !c.parentId : c.parentId === currentParentId
  );
  const hasSubCategories = (cat: Category) => allCategories.some(c => c.parentId === cat.id);
  const [selectedLeafId, setSelectedLeafId] = useState<number | null>(null);
  const { data: leafProducts = [], isLoading: loadingLeaf } = trpc.products.list.useQuery(
    { categoryId: selectedLeafId ?? undefined },
    { enabled: selectedLeafId !== null }
  );
  const handleSelect = (cat: Category) => {
    if (hasSubCategories(cat)) {
      setPath(p => [...p, cat]);
      setSelectedLeafId(null);
    } else {
      setSelectedLeafId(cat.id);
    }
  };
  return (
    <div className="flex-1 overflow-auto p-4" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 mb-4 flex-wrap">
        <button onClick={() => { setPath([]); setSelectedLeafId(null); }}
          className="text-xs text-primary hover:underline font-medium">
          📁 الفئات الرئيسية
        </button>
        {path.map((cat, i) => (
          <span key={cat.id} className="flex items-center gap-1">
            <ChevronLeft className="w-3 h-3 text-muted-foreground" />
            <button onClick={() => { setPath(p => p.slice(0, i + 1)); setSelectedLeafId(null); }}
              className="text-xs text-primary hover:underline font-medium">
              {cat.name}
            </button>
          </span>
        ))}
        {selectedLeafId && (
          <span className="flex items-center gap-1">
            <ChevronLeft className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {allCategories.find(c => c.id === selectedLeafId)?.name}
            </span>
          </span>
        )}
      </div>
      {/* شبكة الفئات */}
      {!selectedLeafId && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
          {currentItems.map(cat => {
            const subCount = allCategories.filter(c => c.parentId === cat.id).length;
            const isLeaf = subCount === 0;
            return (
              <button key={cat.id} onClick={() => handleSelect(cat)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/30 transition-all group text-center">
                <span className="text-3xl">{isLeaf ? "🗂️" : "📁"}</span>
                <span className="text-xs font-medium text-foreground group-hover:text-primary truncate w-full text-center">
                  {cat.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {isLeaf ? "أصناف" : `${subCount} فئة فرعية`}
                </span>
              </button>
            );
          })}
          <button onClick={openCreate}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-dashed border-border hover:border-primary/40 hover:bg-accent/20 transition-all text-center">
            <span className="text-3xl text-muted-foreground/40">➕</span>
            <span className="text-xs text-muted-foreground">إضافة فئة</span>
          </button>
        </div>
      )}
      {/* جدول الأصناف */}
      {selectedLeafId && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">
                {allCategories.find(c => c.id === selectedLeafId)?.name}
              </span>
              <Badge variant="secondary" className="text-xs">{(leafProducts as Product[]).length} صنف</Badge>
            </div>
            <button onClick={() => setSelectedLeafId(null)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ChevronRight className="w-3 h-3" /> رجوع
            </button>
          </div>
          <ProductsTable products={leafProducts as Product[]} loading={loadingLeaf} onOpenProduct={onOpenProduct} />
        </div>
      )}
    </div>
  );
}

// ─── المكوّن الرئيسي ────────────────────────────────────────────
export default function CategoryTree() {
  const utils = trpc.useUtils();
  const [mainTab, setMainTab] = useState<"tree" | "categories" | "products">("tree");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as ViewMode) || "classic";
  });

  // بيانات الفئات
  const { data: allCategories = [], isLoading: loadingCats } = trpc.categories.tree.useQuery();
  // بيانات كل الأصناف
  const { data: allProducts = [], isLoading: loadingProducts } = trpc.products.list.useQuery(
    {},
    { enabled: mainTab === "products" }
  );

  // شجرة الفئات - الصنف المحدد
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  // -1 = الكل، null = لم يُختر بعد
  const { data: categoryProducts = [], isLoading: loadingCatProducts } = trpc.products.list.useQuery(
    { categoryId: selectedCatId !== null && selectedCatId !== -1 ? selectedCatId : undefined },
    { enabled: selectedCatId !== null && mainTab === "tree" }
  );

  // نافذة تعديل الفئة
  const [showCatDialog, setShowCatDialog] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ name: "", description: "", color: "#f59e0b", parentId: "" });

  const createCat = trpc.categories.create.useMutation({
    onSuccess: () => { utils.categories.tree.invalidate(); toast.success("تم إنشاء الفئة"); setShowCatDialog(false); },
    onError: e => toast.error(e.message),
  });
  const updateCat = trpc.categories.update.useMutation({
    onSuccess: () => { utils.categories.tree.invalidate(); toast.success("تم تحديث الفئة"); setShowCatDialog(false); },
    onError: e => toast.error(e.message),
  });

  const openCreateCat = () => {
    setEditCat(null);
    setCatForm({ name: "", description: "", color: "#f59e0b", parentId: "" });
    setShowCatDialog(true);
  };
  const openEditCat = (cat: Category) => {
    setEditCat(cat);
    setCatForm({ name: cat.name, description: cat.description ?? "", color: cat.color ?? "#f59e0b", parentId: cat.parentId ? String(cat.parentId) : "" });
    setShowCatDialog(true);
  };
  const handleCatSubmit = () => {
    if (!catForm.name.trim()) return toast.error("اسم الفئة مطلوب");
    if (editCat) {
      updateCat.mutate({ id: editCat.id, name: catForm.name, description: catForm.description, color: catForm.color });
    } else {
      createCat.mutate({ name: catForm.name, parentId: catForm.parentId ? Number(catForm.parentId) : undefined, description: catForm.description, color: catForm.color });
    }
  };

  // نافذة بطاقة الصنف (عرض + تعديل)
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editProductId, setEditProductId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(emptyForm);
  const { data: categories } = trpc.categories.list.useQuery(undefined, { staleTime: 60000 });

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("تم تحديث الصنف بنجاح");
      setShowProductDialog(false);
    },
    onError: e => toast.error(e.message),
  });
  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); toast.success("تم حذف الصنف"); setShowProductDialog(false); },
    onError: e => toast.error(e.message),
  });

  const openProduct = (p: Product) => {
    setEditProductId(p.id);
    setProductForm({
      name: p.name ?? "", nameEn: p.nameEn ?? "", sku: p.sku ?? "", barcode: p.barcode ?? "",
      categoryId: p.categoryId ? String(p.categoryId) : "", brand: p.brand ?? "", model: p.model ?? "",
      description: p.description ?? "", unit: p.unit ?? "قطعة",
      purchaseUnit: p.purchaseUnit ?? "", saleUnit: p.saleUnit ?? "", conversionFactor: p.conversionFactor ?? "1",
      minStock: String(p.minStock ?? 0), maxStock: String(p.maxStock ?? 0), reorderPoint: String(p.reorderPoint ?? 0),
      trackBatch: p.trackBatch ?? false, trackSerial: p.trackSerial ?? false,
      purchasePrice: p.purchasePrice ?? "0", costPrice: p.costPrice ?? "0", salePrice: p.salePrice ?? "0",
      salePrice2: p.salePrice2 ?? "0", wholesalePrice: p.wholesalePrice ?? "0",
      vatRate: p.vatRate ?? "15", taxable: p.taxable ?? true, hasBOM: p.hasBOM ?? false,
    });
    setShowProductDialog(true);
  };

  const handleProductSave = () => {
    if (!productForm.name.trim()) { toast.error("اسم الصنف مطلوب"); return; }
    if (!editProductId) return;
    updateProduct.mutate({
      id: editProductId,
      name: productForm.name.trim(),
      nameEn: productForm.nameEn.trim() || undefined,
      sku: productForm.sku.trim() || undefined,
      barcode: productForm.barcode.trim() || undefined,
      categoryId: productForm.categoryId ? Number(productForm.categoryId) : undefined,
      brand: productForm.brand.trim() || undefined,
      model: productForm.model.trim() || undefined,
      description: productForm.description.trim() || undefined,
      unit: productForm.unit || "قطعة",
      purchaseUnit: productForm.purchaseUnit.trim() || undefined,
      saleUnit: productForm.saleUnit.trim() || undefined,
      conversionFactor: productForm.conversionFactor || "1",
      minStock: Number(productForm.minStock) || 0,
      maxStock: Number(productForm.maxStock) || 0,
      reorderPoint: Number(productForm.reorderPoint) || 0,
      trackBatch: productForm.trackBatch,
      trackSerial: productForm.trackSerial,
      purchasePrice: productForm.purchasePrice || "0",
      costPrice: productForm.costPrice || "0",
      salePrice: productForm.salePrice || "0",
      salePrice2: productForm.salePrice2 || "0",
      wholesalePrice: productForm.wholesalePrice || "0",
      vatRate: productForm.vatRate || "15",
      taxable: productForm.taxable,
      hasBOM: productForm.hasBOM,
    });
  };

  const selectedCat = selectedCatId ? (allCategories as Category[]).find(c => c.id === selectedCatId) : null;
  const rootCats = (allCategories as Category[]).filter(c => !c.parentId);

  return (
    <div className="flex flex-col h-full border border-border rounded-xl overflow-hidden bg-card">

      {/* ─── الترويسة الرئيسية ─── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20" dir="rtl">
        <div className="flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold text-foreground">شجرة الأصناف</h2>
        </div>
        <Button size="sm" variant="outline" onClick={openCreateCat} className="gap-1.5 text-xs h-8">
          <Plus className="w-3.5 h-3.5" />
          إضافة فئة
        </Button>
      </div>

      {/* ─── تبويبات الشجرة / حسب الفئات / حسب الأصناف ─── */}
      <div className="flex border-b border-border bg-muted/10" dir="rtl">
        <button
          onClick={() => setMainTab("tree")}
          className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-medium border-b-2 transition-colors
            ${mainTab === "tree" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          شجرة الأصناف
        </button>
        <button
          onClick={() => setMainTab("categories")}
          className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-medium border-b-2 transition-colors
            ${mainTab === "categories" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Layers className="w-3.5 h-3.5" />
          حسب الفئات
          <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px]">
            {(allCategories as Category[]).length}
          </span>
        </button>
        <button
          onClick={() => setMainTab("products")}
          className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-medium border-b-2 transition-colors
            ${mainTab === "products" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Package className="w-3.5 h-3.5" />
          حسب الأصناف
          <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px]">
            {(allProducts as Product[]).length}
          </span>
        </button>
      </div>

      {/* ─── محتوى تبويب الشجرة ─── */}
      {mainTab === "tree" && (
        <>
          <ProgressiveView
            allCategories={allCategories as Category[]}
            onEdit={openEditCat}
            openCreate={openCreateCat}
            onOpenProduct={openProduct}
          />
        {false && (
        <div className="flex flex-1 min-h-0" dir="rtl">
          {/* عمود الفئات */}
          <div className="w-64 shrink-0 border-l border-border flex flex-col bg-background">
            <div className="flex items-center justify-between px-2 py-2 border-b border-border bg-muted/30">
              <span className="text-xs font-bold text-foreground">الفئات</span>
              <button onClick={openCreateCat} className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-primary rounded" title="إضافة فئة">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* أزرار نوع العرض */}
            <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/10" dir="rtl">
              <button
                onClick={() => setViewMode("classic")}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all flex-1 justify-center
                  ${viewMode === "classic" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              >
                <FolderTree className="w-3 h-3" />
                شجرة
              </button>
              <button
                onClick={() => setViewMode("progressive")}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all flex-1 justify-center
                  ${(viewMode as string) === "progressive" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              >
                <LayoutList className="w-3 h-3" />
                بطاقات
              </button>
            </div>
            <div className="flex-1 overflow-auto py-1 px-1">
              {loadingCats ? (
                <div className="p-4 text-center"><RefreshCw className="w-4 h-4 animate-spin mx-auto text-primary" /></div>
              ) : (
                <>
                  {/* خيار الكل */}
                  <div
                    className={`flex items-center gap-1.5 cursor-pointer select-none rounded px-2 py-1.5 mb-0.5
                      ${selectedCatId === -1 ? "bg-blue-600 text-white" : "hover:bg-accent/50"}`}
                    onClick={() => setSelectedCatId(-1)}
                  >
                    <span className="text-sm">📦</span>
                    <span className={`text-xs font-semibold ${selectedCatId === -1 ? "text-white" : "text-foreground"}`}>الكل</span>
                  </div>
                  {rootCats.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      لا توجد فئات
                      <button onClick={openCreateCat} className="text-primary hover:underline mt-1 block mx-auto">+ إضافة فئة</button>
                    </div>
                  ) : rootCats.map(cat => (
                    <TreeNode key={cat.id} cat={cat} allCats={allCategories as Category[]} level={0}
                      selectedId={selectedCatId} onSelect={setSelectedCatId} onEdit={openEditCat} />
                  ))}
                </>
              )}
            </div>
            <div className="border-t border-border px-2 py-1.5 bg-muted/20">
              <p className="text-[10px] text-muted-foreground">{(allCategories as Category[]).length} فئة إجمالي</p>
            </div>
          </div>

          {/* عمود الأصناف */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold">
                    {selectedCatId === -1 ? "كل الأصناف" : selectedCat ? (selectedCat as any).name : "الأصناف"}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">{(categoryProducts as Product[]).length} صنف</Badge>
            </div>
            <div className="flex-1 overflow-auto">
              {selectedCatId === null ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <div className="text-5xl">📁</div>
                  <p className="text-sm font-medium">اختر فئة من الشجرة على اليمين</p>
                  <p className="text-xs text-muted-foreground">اضغط على "الكل" لعرض جميع الأصناف أو اختر فئة محددة</p>
                </div>
              ) : (
                <ProductsTable
                  products={categoryProducts as Product[]}
                  loading={loadingCatProducts}
                  onOpenProduct={openProduct}
                />
              )}
            </div>
          </div>
        </div>
        )}
        </>
      )}
      {/* ─── محتوى تبويب الفئات ─── */}
      {mainTab === "categories" && (
        <div className="flex-1 overflow-auto">
          <CategoriesTable
            categories={allCategories as Category[]}
            loading={loadingCats}
            onEdit={openEditCat}
          />
        </div>
      )}

      {/* ─── محتوى تبويب الأصناف ─── */}
      {mainTab === "products" && (
        <div className="flex-1 overflow-auto">
          <ProductsTable
            products={allProducts as Product[]}
            loading={loadingProducts}
            onOpenProduct={openProduct}
          />
        </div>
      )}

      {/* ─── نافذة إضافة/تعديل فئة ─── */}
      <Dialog open={showCatDialog} onOpenChange={setShowCatDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editCat ? "تعديل الفئة" : "إضافة فئة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>اسم الفئة *</Label>
              <Input value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} placeholder="مثال: إلكترونيات" />
            </div>
            {!editCat && (
              <div className="space-y-1.5">
                <Label>الفئة الأم (اختياري)</Label>
                <select value={catForm.parentId} onChange={e => setCatForm(p => ({ ...p, parentId: e.target.value }))}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background">
                  <option value="">بدون فئة أم (رئيسية)</option>
                  {(allCategories as Category[]).map(c => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>الوصف</Label>
              <Input value={catForm.description} onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))} placeholder="وصف اختياري" />
            </div>
            <div className="space-y-1.5">
              <Label>اللون</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={catForm.color} onChange={e => setCatForm(p => ({ ...p, color: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                <div className="flex gap-1.5">
                  {FOLDER_COLORS.map(col => (
                    <button key={col} onClick={() => setCatForm(p => ({ ...p, color: col }))}
                      className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                      style={{ backgroundColor: col, borderColor: catForm.color === col ? "white" : "transparent" }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCatDialog(false)}>إلغاء</Button>
            <Button onClick={handleCatSubmit} disabled={createCat.isPending || updateCat.isPending}>
              {editCat ? "حفظ" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── نافذة بطاقة الصنف ─── */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-primary" />
              بطاقة الصنف
              {productForm.name && <span className="text-muted-foreground font-normal text-base">— {productForm.name}</span>}
            </DialogTitle>
          </DialogHeader>
          <ProductFormTabs
            form={productForm}
            setForm={setProductForm}
            categories={categories}
          />
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="destructive"
              size="sm"
              className="ml-auto gap-1.5"
              onClick={() => {
                if (editProductId && confirm("هل تريد حذف هذا الصنف؟")) {
                  deleteProduct.mutate({ id: editProductId });
                }
              }}
              disabled={deleteProduct.isPending}
            >
              <Trash2 className="w-3.5 h-3.5" />
              حذف
            </Button>
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>إلغاء</Button>
            <Button onClick={handleProductSave} disabled={updateProduct.isPending} className="gap-2">
              {updateProduct.isPending ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
