import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Leaf, Shield, Users, ArrowLeft, Trash2, Plus, X } from "lucide-react";

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
};

const Admin = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"users" | "plants">("users");
  const [showAddPlant, setShowAddPlant] = useState(false);
  const [plantForm, setPlantForm] = useState(defaultPlantForm);
  const [addingPlant, setAddingPlant] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, rolesRes, plantsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, avatar_url, created_at"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("plants").select("*").order("name"),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data);
    if (rolesRes.data) setRoles(rolesRes.data as UserRole[]);
    if (plantsRes.data) setPlants(plantsRes.data);
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

  const addPlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantForm.name.trim()) return;
    setAddingPlant(true);
    const { error } = await supabase.from("plants").insert({
      name: plantForm.name.trim(),
      latin: plantForm.latin.trim() || null,
      description: plantForm.description.trim() || null,
      care_instructions: plantForm.care_instructions.trim() || null,
      light_requirements: plantForm.light_requirements.trim() || null,
      watering_frequency: plantForm.watering_frequency.trim() || null,
      image_url: plantForm.image_url.trim() || null,
      created_by: user?.id,
    });
    if (error) {
      toast({ title: "Failed to add plant", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Plant added! 🌿" });
      setPlantForm(defaultPlantForm);
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
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground font-body">Manage users, roles, and plants</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
        </div>

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
                onClick={() => setShowAddPlant(!showAddPlant)}
                className="font-body text-xs tracking-widest uppercase"
              >
                {showAddPlant ? <><X className="w-3 h-3 mr-1" /> Cancel</> : <><Plus className="w-3 h-3 mr-1" /> Add Plant</>}
              </Button>
            </div>

            {showAddPlant && (
              <Card className="border-primary/30 bg-card/80">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Add New Plant</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={addPlant} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-body text-xs">Plant Name *</Label>
                      <Input value={plantForm.name} onChange={(e) => setPlantForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Monstera" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-body text-xs">Latin Name</Label>
                      <Input value={plantForm.latin} onChange={(e) => setPlantForm((p) => ({ ...p, latin: e.target.value }))} placeholder="e.g. Monstera deliciosa" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-body text-xs">Light Requirements</Label>
                      <Input value={plantForm.light_requirements} onChange={(e) => setPlantForm((p) => ({ ...p, light_requirements: e.target.value }))} placeholder="e.g. Bright indirect light" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-body text-xs">Watering Frequency</Label>
                      <Input value={plantForm.watering_frequency} onChange={(e) => setPlantForm((p) => ({ ...p, watering_frequency: e.target.value }))} placeholder="e.g. Water weekly" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="font-body text-xs">Image URL</Label>
                      <Input value={plantForm.image_url} onChange={(e) => setPlantForm((p) => ({ ...p, image_url: e.target.value }))} placeholder="https://..." />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="font-body text-xs">Description</Label>
                      <Textarea value={plantForm.description} onChange={(e) => setPlantForm((p) => ({ ...p, description: e.target.value }))} placeholder="Brief description…" rows={2} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="font-body text-xs">Care Instructions</Label>
                      <Textarea value={plantForm.care_instructions} onChange={(e) => setPlantForm((p) => ({ ...p, care_instructions: e.target.value }))} placeholder="Care tips…" rows={2} />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <Button type="submit" disabled={addingPlant} className="font-body text-xs tracking-widest uppercase">
                        {addingPlant ? "Adding…" : "Add Plant"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card className="border-border/50 bg-card/80">
              <CardContent className="pt-6">
                {plants.length === 0 ? (
                  <p className="text-center text-muted-foreground font-body py-8">No plants yet. Add your first plant!</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-body">Name</TableHead>
                        <TableHead className="font-body">Latin</TableHead>
                        <TableHead className="font-body">Light</TableHead>
                        <TableHead className="font-body">Watering</TableHead>
                        <TableHead className="font-body text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plants.map((plant) => (
                        <TableRow key={plant.id}>
                          <TableCell className="font-body font-medium">{plant.name}</TableCell>
                          <TableCell className="font-body text-muted-foreground italic text-sm">{plant.latin || "—"}</TableCell>
                          <TableCell className="font-body text-sm">{plant.light_requirements || "—"}</TableCell>
                          <TableCell className="font-body text-sm">{plant.watering_frequency || "—"}</TableCell>
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
      </main>
    </div>
  );
};

export default Admin;
