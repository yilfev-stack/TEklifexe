import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import axios from "axios";
import {
  ArrowLeft, Upload, Lock, RefreshCw, Trash2, Settings,
  Building2, ChevronRight, ChevronDown, Calendar, Save,
  FolderOpen, Download, FileSpreadsheet, Wallet, Euro, DollarSign
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/real-costs`;

const MONTH_NAMES = {
  "01": "Ocak", "02": "Şubat", "03": "Mart", "04": "Nisan",
  "05": "Mayıs", "06": "Haziran", "07": "Temmuz", "08": "Ağustos",
  "09": "Eylül", "10": "Ekim", "11": "Kasım", "12": "Aralık"
};

const CURRENCY_SYMBOLS = {
  "TRY": "₺",
  "EUR": "€",
  "USD": "$"
};

const CURRENCY_ICONS = {
  "TRY": Wallet,
  "EUR": Euro,
  "USD": DollarSign
};

const formatMonth = (m) => {
  if (!m) return "";
  const [y, mo] = m.split("-");
  return `${MONTH_NAMES[mo] || mo} ${y}`;
};

const formatCurrency = (amount, currency = "TRY") => {
  const symbol = CURRENCY_SYMBOLS[currency] || "₺";
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount || 0));
  
  const sign = amount < 0 ? "-" : "";
  return `${sign}${formatted} ${symbol}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
};

