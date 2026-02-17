import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Leaf, Shield, Users, ArrowLeft, Trash2 } from "lucide-react";

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

const Admin = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, avatar_url, created_at"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data);
    if (rolesRes.data) setRoles(rolesRes.data as UserRole[]);
    setLoading(false);
  };

  const toggleRole = async (userId: string, currentRole: "admin" | "user") => {
    if (userId === user?.id) {
      toast({ title: "Cannot change own role", variant: "destructive" });
      return;
    }
    const newRole = currentRole === "admin" ? "user" : "admin";

    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole })
      .eq("user_id", userId);

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
    // Note: Deleting from auth.users requires a backend function.
    // For now we remove profile and role entries.
    const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
    if (error) {
      toast({ title: "Failed to delete user", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "User removed" });
      fetchData();
    }
  };

  const getUserRole = (userId: string) => {
    return roles.find((r) => r.user_id === userId)?.role ?? "user";
  };

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
          <p className="text-muted-foreground font-body">Manage users and roles</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="flex flex-row items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle className="font-display text-lg">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-semibold">{profiles.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="flex flex-row items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle className="font-display text-lg">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-semibold">
                {roles.filter((r) => r.role === "admin").length}
              </p>
            </CardContent>
          </Card>
        </div>

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
                        <Badge
                          variant={role === "admin" ? "default" : "secondary"}
                          className="font-body text-xs"
                        >
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
      </main>
    </div>
  );
};

export default Admin;
