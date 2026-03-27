import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ComboboxSelect from "@/components/ComboboxSelect";
import { toast } from "@/hooks/use-toast";
import { Leaf, Shield, Users, ArrowLeft, Trash2, Plus, X, Upload, Image as ImageIcon, Link, MessageSquare, Send } from "lucide-react";

interface UserProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: "admin" | "user";
}

interface Plant {
  id: string;
  name: string;
  latin: string | null;
  description: string | null;
  care_instructions: string | null;
  light_requirements: string | null;
  watering_frequency: string | null;
  image_url: string | null;
  category: string | null;
  plant_type: string | null;
  soil_type: string | null;
  created_at: string;
}

interface FeedbackItem {
  id: string;
  user_id: string;
  type: string;
  subject: string;
  message: string;
  admin_reply: string | null;
  replied_at: string | null;
  status: string;
  created_at: string;
}

const defaultPlantForm = {
  name: "",
  latin: "",
  description: "",
  care_instructions: "",
  light_requirements: "",
  watering_frequency: "",
  image_url: "",
  category: "",
  plant_type: "",
  soil_type: "",
};

const CATEGORIES = ["Tropical", "Succulent", "Fern", "Orchid", "Herb", "Cactus", "Vine", "Tree", "Shrub", "Aquatic"];
const PLANT_TYPES = ["Indoor", "Outdoor", "Both"];
const WATERING_OPTIONS = ["Daily", "Every 2–3 days", "Weekly", "Bi-weekly", "Monthly", "When soil is dry"];
const SUNLIGHT_OPTIONS = ["Full Sun", "Partial Sun", "Bright Indirect", "Low Light", "Shade"];
const SOIL_TYPES = ["Well-draining", "Sandy", "Clay", "Loamy", "Peat", "Cactus mix", "Orchid bark", "Potting mix"];

