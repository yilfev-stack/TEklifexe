import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import axios from "axios";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  PlusCircle,
  RefreshCw,
  Trash2,
  Check,
  X
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/sofis`;

const SofisImport = () => {
  const navigate = useNavigate();
  
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  
  // Selection state
  const [selectedNew, setSelectedNew] = useState({});
  const [selectedUpdates, setSelectedUpdates] = useState({});

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setAnalysis(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast.error("Lütfen bir Excel dosyası seçin");
      return;
    }
    
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API}/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setAnalysis(response.data);
      
      // Select all new products and price changes by default
      const newSel = {};
      response.data.new_products?.forEach(p => { newSel[p.sku] = true; });
      setSelectedNew(newSel);
      
      const updateSel = {};
      response.data.price_changed?.forEach(p => { updateSel[p.sku] = true; });
      setSelectedUpdates(updateSel);
      
      toast.success("Analiz tamamlandı!");
    } catch (error) {
      const msg = error.response?.data?.detail || "Analiz hatası";
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApply = async () => {
    if (!analysis) return;
    
    // Collect selected items with group info
    const addNew = analysis.new_products?.filter(p => selectedNew[p.sku]) || [];
    const updatePrices = analysis.price_changed?.filter(p => selectedUpdates[p.sku])
      .map(p => ({
        sku: p.sku,
        product_id: p.product_id,
        new_price: p.new_price,
        group_name: p.group_name  // Include group info
      })) || [];
    
    // Also send price_same for group updates only
    const priceSame = analysis.price_same?.map(p => ({
      sku: p.sku,
      product_id: p.product_id,
      group_name: p.group_name
    })) || [];
    
    if (addNew.length === 0 && updatePrices.length === 0) {
      toast.error("Hiçbir değişiklik seçilmedi");
      return;
    }
    
    setApplying(true);
    try {
      const response = await axios.post(`${API}/apply`, {
        add_new: addNew,
        update_prices: updatePrices,
        price_same: priceSame,  // For group updates
        groups_found: analysis.groups_found || []  // Pass found groups
      });
      
      toast.success(response.data.message);
      
      // Show group info
      if (response.data.groups_created > 0) {
        toast.info(`${response.data.groups_created} yeni grup oluşturuldu`);
      }
      
      // Reset and re-analyze to show updated state
      setAnalysis(null);
      setFile(null);
      
    } catch (error) {
      const msg = error.response?.data?.detail || "Uygulama hatası";
      toast.error(msg);
    } finally {
      setApplying(false);
    }
  };

  const toggleAllNew = (value) => {
    const newSel = {};
    analysis?.new_products?.forEach(p => { newSel[p.sku] = value; });
    setSelectedNew(newSel);
  };

  const toggleAllUpdates = (value) => {
    const updateSel = {};
    analysis?.price_changed?.forEach(p => { updateSel[p.sku] = value; });
    setSelectedUpdates(updateSel);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/products")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">SOFIS Fiyat Listesi Import</h1>
              <p className="text-sm text-muted-foreground">
                Excel yükle, karşılaştır, güncelle
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Upload Section */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              {file && (
                <p className="text-sm text-muted-foreground mt-1">
                  📁 {file.name}
                </p>
              )}
            </div>
            <Button onClick={handleAnalyze} disabled={!file || analyzing}>
              {analyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analiz ediliyor...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Analiz Et
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Analysis Results */}
        {analysis && (
          <>
            {/* Groups Info */}
            {analysis.groups_found && analysis.groups_found.length > 0 && (
              <Card className="p-4 mb-6 bg-purple-50 dark:bg-purple-950/30 border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-purple-600 font-semibold">📁 Bulunan Gruplar ({analysis.groups_found.length}):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.groups_found.map((group, idx) => (
                    <span key={idx} className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                      {group}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Bu gruplar otomatik oluşturulacak ve ürünler ilgili gruplara atanacak.
                </p>
              </Card>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4 border-l-4 border-l-blue-500">
                <div className="text-sm text-muted-foreground">Excel'de</div>
                <div className="text-2xl font-bold text-blue-500">
                  {analysis.summary.total_in_excel}
                </div>
                <div className="text-xs text-muted-foreground">ürün</div>
              </Card>
              
              <Card className="p-4 border-l-4 border-l-green-500">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <PlusCircle className="h-4 w-4" /> Yeni
                </div>
                <div className="text-2xl font-bold text-green-500">
                  {analysis.summary.new_products}
                </div>
                <div className="text-xs text-muted-foreground">ürün eklenecek</div>
              </Card>
              
              <Card className="p-4 border-l-4 border-l-orange-500">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" /> Fiyat Değişti
                </div>
                <div className="text-2xl font-bold text-orange-500">
                  {analysis.summary.price_changed}
                </div>
                <div className="text-xs text-muted-foreground">ürün güncellenecek</div>
              </Card>
              
              <Card className="p-4 border-l-4 border-l-gray-400">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> Aynı
                </div>
                <div className="text-2xl font-bold text-gray-500">
                  {analysis.summary.price_same}
                </div>
                <div className="text-xs text-muted-foreground">ürün değişmedi</div>
              </Card>
            </div>

            {/* Detailed Tabs */}
            <Tabs defaultValue="changed" className="space-y-4">
              <TabsList>
                <TabsTrigger value="new" className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Yeni Ürünler ({analysis.summary.new_products})
                </TabsTrigger>
                <TabsTrigger value="changed" className="gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Fiyat Değişenler ({analysis.summary.price_changed})
                </TabsTrigger>
                <TabsTrigger value="same" className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Değişmeyenler ({analysis.summary.price_same})
                </TabsTrigger>
                {analysis.summary.removed_from_list > 0 && (
                  <TabsTrigger value="removed" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Listeden Çıkanlar ({analysis.summary.removed_from_list})
                  </TabsTrigger>
                )}
              </TabsList>

              {/* New Products Tab */}
              <TabsContent value="new">
                <Card className="p-4">
                  {analysis.new_products?.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-green-600">
                          🆕 Yeni Ürünler ({analysis.new_products.length})
                        </h3>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => toggleAllNew(true)}>
                            Tümünü Seç
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toggleAllNew(false)}>
                            Tümünü Kaldır
                          </Button>
                        </div>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-background">
                            <tr className="border-b">
                              <th className="text-left py-2 px-2 w-10"></th>
                              <th className="text-left py-2 px-2">SKU</th>
                              <th className="text-left py-2 px-2">Açıklama</th>
                              <th className="text-left py-2 px-2">Marka</th>
                              <th className="text-right py-2 px-2">Fiyat</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysis.new_products.map((p) => (
                              <tr key={p.sku} className="border-b hover:bg-muted/50">
                                <td className="py-2 px-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedNew[p.sku] || false}
                                    onChange={(e) => setSelectedNew({...selectedNew, [p.sku]: e.target.checked})}
                                  />
                                </td>
                                <td className="py-2 px-2 font-mono text-xs">{p.sku}</td>
                                <td className="py-2 px-2 max-w-xs truncate" title={p.description}>
                                  {p.description}
                                </td>
                                <td className="py-2 px-2">
                                  <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                                    {p.brand}
                                  </span>
                                </td>
                                <td className="py-2 px-2 text-right font-semibold text-green-600">
                                  {formatPrice(p.cost_price)} EUR
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Yeni ürün yok - tüm ürünler zaten sistemde
                    </p>
                  )}
                </Card>
              </TabsContent>

              {/* Price Changed Tab */}
              <TabsContent value="changed">
                <Card className="p-4">
                  {analysis.price_changed?.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-orange-600">
                          🔄 Fiyatı Değişen Ürünler ({analysis.price_changed.length})
                        </h3>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => toggleAllUpdates(true)}>
                            Tümünü Seç
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toggleAllUpdates(false)}>
                            Tümünü Kaldır
                          </Button>
                        </div>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-background">
                            <tr className="border-b">
                              <th className="text-left py-2 px-2 w-10"></th>
                              <th className="text-left py-2 px-2">SKU</th>
                              <th className="text-left py-2 px-2">Açıklama</th>
                              <th className="text-right py-2 px-2">Eski Fiyat</th>
                              <th className="text-center py-2 px-2">→</th>
                              <th className="text-right py-2 px-2">Yeni Fiyat</th>
                              <th className="text-right py-2 px-2">Değişim</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysis.price_changed.map((p) => (
                              <tr key={p.sku} className="border-b hover:bg-muted/50">
                                <td className="py-2 px-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedUpdates[p.sku] || false}
                                    onChange={(e) => setSelectedUpdates({...selectedUpdates, [p.sku]: e.target.checked})}
                                  />
                                </td>
                                <td className="py-2 px-2 font-mono text-xs">{p.sku}</td>
                                <td className="py-2 px-2 max-w-xs truncate" title={p.description}>
                                  {p.description}
                                </td>
                                <td className="py-2 px-2 text-right text-gray-500 line-through">
                                  {formatPrice(p.old_price)}
                                </td>
                                <td className="py-2 px-2 text-center">→</td>
                                <td className="py-2 px-2 text-right font-semibold">
                                  {formatPrice(p.new_price)} EUR
                                </td>
                                <td className={`py-2 px-2 text-right font-semibold ${
                                  p.change_percent > 0 ? 'text-red-500' : 'text-green-500'
                                }`}>
                                  {p.change_percent > 0 ? '+' : ''}{p.change_percent}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Fiyat değişikliği yok
                    </p>
                  )}
                </Card>
              </TabsContent>

              {/* Same Price Tab */}
              <TabsContent value="same">
                <Card className="p-4">
                  {analysis.price_same?.length > 0 ? (
                    <>
                      <h3 className="font-semibold text-gray-600 mb-4">
                        ✅ Fiyatı Değişmeyen Ürünler ({analysis.price_same.length})
                      </h3>
                      <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-background">
                            <tr className="border-b">
                              <th className="text-left py-2 px-2">SKU</th>
                              <th className="text-left py-2 px-2">Açıklama</th>
                              <th className="text-left py-2 px-2">Marka</th>
                              <th className="text-right py-2 px-2">Fiyat</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysis.price_same.map((p) => (
                              <tr key={p.sku} className="border-b hover:bg-muted/50">
                                <td className="py-2 px-2 font-mono text-xs">{p.sku}</td>
                                <td className="py-2 px-2 max-w-xs truncate" title={p.description}>
                                  {p.description}
                                </td>
                                <td className="py-2 px-2">
                                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                                    {p.brand}
                                  </span>
                                </td>
                                <td className="py-2 px-2 text-right">
                                  {formatPrice(p.current_price)} EUR
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Değişmeyen ürün yok
                    </p>
                  )}
                </Card>
              </TabsContent>

              {/* Removed Products Tab */}
              <TabsContent value="removed">
                <Card className="p-4">
                  {analysis.removed_products?.length > 0 ? (
                    <>
                      <h3 className="font-semibold text-red-600 mb-4">
                        ⚠️ Yeni Listede Olmayan Ürünler ({analysis.removed_products.length})
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Bu ürünler sistemde var ama yeni Excel listesinde bulunamadı. Silinmiş veya kod değişmiş olabilir.
                      </p>
                      <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-background">
                            <tr className="border-b">
                              <th className="text-left py-2 px-2">SKU</th>
                              <th className="text-left py-2 px-2">Açıklama</th>
                              <th className="text-right py-2 px-2">Kayıtlı Fiyat</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysis.removed_products.map((p) => (
                              <tr key={p.sku} className="border-b hover:bg-muted/50 bg-red-50">
                                <td className="py-2 px-2 font-mono text-xs">{p.sku}</td>
                                <td className="py-2 px-2 max-w-xs truncate">{p.description}</td>
                                <td className="py-2 px-2 text-right">{formatPrice(p.cost_price)} EUR</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Listeden çıkan ürün yok
                    </p>
                  )}
                </Card>
              </TabsContent>
            </Tabs>

            {/* Apply Button */}
            <div className="mt-6 flex justify-end gap-4">
              <Button variant="outline" onClick={() => setAnalysis(null)}>
                İptal
              </Button>
              <Button 
                onClick={handleApply} 
                disabled={applying || (
                  Object.values(selectedNew).filter(Boolean).length === 0 &&
                  Object.values(selectedUpdates).filter(Boolean).length === 0
                )}
                className="bg-green-600 hover:bg-green-700"
              >
                {applying ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Uygulanıyor...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Seçilenleri Uygula ({
                      Object.values(selectedNew).filter(Boolean).length +
                      Object.values(selectedUpdates).filter(Boolean).length
                    } ürün)
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Info Card when no analysis */}
        {!analysis && (
          <Card className="p-8 text-center">
            <FileSpreadsheet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">SOFIS Excel Dosyası Yükleyin</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sistem otomatik olarak:
            </p>
            <ul className="text-sm text-left max-w-md mx-auto space-y-2">
              <li className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-green-500" />
                <span>Yeni ürünleri tespit eder</span>
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span>Fiyat değişikliklerini gösterir</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-gray-500" />
                <span>Değişmeyen ürünleri listeler</span>
              </li>
              <li className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-red-500" />
                <span>Listeden çıkan ürünleri uyarır</span>
              </li>
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SofisImport;
