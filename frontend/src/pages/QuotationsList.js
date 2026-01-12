import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Plus,
  Eye,
  Edit,
  Copy,
  FileText,
  Search,
  Archive,
  CheckCircle,
  XCircle,
  Clock,
  GitBranch,
  History,
  RefreshCw,
  Truck,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QuotationsList = () => {
  const navigate = useNavigate();
  const { type } = useParams(); // 'sales' or 'service'

  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");

  // ✅ NEW: show archived only toggle
  const [showArchivedOnly, setShowArchivedOnly] = useState(false);

  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [selectedQuotationRevisions, setSelectedQuotationRevisions] = useState([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  // ✅ Status Update Dialog (List Page)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null); // quotation object
  const [statusForm, setStatusForm] = useState({
    offer_status: "pending",
    rejection_reason: "",
    invoice_number: "",
  });

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchQuotations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, statusFilter, customerFilter, showArchivedOnly]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers?is_active=true`);
      setCustomers(response.data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const buildQuotationsUrl = () => {
    // ✅ IMPORTANT: backend must support is_archived query filter
    let url = `${API}/quotations?quotation_type=${type}&is_archived=${showArchivedOnly ? "true" : "false"}`;

    if (statusFilter !== "all") url += `&offer_status=${statusFilter}`;
    if (customerFilter !== "all") url += `&customer_id=${customerFilter}`;

    return url;
  };

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const url = buildQuotationsUrl();
      const response = await axios.get(url);
      setQuotations(response.data || []);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      toast.error("Failed to load quotations");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) {
      fetchQuotations();
      return;
    }

    try {
      const response = await axios.get(
        `${API}/search?q=${encodeURIComponent(searchQuery)}&quotation_type=${type}&is_archived=${showArchivedOnly ? "true" : "false"}`
      );
      setQuotations(response.data || []);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed");
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await axios.post(`${API}/quotations/${id}/duplicate`);
      toast.success("Quotation duplicated");
      fetchQuotations();
    } catch (error) {
      console.error("Duplicate error:", error);
      toast.error("Failed to duplicate");
    }
  };

  const handleArchive = async (id, currentStatus) => {
    // currentStatus = quot.is_archived
    const willArchive = !currentStatus;

    const confirmText = willArchive
      ? "Bu teklifi ARŞİVLEMEK üzeresiniz.\n\nArşivlenen teklifler listeden gizlenir.\n\nEmin misiniz?"
      : "Bu teklifi ARŞİVDEN ÇIKARMAK üzeresiniz.\n\nEmin misiniz?";

    const ok = window.confirm(confirmText);
    if (!ok) return;

    try {
      await axios.put(`${API}/quotations/${id}`, { is_archived: willArchive });
      toast.success(willArchive ? "Archived" : "Unarchived");
      fetchQuotations();
    } catch (error) {
      console.error("Archive error:", error);
      toast.error("Failed to archive");
    }
  };

  const handleNewRevision = async (id) => {
    try {
      const response = await axios.post(`${API}/quotations/${id}/revise`);
      toast.success("Yeni revizyon oluşturuldu!");
      navigate(`/quotations/${type}/edit/${response.data.id}`);
    } catch (error) {
      console.error("Revision error:", error);
      toast.error("Revizyon oluşturulamadı");
    }
  };

  const handleViewRevisions = async (id) => {
    setLoadingRevisions(true);
    setRevisionDialogOpen(true);
    try {
      const response = await axios.get(`${API}/quotations/${id}/revisions`);
      setSelectedQuotationRevisions(response.data || []);
    } catch (error) {
      console.error("Error fetching revisions:", error);
      toast.error("Revizyonlar yüklenemedi");
      setSelectedQuotationRevisions([]);
    } finally {
      setLoadingRevisions(false);
    }
  };

  const openStatusDialog = (quot) => {
    setStatusTarget(quot);
    setStatusForm({
      offer_status: quot.offer_status || "pending",
      rejection_reason: quot.rejection_reason || "",
      invoice_number: quot.invoice_number || "",
    });
    setStatusDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!statusTarget?.id) return;

    try {
      await axios.patch(`${API}/quotations/${statusTarget.id}/status`, {
        offer_status: statusForm.offer_status,
        rejection_reason:
          statusForm.offer_status === "rejected" ? (statusForm.rejection_reason || null) : null,
        invoice_number:
          statusForm.offer_status === "accepted" ? (statusForm.invoice_number || null) : null,
      });

      toast.success("Status updated");
      setStatusDialogOpen(false);
      setStatusTarget(null);
      fetchQuotations();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  // Teslimat işlemi - stoktan düşer
  const handleDelivery = async (quotationId) => {
    if (!window.confirm("Teklif teslim edildi olarak işaretlenecek ve stoktan düşülecek. Onaylıyor musunuz?")) {
      return;
    }

    try {
      await axios.post(`${API}/quotations/${quotationId}/deliver`);
      toast.success("Teslimat tamamlandı! Stoktan düşüldü.");
      fetchQuotations();
    } catch (error) {
      console.error("Error marking delivery:", error);
      const msg = error.response?.data?.detail || "Teslimat işlemi başarısız";
      toast.error(msg);
    }
  };

  // Teslimatı geri al - stokları geri yükle
  const handleRevertDelivery = async (quotationId) => {
    if (!window.confirm("Teslimat geri alınacak ve ürünler stoğa geri eklenecek. Onaylıyor musunuz?")) {
      return;
    }

    try {
      await axios.post(`${API}/quotations/${quotationId}/revert-delivery`);
      toast.success("Teslimat geri alındı! Stoklar yeniden eklendi.");
      fetchQuotations();
    } catch (error) {
      console.error("Error reverting delivery:", error);
      const msg = error.response?.data?.detail || "Teslimat geri alma işlemi başarısız";
      toast.error(msg);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: {
        bg: "bg-yellow-500/20",
        text: "text-yellow-400",
        border: "border-yellow-500/30",
        icon: Clock,
      },
      accepted: {
        bg: "bg-green-500/20",
        text: "text-green-400",
        border: "border-green-500/30",
        icon: CheckCircle,
      },
      rejected: {
        bg: "bg-red-500/20",
        text: "text-red-400",
        border: "border-red-500/30",
        icon: XCircle,
      },
    };

    const style = styles[status] || styles.pending;
    const Icon = style.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}
      >
        <Icon className="h-3 w-3" />
        {String(status || "pending").charAt(0).toUpperCase() + String(status || "pending").slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-GB");
    } catch {
      return "-";
    }
  };

  const formatTotals = (totals) => {
    if (!totals || !totals.totals) return "-";
    const totalObj = totals.totals;
    return Object.keys(totalObj)
      .map((currency) => `${Number(totalObj[currency] || 0).toFixed(2)} ${currency}`)
      .join(" + ");
  };

  // ✅ IMPORTANT:
  // We DO NOT filter archive on frontend anymore, because we fetch only archived or only non-archived from backend.
  const displayQuotations = quotations;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-heading font-bold">
                  {type === "sales" ? "Sales" : "Service"} Quotations
                </h1>
                <p className="text-xs text-muted-foreground">
                  {displayQuotations.length} quotations
                  {showArchivedOnly ? " (archived)" : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* ✅ Show Archived Toggle Button */}
              <Button
                variant="outline"
                onClick={() => setShowArchivedOnly((v) => !v)}
                title="Arşivlenen teklifleri göster / gizle"
              >
                <Archive className="mr-2 h-4 w-4" />
                {showArchivedOnly ? "Aktifleri Göster" : "Arşivleri Göster"}
              </Button>

              <Button
                className="bg-primary"
                onClick={() => navigate(`/quotations/${type}/create`)}
                data-testid="create-quotation-btn"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Quotation
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Search by quote no, customer, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button variant="outline" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Customer Filter */}
          <select
            className="px-4 py-2 border rounded bg-background min-w-[200px]"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
          >
            <option value="all">Tüm Müşteriler</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="px-4 py-2 border rounded bg-background"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : displayQuotations.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {showArchivedOnly ? "No archived quotations found" : "No quotations found"}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {displayQuotations.map((quot) => {
              // Duruma göre çerçeve rengi
              const borderColor = 
                quot.offer_status === 'accepted' ? 'border-green-500' :
                quot.offer_status === 'rejected' ? 'border-red-500' :
                'border-yellow-500';
              
              return (
              <Card
                key={quot.id}
                className={`p-5 bg-card border-2 ${borderColor} hover:shadow-lg transition-all`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono font-bold text-primary">
                        {quot.quote_no}
                      </span>

                      {getStatusBadge(quot.offer_status)}

                      {quot.invoice_status === "invoiced" && (
                        <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                          Invoiced: {quot.invoice_number}
                        </span>
                      )}

                      {quot.revision_no > 0 && (
                        <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                          Rev {quot.revision_no}
                        </span>
                      )}

                      {quot.is_archived && (
                        <span className="text-xs px-2 py-1 bg-slate-500/20 text-slate-300 rounded">
                          Archived
                        </span>
                      )}

                      {/* Teslimat Durumu - Sadece onaylanan tekliflerde */}
                      {quot.offer_status === 'accepted' && (
                        quot.delivery_status === 'delivered' ? (
                          <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded flex items-center gap-1">
                            ✓ Teslim Edildi
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded flex items-center gap-1">
                            📦 Teslimat Bekleniyor
                          </span>
                        )
                      )}
                    </div>

                    <h3 
                      className="text-lg font-semibold text-foreground mb-1 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/quotations/${type}/preview/${quot.id}`)}
                    >
                      {quot.subject}
                    </h3>

                    <div 
                      className="flex items-center gap-6 text-sm text-muted-foreground mb-2 cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => navigate(`/quotations/${type}/preview/${quot.id}`)}
                    >
                      <span>👤 {quot.customer_name}</span>
                      <span>📅 {formatDate(quot.date)}</span>
                      {quot.project_code && <span>🏷️ {quot.project_code}</span>}
                    </div>

                    <div className="text-lg font-bold text-accent font-mono">
                      {formatTotals(quot.totals_by_currency)}
                    </div>
                  </div>

                  {/* Right action buttons - 2 column grid layout */}
                  <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/quotations/${type}/preview/${quot.id}`)}
                      className="justify-start h-7 px-2"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                      <span className="text-xs">Önizle</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/quotations/${type}/edit/${quot.id}`)}
                      className="justify-start h-7 px-2"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                      <span className="text-xs">Düzenle</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openStatusDialog(quot)}
                      className="justify-start h-7 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                      <span className="text-xs">Durum</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleNewRevision(quot.id)}
                      className="justify-start h-7 px-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                    >
                      <GitBranch className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                      <span className="text-xs">Revizyon</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewRevisions(quot.id)}
                      className="justify-start h-7 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                    >
                      <History className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                      <span className="text-xs">Geçmiş</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(quot.id)}
                      className="justify-start h-7 px-2"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                      <span className="text-xs">Kopyala</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchive(quot.id, !!quot.is_archived)}
                      className={`justify-start h-7 px-2 ${
                        quot.is_archived
                          ? "text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                          : ""
                      }`}
                    >
                      <Archive className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                      <span className="text-xs">{quot.is_archived ? "Geri Al" : "Arşivle"}</span>
                    </Button>

                    {quot.offer_status === 'accepted' && quot.delivery_status !== 'delivered' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelivery(quot.id)}
                        className="justify-start h-7 px-2 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                      >
                        <Truck className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                        <span className="text-xs">Teslim Et</span>
                      </Button>
                    )}

                    {quot.delivery_status === 'delivered' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevertDelivery(quot.id)}
                        className="justify-start h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Undo2 className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                        <span className="text-xs">Geri Al</span>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
            })}
          </div>
        )}
      </div>

      {/* Revision History Dialog */}
      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-400" />
              Revizyon Geçmişi
            </DialogTitle>
          </DialogHeader>

          {loadingRevisions ? (
            <div className="text-center py-8">Revizyonlar yükleniyor...</div>
          ) : selectedQuotationRevisions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Revizyon bulunamadı</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedQuotationRevisions.map((revision, index) => (
                <Card
                  key={revision.id}
                  className={`p-4 ${
                    index === selectedQuotationRevisions.length - 1
                      ? "border-2 border-green-500/50 bg-green-500/5"
                      : "border-border/40"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-mono font-bold text-primary">
                          {revision.quote_no}
                        </span>

                        {index === selectedQuotationRevisions.length - 1 && (
                          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded font-semibold">
                            En Güncel
                          </span>
                        )}

                        {getStatusBadge(revision.offer_status)}

                        {revision.revision_no > 0 && (
                          <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                            Rev {revision.revision_no}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-semibold text-foreground mb-1">
                        {revision.subject}
                      </h3>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>📅 {formatDate(revision.date)}</span>
                        <span>🕘 Oluşturulma: {formatDate(revision.created_at)}</span>
                      </div>

                      <div className="text-base font-bold text-accent font-mono mt-2">
                        {formatTotals(revision.totals_by_currency)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRevisionDialogOpen(false);
                          navigate(`/quotations/${type}/preview/${revision.id}`);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Görüntüle
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRevisionDialogOpen(false);
                          navigate(`/quotations/${type}/edit/${revision.id}`);
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Düzenle
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Status Update</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label>Offer Status</Label>
              <select
                className="w-full p-2 border rounded bg-background"
                value={statusForm.offer_status}
                onChange={(e) => setStatusForm({ ...statusForm, offer_status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {statusForm.offer_status === "rejected" && (
              <div>
                <Label>Rejection Reason</Label>
                <Textarea
                  value={statusForm.rejection_reason}
                  onChange={(e) => setStatusForm({ ...statusForm, rejection_reason: e.target.value })}
                  rows={3}
                />
              </div>
            )}

            {statusForm.offer_status === "accepted" && (
              <div>
                <Label>Invoice Number (optional)</Label>
                <Input
                  value={statusForm.invoice_number}
                  onChange={(e) => setStatusForm({ ...statusForm, invoice_number: e.target.value })}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusDialogOpen(false);
                  setStatusTarget(null);
                }}
              >
                Cancel
              </Button>
              <Button className="bg-primary" onClick={handleStatusUpdate}>
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotationsList;