const RealCosts = () => {
  const navigate = useNavigate();
  
  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  
  // View
  const [currentView, setCurrentView] = useState("main");
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  
  // Data
  const [summary, setSummary] = useState(null);
  const [months, setMonths] = useState([]);
  const [monthDetail, setMonthDetail] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Expandable sections
  const [expandedYears, setExpandedYears] = useState({});
  const [showUploads, setShowUploads] = useState(false);
  const [expandedUploadMonths, setExpandedUploadMonths] = useState({});
  
  // Upload form
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadBank, setUploadBank] = useState("");
  const [uploadCurrency, setUploadCurrency] = useState("");
  const [uploading, setUploading] = useState(false);
  
  // Opening balance form
  const [openingBank, setOpeningBank] = useState("Garanti");
  const [openingCurrency, setOpeningCurrency] = useState("TRY");
  const [openingAmount, setOpeningAmount] = useState("");
  const [savingBalance, setSavingBalance] = useState(false);
  const [openingBalances, setOpeningBalances] = useState({});

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      await axios.post(`${API}/verify-password`, { password });
      setIsAuthenticated(true);
      toast.success("Giriş başarılı");
    } catch {
      toast.error("Yanlış şifre");
    } finally {
      setAuthLoading(false);
    }
  };

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, monthsRes, uploadsRes, openingRes] = await Promise.all([
        axios.get(`${API}/summary`),
        axios.get(`${API}/months`),
        axios.get(`${API}/uploads`),
        axios.get(`${API}/opening-balances`)
      ]);
      setSummary(summaryRes.data);
      setMonths(monthsRes.data);
      setUploads(uploadsRes.data);
      setOpeningBalances(openingRes.data);
      
      // Auto-expand current year
      const currentYear = new Date().getFullYear().toString();
      setExpandedYears(prev => ({ ...prev, [currentYear]: true }));
    } catch (error) {
      console.error("Error:", error);
      toast.error("Veri yüklenirken hata");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMonthDetail = async (month, bank, currency) => {
    setLoading(true);
    try {
      let url = `${API}/month/${month}`;
      const params = [];
      if (bank) params.push(`bank=${bank}`);
      if (currency) params.push(`currency=${currency}`);
      if (params.length) url += `?${params.join('&')}`;
      
      const res = await axios.get(url);
      setMonthDetail(res.data);
    } catch {
      toast.error("Ay detayı yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, fetchData]);

  // Upload
  const handleUpload = async () => {
    if (!uploadFile || !uploadBank || !uploadCurrency) {
      toast.error("Dosya, banka ve para birimi seçimi zorunlu");
      return;
    }
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('bank', uploadBank);
      formData.append('currency', uploadCurrency);
      
      const res = await axios.post(`${API}/upload`, formData);
      toast.success(res.data.message);
      setUploadFile(null);
      setUploadBank("");
      setUploadCurrency("");
      fetchData();
      setCurrentView("main");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Yükleme başarısız");
    } finally {
      setUploading(false);
    }
  };

  // Delete upload
  const handleDeleteUpload = async (uploadId) => {
    if (!window.confirm("Bu yükleme ve tüm işlemleri silinecek. Onaylıyor musunuz?")) return;
    
    try {
      await axios.delete(`${API}/uploads/${uploadId}`);
      toast.success("Silindi");
      fetchData();
    } catch {
      toast.error("Silme başarısız");
    }
  };

  // Save opening balance
  const handleSaveBalance = async () => {
    if (!openingAmount) {
      toast.error("Bakiye girin");
      return;
    }
    
    setSavingBalance(true);
    try {
      await axios.post(`${API}/opening-balances`, {
        bank: openingBank,
        currency: openingCurrency,
        amount: parseFloat(openingAmount)
      });
      toast.success("Açılış bakiyesi kaydedildi");
      fetchData();
      setOpeningAmount("");
    } catch {
      toast.error("Kaydetme başarısız");
    } finally {
      setSavingBalance(false);
    }
  };

  // Open month detail
  const openMonth = (month, bank = null, currency = null) => {
    setSelectedMonth(month);
    setSelectedBank(bank);
    setSelectedCurrency(currency);
    setCurrentView("month");
    fetchMonthDetail(month, bank, currency);
  };

  // Toggle year expansion
  const toggleYear = (year) => {
    setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
  };

  // Toggle upload month expansion
  const toggleUploadMonth = (month) => {
    setExpandedUploadMonths(prev => ({ ...prev, [month]: !prev[month] }));
  };

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <Lock className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Gerçek Maliyetler</h1>
            <p className="text-sm text-muted-foreground mt-2">Şifre gerekli</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifre"
                autoFocus
              />
              <Button type="submit" className="w-full" disabled={authLoading}>
                {authLoading ? "..." : "Giriş"}
              </Button>
            </div>
          </form>
          <Button variant="ghost" className="w-full mt-4" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Ana Sayfa
          </Button>
        </Card>
      </div>
    );
  }

  // UPLOAD VIEW
  if (currentView === "upload") {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card/50">
          <div className="container mx-auto px-6 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Dosya Yükle</h1>
          </div>
        </div>
        <div className="container mx-auto px-6 py-6">
          <Card className="p-6 max-w-lg mx-auto space-y-6">
            <div>
              <Label className="text-base font-semibold">Banka</Label>
              <Select value={uploadBank} onValueChange={setUploadBank}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Banka seçin..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Garanti">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-red-500" />
                      Garanti Bankası
                    </div>
                  </SelectItem>
                  <SelectItem value="Ziraat">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-green-500" />
                      Ziraat Bankası
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-base font-semibold">Para Birimi</Label>
              <Select value={uploadCurrency} onValueChange={setUploadCurrency}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Para birimi seçin..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">🇹🇷 Türk Lirası (TL)</SelectItem>
                  <SelectItem value="EUR">🇪🇺 Euro (EUR)</SelectItem>
                  <SelectItem value="USD">🇺🇸 Amerikan Doları (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Excel Dosyası</Label>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="mt-2"
              />
            </div>
            
            <Button 
              onClick={handleUpload} 
              disabled={uploading || !uploadFile || !uploadBank || !uploadCurrency}
              className="w-full"
            >
              {uploading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? "Yükleniyor..." : "Yükle"}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // SETTINGS VIEW
  if (currentView === "settings") {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card/50">
          <div className="container mx-auto px-6 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Açılış Bakiyeleri</h1>
          </div>
        </div>
        <div className="container mx-auto px-6 py-6">
          <Card className="p-6 max-w-lg mx-auto space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Her banka ve para birimi için açılış bakiyesi girin.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Banka</Label>
                <Select value={openingBank} onValueChange={setOpeningBank}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Garanti">Garanti</SelectItem>
                    <SelectItem value="Ziraat">Ziraat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Para Birimi</Label>
                <Select value={openingCurrency} onValueChange={setOpeningCurrency}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRY">TL</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Açılış Bakiyesi</Label>
              <Input
                type="number"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                placeholder="Örn: 10000"
                className="mt-1"
              />
              {openingBalances[`${openingBank}_${openingCurrency}`] && (
                <p className="text-xs text-muted-foreground mt-1">
                  Mevcut: {formatCurrency(openingBalances[`${openingBank}_${openingCurrency}`].amount, openingCurrency)}
                </p>
              )}
            </div>
            
            <Button onClick={handleSaveBalance} disabled={savingBalance} className="w-full">
              {savingBalance ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Kaydet
            </Button>
            
            {/* Current balances list */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-3">Mevcut Açılış Bakiyeleri</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(openingBalances).map(([key, data]) => {
                  const [bank, currency] = key.split('_');
                  return (
                    <div key={key} className="flex justify-between p-2 bg-muted/50 rounded">
                      <span>{bank} - {currency}</span>
                      <span className="font-medium">{formatCurrency(data.amount, currency)}</span>
                    </div>
                  );
                })}
                {Object.keys(openingBalances).length === 0 && (
                  <p className="text-muted-foreground">Henüz açılış bakiyesi yok</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // MONTH DETAIL VIEW
  if (currentView === "month" && selectedMonth) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card/50">
          <div className="container mx-auto px-6 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{formatMonth(selectedMonth)}</h1>
              <p className="text-sm text-muted-foreground">
                {selectedBank && selectedCurrency ? `${selectedBank} - ${selectedCurrency}` : "Tüm Bankalar"}
              </p>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-6 py-6">
          {loading ? (
            <div className="text-center py-12"><RefreshCw className="h-8 w-8 animate-spin mx-auto" /></div>
          ) : monthDetail?.transactions?.length > 0 ? (
            <Card className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Tarih</th>
                      <th className="text-left py-2">Banka</th>
                      <th className="text-left py-2">Açıklama</th>
                      <th className="text-right py-2">Tutar</th>
                      <th className="text-right py-2">Bakiye</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthDetail.transactions.map(t => (
                      <tr key={t.id} className="border-b hover:bg-muted/30">
                        <td className="py-2">{t.date}</td>
                        <td className="py-2 text-xs">{t.bank} {t.currency}</td>
                        <td className="py-2">{t.description?.substring(0, 40)}</td>
                        <td className={`py-2 text-right font-medium ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(t.amount, t.currency)}
                        </td>
                        <td className="py-2 text-right text-muted-foreground">
                          {t.balance != null ? formatCurrency(t.balance, t.currency) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <p className="text-center text-muted-foreground py-12">Veri bulunamadı</p>
          )}
        </div>
      </div>
    );
  }

  // MAIN VIEW
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Varlık Takibi</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Yenile
            </Button>
            <Button variant="outline" onClick={() => setCurrentView("settings")}>
              <Settings className="h-4 w-4 mr-2" />
              Açılış
            </Button>
            <Button onClick={() => setCurrentView("upload")}>
              <Upload className="h-4 w-4 mr-2" />
              Yükle
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Bank Summary Cards */}
        {summary?.banks && Object.entries(summary.banks).map(([bankName, currencies]) => (
          <Card key={bankName} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className={`h-6 w-6 ${bankName === 'Garanti' ? 'text-red-500' : 'text-green-500'}`} />
              <h2 className="text-xl font-bold">{bankName} Bankası</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(currencies).map(([currency, data]) => {
                const CurrencyIcon = CURRENCY_ICONS[currency] || Wallet;
                const hasData = data.transaction_count > 0 || data.opening > 0;
                
                return (
                  <div 
                    key={currency} 
                    className={`p-4 rounded-lg border ${hasData ? 'bg-muted/30' : 'bg-muted/10 opacity-50'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CurrencyIcon className="h-5 w-5 text-primary" />
                      <span className="font-medium">{currency}</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(data.current_balance, currency)}
                    </div>
                    {data.last_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Son: {data.last_date}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}

        {/* Monthly Breakdown - Year Folders */}
        {months.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Aylık Döküm
            </h3>
            
            <div className="space-y-2">
              {months.map(yearData => (
                <div key={yearData.year} className="border rounded-lg">
                  {/* Year Header - Collapsible */}
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleYear(yearData.year)}
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-yellow-500" />
                      <span className="font-medium">{yearData.year}</span>
                      <span className="text-xs text-muted-foreground">
                        ({yearData.months.length} ay)
                      </span>
                    </div>
                    {expandedYears[yearData.year] ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Months inside year */}
                  {expandedYears[yearData.year] && (
                    <div className="border-t p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {yearData.months.map(monthData => (
                        <div
                          key={monthData.month}
                          onClick={() => openMonth(monthData.month)}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{formatMonth(monthData.month)}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="space-y-1 text-xs">
                            {Object.entries(monthData.data).map(([key, info]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-muted-foreground">{info.bank} {info.currency}:</span>
                                <span className={info.last_balance != null ? 'text-blue-600 font-medium' : ''}>
                                  {info.last_balance != null 
                                    ? formatCurrency(info.last_balance, info.currency)
                                    : formatCurrency(info.net, info.currency)
                                  }
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Uploads - Collapsible */}
        {uploads.length > 0 && (
          <Card className="p-4">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowUploads(!showUploads)}
            >
              <h3 className="font-semibold flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Yüklemeler
                <span className="text-xs text-muted-foreground font-normal">
                  ({uploads.reduce((acc, m) => acc + m.uploads.length, 0)} dosya)
                </span>
              </h3>
              {showUploads ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            
            {showUploads && (
              <div className="mt-4 space-y-2">
                {uploads.map(monthGroup => (
                  <div key={monthGroup.month} className="border rounded-lg">
                    {/* Month Header */}
                    <div 
                      className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted/30"
                      onClick={() => toggleUploadMonth(monthGroup.month)}
                    >
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{formatMonth(monthGroup.month)}</span>
                        <span className="text-xs text-muted-foreground">
                          ({monthGroup.uploads.length} dosya)
                        </span>
                      </div>
                      {expandedUploadMonths[monthGroup.month] ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* Files inside month */}
                    {expandedUploadMonths[monthGroup.month] && (
                      <div className="border-t">
                        {monthGroup.uploads.map(u => (
                          <div key={u.id} className="flex items-center justify-between p-2 border-b last:border-b-0 hover:bg-muted/20">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileSpreadsheet className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm truncate">{u.filename}</p>
                                <p className="text-xs text-muted-foreground">
                                  {u.bank} • {u.currency} • {u.record_count} işlem • {formatDate(u.uploaded_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`${API}/uploads/${u.id}/download`, '_blank');
                                }}
                                title="Excel'i İndir"
                              >
                                <Download className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteUpload(u.id);
                                }}
                                title="Sil"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default RealCosts;
