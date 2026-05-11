import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Layers, Edit, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";

type SortField = "groupCode" | "name" | "id";
type SortDir = "asc" | "desc";

export default function ProductGroups() {
  const utils = trpc.useUtils();
  const { data: groups = [], isLoading } = trpc.productGroups.list.useQuery();
  const createMutation = trpc.productGroups.create.useMutation({
    onSuccess: () => {
      utils.productGroups.list.invalidate();
      toast.success("تم إنشاء المجموعة");
      setShowDialog(false);
      setForm({ groupCode: "", name: "", description: "" });
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.productGroups.update.useMutation({
    onSuccess: () => { utils.productGroups.list.invalidate(); toast.success("تم تحديث المجموعة"); setShowDialog(false); },
    onError: (e) => toast.error(e.message),
  });

  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ groupCode: "", name: "", description: "" });
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const openCreate = () => {
    setEditItem(null);
    setForm({ groupCode: "", name: "", description: "" });
    setShowDialog(true);
  };
  const openEdit = (g: any) => {
    setEditItem(g);
    setForm({ groupCode: g.groupCode ?? "", name: g.name, description: g.description ?? "" });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error("اسم المجموعة مطلوب");
    if (editItem) {
      updateMutation.mutate({
        id: editItem.id,
        groupCode: form.groupCode || undefined,
        name: form.name,
        description: form.description || undefined,
      });
    } else {
      createMutation.mutate({
        groupCode: form.groupCode || undefined,
        name: form.name,
        description: form.description || undefined,
      });
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />;
    return sortDir === "asc"
      ? <ArrowUp className="w-3 h-3 text-primary" />
      : <ArrowDown className="w-3 h-3 text-primary" />;
  };

  const filteredGroups = useMemo(() => {
    let result = [...(groups as any[])];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(g =>
        g.name.toLowerCase().includes(q) ||
        (g.groupCode ?? "").toLowerCase().includes(q) ||
        (g.description ?? "").toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      let aVal = sortField === "id" ? a.id : (a[sortField] ?? "");
      let bVal = sortField === "id" ? b.id : (b[sortField] ?? "");
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [groups, search, sortField, sortDir]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">مجموعات الأصناف</h2>
          <Badge variant="secondary">{(groups as any[]).length} مجموعة</Badge>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          إنشاء مجموعة
        </Button>
      </div>

      {/* شريط البحث */}
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="بحث في المجموعات..."
          className="pr-9 text-sm"
        />
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-right w-12">
                <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("id")}>
                  # <SortIcon field="id" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("groupCode")}>
                  رقم المجموعة <SortIcon field="groupCode" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("name")}>
                  اسم المجموعة <SortIcon field="name" />
                </button>
              </TableHead>
              <TableHead className="text-right">الوصف</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <Layers className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  {search ? "لا توجد نتائج للبحث" : "لا توجد مجموعات بعد"}
                </TableCell>
              </TableRow>
            ) : (
              filteredGroups.map((g: any, i: number) => (
                <TableRow key={g.id} className="hover:bg-muted/20">
                  <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                  <TableCell>
                    {g.groupCode ? (
                      <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-primary font-semibold">
                        {g.groupCode}
                      </code>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                    {g.description ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={g.isActive ? "default" : "secondary"} className="text-[10px] h-5">
                      {g.isActive ? "نشط" : "موقوف"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(g)}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editItem ? "تعديل المجموعة" : "إنشاء مجموعة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>رقم المجموعة</Label>
              <Input
                value={form.groupCode}
                onChange={e => setForm(p => ({ ...p, groupCode: e.target.value }))}
                placeholder="مثال: GRP-001 أو D-001"
                className="font-mono"
              />
              <p className="text-[11px] text-muted-foreground">رقم مرجعي للمجموعة (اختياري)</p>
            </div>
            <div className="space-y-1.5">
              <Label>اسم المجموعة *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="مثال: دهانات بلاستيكية"
              />
            </div>
            <div className="space-y-1.5">
              <Label>الوصف</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="وصف اختياري للمجموعة"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editItem ? "حفظ التعديلات" : "إنشاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
