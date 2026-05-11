import { useState } from "react";
import { useLocation } from "wouter";
import {
  ChevronDown, ChevronRight, FolderTree, Ruler, Layers, Tag, Link2, TrendingUp,
  ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, ClipboardList, RefreshCw,
  BarChart3, Settings, Building2, Warehouse, Package, FileText
} from "lucide-react";
// صفحات المخزون
import CategoryTree from "./inventory/CategoryTree";
import Units from "./inventory/Units";
import ProductGroups from "./inventory/ProductGroups";
import ProductWarehouseBinding from "./inventory/ProductWarehouseBinding";
import AutoPricing from "./inventory/AutoPricing";
import StockVouchers from "./inventory/StockVouchers";
import InventoryCount from "./inventory/InventoryCount";
import InventoryReports from "./inventory/InventoryReports";

// استيراد الصفحات الموجودة
import Products from "./Products";
import Warehouses from "./Warehouses";
import Branches from "./Branches";
import Transfers from "./Transfers";

type MenuSection = {
  id: string;
  label: string;
  icon: React.ElementType;
  children?: { id: string; label: string; icon: React.ElementType }[];
};

const menuSections: MenuSection[] = [
  {
    id: "products-section",
    label: "الأصناف",
    icon: Package,
    children: [
      { id: "products-list", label: "دليل الأصناف", icon: Package },
      { id: "units", label: "وحدات الأصناف", icon: Ruler },
      { id: "product-groups", label: "إنشاء مجموعات الأصناف", icon: Layers },
      { id: "categories", label: "فئات الأصناف", icon: Tag },
      { id: "product-binding", label: "ربط الأصناف بالمخازن", icon: Link2 },
      { id: "auto-pricing", label: "تسعير الأصناف آلياً", icon: TrendingUp },
    ],
  },
  {
    id: "vouchers-section",
    label: "السندات",
    icon: FileText,
    children: [
      { id: "transfer-voucher", label: "سند تحويل بين الفروع", icon: ArrowLeftRight },
      { id: "receipt-voucher", label: "سند توريد", icon: ArrowDownCircle },
      { id: "issue-voucher", label: "سند صرف", icon: ArrowUpCircle },
    ],
  },
  {
    id: "inventory-count",
    label: "شاشة جرد المخزون",
    icon: ClipboardList,
  },
  {
    id: "invoice-ops",
    label: "عمليات الفواتير",
    icon: RefreshCw,
    children: [
      { id: "reinstate-invoices", label: "إعادة تثبيت الفواتير", icon: RefreshCw },
      { id: "regenerate-invoices", label: "إعادة توليد الفواتير", icon: RefreshCw },
    ],
  },
  {
    id: "reports-section",
    label: "التقارير",
    icon: BarChart3,
    children: [
      { id: "stock-reports", label: "تقارير المخزون والأصناف", icon: BarChart3 },
      { id: "voucher-reports", label: "تقارير سندات المخزن", icon: FileText },
    ],
  },
  {
    id: "config-section",
    label: "التهيئة",
    icon: Settings,
    children: [
      { id: "branches-config", label: "الفروع", icon: Building2 },
      { id: "warehouses-config", label: "المستودعات", icon: Warehouse },
    ],
  },
];

function InventoryMenu({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "products-section": true,
    "vouchers-section": true,
    "reports-section": false,
    "config-section": false,
    "invoice-ops": false,
  });

  const toggle = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  return (
    <nav className="w-56 shrink-0 border-l border-border bg-card/50 overflow-y-auto">
      <div className="p-3 border-b border-border">
        <h2 className="font-bold text-sm flex items-center gap-2">
          <Warehouse className="w-4 h-4 text-primary" />
          المخزون
        </h2>
      </div>
      <div className="py-2">
        {menuSections.map(section => (
          <div key={section.id}>
            {section.children ? (
              <>
                <button
                  onClick={() => toggle(section.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
                >
                  <section.icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-right">{section.label}</span>
                  {expanded[section.id]
                    ? <ChevronDown className="w-3.5 h-3.5" />
                    : <ChevronRight className="w-3.5 h-3.5" />
                  }
                </button>
                {expanded[section.id] && (
                  <div className="mr-4 border-r border-border/50">
                    {section.children.map(child => (
                      <button
                        key={child.id}
                        onClick={() => onSelect(child.id)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                          activeId === child.id
                            ? "bg-primary/10 text-primary font-medium border-r-2 border-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                        }`}
                      >
                        <child.icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-right leading-tight">{child.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => onSelect(section.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold transition-colors ${
                  activeId === section.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                }`}
              >
                <section.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-right">{section.label}</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}

function InventoryContent({ activeId }: { activeId: string }) {
  switch (activeId) {

    case "products-list": return <Products />;
    case "units": return <Units />;
    case "product-groups": return <ProductGroups />;
    case "categories": return <CategoryTree />;
    case "product-binding": return <ProductWarehouseBinding />;
    case "auto-pricing": return <AutoPricing />;
    case "transfer-voucher": return <Transfers />;
    case "receipt-voucher": return <StockVouchers />;
    case "issue-voucher": return <StockVouchers />;
    case "inventory-count": return <InventoryCount />;
    case "stock-reports":
    case "voucher-reports": return <InventoryReports />;
    case "branches-config": return <Branches />;
    case "warehouses-config": return <Warehouses />;
    case "reinstate-invoices":
    case "regenerate-invoices":
      return (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
          <RefreshCw className="w-12 h-12 opacity-20" />
          <p className="text-lg font-medium">قريباً</p>
          <p className="text-sm">هذه الميزة قيد التطوير</p>
        </div>
      );
    default:
      return (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
          <Package className="w-12 h-12 opacity-20" />
          <p>اختر قسماً من القائمة</p>
        </div>
      );
  }
}

export default function InventoryModule() {
  const [activeId, setActiveId] = useState("products-list");

  return (
    <div className="flex h-full" dir="rtl">
      <InventoryMenu activeId={activeId} onSelect={setActiveId} />
      <div className="flex-1 overflow-auto p-6">
        <InventoryContent activeId={activeId} />
      </div>
    </div>
  );
}
