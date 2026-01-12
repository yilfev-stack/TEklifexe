import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Representatives = () => {
  const [representatives, setRepresentatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: ""
  });

  useEffect(() => {
    fetchRepresentatives();
  }, []);

  const fetchRepresentatives = async () => {
    try {
      const response = await axios.get(`${API}/representatives`);
      setRepresentatives(response.data);
    } catch (error) {
      console.error("Error fetching representatives:", error);
      toast.error("Yetkililer yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.put(`${API}/representatives/${currentId}`, formData);
        toast.success("Yetkili güncellendi");
      } else {
        await axios.post(`${API}/representatives`, formData);
        toast.success("Yetkili eklendi");
      }
      setDialogOpen(false);
      resetForm();
      fetchRepresentatives();
    } catch (error) {
      console.error("Error saving representative:", error);
      toast.error("Kayıt başarısız");
    }
  };

  const handleEdit = (rep) => {
    setEditMode(true);
    setCurrentId(rep.id);
    setFormData({
      name: rep.name,
      phone: rep.phone,
      email: rep.email
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu yetkilisi silmek istediğinize emin misiniz?")) return;
    
    try {
      await axios.delete(`${API}/representatives/${id}`);
      toast.success("Yetkili silindi");
      fetchRepresentatives();
    } catch (error) {
      console.error("Error deleting representative:", error);
      toast.error("Silme başarısız");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", phone: "", email: "" });
    setEditMode(false);
    setCurrentId(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  if (loading) return <div className="p-8">Yükleniyor...</div>;

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
          >
            ← Ana Sayfa
          </Button>
          <h1 className="text-3xl font-bold">DEMART Yetkilileri</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Yetkili Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editMode ? "Yetkili Düzenle" : "Yeni Yetkili Ekle"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Ad Soyad *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Telefon *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  placeholder="+90 532 123 4567"
                />
              </div>
              <div>
                <Label>E-posta *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="ad.soyad@demart.com.tr"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  İptal
                </Button>
                <Button type="submit">
                  {editMode ? "Güncelle" : "Ekle"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {representatives.map((rep) => (
          <Card key={rep.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{rep.name}</h3>
                <p className="text-sm text-muted-foreground">{rep.phone}</p>
                <p className="text-sm text-muted-foreground">{rep.email}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(rep)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(rep.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Representatives;
