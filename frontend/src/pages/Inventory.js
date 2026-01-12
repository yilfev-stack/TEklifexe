import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Archive,
  RotateCcw,
  Building2,
  Wrench,
  Hammer,
  Car,
  Package,
  TrendingDown,
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/inventory`;

const CATEGORY_ICONS = {
  office: Building2,
  workshop: Wrench,
  tools: Hammer,
  vehicle: Car,
};

const CATEGORY_COLORS = {
  office: "text-blue-600 bg-blue-50 border-blue-200",
  workshop: "text-orange-600 bg-orange-50 border-orange-200",
  tools: "text-purple-600 bg-purple-50 border-purple-200",
  vehicle: "text-green-600 bg-green-50 border-green-200",
};

const Inventory = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [items, setItems] = useState([]);
  const [retiredItems, setRetiredItems] = useState([]);
  const [activeTab, setActiveTab] = useState("active");
  const [summary, setSummary] = useState(null);

  // Dialog state
  const [itemDialog, setItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [retireDialog, setRetireDialog] = useState(false);
  const [retiringItem, setRetiringItem] = useState(null);
  const [retireReason, setRetireReason] = useState("");

  // Form state
  const [itemForm, setItemForm] = useState({
    description: "",
    purchase_date: new Date().toISOString().split("T")[0],
    quantity: 1,
    purchase_price: 0,
    notes: "",
  });

  useEffect(() => {
    fetchCategories();
    fetchSummary();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchItems(selectedCategory);
      fetchRetiredItems(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/categories`);
      setCategories(res.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${API}/summary`);
      setSummary(res.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const fetchItems = async (category) => {
    try {
      const res = await axios.get(`${API}/items?category=${category}`);
      setItems(res.data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const fetchRetiredItems = async (category) => {
    try {
      const res = await axios.get(`${API}/items/retired?category=${category}`);
      setRetiredItems(res.data || []);
    } catch (error) {
      console.error("Error fetching retired items:", error);
    }
  };

  const handleSaveItem = async () => {
    if (!itemForm.description.trim()) {
      toast.error("Açıklama zorunludur");
      return;
    }
    try {
      if (editingItem) {
        await axios.put(`${API}/items/${editingItem.id}`, itemForm);
        toast.success("Envanter güncellendi");
      } else {
        await axios.post(`${API}/items`, {
          ...itemForm,
          category: selectedCategory,
        });
        toast.success("Envanter eklendi");
      }
      setItemDialog(false);
      setEditingItem(null);
      setItemForm({
        description: "",
        purchase_date: new Date().toISOString().split("T")[0],
        quantity: 1,
        purchase_price: 0,
        notes: "",
      });
      fetchItems(selectedCategory);
      fetchCategories();
      fetchSummary();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Kayıt başarısız");
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`"${item.description}" envanterini silmek istediğinize emin misiniz?`)) return;
    try {
      await axios.delete(`${API}/items/${item.id}`);
      toast.success("Envanter silindi");
      fetchItems(selectedCategory);
      fetchRetiredItems(selectedCategory);
      fetchCategories();
      fetchSummary();
    } catch (error) {
      toast.error("Silme başarısız");
    }
  };

  const handleRetireItem = async () => {
    try {
      await axios.post(`${API}/items/${retiringItem.id}/retire?reason=${encodeURIComponent(retireReason)}`);
      toast.success("Envanter envanterden çıkarıldı");
      setRetireDialog(false);
      setRetiringItem(null);
      setRetireReason("");
      fetchItems(selectedCategory);
      fetchRetiredItems(selectedCategory);
      fetchCategories();
      fetchSummary();
    } catch (error) {
      toast.error("İşlem başarısız");
    }
  };

  const handleRestoreItem = async (item) => {
    try {
      await axios.post(`${API}/items/${item.id}/restore`);
      toast.success("Envanter geri alındı");
      fetchItems(selectedCategory);
      fetchRetiredItems(selectedCategory);
      fetchCategories();
      fetchSummary();
    } catch (error) {
      toast.error("İşlem başarısız");
    }
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    setItemForm({
      description: item.description,
      purchase_date: item.purchase_date,
      quantity: item.quantity,
      purchase_price: item.purchase_price,
      notes: item.notes || "",
    });
    setItemDialog(true);
  };

  const openRetireDialog = (item) => {
    setRetiringItem(item);
    setRetireReason("");
    setRetireDialog(true);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(value);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("tr-TR");
  };

  const calculateTotal = (itemList) => {
    return itemList.reduce((sum, item) => sum + item.purchase_price * item.quantity, 0);
  };

  // Category selection view
  if (!selectedCategory) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-amber-600" />
                <div>
                  <h1 className="text-2xl font-bold">Envanter Yönetimi</h1>
                  <p className="text-sm text-muted-foreground">Şirket envanterini yönetin</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Toplam Envanter</div>
                <div className="text-2xl font-bold">{summary.total_items}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Çıkan Envanter</div>
                <div className="text-2xl font-bold text-orange-600">{summary.retired_items}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Toplam Yatırım</div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_investment)}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Zaiyat Değeri</div>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.retired_value)}</div>
              </Card>
            </div>
          )}

          {/* Category Cards */}
          <h2 className="text-lg font-semibold mb-4">Envanter Grupları</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.key] || Package;
              const colorClass = CATEGORY_COLORS[cat.key] || "text-gray-600 bg-gray-50 border-gray-200";
              return (
                <Card
                  key={cat.key}
                  className={`p-6 cursor-pointer hover:shadow-lg transition-all border-2 ${colorClass}`}
                  onClick={() => setSelectedCategory(cat.key)}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-lg ${colorClass.split(" ")[1]}`}>
                      <Icon className={`h-8 w-8 ${colorClass.split(" ")[0]}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground">Kod: {cat.prefix}-XX</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Aktif:</span>
                      <span className="font-semibold">{cat.active_count} adet</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Çıkan:</span>
                      <span className="font-semibold text-orange-600">{cat.retired_count} adet</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-muted-foreground">Maliyet:</span>
                      <span className="font-bold text-green-600">{formatCurrency(cat.total_cost)}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Category detail view
  const currentCategory = categories.find((c) => c.key === selectedCategory);
  const CategoryIcon = CATEGORY_ICONS[selectedCategory] || Package;
  const categoryColor = CATEGORY_COLORS[selectedCategory] || "text-gray-600";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setSelectedCategory(null)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <CategoryIcon className={`h-8 w-8 ${categoryColor.split(" ")[0]}`} />
                <div>
                  <h1 className="text-2xl font-bold">{currentCategory?.name}</h1>
                  <p className="text-sm text-muted-foreground">Kod formatı: {currentCategory?.prefix}-XX</p>
                </div>
              </div>
            </div>
            <Button onClick={() => { setEditingItem(null); setItemForm({ description: "", purchase_date: new Date().toISOString().split("T")[0], quantity: 1, purchase_price: 0, notes: "" }); setItemDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Yeni Envanter
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="active">
              <Package className="h-4 w-4 mr-2" /> Aktif Envanter ({items.length})
            </TabsTrigger>
            <TabsTrigger value="retired">
              <TrendingDown className="h-4 w-4 mr-2" /> Çıkan / Hurda ({retiredItems.length})
            </TabsTrigger>
          </TabsList>

          {/* Active Items Tab */}
          <TabsContent value="active">
            <Card className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Envanter No</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead className="w-[120px]">Alınış Tarihi</TableHead>
                    <TableHead className="w-[80px] text-right">Adet</TableHead>
                    <TableHead className="w-[120px] text-right">Alış Ücreti</TableHead>
                    <TableHead className="w-[120px] text-right">Toplam</TableHead>
                    <TableHead className="w-[150px] text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Bu kategoride henüz envanter yok
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono font-bold">{item.inventory_no}</TableCell>
                        <TableCell>
                          <div>{item.description}</div>
                          {item.notes && <div className="text-xs text-muted-foreground">{item.notes}</div>}
                        </TableCell>
                        <TableCell>{formatDate(item.purchase_date)}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.purchase_price)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(item.purchase_price * item.quantity)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEditDialog(item)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => openRetireDialog(item)} title="Envanterden Çıkar">
                              <Archive className="h-4 w-4 text-orange-500" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteItem(item)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Total */}
              {items.length > 0 && (
                <div className="border-t mt-4 pt-4 flex justify-end">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Toplam Yatırım</div>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(calculateTotal(items))}</div>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Retired Items Tab */}
          <TabsContent value="retired">
            <Card className="p-4 border-orange-200 bg-orange-50/30">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-orange-700">
                <TrendingDown className="h-5 w-5" /> Envanterden Çıkan / Hurda
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Envanter No</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Çıkış Sebebi</TableHead>
                    <TableHead className="w-[80px] text-right">Adet</TableHead>
                    <TableHead className="w-[120px] text-right">Değeri</TableHead>
                    <TableHead className="w-[100px] text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retiredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Envanterden çıkan ürün yok
                      </TableCell>
                    </TableRow>
                  ) : (
                    retiredItems.map((item) => (
                      <TableRow key={item.id} className="opacity-70">
                        <TableCell className="font-mono">{item.inventory_no}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-orange-600">{item.retirement_reason || "-"}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.purchase_price * item.quantity)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => handleRestoreItem(item)}>
                            <RotateCcw className="h-4 w-4 mr-1" /> Geri Al
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Retired Total */}
              {retiredItems.length > 0 && (
                <div className="border-t border-orange-200 mt-4 pt-4 flex justify-end">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Toplam Zaiyat</div>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(calculateTotal(retiredItems))}</div>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Item Dialog */}
      <Dialog open={itemDialog} onOpenChange={(open) => { setItemDialog(open); if (!open) setEditingItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Envanter Düzenle" : "Yeni Envanter Ekle"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Açıklama *</Label>
              <Input
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="Envanter açıklaması"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Alınış Tarihi</Label>
                <Input
                  type="date"
                  value={itemForm.purchase_date}
                  onChange={(e) => setItemForm({ ...itemForm, purchase_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Adet</Label>
                <Input
                  type="number"
                  min="1"
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({ ...itemForm, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Alış Ücreti (TRY)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={itemForm.purchase_price}
                onChange={(e) => setItemForm({ ...itemForm, purchase_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Notlar</Label>
              <Textarea
                value={itemForm.notes}
                onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                rows={2}
                placeholder="Ek notlar..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialog(false)}>İptal</Button>
            <Button onClick={handleSaveItem}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Retire Item Dialog */}
      <Dialog open={retireDialog} onOpenChange={setRetireDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envanterden Çıkar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">
              <strong>{retiringItem?.inventory_no}</strong> - {retiringItem?.description}
            </p>
            <div className="grid gap-2">
              <Label>Çıkış Sebebi</Label>
              <Textarea
                value={retireReason}
                onChange={(e) => setRetireReason(e.target.value)}
                rows={3}
                placeholder="Örn: Arızalı, Hurda, Satıldı, Kayıp..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRetireDialog(false)}>İptal</Button>
            <Button variant="destructive" onClick={handleRetireItem}>Envanterden Çıkar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
