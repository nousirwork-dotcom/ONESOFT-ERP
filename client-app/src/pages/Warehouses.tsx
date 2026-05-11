import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Edit, Plus, Warehouse } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Warehouses() {
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", branchId: "", description: "" });
  const utils = trpc.useUtils();

  const { data: warehouses, isLoading } = trpc.warehouses.list.useQuery();
  const { data: branches } = trpc.branches.list.useQuery();

  const create = trpc.warehouses.create.useMutation({
    onSuccess: () => { utils.warehouses.list.invalidate(); toast.success("تم إنشاء المخزن"); setIsOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.warehouses.update.useMutation({
    onSuccess: () => { utils.warehouses.list.invalidate(); toast.success("تم تحديث المخزن"); setIsOpen(false); },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => { setEditId(null); setForm({ name: "", branchId: "", description: "" }); setIsOpen(true); };
  const openEdit = (w: any) => { setEditId(w.id); setForm({ name: w.name, branchId: String(w.branchId), description: w.description ?? "" }); setIsOpen(true); };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("اسم المخزن مطلوب"); return; }
    if (!form.branchId) { toast.error("الفرع مطلوب"); return; }
    if (editId) update.mutate({ id: editId, name: form.name, description: form.description || undefined });
    else create.mutate({ name: form.name, branchId: Number(form.branchId), description: form.description || undefined });
  };

  const getBranchName = (id: number) => branches?.find((b) => b.id === id)?.name ?? "—";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">المخازن</h1><p className="text-muted-foreground text-sm mt-0.5">إدارة مخازن الفروع</p></div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" />إضافة مخزن</Button>
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-right">المخزن</TableHead>
                <TableHead className="text-right">الفرع</TableHead>
                <TableHead className="text-right">الوصف</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right w-20">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => (<TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>))}</TableRow>
                ))
              ) : warehouses?.map((w) => (
                <TableRow key={w.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium"><div className="flex items-center gap-2"><Warehouse className="w-4 h-4 text-primary" />{w.name}</div></TableCell>
                  <TableCell>{getBranchName(w.branchId)}</TableCell>
                  <TableCell className="text-muted-foreground">{w.description ?? "—"}</TableCell>
                  <TableCell><Badge variant={w.isActive ? "default" : "secondary"} className="text-xs">{w.isActive ? "نشط" : "غير نشط"}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(w)}><Edit className="w-3.5 h-3.5" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? "تعديل المخزن" : "إضافة مخزن جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>اسم المخزن *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label>الفرع *</Label>
              <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="اختر الفرع" /></SelectTrigger>
                <SelectContent>{branches?.map((b) => (<SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div><Label>الوصف</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={create.isPending || update.isPending}>{editId ? "حفظ" : "إضافة"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
