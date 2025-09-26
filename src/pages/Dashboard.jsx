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
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [playlists, setPlaylists] = useState([]);
  const [isFetchingPlaylists, setIsFetchingPlaylists] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [metrics, setMetrics] = useState({
    totalPlaylists: 0,
    artistsFound: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsFetchingPlaylists(true);
      setFetchError(null);
      try {
        if (!supabase) {
          throw new Error("Supabase client is not initialized. Check supabase.js configuration.");
        }

        const { data: { user } } = await supabase.auth.getUser();
        console.log("Current user:", user ? user.id : "No authenticated user");

        // Fetch recent playlists with lowercase column names
        const { data: playlistData, error: playlistError } = await supabase
          .from("playlist")
          .select("id, playlistid, curator, playlistimage, playlistlink")
          .order("created_at", { ascending: false })
          .limit(6); // Limit to 6 for recent playlists

        if (playlistError) {
          console.error("Supabase query error:", {
            message: playlistError.message,
            details: playlistError.details,
            hint: playlistError.hint,
            code: playlistError.code,
          });
          throw new Error(`Failed to fetch playlists: ${playlistError.message} (Code: ${playlistError.code})`);
        }

        console.log("Fetched playlists:", playlistData);
        setPlaylists(playlistData || []);
        setMetrics((prev) => ({ ...prev, totalPlaylists: playlistData?.length || 0 }));

        if (!playlistData || playlistData.length === 0) {
          toast.info("No playlists found in the database. Try scraping playlists first.");
        }
      } catch (error) {
        console.error("Error fetching data:", error.message);
        setFetchError(error.message);
        toast.error(`Failed to fetch data: ${error.message}. Check console for details.`);
      } finally {
        setIsFetchingPlaylists(false);
      }
    };

    fetchData();
  }, []);

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 bg-card shadow-apple">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1 text-foreground hover:text-accent" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-6 bg-background text-foreground">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <div className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="rounded-apple shadow-apple bg-card border-none overflow-hidden">
              <CardBody className="p-4">
                <Typography variant="small" className="text-muted-foreground">
                  Total Playlists
                </Typography>
                <Typography variant="h4" className="text-foreground font-bold">
                  {metrics.totalPlaylists}
                </Typography>
              </CardBody>
            </Card>
            <Card className="rounded-apple shadow-apple bg-card border-none overflow-hidden">
              <CardBody className="p-4">
                <Typography variant="small" className="text-muted-foreground">
                  Artists Found
                </Typography>
                <Typography variant="h4" className="text-foreground font-bold">
                  {metrics.artistsFound}
                </Typography>
              </CardBody>
            </Card>
          </div>
          {/* Recent Playlists */}
          <ShadcnCard className="bg-card shadow-apple rounded-apple border-none">
            <CardHeader>
              <CardTitle className="text-foreground">Recent Playlists</CardTitle>
            </CardHeader>
            <CardContent>
              {isFetchingPlaylists ? (
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
                        <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground hover:bg-accent/90 rounded-apple">
                          Saved
                        </Badge>
                      </div>
                      <CardBody className="p-4">
                        <Typography variant="h6" className="text-foreground font-semibold truncate mb-2">
                          <a
                            href={playlist.playlistlink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-accent transition-colors"
                          >
                            {playlist.curator || "Unknown"}
                          </a>
                        </Typography>
                        <Typography variant="small" className="text-muted-foreground truncate">
                          {playlist.playlistid}
                        </Typography>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No playlists available. Try scraping playlists first.</p>
              )}
            </CardContent>
          </ShadcnCard>
        </div>
      </div>
    </SidebarInset>
  );
}