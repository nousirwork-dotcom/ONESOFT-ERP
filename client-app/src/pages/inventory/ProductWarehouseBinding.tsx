import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Link2, Package, Warehouse, CheckCircle2 } from "lucide-react";

export default function ProductWarehouseBinding() {
  const utils = trpc.useUtils();
  const { data: products = [] } = trpc.products.list.useQuery();
  const { data: warehouses = [] } = trpc.warehouses.list.useQuery();
  const { data: bindings = [], isLoading } = trpc.productBinding.list.useQuery();

  const bindMutation = trpc.productBinding.bind.useMutation({
    onSuccess: () => { utils.productBinding.list.invalidate(); toast.success("تم ربط الصنف بالمخزن"); },
    onError: (e) => toast.error(e.message),
  });

  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");

  const handleBind = () => {
    if (!selectedProduct || !selectedWarehouse) return toast.error("اختر صنفاً ومخزناً");
    bindMutation.mutate({ productId: Number(selectedProduct), warehouseId: Number(selectedWarehouse) });
  };

  const isAlreadyBound = (productId: number, warehouseId: number) =>
    bindings.some((b: any) => b.productId === productId && b.warehouseId === warehouseId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link2 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">ربط الأصناف بالمخازن</h2>
        <Badge variant="secondary">{bindings.length} ربط</Badge>
      </div>

      {/* ربط جديد */}
      <div className="border border-border rounded-xl p-4 bg-card space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground">إضافة ربط جديد</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الصنف" />
            </SelectTrigger>
            <SelectContent>
              {(products as any[]).map(p => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
            <SelectTrigger>
              <SelectValue placeholder="اختر المخزن" />
            </SelectTrigger>
            <SelectContent>
              {(warehouses as any[]).map(w => (
                <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleBind} disabled={bindMutation.isPending} className="gap-2">
            <Link2 className="w-4 h-4" />
            ربط
          </Button>
        </div>
      </div>

      {/* جدول الروابط الحالية */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-right"><Package className="w-4 h-4 inline ml-1" />الصنف</TableHead>
              <TableHead className="text-right"><Warehouse className="w-4 h-4 inline ml-1" />المخزن</TableHead>
              <TableHead className="text-right">الكمية المتاحة</TableHead>
              <TableHead className="text-right">الكمية المحجوزة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 4 }).map((_, j) => <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>)}</TableRow>
              ))
            ) : bindings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  <Link2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  لا توجد روابط بعد
                </TableCell>
              </TableRow>
            ) : (
              (bindings as any[]).map((b: any) => {
                const prod = (products as any[]).find(p => p.id === b.productId);
                const wh = (warehouses as any[]).find(w => w.id === b.warehouseId);
                return (
                  <TableRow key={`${b.productId}-${b.warehouseId}`} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-medium">{prod?.name ?? `#${b.productId}`}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{wh?.name ?? `#${b.warehouseId}`}</TableCell>
                    <TableCell>
                      <Badge variant={Number(b.quantity) > 0 ? "default" : "destructive"} className="font-mono">
                        {Number(b.quantity).toFixed(0)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{Number(b.reservedQuantity ?? 0).toFixed(0)}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
