import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Wrench, Users, Package, BarChart3, Warehouse, Boxes, Wallet, ClipboardList, ExternalLink, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "@/i18n/translations";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentQuotations, setRecentQuotations] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [realCostsData, setRealCostsData] = useState(null);
  const [realCostsPassword, setRealCostsPassword] = useState("");
  const [realCostsUnlocked, setRealCostsUnlocked] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    fetchStats();
    fetchRecentQuotations();
    fetchMonthlyStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/statistics`);
      const data = response.data;

      // Backend response:
      // { total, sales, service, offer_status: { pending, accepted, rejected } }
      setStats({
        total: data?.total ?? 0,
        sales: data?.sales ?? 0,
        service: data?.service ?? 0,

        // Backend şu an bunları göndermiyor; 0 kalması normal.
        customers: data?.customers ?? 0,
        products: data?.products ?? 0,

        pending: data?.offer_status?.pending ?? 0,
        accepted: data?.offer_status?.accepted ?? 0,
        rejected: data?.offer_status?.rejected ?? 0,
      });
    } catch (error) {
      console.error("Stats fetch error:", error);
      // UI’de null kalmasın diye (opsiyonel) fallback:
      setStats({
        total: 0,
        sales: 0,
        service: 0,
        customers: 0,
        products: 0,
        pending: 0,
        accepted: 0,
        rejected: 0,
      });
    }
  };

  const fetchRecentQuotations = async () => {
    try {
      const response = await axios.get(`${API}/quotations`);
      const sorted = response.data
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      setRecentQuotations(sorted);
    } catch (error) {
      console.error("Recent quotations fetch error:", error);
    }
  };

  const fetchMonthlyStats = async () => {
    try {
      const response = await axios.get(`${API}/quotations`);
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const thisMonth = response.data.filter(q => {
        const d = new Date(q.created_at);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      
      setMonthlyStats({
        total: thisMonth.length,
        pending: thisMonth.filter(q => q.offer_status === 'pending').length,
        accepted: thisMonth.filter(q => q.offer_status === 'accepted').length,
        rejected: thisMonth.filter(q => q.offer_status === 'rejected').length,
      });
    } catch (error) {
      console.error("Monthly stats error:", error);
    }
  };

  const unlockRealCosts = async () => {
    try {
      await axios.post(`${API}/real-costs/verify-password`, { password: realCostsPassword });
      const response = await axios.get(`${API}/real-costs/monthly-overview`);
      setRealCostsData(response.data.months?.[0] || null);
      setRealCostsUnlocked(true);
      toast.success("Şifre doğru");
    } catch (error) {
      toast.error("Yanlış şifre");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="https://customer-assets.emergentagent.com/job_quote-creator-10/artifacts/mew65la4_logo%20sosn.jpg"
                alt="DEMART Logo"
                className="h-14 w-auto"
              />
              <div>
                <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">
                  DEMART Quotation System
                </h1>
                <p className="text-xs font-semibold text-blue-600 italic">
                  The Art of Design Engineering Maintenance
                </p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card
            className="p-8 bg-card border-2 border-primary/50 hover:border-primary transition-all cursor-pointer group"
            onClick={() => navigate("/quotations/sales")}
            data-testid="sales-quotations-btn"
          >
            <FileText className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
              {t("salesQuotations")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("createManageProductSales")}
            </p>
            <div className="mt-4 text-sm font-mono text-primary">
              {stats?.sales ?? 0} {t("quotations").toLowerCase()}
            </div>
          </Card>

          <Card
            className="p-8 bg-card border-2 border-accent/50 hover:border-accent transition-all cursor-pointer group"
            onClick={() => navigate("/quotations/service")}
            data-testid="service-quotations-btn"
          >
            <Wrench className="h-12 w-12 text-accent mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
              {t("serviceQuotations")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("createManageService")}
            </p>
            <div className="mt-4 text-sm font-mono text-accent">
              {stats?.service ?? 0} {t("quotations").toLowerCase()}
            </div>
          </Card>
        </div>

        {/* Secondary Actions - 5 buttons */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Button
            variant="outline"
            className="h-20 justify-start gap-3 border-border/40 hover:border-primary/50"
            onClick={() => navigate("/customers")}
            data-testid="customers-btn"
          >
            <Users className="h-5 w-5 text-primary" />
            <div className="text-left">
              <div className="font-semibold text-sm">{t("customers")}</div>
              <div className="text-xs text-muted-foreground">
                {t("manageCustomerDatabase")}
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-20 justify-start gap-3 border-border/40 hover:border-primary/50"
            onClick={() => navigate("/products")}
            data-testid="products-btn"
          >
            <Package className="h-5 w-5 text-primary" />
            <div className="text-left">
              <div className="font-semibold text-sm">{t("products")}</div>
              <div className="text-xs text-muted-foreground">
                {t("manageProductCatalog")}
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-20 justify-start gap-3 border-border/40 hover:border-primary/50"
            onClick={() => navigate("/representatives")}
          >
            <Users className="h-5 w-5 text-accent" />
            <div className="text-left">
              <div className="font-semibold text-sm">{t("demartRepresentatives")}</div>
              <div className="text-xs text-muted-foreground">
                {t("manageRepresentatives")}
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-20 justify-start gap-3 border-border/40 hover:border-primary/50"
            onClick={() => navigate("/cost-reports")}
            data-testid="reports-btn"
          >
            <BarChart3 className="h-5 w-5 text-primary" />
            <div className="text-left">
              <div className="font-semibold text-sm">{t("costReports")}</div>
              <div className="text-xs text-muted-foreground">
                {t("viewCostAnalysis")}
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-20 justify-start gap-3 border-border/40 hover:border-purple-500/50"
            onClick={() => navigate("/real-costs")}
            data-testid="real-costs-btn"
          >
            <Wallet className="h-5 w-5 text-purple-500" />
            <div className="text-left">
              <div className="font-semibold text-sm">Gerçek Maliyetler</div>
              <div className="text-xs text-muted-foreground">
                Banka harcama analizi
              </div>
            </div>
          </Button>
        </div>

        {/* Large Cards - Depo & Envanter & Servis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all group border-2 border-green-400 hover:border-green-500"
            onClick={() => navigate("/warehouse")}
            data-testid="warehouse-btn"
          >
            <Warehouse className="h-10 w-10 text-green-500 mb-3 group-hover:scale-110 transition-transform" />
            <h2 className="text-xl font-heading font-bold mb-2">
              Depo / Stok Yönetimi
            </h2>
            <p className="text-sm text-muted-foreground">
              Çoklu depo, raf adresleme ve stok takibi
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all group border-2 border-orange-700 hover:border-orange-800"
            onClick={() => navigate("/inventory")}
            data-testid="inventory-btn"
          >
            <Boxes className="h-10 w-10 text-orange-700 mb-3 group-hover:scale-110 transition-transform" />
            <h2 className="text-xl font-heading font-bold mb-2">
              Envanter Yönetimi
            </h2>
            <p className="text-sm text-muted-foreground">
              Ofis, atölye, el aletleri ve araç envanteri
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all group border-2 border-cyan-600 hover:border-cyan-700"
            onClick={() => window.open("http://localhost:3000", "_blank")}
            data-testid="servis-btn"
          >
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="h-10 w-10 text-cyan-600 group-hover:scale-110 transition-transform" />
              <ExternalLink className="h-4 w-4 text-cyan-500" />
            </div>
            <h2 className="text-xl font-heading font-bold mb-2">
              Servis Yönetimi
            </h2>
            <p className="text-sm text-muted-foreground">
              Servis raporları ve müşteri takibi
            </p>
          </Card>
        </div>

        {/* Dashboard - Bu Ay Özeti (En Alta) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          
          {/* Bu Ay Teklifler */}
          <Card className="p-5 border-l-4 border-l-blue-500">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Bu Ay Teklifler
            </h3>
            {monthlyStats ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-3xl font-bold text-blue-600">{monthlyStats.total}</div>
                  <div className="text-xs text-muted-foreground">Toplam</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-3 w-3 text-yellow-500" />
                    <span>{monthlyStats.pending} Beklemede</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>{monthlyStats.accepted} Onaylandı</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <XCircle className="h-3 w-3 text-red-500" />
                    <span>{monthlyStats.rejected} Reddedildi</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">Yükleniyor...</div>
            )}
          </Card>

          {/* Son 5 Teklif */}
          <Card className="p-5 border-l-4 border-l-green-500">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Son 5 Teklif
            </h3>
            {recentQuotations.length > 0 ? (
              <div className="space-y-2">
                {recentQuotations.map((q) => (
                  <div 
                    key={q.id} 
                    className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/50 p-1 rounded"
                    onClick={() => navigate(`/quotations/${q.quotation_type}/preview/${q.id}`)}
                  >
                    <span className="font-mono text-xs">{q.quote_no}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      q.offer_status === 'accepted' ? 'bg-green-100 text-green-700' :
                      q.offer_status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {q.offer_status === 'accepted' ? '✓' : q.offer_status === 'rejected' ? '✗' : '⏳'}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(q.created_at)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">Henüz teklif yok</div>
            )}
          </Card>

          {/* Gerçek Maliyetler Özeti */}
          <Card className="p-5 border-l-4 border-l-purple-500">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Aylık Gelir/Gider
            </h3>
            {!realCostsUnlocked ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Şifre gerekli
                </p>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Şifre"
                    className="h-8 text-sm"
                    value={realCostsPassword}
                    onChange={(e) => setRealCostsPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && unlockRealCosts()}
                  />
                  <Button size="sm" variant="outline" onClick={unlockRealCosts}>
                    Göster
                  </Button>
                </div>
              </div>
            ) : realCostsData ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-red-500" /> Gider
                  </span>
                  <span className="font-semibold text-red-500">
                    {formatCurrency(realCostsData.expense)} ₺
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" /> Gelir
                  </span>
                  <span className="font-semibold text-green-500">
                    {formatCurrency(realCostsData.income)} ₺
                  </span>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-sm font-medium">Net</span>
                  <span className={`font-bold ${realCostsData.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(realCostsData.net)} ₺
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Veri yok - Excel yükleyin</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;
