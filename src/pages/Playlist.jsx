import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Card as ShadcnCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { Trash2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Playlist() {
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlaylists = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        if (!supabase) {
          throw new Error("Supabase client is not initialized. Check supabase.js configuration.");
        }

        const { data: { user } } = await supabase.auth.getUser();
        console.log("Current user:", user ? user.id : "No authenticated user");

        const { data, error } = await supabase
          .from("playlist")
          .select("id, created_at, playlistid, curator, playlistimage, playlistlink")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase query error:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          throw new Error(`Failed to fetch playlists: ${error.message} (Code: ${error.code})`);
        }

        console.log("Fetched playlists:", data);
        setPlaylists(data || []);
        if (!data || data.length === 0) {
          toast.info("No playlists found in the database. Try scraping playlists first.");
        }
      } catch (error) {
        console.error("Error fetching playlists:", error.message);
        setFetchError(error.message);
        toast.error(`Failed to fetch playlists: ${error.message}. Check console for details.`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  const handleDelete = async (playlistId, playlistName) => {
    try {
      const { error } = await supabase
        .from("playlist")
        .delete()
        .eq("id", playlistId);

      if (error) {
        console.error("Delete error:", error);
        throw new Error(`Failed to delete playlist: ${error.message}`);
      }

      setPlaylists(playlists.filter((playlist) => playlist.id !== playlistId));
      toast.success(`Playlist "${playlistName}" deleted successfully!`);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(`Failed to delete playlist: ${error.message}`);
    }
  };

  const handleScrape = (playlist) => {
    navigate("/find-artist", { state: { selectedPlaylistId: playlist.playlistid } });
  };

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 bg-card shadow-apple">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1 text-foreground hover:text-accent" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Playlists</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-6 bg-background text-foreground">
        <h1 className="text-3xl font-bold text-foreground">Playlists</h1>
        <div className="space-y-6">
          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading playlists...</p>
          ) : fetchError ? (
            <p className="text-center text-destructive">
              Error loading playlists: {fetchError}. Check console for details.
            </p>
          ) : playlists.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {playlists.map((playlist) => (
                <Card
                  key={playlist.id}
                  className="rounded-apple shadow-apple bg-card border-none overflow-hidden transition-all duration-300 hover:shadow-[0_8px_24px_rgba(20,208,97,0.2)] hover:-translate-y-1"
                >
                  <div className="relative">
                    <img
                      src={playlist.playlistimage || "https://placehold.co/150x150?text=Playlist"}
                      alt="Playlist cover"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <CardBody className="p-4 space-y-2">
                    <Typography variant="h6" className="text-foreground font-semibold truncate">
                      <a
                        href={playlist.playlistlink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-accent transition-colors"
                      >
                        {playlist.curator || "Unknown"}
                      </a>
                    </Typography>
                    <div className="space-y-1">
                      <Typography variant="small" className="text-muted-foreground flex items-center gap-1">
                        <span className="font-medium text-foreground">Playlist ID:</span>
                        <span className="truncate">{playlist.playlistid}</span>
                      </Typography>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleScrape(playlist)}
                        className="rounded-apple border-accent text-accent hover:bg-accent hover:text-accent-foreground flex items-center gap-1"
                      >
                        <Search className="h-4 w-4" />
                        Scrape
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-apple border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-apple bg-card">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground">Confirm Deletion</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                              Are you sure you want to delete the playlist "{playlist.curator || playlist.playlistid}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-apple">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="rounded-apple bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(playlist.id, playlist.curator || playlist.playlistid)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No playlists available. Try scraping playlists first.</p>
          )}
        </div>
      </div>
    </SidebarInset>
  );
}