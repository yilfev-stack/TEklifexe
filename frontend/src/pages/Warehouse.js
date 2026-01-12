import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  Package,
  MapPin,
  History,
  AlertTriangle,
  Warehouse as WarehouseIcon,
  Layers,
  Grid3X3,
  ClipboardCheck,
  Building2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/warehouse`;

const Warehouse = () => {
  const navigate = useNavigate();

  // Main state
  const [activeTab, setActiveTab] = useState("warehouses");
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [selectedRackGroup, setSelectedRackGroup] = useState(null);
  const [selectedRackLevel, setSelectedRackLevel] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data state
  const [warehouses, setWarehouses] = useState([]);
  const [rackGroups, setRackGroups] = useState([]);
  const [rackLevels, setRackLevels] = useState([]);
  const [rackSlots, setRackSlots] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [warehouseReports, setWarehouseReports] = useState([]);
  const [productReports, setProductReports] = useState([]);

  // Dialog state
  const [warehouseDialog, setWarehouseDialog] = useState(false);
  const [rackGroupDialog, setRackGroupDialog] = useState(false);
  const [rackLevelDialog, setRackLevelDialog] = useState(false);
  const [rackSlotDialog, setRackSlotDialog] = useState(false);
  const [stockInDialog, setStockInDialog] = useState(false);
  const [transferDialog, setTransferDialog] = useState(false);
  const [stockEditDialog, setStockEditDialog] = useState(false);

  // Editing state
  const [editingRackGroup, setEditingRackGroup] = useState(null);
  const [editingRackLevel, setEditingRackLevel] = useState(null);
  const [editingRackSlot, setEditingRackSlot] = useState(null);
  const [editingStock, setEditingStock] = useState(null);
  const [stockEditForm, setStockEditForm] = useState({ quantity: 0, note: "" });

  // Form state
  const [warehouseForm, setWarehouseForm] = useState({ name: "", code: "", address: "", description: "" });
  const [rackGroupForm, setRackGroupForm] = useState({ name: "", code: "", description: "" });
  const [rackLevelForm, setRackLevelForm] = useState({ level_number: 1, name: "" });
  const [rackSlotForm, setRackSlotForm] = useState({ slot_number: 1, name: "" });
  const [stockInForm, setStockInForm] = useState({
    product_id: "", variant_id: "", variant_name: "", quantity: 1,
    warehouse_id: "", rack_group_id: "", rack_level_id: "", rack_slot_id: "",
    reference: "", note: ""
  });
  const [transferForm, setTransferForm] = useState({
    product_id: "", variant_id: "", variant_name: "", quantity: 1,
    warehouse_id: "", rack_group_id: "", rack_level_id: "", rack_slot_id: "",
    target_warehouse_id: "", target_rack_group_id: "", target_rack_level_id: "", target_rack_slot_id: "",
    reference: "", note: ""
  });

  // Editing state
  const [editingWarehouse, setEditingWarehouse] = useState(null);

  // Fetch data
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedWarehouse) {
      fetchRackGroups(selectedWarehouse.id);
      fetchStockItems(selectedWarehouse.id);
    }
  }, [selectedWarehouse]);

  useEffect(() => {
    if (selectedRackGroup) {
      fetchRackLevels(selectedRackGroup.id);
    }
  }, [selectedRackGroup]);

  useEffect(() => {
    if (selectedRackLevel) {
      fetchRackSlots(selectedRackLevel.id);
    }
  }, [selectedRackLevel]);

  useEffect(() => {
    if (activeTab === "reports") {
      fetchReports();
    } else if (activeTab === "movements") {
      fetchMovements();
    } else if (activeTab === "stock") {
      axios.get(`${API}/stock`).then(res => setStockItems(res.data || []));
    }
  }, [activeTab]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [whRes, prodRes, lowStockRes] = await Promise.all([
        axios.get(`${API}/warehouses`),
        axios.get(`${BACKEND_URL}/api/products`),
        axios.get(`${API}/stock/low-stock`).catch(() => ({ data: [] })),
      ]);
      setWarehouses(whRes.data || []);
      setProducts(prodRes.data || []);
      setLowStockItems(lowStockRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const fetchRackGroups = async (warehouseId) => {
    try {
      const res = await axios.get(`${API}/rack-groups?warehouse_id=${warehouseId}`);
      setRackGroups(res.data || []);
    } catch (error) {
      console.error("Error fetching rack groups:", error);
    }
  };

  const fetchRackLevels = async (rackGroupId) => {
    try {
      const res = await axios.get(`${API}/rack-levels?rack_group_id=${rackGroupId}`);
      setRackLevels(res.data || []);
    } catch (error) {
      console.error("Error fetching rack levels:", error);
    }
  };

  const fetchRackSlots = async (rackLevelId) => {
    try {
      const res = await axios.get(`${API}/rack-slots?rack_level_id=${rackLevelId}`);
      setRackSlots(res.data || []);
    } catch (error) {
      console.error("Error fetching rack slots:", error);
    }
  };

  const fetchStockItems = async (warehouseId) => {
    try {
      const res = await axios.get(`${API}/stock?warehouse_id=${warehouseId}`);
      setStockItems(res.data || []);
    } catch (error) {
      console.error("Error fetching stock:", error);
    }
  };

  const fetchMovements = async () => {
    try {
      const res = await axios.get(`${API}/movements?limit=100`);
      setMovements(res.data || []);
    } catch (error) {
      console.error("Error fetching movements:", error);
    }
  };

  const fetchReports = async () => {
    try {
      const [whRes, prodRes] = await Promise.all([
        axios.get(`${API}/reports/by-warehouse`),
        axios.get(`${API}/reports/by-product`)
      ]);
      setWarehouseReports(whRes.data || []);
      setProductReports(prodRes.data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  // WAREHOUSE CRUD
  const handleSaveWarehouse = async () => {
    if (!warehouseForm.name || !warehouseForm.code) {
      toast.error("Depo adı ve kodu zorunludur");
      return;
    }
    try {
      if (editingWarehouse) {
        await axios.put(`${API}/warehouses/${editingWarehouse}`, warehouseForm);
        toast.success("Depo güncellendi");
      } else {
        await axios.post(`${API}/warehouses`, warehouseForm);
        toast.success("Depo oluşturuldu");
      }
      setWarehouseDialog(false);
      setEditingWarehouse(null);
      setWarehouseForm({ name: "", code: "", address: "", description: "" });
      fetchInitialData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Kayıt başarısız");
    }
  };

  const handleDeleteWarehouse = async (id) => {
    if (!window.confirm("Bu depoyu silmek istediğinize emin misiniz?")) return;
    try {
      await axios.delete(`${API}/warehouses/${id}`);
      toast.success("Depo silindi");
      if (selectedWarehouse?.id === id) {
        setSelectedWarehouse(null);
        setSelectedRackGroup(null);
        setSelectedRackLevel(null);
      }
      fetchInitialData();
    } catch (error) {
      toast.error("Silme başarısız");
    }
  };

  // RACK GROUP CRUD
  const handleSaveRackGroup = async () => {
    if (!rackGroupForm.name || !rackGroupForm.code) {
      toast.error("Raf grubu adı ve kodu zorunludur");
      return;
    }
    if (!selectedWarehouse && !editingRackGroup) {
      toast.error("Önce bir depo seçin");
      return;
    }
    try {
      if (editingRackGroup) {
        await axios.put(`${API}/rack-groups/${editingRackGroup.id}`, rackGroupForm);
        toast.success("Raf grubu güncellendi");
      } else {
        await axios.post(`${API}/rack-groups`, {
          ...rackGroupForm,
          warehouse_id: selectedWarehouse.id
        });
        toast.success("Raf grubu oluşturuldu");
      }
      setRackGroupDialog(false);
      setEditingRackGroup(null);
      setRackGroupForm({ name: "", code: "", description: "" });
      if (selectedWarehouse) {
        fetchRackGroups(selectedWarehouse.id);
      }
    } catch (error) {
      console.error("Rack group save error:", error);
      toast.error(error.response?.data?.detail || "Kayıt başarısız");
    }
  };

  // RACK LEVEL CRUD
  const handleSaveRackLevel = async () => {
    try {
      if (editingRackLevel) {
        await axios.put(`${API}/rack-levels/${editingRackLevel.id}`, rackLevelForm);
        toast.success("Kat güncellendi");
      } else {
        await axios.post(`${API}/rack-levels`, {
          ...rackLevelForm,
          rack_group_id: selectedRackGroup.id
        });
        toast.success("Kat oluşturuldu");
      }
      setRackLevelDialog(false);
      setEditingRackLevel(null);
      setRackLevelForm({ level_number: 1, name: "" });
      fetchRackLevels(selectedRackGroup.id);
    } catch (error) {
      toast.error("Kayıt başarısız");
    }
  };

  // RACK SLOT CRUD
  const handleSaveRackSlot = async () => {
    try {
      if (editingRackSlot) {
        await axios.put(`${API}/rack-slots/${editingRackSlot.id}`, rackSlotForm);
        toast.success("Bölme güncellendi");
      } else {
        await axios.post(`${API}/rack-slots`, {
          ...rackSlotForm,
          rack_level_id: selectedRackLevel.id
        });
        toast.success("Bölme oluşturuldu");
      }
      setRackSlotDialog(false);
      setEditingRackSlot(null);
      setRackSlotForm({ slot_number: 1, name: "" });
      fetchRackSlots(selectedRackLevel.id);
    } catch (error) {
      toast.error("Kayıt başarısız");
    }
  };

  // STOCK IN
  const handleStockIn = async () => {
    if (!stockInForm.product_id || !stockInForm.rack_slot_id) {
      toast.error("Ürün ve lokasyon seçimi zorunludur");
      return;
    }
    try {
      await axios.post(`${API}/stock/in`, {
        ...stockInForm,
        movement_type: "IN",
        quantity: parseFloat(stockInForm.quantity)
      });
      toast.success("Stok girişi kaydedildi");
      setStockInDialog(false);
      setStockInForm({
        product_id: "", variant_id: "", variant_name: "", quantity: 1,
        warehouse_id: "", rack_group_id: "", rack_level_id: "", rack_slot_id: "",
        reference: "", note: ""
      });
      if (selectedWarehouse) {
        fetchStockItems(selectedWarehouse.id);
      }
      fetchInitialData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Stok girişi başarısız");
    }
  };

  // TRANSFER
  const handleTransfer = async () => {
    if (!transferForm.product_id || !transferForm.rack_slot_id || !transferForm.target_rack_slot_id) {
      toast.error("Ürün, kaynak ve hedef lokasyon seçimi zorunludur");
      return;
    }
    try {
      await axios.post(`${API}/stock/transfer`, {
        ...transferForm,
        movement_type: "TRANSFER",
        quantity: parseFloat(transferForm.quantity)
      });
      toast.success("Transfer kaydedildi");
      setTransferDialog(false);
      if (selectedWarehouse) {
        fetchStockItems(selectedWarehouse.id);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Transfer başarısız");
    }
  };

  // Helper: Get product name
  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? `${product.brand || ''} ${product.item_short_name}`.trim() : productId;
  };

  // Helper: Get product variants
  const getProductVariants = (productId) => {
    const product = products.find(p => p.id === productId);
    return product?.models || [];
  };

  // Open stock in dialog with pre-selected location
  const openStockInDialog = (warehouseId = "", rackGroupId = "", rackLevelId = "", rackSlotId = "") => {
    setStockInForm({
      ...stockInForm,
      warehouse_id: warehouseId || selectedWarehouse?.id || "",
      rack_group_id: rackGroupId || selectedRackGroup?.id || "",
      rack_level_id: rackLevelId || selectedRackLevel?.id || "",
      rack_slot_id: rackSlotId || ""
    });
    setStockInDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <WarehouseIcon className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">Depo Yönetim Sistemi</h1>
                  <p className="text-sm text-muted-foreground">
                    Çoklu Depo • Raf Adresleme • Variant Bazlı Stok
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {lowStockItems.length > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {lowStockItems.length} Düşük Stok
                </Badge>
              )}
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="warehouses" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Depolar
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <Package className="h-4 w-4" /> Stok
            </TabsTrigger>
            <TabsTrigger value="movements" className="flex items-center gap-2" onClick={fetchMovements}>
              <History className="h-4 w-4" /> Hareketler
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" /> Raporlar
            </TabsTrigger>
          </TabsList>

          {/* WAREHOUSES TAB */}
          <TabsContent value="warehouses" className="space-y-6">
            {!selectedWarehouse ? (
              // Warehouse List
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Depolar</h2>
                  <Button onClick={() => { setEditingWarehouse(null); setWarehouseForm({ name: "", code: "", address: "", description: "" }); setWarehouseDialog(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Yeni Depo
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {warehouses.length === 0 ? (
                    <Card className="col-span-full p-8 text-center text-muted-foreground">
                      <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>Henüz depo eklenmemiş</p>
                    </Card>
                  ) : (
                    warehouses.map((wh) => (
                      <Card
                        key={wh.id}
                        className="p-4 cursor-pointer hover:border-primary transition-colors"
                        onClick={() => setSelectedWarehouse(wh)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-primary" />
                              {wh.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">Kod: {wh.code}</p>
                            {wh.address && <p className="text-xs text-muted-foreground mt-1">{wh.address}</p>}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingWarehouse(wh.id); setWarehouseForm({ name: wh.name, code: wh.code, address: wh.address || "", description: wh.description || "" }); setWarehouseDialog(true); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteWarehouse(wh.id); }}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center text-sm text-muted-foreground">
                          <ChevronRight className="h-4 w-4" />
                          <span>Detay için tıklayın</span>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            ) : (
              // Warehouse Detail with Rack Structure
              <div className="space-y-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm">
                  <Button variant="link" className="p-0 h-auto" onClick={() => { setSelectedWarehouse(null); setSelectedRackGroup(null); setSelectedRackLevel(null); }}>
                    Depolar
                  </Button>
                  <ChevronRight className="h-4 w-4" />
                  <span className="font-semibold">{selectedWarehouse.name}</span>
                  {selectedRackGroup && (
                    <>
                      <ChevronRight className="h-4 w-4" />
                      <Button variant="link" className="p-0 h-auto" onClick={() => { setSelectedRackLevel(null); }}>
                        {selectedRackGroup.name}
                      </Button>
                    </>
                  )}
                  {selectedRackLevel && (
                    <>
                      <ChevronRight className="h-4 w-4" />
                      <span>{selectedRackLevel.name || `${selectedRackLevel.level_number}. Kat`}</span>
                    </>
                  )}
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Rack Groups */}
                  <Card className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Layers className="h-4 w-4" /> Raf Grupları
                      </h3>
                      <Button size="sm" onClick={() => setRackGroupDialog(true)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {rackGroups.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Raf grubu yok</p>
                      ) : (
                        rackGroups.map((rg) => (
                          <div
                            key={rg.id}
                            className={`p-3 rounded-lg cursor-pointer border transition-colors ${selectedRackGroup?.id === rg.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                            onClick={() => { setSelectedRackGroup(rg); setSelectedRackLevel(null); }}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{rg.name}</div>
                                <div className="text-xs text-muted-foreground">Kod: {rg.code}</div>
                              </div>
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                                  setEditingRackGroup(rg);
                                  setRackGroupForm({ name: rg.name, code: rg.code, description: rg.description || "" });
                                  setRackGroupDialog(true);
                                }}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-700" onClick={async () => {
                                  if (window.confirm(`"${rg.name}" rafını silmek istediğinize emin misiniz?`)) {
                                    await axios.delete(`${API}/rack-groups/${rg.id}`);
                                    fetchRackGroups(selectedWarehouse.id);
                                    if (selectedRackGroup?.id === rg.id) {
                                      setSelectedRackGroup(null);
                                      setSelectedRackLevel(null);
                                    }
                                  }
                                }}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>

                  {/* Rack Levels */}
                  <Card className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Grid3X3 className="h-4 w-4" /> Katlar
                      </h3>
                      {selectedRackGroup && (
                        <Button size="sm" onClick={() => setRackLevelDialog(true)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {!selectedRackGroup ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Önce raf grubu seçin</p>
                    ) : rackLevels.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Kat yok</p>
                    ) : (
                      <div className="space-y-2">
                        {rackLevels.map((rl) => (
                          <div
                            key={rl.id}
                            className={`p-3 rounded-lg cursor-pointer border transition-colors ${selectedRackLevel?.id === rl.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                            onClick={() => setSelectedRackLevel(rl)}
                          >
                            <div className="flex justify-between items-center">
                              <div className="font-medium">
                                {rl.name ? `${rl.level_number}. Kat - ${rl.name}` : `${rl.level_number}. Kat`}
                              </div>
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                                  setEditingRackLevel(rl);
                                  setRackLevelForm({ level_number: rl.level_number, name: rl.name || "" });
                                  setRackLevelDialog(true);
                                }}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-700" onClick={async () => {
                                  if (window.confirm(`"${rl.name || rl.level_number + '. Kat'}" katını silmek istediğinize emin misiniz?`)) {
                                    await axios.delete(`${API}/rack-levels/${rl.id}`);
                                    fetchRackLevels(selectedRackGroup.id);
                                    if (selectedRackLevel?.id === rl.id) setSelectedRackLevel(null);
                                  }
                                }}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Rack Slots / Compartments */}
                  <Card className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Bölmeler
                      </h3>
                      {selectedRackLevel && (
                        <Button size="sm" onClick={() => setRackSlotDialog(true)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {!selectedRackLevel ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Önce kat seçin</p>
                    ) : rackSlots.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Bölme yok</p>
                    ) : (
                      <div className="space-y-2">
                        {rackSlots.map((rs) => (
                          <div
                            key={rs.id}
                            className="p-3 rounded-lg border hover:bg-muted flex justify-between items-center"
                          >
                            <div className="font-medium">
                              {rs.name ? `Bölme ${rs.slot_number} - ${rs.name}` : `Bölme ${rs.slot_number}`}
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => openStockInDialog(selectedWarehouse.id, selectedRackGroup.id, selectedRackLevel.id, rs.id)}>
                                <ArrowDownCircle className="h-4 w-4 mr-1" /> Giriş
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                                setEditingRackSlot(rs);
                                setRackSlotForm({ slot_number: rs.slot_number, name: rs.name || "" });
                                setRackSlotDialog(true);
                              }}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={async () => {
                                if (window.confirm(`"${rs.name || 'Bölme ' + rs.slot_number}" bölmesini silmek istediğinize emin misiniz?`)) {
                                  await axios.delete(`${API}/rack-slots/${rs.id}`);
                                  fetchRackSlots(selectedRackLevel.id);
                                }
                              }}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>

                {/* Stock in this warehouse */}
                <Card className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Bu Depodaki Stoklar</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => openStockInDialog()}>
                        <ArrowDownCircle className="mr-2 h-4 w-4 text-green-600" /> Stok Girişi
                      </Button>
                      <Button variant="outline" onClick={() => setTransferDialog(true)}>
                        <ArrowLeftRight className="mr-2 h-4 w-4 text-blue-600" /> Transfer
                      </Button>
                    </div>
                  </div>
                  {stockItems.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">Bu depoda stok yok</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Adres</TableHead>
                          <TableHead>Ürün / Model</TableHead>
                          <TableHead className="text-right">Miktar</TableHead>
                          <TableHead className="text-right">Rezerve</TableHead>
                          <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {item.full_address || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{item.variant_name || getProductName(item.product_id)}</div>
                              {item.variant_sku && <div className="text-xs text-muted-foreground">SKU: {item.variant_sku}</div>}
                            </TableCell>
                            <TableCell className="text-right font-bold">{item.quantity}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{item.reserved_quantity || 0}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                                  setEditingStock(item);
                                  setStockEditForm({ quantity: item.quantity, note: "" });
                                  setStockEditDialog(true);
                                }} title="Miktar Düzenle">
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={async () => {
                                  if (window.confirm(`Bu stok kaydını silmek istediğinize emin misiniz?\n${item.full_address}\n${item.quantity} adet ${item.variant_name}`)) {
                                    try {
                                      await axios.delete(`${API}/stock/${item.id}`);
                                      toast.success("Stok kaydı silindi");
                                      fetchStockItems(selectedWarehouse?.id);
                                    } catch (error) {
                                      toast.error(error.response?.data?.detail || "Silme başarısız");
                                    }
                                  }
                                }} title="Sil">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Card>
              </div>
            )}
          </TabsContent>

          {/* STOCK TAB */}
          <TabsContent value="stock" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Tüm Stoklar</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => openStockInDialog()}>
                  <ArrowDownCircle className="mr-2 h-4 w-4 text-green-600" /> Stok Girişi
                </Button>
                <Button variant="outline" onClick={() => setTransferDialog(true)}>
                  <ArrowLeftRight className="mr-2 h-4 w-4 text-blue-600" /> Transfer
                </Button>
              </div>
            </div>

            {lowStockItems.length > 0 && (
              <Card className="p-4 border-orange-300 bg-orange-50">
                <h3 className="font-semibold flex items-center gap-2 text-orange-700 mb-3">
                  <AlertTriangle className="h-5 w-5" /> Düşük Stok Uyarıları
                </h3>
                <div className="space-y-2">
                  {lowStockItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-white rounded">
                      <span>{item.variant_name || item.variant_id}</span>
                      <Badge variant="destructive">
                        Stok: {item.total_quantity} / Min: {item.min_stock}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Depo / Adres</TableHead>
                    <TableHead>Ürün / Model</TableHead>
                    <TableHead className="text-right">Miktar</TableHead>
                    <TableHead className="text-right">Rezerve</TableHead>
                    <TableHead className="text-right">Kullanılabilir</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockItems.length === 0 && warehouses.length > 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Önce sol menüden bir depo seçin veya stok ekleyin
                      </TableCell>
                    </TableRow>
                  ) : (
                    stockItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {item.full_address || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{item.variant_name || getProductName(item.product_id)}</div>
                          {item.variant_sku && <div className="text-xs text-muted-foreground">SKU: {item.variant_sku}</div>}
                        </TableCell>
                        <TableCell className="text-right font-bold">{item.quantity}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{item.reserved_quantity || 0}</TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          {(item.quantity || 0) - (item.reserved_quantity || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                              setEditingStock(item);
                              setStockEditForm({ quantity: item.quantity, note: "" });
                              setStockEditDialog(true);
                            }} title="Miktar Düzenle">
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={async () => {
                              if (window.confirm(`Bu stok kaydını silmek istediğinize emin misiniz?\n${item.full_address}\n${item.quantity} adet ${item.variant_name}`)) {
                                try {
                                  await axios.delete(`${API}/stock/${item.id}`);
                                  toast.success("Stok kaydı silindi");
                                  fetchStockItems(selectedWarehouse?.id);
                                } catch (error) {
                                  toast.error(error.response?.data?.detail || "Silme başarısız");
                                }
                              }
                            }} title="Sil">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* MOVEMENTS TAB */}
          <TabsContent value="movements" className="space-y-6">
            <h2 className="text-lg font-semibold">Stok Hareketleri</h2>
            <Card className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Ürün</TableHead>
                    <TableHead>Kaynak Adres</TableHead>
                    <TableHead>Hedef Adres</TableHead>
                    <TableHead className="text-right">Miktar</TableHead>
                    <TableHead>Not</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Henüz hareket kaydı yok
                      </TableCell>
                    </TableRow>
                  ) : (
                    movements.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell className="text-muted-foreground text-sm">
                          {mov.created_at ? new Date(mov.created_at).toLocaleString("tr-TR") : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={mov.movement_type === "IN" ? "default" : mov.movement_type === "OUT" ? "destructive" : "secondary"}>
                            {mov.movement_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{mov.variant_name || mov.variant_id}</TableCell>
                        <TableCell className="font-mono text-xs">{mov.source_address || "-"}</TableCell>
                        <TableCell className="font-mono text-xs">{mov.target_address || "-"}</TableCell>
                        <TableCell className={`text-right font-bold ${mov.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {mov.quantity > 0 ? '+' : ''}{mov.quantity}
                        </TableCell>
                        <TableCell className="text-sm">{mov.note || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* REPORTS TAB */}
          <TabsContent value="reports" className="space-y-6">
            <h2 className="text-lg font-semibold">Raporlar</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Warehouse Report */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <WarehouseIcon className="h-5 w-5 text-blue-600" /> Depo Bazlı Stok Özeti
                </h3>
                {warehouseReports.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Henüz veri yok</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Depo</TableHead>
                        <TableHead className="text-right">Kalem</TableHead>
                        <TableHead className="text-right">Toplam Stok</TableHead>
                        <TableHead className="text-right">Rezerve</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {warehouseReports.map((report, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{report.warehouse_name || report.warehouse_id}</TableCell>
                          <TableCell className="text-right">{report.total_items}</TableCell>
                          <TableCell className="text-right font-bold text-green-600">{report.total_quantity}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{report.total_reserved || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>

              {/* Product Report */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-600" /> Ürün Bazlı Stok Raporu
                </h3>
                {productReports.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Henüz veri yok</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ürün / Model</TableHead>
                        <TableHead className="text-right">Lokasyon</TableHead>
                        <TableHead className="text-right">Stok</TableHead>
                        <TableHead className="text-right">Kullanılabilir</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productReports.map((report, idx) => (
                        <TableRow key={idx} className={report.is_low_stock ? "bg-orange-50 dark:bg-orange-950/20" : ""}>
                          <TableCell>
                            <div className="font-medium">{report.variant_name || report.variant_id}</div>
                            {report.is_low_stock && (
                              <Badge variant="destructive" className="text-xs mt-1">
                                <AlertTriangle className="h-3 w-3 mr-1" /> Düşük Stok
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{report.locations_count}</TableCell>
                          <TableCell className="text-right font-bold">{report.total_quantity}</TableCell>
                          <TableCell className="text-right text-green-600">{report.available || (report.total_quantity - (report.total_reserved || 0))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </div>

            {/* Low Stock Alert */}
            {lowStockItems.length > 0 && (
              <Card className="p-4 border-orange-300 bg-orange-50 dark:bg-orange-950/20">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-orange-700 dark:text-orange-400">
                  <AlertTriangle className="h-5 w-5" /> Düşük Stok Uyarıları ({lowStockItems.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün</TableHead>
                      <TableHead className="text-right">Mevcut</TableHead>
                      <TableHead className="text-right">Minimum</TableHead>
                      <TableHead className="text-right">Eksik</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockItems.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.variant_name || item.variant_id}</TableCell>
                        <TableCell className="text-right">{item.total_quantity}</TableCell>
                        <TableCell className="text-right">{item.min_stock}</TableCell>
                        <TableCell className="text-right font-bold text-red-600">{item.shortage}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* DIALOGS */}
      {/* Warehouse Dialog */}
      <Dialog open={warehouseDialog} onOpenChange={setWarehouseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWarehouse ? "Depo Düzenle" : "Yeni Depo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Depo Adı *</Label>
              <Input value={warehouseForm.name} onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })} placeholder="Örn: Pendik Depo" />
            </div>
            <div className="grid gap-2">
              <Label>Depo Kodu *</Label>
              <Input value={warehouseForm.code} onChange={(e) => setWarehouseForm({ ...warehouseForm, code: e.target.value })} placeholder="Örn: PND" />
            </div>
            <div className="grid gap-2">
              <Label>Adres</Label>
              <Input value={warehouseForm.address} onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })} placeholder="Depo adresi" />
            </div>
            <div className="grid gap-2">
              <Label>Açıklama</Label>
              <Textarea value={warehouseForm.description} onChange={(e) => setWarehouseForm({ ...warehouseForm, description: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarehouseDialog(false)}>İptal</Button>
            <Button onClick={handleSaveWarehouse}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rack Group Dialog */}
      <Dialog open={rackGroupDialog} onOpenChange={(open) => {
        setRackGroupDialog(open);
        if (!open) { setEditingRackGroup(null); setRackGroupForm({ name: "", code: "", description: "" }); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRackGroup ? "Raf Grubu Düzenle" : "Yeni Raf Grubu"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Grup Adı *</Label>
              <Input value={rackGroupForm.name} onChange={(e) => setRackGroupForm({ ...rackGroupForm, name: e.target.value })} placeholder="Örn: A Rafı" />
            </div>
            <div className="grid gap-2">
              <Label>Grup Kodu *</Label>
              <Input value={rackGroupForm.code} onChange={(e) => setRackGroupForm({ ...rackGroupForm, code: e.target.value })} placeholder="Örn: A" />
            </div>
            <div className="grid gap-2">
              <Label>Açıklama</Label>
              <Textarea value={rackGroupForm.description} onChange={(e) => setRackGroupForm({ ...rackGroupForm, description: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRackGroupDialog(false)}>İptal</Button>
            <Button onClick={handleSaveRackGroup}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rack Level Dialog */}
      <Dialog open={rackLevelDialog} onOpenChange={(open) => {
        setRackLevelDialog(open);
        if (!open) { setEditingRackLevel(null); setRackLevelForm({ level_number: 1, name: "" }); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRackLevel ? "Kat Düzenle" : "Yeni Kat"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Kat Numarası *</Label>
              <Input type="number" min="1" value={rackLevelForm.level_number} onChange={(e) => setRackLevelForm({ ...rackLevelForm, level_number: parseInt(e.target.value) })} />
            </div>
            <div className="grid gap-2">
              <Label>Kat Adı (Opsiyonel)</Label>
              <Input value={rackLevelForm.name} onChange={(e) => setRackLevelForm({ ...rackLevelForm, name: e.target.value })} placeholder="Örn: Üst Kat" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRackLevelDialog(false)}>İptal</Button>
            <Button onClick={handleSaveRackLevel}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rack Slot Dialog */}
      <Dialog open={rackSlotDialog} onOpenChange={(open) => {
        setRackSlotDialog(open);
        if (!open) { setEditingRackSlot(null); setRackSlotForm({ slot_number: 1, name: "" }); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRackSlot ? "Bölme Düzenle" : "Yeni Bölme"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Bölme Numarası *</Label>
              <Input type="number" min="1" value={rackSlotForm.slot_number} onChange={(e) => setRackSlotForm({ ...rackSlotForm, slot_number: parseInt(e.target.value) })} />
            </div>
            <div className="grid gap-2">
              <Label>Bölme Adı (Opsiyonel)</Label>
              <Input value={rackSlotForm.name} onChange={(e) => setRackSlotForm({ ...rackSlotForm, name: e.target.value })} placeholder="Örn: Sol Bölme" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRackSlotDialog(false)}>İptal</Button>
            <Button onClick={handleSaveRackSlot}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock In Dialog */}
      <Dialog open={stockInDialog} onOpenChange={setStockInDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-green-600" /> Stok Girişi
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Product Selection */}
            <div className="grid gap-2">
              <Label>Ürün *</Label>
              <select
                value={stockInForm.product_id}
                onChange={(e) => setStockInForm({ ...stockInForm, product_id: e.target.value, variant_id: "", variant_name: "" })}
                className="w-full p-2 border rounded bg-background"
              >
                <option value="">Ürün seçin...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.brand ? `${p.brand} - ` : ""}{p.item_short_name}</option>
                ))}
              </select>
            </div>

            {/* Variant Selection - Optional */}
            <div className="grid gap-2">
              <Label>Model / Variant (Opsiyonel)</Label>
              <select
                value={stockInForm.variant_id}
                onChange={(e) => {
                  const variant = getProductVariants(stockInForm.product_id).find(v => v.id === e.target.value || v.model_name === e.target.value);
                  setStockInForm({ ...stockInForm, variant_id: e.target.value, variant_name: variant?.model_name || "" });
                }}
                className="w-full p-2 border rounded bg-background"
                disabled={!stockInForm.product_id}
              >
                <option value="">{stockInForm.product_id ? (getProductVariants(stockInForm.product_id).length > 0 ? "Model seçin (opsiyonel)..." : "Model yok") : "Önce ürün seçin"}</option>
                {getProductVariants(stockInForm.product_id).map((v) => (
                  <option key={v.id || v.model_name} value={v.id || v.model_name}>
                    {v.model_name} {v.sku ? `(${v.sku})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Selection */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Depo *</Label>
                <select
                  value={stockInForm.warehouse_id}
                  onChange={(e) => setStockInForm({ ...stockInForm, warehouse_id: e.target.value, rack_group_id: "", rack_level_id: "", rack_slot_id: "" })}
                  className="w-full p-2 border rounded bg-background"
                >
                  <option value="">Depo seçin...</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Raf Grubu *</Label>
                <select
                  value={stockInForm.rack_group_id}
                  onChange={(e) => setStockInForm({ ...stockInForm, rack_group_id: e.target.value, rack_level_id: "", rack_slot_id: "" })}
                  className="w-full p-2 border rounded bg-background"
                  disabled={!stockInForm.warehouse_id}
                >
                  <option value="">Seçin...</option>
                  {rackGroups.filter(rg => rg.warehouse_id === stockInForm.warehouse_id).map((rg) => (
                    <option key={rg.id} value={rg.id}>{rg.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Kat *</Label>
                <select
                  value={stockInForm.rack_level_id}
                  onChange={(e) => setStockInForm({ ...stockInForm, rack_level_id: e.target.value, rack_slot_id: "" })}
                  className="w-full p-2 border rounded bg-background"
                  disabled={!stockInForm.rack_group_id}
                >
                  <option value="">Seçin...</option>
                  {rackLevels.filter(rl => rl.rack_group_id === stockInForm.rack_group_id).map((rl) => (
                    <option key={rl.id} value={rl.id}>{rl.name || `${rl.level_number}. Kat`}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Bölme *</Label>
                <select
                  value={stockInForm.rack_slot_id}
                  onChange={(e) => setStockInForm({ ...stockInForm, rack_slot_id: e.target.value })}
                  className="w-full p-2 border rounded bg-background"
                  disabled={!stockInForm.rack_level_id}
                >
                  <option value="">Seçin...</option>
                  {rackSlots.filter(rs => rs.rack_level_id === stockInForm.rack_level_id).map((rs) => (
                    <option key={rs.id} value={rs.id}>{rs.name || `Bölme ${rs.slot_number}`}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Miktar *</Label>
              <Input type="number" min="0.01" step="0.01" value={stockInForm.quantity} onChange={(e) => setStockInForm({ ...stockInForm, quantity: e.target.value })} />
            </div>

            <div className="grid gap-2">
              <Label>Referans</Label>
              <Input value={stockInForm.reference} onChange={(e) => setStockInForm({ ...stockInForm, reference: e.target.value })} placeholder="Sipariş No, Fatura No..." />
            </div>

            <div className="grid gap-2">
              <Label>Not</Label>
              <Textarea value={stockInForm.note} onChange={(e) => setStockInForm({ ...stockInForm, note: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockInDialog(false)}>İptal</Button>
            <Button onClick={handleStockIn} className="bg-green-600 hover:bg-green-700">Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferDialog} onOpenChange={setTransferDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-blue-600" /> Stok Transferi
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Product Selection */}
            <div className="grid gap-2">
              <Label>Ürün *</Label>
              <select
                value={transferForm.product_id}
                onChange={(e) => setTransferForm({ ...transferForm, product_id: e.target.value, variant_id: "", variant_name: "" })}
                className="w-full p-2 border rounded bg-background"
              >
                <option value="">Ürün seçin...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.brand ? `${p.brand} - ` : ""}{p.item_short_name}</option>
                ))}
              </select>
            </div>

            {/* Variant Selection - Optional */}
            <div className="grid gap-2">
              <Label>Model / Variant (Opsiyonel)</Label>
              <select
                value={transferForm.variant_id}
                onChange={(e) => {
                  const variant = getProductVariants(transferForm.product_id).find(v => v.id === e.target.value || v.model_name === e.target.value);
                  setTransferForm({ ...transferForm, variant_id: e.target.value, variant_name: variant?.model_name || "" });
                }}
                className="w-full p-2 border rounded bg-background"
                disabled={!transferForm.product_id}
              >
                <option value="">{transferForm.product_id ? (getProductVariants(transferForm.product_id).length > 0 ? "Model seçin (opsiyonel)..." : "Model yok") : "Önce ürün seçin"}</option>
                {getProductVariants(transferForm.product_id).map((v) => (
                  <option key={v.id || v.model_name} value={v.id || v.model_name}>
                    {v.model_name} {v.sku ? `(${v.sku})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Location */}
            <div className="border rounded p-3 bg-muted/30">
              <h4 className="font-semibold mb-3 text-orange-600">Kaynak Adres</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Depo *</Label>
                  <select
                    value={transferForm.warehouse_id}
                    onChange={(e) => setTransferForm({ ...transferForm, warehouse_id: e.target.value, rack_group_id: "", rack_level_id: "", rack_slot_id: "" })}
                    className="w-full p-2 border rounded bg-background"
                  >
                    <option value="">Depo seçin...</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Raf Grubu *</Label>
                  <select
                    value={transferForm.rack_group_id}
                    onChange={(e) => setTransferForm({ ...transferForm, rack_group_id: e.target.value, rack_level_id: "", rack_slot_id: "" })}
                    className="w-full p-2 border rounded bg-background"
                    disabled={!transferForm.warehouse_id}
                  >
                    <option value="">Seçin...</option>
                    {rackGroups.filter(rg => rg.warehouse_id === transferForm.warehouse_id).map((rg) => (
                      <option key={rg.id} value={rg.id}>{rg.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <Label>Kat *</Label>
                  <select
                    value={transferForm.rack_level_id}
                    onChange={(e) => setTransferForm({ ...transferForm, rack_level_id: e.target.value, rack_slot_id: "" })}
                    className="w-full p-2 border rounded bg-background"
                    disabled={!transferForm.rack_group_id}
                  >
                    <option value="">Seçin...</option>
                    {rackLevels.filter(rl => rl.rack_group_id === transferForm.rack_group_id).map((rl) => (
                      <option key={rl.id} value={rl.id}>{rl.name || `${rl.level_number}. Kat`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Bölme *</Label>
                  <select
                    value={transferForm.rack_slot_id}
                    onChange={(e) => setTransferForm({ ...transferForm, rack_slot_id: e.target.value })}
                    className="w-full p-2 border rounded bg-background"
                    disabled={!transferForm.rack_level_id}
                  >
                    <option value="">Seçin...</option>
                    {rackSlots.filter(rs => rs.rack_level_id === transferForm.rack_level_id).map((rs) => (
                      <option key={rs.id} value={rs.id}>{rs.name || `Bölme ${rs.slot_number}`}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Target Location */}
            <div className="border rounded p-3 bg-muted/30">
              <h4 className="font-semibold mb-3 text-green-600">Hedef Adres</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Depo *</Label>
                  <select
                    value={transferForm.target_warehouse_id}
                    onChange={(e) => setTransferForm({ ...transferForm, target_warehouse_id: e.target.value, target_rack_group_id: "", target_rack_level_id: "", target_rack_slot_id: "" })}
                    className="w-full p-2 border rounded bg-background"
                  >
                    <option value="">Depo seçin...</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Raf Grubu *</Label>
                  <select
                    value={transferForm.target_rack_group_id}
                    onChange={(e) => setTransferForm({ ...transferForm, target_rack_group_id: e.target.value, target_rack_level_id: "", target_rack_slot_id: "" })}
                    className="w-full p-2 border rounded bg-background"
                    disabled={!transferForm.target_warehouse_id}
                  >
                    <option value="">Seçin...</option>
                    {rackGroups.filter(rg => rg.warehouse_id === transferForm.target_warehouse_id).map((rg) => (
                      <option key={rg.id} value={rg.id}>{rg.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <Label>Kat *</Label>
                  <select
                    value={transferForm.target_rack_level_id}
                    onChange={(e) => setTransferForm({ ...transferForm, target_rack_level_id: e.target.value, target_rack_slot_id: "" })}
                    className="w-full p-2 border rounded bg-background"
                    disabled={!transferForm.target_rack_group_id}
                  >
                    <option value="">Seçin...</option>
                    {rackLevels.filter(rl => rl.rack_group_id === transferForm.target_rack_group_id).map((rl) => (
                      <option key={rl.id} value={rl.id}>{rl.name || `${rl.level_number}. Kat`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Bölme *</Label>
                  <select
                    value={transferForm.target_rack_slot_id}
                    onChange={(e) => setTransferForm({ ...transferForm, target_rack_slot_id: e.target.value })}
                    className="w-full p-2 border rounded bg-background"
                    disabled={!transferForm.target_rack_level_id}
                  >
                    <option value="">Seçin...</option>
                    {rackSlots.filter(rs => rs.rack_level_id === transferForm.target_rack_level_id).map((rs) => (
                      <option key={rs.id} value={rs.id}>{rs.name || `Bölme ${rs.slot_number}`}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Miktar *</Label>
              <Input type="number" min="0.01" step="0.01" value={transferForm.quantity} onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })} />
            </div>

            <div className="grid gap-2">
              <Label>Not</Label>
              <Textarea value={transferForm.note} onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })} rows={2} placeholder="Transfer açıklaması..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialog(false)}>İptal</Button>
            <Button onClick={handleTransfer} className="bg-blue-600 hover:bg-blue-700">Transfer Et</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Edit Dialog */}
      <Dialog open={stockEditDialog} onOpenChange={(open) => {
        setStockEditDialog(open);
        if (!open) { setEditingStock(null); setStockEditForm({ quantity: 0, note: "" }); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" /> Stok Miktarı Düzenle
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editingStock && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">{editingStock.variant_name}</div>
                <div className="text-sm text-muted-foreground">{editingStock.full_address}</div>
                <div className="text-sm">Mevcut Miktar: <strong>{editingStock.quantity}</strong></div>
              </div>
            )}
            <div className="grid gap-2">
              <Label>Yeni Miktar *</Label>
              <Input 
                type="number" 
                min="0" 
                step="0.01" 
                value={stockEditForm.quantity} 
                onChange={(e) => setStockEditForm({ ...stockEditForm, quantity: parseFloat(e.target.value) || 0 })} 
              />
            </div>
            <div className="grid gap-2">
              <Label>Düzeltme Sebebi</Label>
              <Textarea 
                value={stockEditForm.note} 
                onChange={(e) => setStockEditForm({ ...stockEditForm, note: e.target.value })} 
                rows={2} 
                placeholder="Örn: Sayım sonrası düzeltme, hatalı giriş..." 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockEditDialog(false)}>İptal</Button>
            <Button onClick={async () => {
              try {
                await axios.put(`${API}/stock/${editingStock.id}?quantity=${stockEditForm.quantity}&note=${encodeURIComponent(stockEditForm.note)}`);
                toast.success("Stok miktarı güncellendi");
                setStockEditDialog(false);
                setEditingStock(null);
                fetchStockItems(selectedWarehouse?.id);
              } catch (error) {
                toast.error(error.response?.data?.detail || "Güncelleme başarısız");
              }
            }}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Warehouse;
