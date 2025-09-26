import { useState, useEffect } from "react";
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
import { Trash2, Music, Camera, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Artist() {
  const [artists, setArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const fetchArtists = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      if (!supabase) {
        throw new Error("Supabase client is not initialized. Check supabase.js configuration.");
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      console.log("Current user:", userData?.user ? userData.user.id : "No authenticated user");
      if (userError) {
        console.error("User fetch error:", userError);
        throw new Error(`Failed to fetch user: ${userError.message}`);
      }

      // Using lowercase column names
      const { data, error } = await supabase
        .from("artist")
        .select("id, created_at, artist, followers, monthlylisteners, sociallink, artistid, imagelink")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase query error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw new Error(`Failed to fetch artists: ${error.message} (Code: ${error.code})`);
      }

      console.log("Artists fetched:", data);
      
      // Map the lowercase column names to camelCase
      const mappedData = data?.map(artist => ({
        id: artist.id,
        created_at: artist.created_at,
        artist: artist.artist,
        followers: artist.followers,
        monthlyListeners: artist.monthlylisteners,
        socialLink: artist.sociallink,
        artistID: artist.artistid,
        imageLink: artist.imagelink
      })) || [];
      
      setArtists(mappedData);
      if (mappedData.length === 0) {
        toast.info("No artists found in the database. Try finding artists first or check RLS permissions.");
      }
    } catch (error) {
      console.error("Error fetching artists:", error.message);
      setFetchError(error.message);
      toast.error(`Failed to fetch artists: ${error.message}. Check console for details.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArtists();
  }, []);

  const handleDelete = async (artistId, artistName) => {
    try {
      const { error } = await supabase
        .from("artist")
        .delete()
        .eq("id", artistId);

      if (error) {
        console.error("Delete error:", error);
        throw new Error(`Failed to delete artist: ${error.message}`);
      }

      setArtists(artists.filter((artist) => artist.id !== artistId));
      toast.success(`Artist "${artistName}" deleted successfully!`);
    } catch (error) {
      console.error("Delete error:", error.message);
      toast.error(`Failed to delete artist: ${error.message}`);
    }
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
                <BreadcrumbPage>Artists</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-6 bg-background text-foreground">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Artists</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchArtists}
            className="rounded-apple border-accent text-accent hover:bg-accent hover:text-accent-foreground flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        <div className="space-y-6">
          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading artists...</p>
          ) : fetchError ? (
            <p className="text-center text-destructive">
              Error loading artists: {fetchError}. Check console for details.
            </p>
          ) : artists.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {artists.map((artist) => (
                <Card
                  key={artist.id}
                  className="rounded-apple shadow-apple bg-card border-none overflow-hidden transition-all duration-300 hover:shadow-[0_8px_24px_rgba(20,208,97,0.2)] hover:-translate-y-1"
                >
                  <div className="relative">
                    <img
                      src={artist.imageLink || "https://placehold.co/150x150?text=Artist"}
                      alt="Artist image"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <CardBody className="p-4 space-y-2">
                    <Typography variant="h6" className="text-foreground font-semibold truncate">
                      {artist.artist || "Unknown Artist"}
                    </Typography>
                    <div className="space-y-1">
                      <Typography variant="small" className="text-muted-foreground flex items-center gap-1">
                        <span className="font-medium text-foreground">Followers:</span>
                        <span>{artist.followers ? Number(artist.followers).toLocaleString() : "0"}</span>
                      </Typography>
                      <Typography variant="small" className="text-muted-foreground flex items-center gap-1">
                        <span className="font-medium text-foreground">Monthly Listeners:</span>
                        <span>{artist.monthlyListeners ? Number(artist.monthlyListeners).toLocaleString() : "0"}</span>
                      </Typography>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="rounded-apple border-accent text-accent hover:bg-accent hover:text-accent-foreground flex items-center gap-1"
                      >
                        <a href={`https://open.spotify.com/artist/${artist.artistID}`} target="_blank" rel="noopener noreferrer">
                          <Music className="h-4 w-4" />
                          Spotify
                        </a>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="rounded-apple border-accent text-accent hover:bg-accent hover:text-accent-foreground flex items-center gap-1"
                      >
                        <a href={artist.socialLink || "#"} target="_blank" rel="noopener noreferrer">
                          <Camera className="h-4 w-4" />
                          Instagram
                        </a>
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
                              Are you sure you want to delete the artist "{artist.artist || "Unknown Artist"}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-apple">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="rounded-apple bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(artist.id, artist.artist)}
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
            <p className="text-center text-muted-foreground">No artists available. Try finding artists first or check RLS permissions.</p>
          )}
        </div>
      </div>
    </SidebarInset>
  );
}