const Admin = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"users" | "plants" | "feedback">("users");
  const [showAddPlant, setShowAddPlant] = useState(false);
  const [plantForm, setPlantForm] = useState(defaultPlantForm);
  const [addingPlant, setAddingPlant] = useState(false);
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  // Realtime subscription for feedback
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("admin-feedback")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feedback" },
        () => {
          // Re-fetch feedback on any change
          supabase
            .from("feedback")
            .select("*")
            .order("created_at", { ascending: false })
            .then(({ data }) => {
              if (data) setFeedbacks(data as FeedbackItem[]);
            });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, rolesRes, plantsRes, feedbackRes] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, avatar_url, created_at"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("plants").select("*").order("name"),
      supabase.from("feedback").select("*").order("created_at", { ascending: false }),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data);
    if (rolesRes.data) setRoles(rolesRes.data as UserRole[]);
    if (plantsRes.data) setPlants(plantsRes.data as Plant[]);
    if (feedbackRes.data) setFeedbacks(feedbackRes.data as FeedbackItem[]);
    setLoading(false);
  };

  const toggleRole = async (userId: string, currentRole: "admin" | "user") => {
    if (userId === user?.id) {
      toast({ title: "Cannot change own role", variant: "destructive" });
      return;
    }
    const newRole = currentRole === "admin" ? "user" : "admin";
    const { error } = await supabase.from("user_roles").update({ role: newRole }).eq("user_id", userId);
    if (error) {
      toast({ title: "Failed to update role", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Role updated to ${newRole}` });
      fetchData();
    }
  };

  const deleteUser = async (userId: string) => {
    if (userId === user?.id) {
      toast({ title: "Cannot delete yourself", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
    if (error) {
      toast({ title: "Failed to delete user", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "User removed" });
      fetchData();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed.", variant: "destructive" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    const ext = imageFile.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("plant-images").upload(fileName, imageFile);
    if (error) {
      toast({ title: "Image upload failed", description: error.message, variant: "destructive" });
      return null;
    }
    const { data } = supabase.storage.from("plant-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const addPlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantForm.name.trim()) return;
    setAddingPlant(true);

    let finalImageUrl: string | null = null;
    if (imageMode === "upload" && imageFile) {
      finalImageUrl = await uploadImage();
      if (!finalImageUrl) { setAddingPlant(false); return; }
    } else if (imageMode === "url" && plantForm.image_url.trim()) {
      finalImageUrl = plantForm.image_url.trim();
    }

    const { error } = await supabase.from("plants").insert({
      name: plantForm.name.trim(),
      latin: plantForm.latin.trim() || null,
      description: plantForm.description.trim() || null,
      care_instructions: plantForm.care_instructions.trim() || null,
      light_requirements: plantForm.light_requirements || null,
      watering_frequency: plantForm.watering_frequency || null,
      image_url: finalImageUrl,
      category: plantForm.category || null,
      plant_type: plantForm.plant_type || null,
      soil_type: plantForm.soil_type || null,
      created_by: user?.id,
    });

    if (error) {
      toast({ title: "Failed to add plant", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Plant added! 🌿" });
      setPlantForm(defaultPlantForm);
      setImageFile(null);
      setImagePreview(null);
      setShowAddPlant(false);
      fetchData();
    }
    setAddingPlant(false);
  };

  const deletePlant = async (plantId: string) => {
    const { error } = await supabase.from("plants").delete().eq("id", plantId);
    if (error) {
      toast({ title: "Failed to delete plant", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Plant deleted" });
      setPlants((prev) => prev.filter((p) => p.id !== plantId));
    }
  };

  const replyToFeedback = async (feedbackId: string) => {
    if (!replyText.trim()) return;
    const { error } = await supabase
      .from("feedback")
      .update({
        admin_reply: replyText.trim(),
        replied_at: new Date().toISOString(),
        replied_by: user?.id,
        status: "replied",
      })
      .eq("id", feedbackId);
    if (error) {
      toast({ title: "Failed to reply", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reply sent ✉️" });
      setReplyingTo(null);
      setReplyText("");
      fetchData();
    }
  };

  const getUserName = (userId: string) => {
    const p = profiles.find((pr) => pr.user_id === userId);
    return p?.display_name || "Unknown User";
  };

  const resetForm = () => {
    setPlantForm(defaultPlantForm);
    setImageFile(null);
    setImagePreview(null);
    setImageMode("upload");
    setShowAddPlant(false);
  };

  const getUserRole = (userId: string) => roles.find((r) => r.user_id === userId)?.role ?? "user";

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-body">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-background/60 backdrop-blur-md">
        <div className="container px-6 md:px-12 lg:px-20 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-primary" />
            <span className="font-display text-lg font-semibold tracking-wide">VELVET</span>
            <Badge variant="outline" className="ml-2 text-primary border-primary/30">
              <Shield className="w-3 h-3 mr-1" /> Admin
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="font-body text-xs tracking-widest uppercase">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button variant="outline" size="sm" onClick={signOut} className="font-body text-xs tracking-widest uppercase">
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="container px-6 md:px-12 lg:px-20 py-12">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-3xl font-semibold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground font-body">Manage users, roles, and plants</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle className="font-display text-lg">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-semibold">{profiles.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle className="font-display text-lg">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-semibold">{roles.filter((r) => r.role === "admin").length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Leaf className="w-5 h-5 text-primary" />
              <CardTitle className="font-display text-lg">Plants</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-semibold">{plants.length}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={tab === "users" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("users")}
            className="font-body text-xs tracking-widest uppercase"
          >
            <Users className="w-3 h-3 mr-2" /> Users
          </Button>
          <Button
            variant={tab === "plants" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("plants")}
            className="font-body text-xs tracking-widest uppercase"
          >
            <Leaf className="w-3 h-3 mr-2" /> Plants
          </Button>
          <Button
            variant={tab === "feedback" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("feedback")}
            className="font-body text-xs tracking-widest uppercase"
          >
            <MessageSquare className="w-3 h-3 mr-2" /> Feedback
            {feedbacks.filter(f => f.status === "open").length > 0 && (
              <span className="ml-1 bg-destructive text-destructive-foreground text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                {feedbacks.filter(f => f.status === "open").length}
              </span>
            )}
          </Button>
        </div>

        {/* Users Tab */}
        {tab === "users" && (
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="font-display text-xl">User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body">Name</TableHead>
                    <TableHead className="font-body">Role</TableHead>
                    <TableHead className="font-body">Joined</TableHead>
                    <TableHead className="font-body text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => {
                    const role = getUserRole(profile.user_id);
                    const isSelf = profile.user_id === user?.id;
                    return (
                      <TableRow key={profile.user_id}>
                        <TableCell className="font-body font-medium">
                          {profile.display_name || "Unnamed"}
                          {isSelf && <span className="text-muted-foreground text-xs ml-2">(you)</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={role === "admin" ? "default" : "secondary"} className="font-body text-xs">
                            {role}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-body text-muted-foreground">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleRole(profile.user_id, role)}
                            disabled={isSelf}
                            className="font-body text-xs"
                          >
                            {role === "admin" ? "Demote" : "Promote"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteUser(profile.user_id)}
                            disabled={isSelf}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Plants Tab */}
        {tab === "plants" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-muted-foreground font-body text-sm">{plants.length} plants in catalogue</p>
              <Button
                size="sm"
                onClick={() => showAddPlant ? resetForm() : setShowAddPlant(true)}
                className="font-body text-xs tracking-widest uppercase"
              >
                {showAddPlant ? <><X className="w-3 h-3 mr-1" /> Cancel</> : <><Plus className="w-3 h-3 mr-1" /> Add Plant</>}
              </Button>
            </div>

            {showAddPlant && (
              <Card className="border-primary/30 bg-card/80">
                <CardHeader>
       background/60 backdrop-blur-xl    <CardTitle className="font-display text-lg">Add New Plant</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={addPlant} className="space-y-6">

                    {/* Plant Name */}
                    <div className="space-y-2">
                      <Label className="font-body text-xs tracking-widest uppercase text-muted-foreground">Plant Name *</Label>
                      <Input
                        value={plantForm.name}
                        onChange={(e) => setPlantForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Monstera"
                        required
                      />
                    </div>

                    {/* Plant Image */}
                    <div className="space-y-3">
                      <Label className="font-body text-xs tracking-widest uppercase text-muted-foreground">Plant Image</Label>

                      {imageMode === "upload" ? (
                        <div className="space-y-3">
                          {/* Drop zone */}
                          <div
                            className="relative border-2 border-dashed border-border hover:border-primary/50 rounded-lg transition-colors cursor-pointer bg-muted/30"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                            {imagePreview ? (
                              <div className="relative">
                                <img
                                  src={imagePreview}
                                  alt="Preview"
                                  className="w-full h-48 object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                                  className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-background"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                  <Upload className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div className="text-center">
                                  <p className="font-body text-sm font-medium">Upload plant image</p>
                                  <p className="font-body text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                                </div>
                                <Button type="button" variant="outline" size="sm" className="font-body text-xs">
                                  Choose File
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Switch to URL */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-muted-foreground text-xs font-body">or</span>
                            <div className="flex-1 h-px bg-border" />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setImageMode("url")}
                            className="font-body text-xs text-muted-foreground hover:text-foreground w-full"
                          >
                            <Link className="w-3 h-3 mr-2" />
                            Enter image URL instead
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={plantForm.image_url}
                              onChange={(e) => setPlantForm((p) => ({ ...p, image_url: e.target.value }))}
                              placeholder="https://example.com/plant.jpg"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => { setImageMode("upload"); setPlantForm(p => ({ ...p, image_url: "" })); }}
                              className="text-muted-foreground hover:text-foreground shrink-0"
                            >
                              <ImageIcon className="w-4 h-4 mr-1" /> Upload
                            </Button>
                          </div>
                          {plantForm.image_url && (
                            <img src={plantForm.image_url} alt="Preview" className="w-full h-40 object-cover rounded-lg mt-2" onError={(e) => (e.currentTarget.style.display = "none")} />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Two-column grid for dropdowns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Category */}
                      <div className="space-y-2">
                        <Label className="font-body text-xs tracking-widest uppercase text-muted-foreground">Category</Label>
                        <ComboboxSelect options={CATEGORIES} value={plantForm.category} onChange={(v) => setPlantForm(p => ({ ...p, category: v }))} placeholder="Select or type to add new" />
                      </div>

                      {/* Type */}
                      <div className="space-y-2">
                        <Label className="font-body text-xs tracking-widest uppercase text-muted-foreground">Type</Label>
                        <ComboboxSelect options={PLANT_TYPES} value={plantForm.plant_type} onChange={(v) => setPlantForm(p => ({ ...p, plant_type: v }))} placeholder="Select or type to add new" />
                      </div>

                      {/* Watering Schedule */}
                      <div className="space-y-2">
                        <Label className="font-body text-xs tracking-widest uppercase text-muted-foreground">Watering Schedule</Label>
                        <ComboboxSelect options={WATERING_OPTIONS} value={plantForm.watering_frequency} onChange={(v) => setPlantForm(p => ({ ...p, watering_frequency: v }))} placeholder="Select or type to add new" />
                      </div>

                      {/* Sunlight Requirement */}
                      <div className="space-y-2">
                        <Label className="font-body text-xs tracking-widest uppercase text-muted-foreground">Sunlight Requirement</Label>
                        <ComboboxSelect options={SUNLIGHT_OPTIONS} value={plantForm.light_requirements} onChange={(v) => setPlantForm(p => ({ ...p, light_requirements: v }))} placeholder="Select or type to add new" />
                      </div>

                      {/* Soil Type */}
                      <div className="space-y-2 md:col-span-2">
                        <Label className="font-body text-xs tracking-widest uppercase text-muted-foreground">Soil Type</Label>
                        <ComboboxSelect options={SOIL_TYPES} value={plantForm.soil_type} onChange={(v) => setPlantForm(p => ({ ...p, soil_type: v }))} placeholder="Select or type to add new" />
                      </div>
                    </div>

                    {/* Latin Name */}
                    <div className="space-y-2">
                      <Label className="font-body text-xs tracking-widest uppercase text-muted-foreground">Latin Name</Label>
                      <Input
                        value={plantForm.latin}
                        onChange={(e) => setPlantForm((p) => ({ ...p, latin: e.target.value }))}
                        placeholder="e.g. Monstera deliciosa"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label className="font-body text-xs tracking-widest uppercase text-muted-foreground">Description <span className="normal-case">(Optional)</span></Label>
                      <Textarea
                        value={plantForm.description}
                        onChange={(e) => setPlantForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Brief description of this plant…"
                        rows={3}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2 border-t border-border/50">
                      <Button type="button" variant="outline" onClick={resetForm} className="font-body text-xs tracking-widest uppercase">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addingPlant} className="font-body text-xs tracking-widest uppercase">
                        {addingPlant ? "Adding…" : "Add Plant"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Plants Table */}
            <Card className="border-border/50 bg-card/80">
              <CardContent className="pt-6">
                {plants.length === 0 ? (
                  <p className="text-center text-muted-foreground font-body py-8">No plants yet. Add your first plant!</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-body">Name</TableHead>
                        <TableHead className="font-body">Category</TableHead>
                        <TableHead className="font-body">Type</TableHead>
                        <TableHead className="font-body">Watering</TableHead>
                        <TableHead className="font-body">Sunlight</TableHead>
                        <TableHead className="font-body text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plants.map((plant) => (
                        <TableRow key={plant.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {plant.image_url ? (
                                <img src={plant.image_url} alt={plant.name} className="w-8 h-8 rounded object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                  <Leaf className="w-4 h-4 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-body font-medium text-sm">{plant.name}</p>
                                {plant.latin && <p className="font-body text-xs text-muted-foreground italic">{plant.latin}</p>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-body text-sm">{plant.category || "—"}</TableCell>
                          <TableCell className="font-body text-sm">{plant.plant_type || "—"}</TableCell>
                          <TableCell className="font-body text-sm">{plant.watering_frequency || "—"}</TableCell>
                          <TableCell className="font-body text-sm">{plant.light_requirements || "—"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deletePlant(plant.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Feedback Tab */}
        {tab === "feedback" && (
          <div className="space-y-4">
            <p className="text-muted-foreground font-body text-sm">
              {feedbacks.length} submissions · {feedbacks.filter(f => f.status === "open").length} awaiting reply
            </p>

            {feedbacks.length === 0 ? (
              <Card className="border-border/50 bg-card/80">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground font-body">No feedback yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((fb) => (
                  <Card key={fb.id} className={`border-border/50 bg-card/80 ${fb.status === "open" ? "border-l-2 border-l-primary" : ""}`}>
                    <CardContent className="pt-5 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-body capitalize">{fb.type}</Badge>
                          <Badge className={`text-xs font-body ${fb.status === "open" ? "bg-primary/20 text-primary" : fb.status === "replied" ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"}`}>
                            {fb.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground font-body">
                          {getUserName(fb.user_id)} · {new Date(fb.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="font-display font-semibold">{fb.subject}</h3>
                      <p className="font-body text-sm text-muted-foreground whitespace-pre-wrap">{fb.message}</p>

                      {fb.admin_reply && (
                        <div className="p-3 rounded-md bg-primary/5 border border-primary/20">
                          <p className="text-xs text-primary font-body font-medium mb-1">Your Reply</p>
                          <p className="font-body text-sm whitespace-pre-wrap">{fb.admin_reply}</p>
                        </div>
                      )}

                      {replyingTo === fb.id ? (
                        <div className="space-y-2 pt-2 border-t border-border/50">
                          <Textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type your reply..."
                            rows={3}
                            maxLength={2000}
                            className="bg-background/60"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => { setReplyingTo(null); setReplyText(""); }} className="font-body text-xs">
                              Cancel
                            </Button>
                            <Button size="sm" onClick={() => replyToFeedback(fb.id)} disabled={!replyText.trim()} className="font-body text-xs">
                              <Send className="w-3 h-3 mr-1" /> Send Reply
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setReplyingTo(fb.id); setReplyText(fb.admin_reply || ""); }}
                            className="font-body text-xs"
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            {fb.admin_reply ? "Edit Reply" : "Reply"}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
