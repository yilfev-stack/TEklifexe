import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, Plus, Edit, Package, Trash2, Warehouse, FileSpreadsheet, 
  ChevronDown, ChevronRight, FolderPlus, Folder, FolderOpen, Pencil, X,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/translations";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Products = () => {
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [stockData, setStockData] = useState({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("sales");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Group management
  const [expandedGroups, setExpandedGroups] = useState({});
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupName, setGroupName] = useState("");
  
  const [formData, setFormData] = useState({
    product_type: "sales",
    brand: "",
    model: "",
    models: [],
    category: "",
    item_short_name: "",
    item_description: "",
    default_unit: "Adet",
    default_currency: "EUR",
    default_unit_price: 0,
    cost_price: 0,
    group_id: null
  });

  useEffect(() => {
    fetchProducts(activeTab);
    fetchGroups();
    fetchStockData();
  }, [activeTab]);

  const fetchProducts = async (type) => {
    try {
      const response = await axios.get(`${API}/products?product_type=${type}`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${API}/product-groups`);
      setGroups(response.data);
      // Initialize expanded state - default to COLLAPSED (false)
      const expanded = {};
      response.data.forEach(g => {
        expanded[g.id] = false; // All groups collapsed by default
      });
      setExpandedGroups(prev => ({ ...prev, ...expanded }));
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchStockData = async () => {
    try {
      const response = await axios.get(`${API}/warehouse/stock`);
      const stockByProduct = {};
      response.data.forEach(item => {
        const pid = item.product_id;
        if (!stockByProduct[pid]) {
          stockByProduct[pid] = { total: 0, reserved: 0, variants: {} };
        }
        stockByProduct[pid].total += item.quantity || 0;
        stockByProduct[pid].reserved += item.reserved_quantity || 0;
      });
      setStockData(stockByProduct);
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const normalizedData = {
      ...formData,
      brand: formData.brand?.toUpperCase(),
      model: formData.model?.toUpperCase(),
      models: formData.models.map(m => ({
        ...m,
        model_name: m.model_name?.toUpperCase(),
        sku: m.sku?.toUpperCase()
      }))
    };
    
    try {
      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, normalizedData);
        toast.success(t('productUpdated'));
      } else {
        await axios.post(`${API}/products`, normalizedData);
        toast.success(t('productCreated'));
      }
      
      setDialogOpen(false);
      resetForm();
      fetchProducts(activeTab);
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(error.response?.data?.detail || t('productSaveFailed'));
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      product_type: product.product_type,
      brand: product.brand || "",
      model: product.model || "",
      models: product.models || [],
      category: product.category || "",
      item_short_name: product.item_short_name,
      item_description: product.item_description || "",
      default_unit: product.default_unit,
      default_currency: product.default_currency,
      default_unit_price: product.default_unit_price,
      cost_price: product.cost_price || 0,
      group_id: product.group_id || null
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      product_type: activeTab,
      brand: "",
      model: "",
      models: [],
      category: "",
      item_short_name: "",
      item_description: "",
      default_unit: "Adet",
      default_currency: "EUR",
      default_unit_price: 0,
      cost_price: 0,
      group_id: null
    });
  };

  const addModel = () => {
    setFormData({
      ...formData,
      models: [...formData.models, { model_name: "", sku: "", price: 0, description: "" }]
    });
  };

  const removeModel = (index) => {
    setFormData({
      ...formData,
      models: formData.models.filter((_, i) => i !== index)
    });
  };

  const updateModel = (index, field, value) => {
    const newModels = [...formData.models];
    newModels[index] = { ...newModels[index], [field]: value };
    setFormData({ ...formData, models: newModels });
  };

  // Group management functions
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Grup adı gerekli");
      return;
    }
    
    try {
      await axios.post(`${API}/product-groups`, { name: groupName });
      toast.success("Grup oluşturuldu");
      setGroupName("");
      setGroupDialogOpen(false);
      fetchGroups();
    } catch (error) {
      toast.error("Grup oluşturulamadı");
    }
  };

  const handleUpdateGroup = async () => {
    if (!groupName.trim() || !editingGroup) return;
    
    try {
      await axios.put(`${API}/product-groups/${editingGroup.id}`, { name: groupName });
      toast.success("Grup güncellendi");
      setEditingGroup(null);
      setGroupName("");
      setGroupDialogOpen(false);
      fetchGroups();
    } catch (error) {
      toast.error("Grup güncellenemedi");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("Bu grubu silmek istediğinizden emin misiniz? Ürünler grupsuz kalacak.")) {
      return;
    }
    
    try {
      await axios.delete(`${API}/product-groups/${groupId}`);
      toast.success("Grup silindi");
      fetchGroups();
      fetchProducts(activeTab);
    } catch (error) {
      toast.error("Grup silinemedi");
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`"${productName}" ürününü silmek istediğinizden emin misiniz?`)) {
      return;
    }
    
    try {
      await axios.delete(`${API}/products/${productId}`);
      toast.success("Ürün silindi");
      fetchProducts(activeTab);
    } catch (error) {
      toast.error("Ürün silinemedi");
    }
  };

  const handleDeleteAllProducts = async () => {
    const count = products.length;
    if (!window.confirm(`DİKKAT! ${count} ürünün TAMAMINI silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz!`)) {
      return;
    }
    
    // İkinci onay
    const confirmText = window.prompt(`Silme işlemini onaylamak için "SİL" yazın:`);
    if (confirmText !== "SİL") {
      toast.error("Silme işlemi iptal edildi");
      return;
    }
    
    try {
      await axios.delete(`${API}/products/delete-all?product_type=${activeTab}&confirm=yes`);
      toast.success(`${count} ürün silindi`);
      fetchProducts(activeTab);
      fetchGroups();
    } catch (error) {
      toast.error("Silme işlemi başarısız: " + (error.response?.data?.detail || "Hata"));
    }
  };

  const handleAssignToGroup = async (productId, groupId) => {
    try {
      await axios.put(`${API}/products/${productId}/group`, { group_id: groupId || null });
      toast.success("Ürün grubu güncellendi");
      fetchProducts(activeTab);
    } catch (error) {
      toast.error("Grup ataması başarısız");
    }
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const openEditGroupDialog = (group) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupDialogOpen(true);
  };

  // Filter and group products
  const filteredProducts = products.filter(p => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.item_short_name?.toLowerCase().includes(query) ||
      p.brand?.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query) ||
      p.models?.some(m => m.model_name?.toLowerCase().includes(query) || m.sku?.toLowerCase().includes(query))
    );
  });

  const groupedProducts = {};
  const ungroupedProducts = [];

  filteredProducts.forEach(product => {
    if (product.group_id) {
      if (!groupedProducts[product.group_id]) {
        groupedProducts[product.group_id] = [];
      }
      groupedProducts[product.group_id].push(product);
    } else {
      ungroupedProducts.push(product);
    }
  });

  const renderProductCard = (product) => (
    <Card key={product.id} className="p-3 bg-card border border-border/40 hover:border-primary/50 transition-all">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm truncate">{product.item_short_name}</h3>
          {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
        </div>
        <div className="flex items-center gap-1 ml-2">
          <Select
            value={product.group_id || "ungrouped"}
            onValueChange={(val) => handleAssignToGroup(product.id, val === "ungrouped" ? null : val)}
          >
            <SelectTrigger className="w-[100px] h-7 text-xs">
              <SelectValue placeholder="Grup" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ungrouped">Grupsuz</SelectItem>
              {groups.map(g => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(product)}>
            <Edit className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" 
            onClick={() => handleDeleteProduct(product.id, product.item_short_name)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="space-y-1 text-xs text-muted-foreground">
        {product.category && <div>📦 {product.category}</div>}
        {product.models && product.models.length > 0 && (
          <div>
            <span className="font-semibold">{product.models.length} model</span>
          </div>
        )}
        <div className="font-semibold text-accent">{product.default_unit_price} {product.default_currency}</div>
        
        {stockData[product.id] ? (
          <div className="mt-2 p-1.5 bg-green-50 dark:bg-green-900/20 rounded text-green-700 dark:text-green-400 text-xs">
            <Warehouse className="h-3 w-3 inline mr-1" />
            Stok: {stockData[product.id].total}
            {stockData[product.id].reserved > 0 && (
              <span className="text-orange-600 ml-1">({stockData[product.id].reserved} rez.)</span>
            )}
          </div>
        ) : (
          <div className="mt-2 p-1.5 bg-gray-50 dark:bg-gray-800/50 rounded text-gray-500 text-xs">
            <Warehouse className="h-3 w-3 inline mr-1" />
            Stokta yok
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{t('products')}</h1>
                <p className="text-sm text-muted-foreground">{products.length} ürün</p>
              </div>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <div className="flex gap-2">
                {products.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={handleDeleteAllProducts}
                    className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Tümünü Sil ({products.length})
                  </Button>
                )}
                <Button variant="outline" onClick={() => navigate('/sofis-import')}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  SOFIS Import
                </Button>
                <Button variant="outline" onClick={() => {
                  setEditingGroup(null);
                  setGroupName("");
                  setGroupDialogOpen(true);
                }}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Grup Ekle
                </Button>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('addProduct')}
                  </Button>
                </DialogTrigger>
              </div>
              <DialogContent 
                className="max-w-3xl max-h-[90vh] overflow-y-auto"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
              >
                <DialogHeader>
                  <DialogTitle>{editingProduct ? t('editProduct') : t('addProduct')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Grup</Label>
                      <Select
                        value={formData.group_id || "ungrouped"}
                        onValueChange={(val) => setFormData({...formData, group_id: val === "ungrouped" ? null : val})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Grup seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ungrouped">Grupsuz</SelectItem>
                          {groups.map(g => (
                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t('brand')} *</Label>
                      <Input value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} required />
                    </div>
                    <div>
                      <Label>{t('category')}</Label>
                      <Input value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                      <Label>{t('itemName')} *</Label>
                      <Input value={formData.item_short_name} onChange={(e) => setFormData({...formData, item_short_name: e.target.value})} required />
                    </div>
                    <div className="col-span-2">
                      <Label>{t('description')}</Label>
                      <Textarea value={formData.item_description} onChange={(e) => setFormData({...formData, item_description: e.target.value})} rows={2} />
                    </div>
                  </div>

                  {/* Multiple Models Section */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-lg font-semibold">{t('models')}</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addModel}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('addModel')}
                      </Button>
                    </div>
                    
                    {formData.models.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4 border rounded">
                        Bir marka için birden fazla model ekleyebilirsiniz
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {formData.models.map((model, index) => (
                          <div key={index} className="p-4 border rounded bg-muted/20">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium">{t('model')} {index + 1}</span>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeModel(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>{t('modelName')} *</Label>
                                <Input 
                                  value={model.model_name} 
                                  onChange={(e) => updateModel(index, 'model_name', e.target.value)}
                                  required
                                />
                              </div>
                              <div>
                                <Label>{t('sku')}</Label>
                                <Input 
                                  value={model.sku || ''} 
                                  onChange={(e) => updateModel(index, 'sku', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>{t('unitPrice')}</Label>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  value={model.price || 0} 
                                  onChange={(e) => updateModel(index, 'price', parseFloat(e.target.value))}
                                />
                              </div>
                              <div>
                                <Label>{t('description')}</Label>
                                <Input 
                                  value={model.description || ''} 
                                  onChange={(e) => updateModel(index, 'description', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Default Values */}
                  <div className="border-t pt-4">
                    <Label className="text-lg font-semibold mb-3 block">{t('defaultValues')}</Label>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label>{t('unit')}</Label>
                        <Input value={formData.default_unit} onChange={(e) => setFormData({...formData, default_unit: e.target.value})} />
                      </div>
                      <div>
                        <Label>{t('currency')}</Label>
                        <select 
                          className="w-full h-10 px-3 py-2 border rounded-md bg-background"
                          value={formData.default_currency}
                          onChange={(e) => setFormData({...formData, default_currency: e.target.value})}
                        >
                          <option value="EUR">EUR</option>
                          <option value="TRY">TRY</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                      <div>
                        <Label>{t('unitPrice')}</Label>
                        <Input type="number" step="0.01" value={formData.default_unit_price} onChange={(e) => setFormData({...formData, default_unit_price: parseFloat(e.target.value)})} />
                      </div>
                      <div>
                        <Label>{t('costPrice')}</Label>
                        <Input type="number" step="0.01" value={formData.cost_price} onChange={(e) => setFormData({...formData, cost_price: parseFloat(e.target.value)})} />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
                    <Button type="submit">{t('save')}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Group Dialog */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGroup ? "Grubu Düzenle" : "Yeni Grup Oluştur"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Grup Adı</Label>
              <Input 
                value={groupName} 
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Örn: Pozisyonerler, Vanalar, Aktüatörler..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>İptal</Button>
              <Button onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}>
                {editingGroup ? "Güncelle" : "Oluştur"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-6 py-6">
        {/* Search */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ürün ara (isim, marka, SKU...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="sales">{currentLanguage === 'tr' ? 'Satış Ürünleri' : 'Sales Products'}</TabsTrigger>
            <TabsTrigger value="service">{currentLanguage === 'tr' ? 'Hizmet Ürünleri' : 'Service Products'}</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="text-center py-12">{t('loading')}</div>
            ) : filteredProducts.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "Arama sonucu bulunamadı" : t('noProductsYet')}
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Grouped Products */}
                {groups.map(group => {
                  const groupProducts = groupedProducts[group.id] || [];
                  if (groupProducts.length === 0 && searchQuery) return null;
                  
                  const isExpanded = expandedGroups[group.id];
                  
                  return (
                    <Card key={group.id} className="overflow-hidden">
                      <div 
                        className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleGroup(group.id)}
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          {isExpanded ? (
                            <FolderOpen className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <Folder className="h-5 w-5 text-yellow-500" />
                          )}
                          <span className="font-semibold">{group.name}</span>
                          <span className="text-sm text-muted-foreground">({groupProducts.length} ürün)</span>
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditGroupDialog(group)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteGroup(group.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {isExpanded && groupProducts.length > 0 && (
                        <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                          {groupProducts.map(renderProductCard)}
                        </div>
                      )}
                      
                      {isExpanded && groupProducts.length === 0 && (
                        <div className="p-6 text-center text-muted-foreground text-sm">
                          Bu grupta henüz ürün yok
                        </div>
                      )}
                    </Card>
                  );
                })}

                {/* Ungrouped Products */}
                {ungroupedProducts.length > 0 && (
                  <Card className="overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleGroup('ungrouped')}
                    >
                      <div className="flex items-center gap-2">
                        {expandedGroups['ungrouped'] !== false ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <Package className="h-5 w-5 text-gray-400" />
                        <span className="font-semibold">Grupsuz Ürünler</span>
                        <span className="text-sm text-muted-foreground">({ungroupedProducts.length} ürün)</span>
                      </div>
                    </div>
                    
                    {expandedGroups['ungrouped'] !== false && (
                      <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {ungroupedProducts.map(renderProductCard)}
                      </div>
                    )}
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Products;
