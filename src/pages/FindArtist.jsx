import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, Check, ChevronsUpDown, Music, Camera } from "lucide-react";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  playlistId: z.string().nonempty("Please select a playlist"),
  minListeners: z.number().min(0, "Minimum listeners must be at least 0"),
  maxListeners: z.number().min(1, "Maximum listeners must be at least 1"),
});

const listenerPresets = [
  { value: 10000, label: "10,000" },
  { value: 50000, label: "50,000" },
  { value: 100000, label: "100,000" },
  { value: 500000, label: "500,000" },
  { value: 1000000, label: "1,000,000" },
  { value: 5000000, label: "5,000,000" },
];

export default function FindArtist() {
  const [artists, setArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [isFetchingPlaylists, setIsFetchingPlaylists] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [openMin, setOpenMin] = useState(false);
  const [openMax, setOpenMax] = useState(false);
  const [eventSource, setEventSource] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const location = useLocation();
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playlistId: "",
      minListeners: 50000,
      maxListeners: 100000,
    },
  });

  useEffect(() => {
    const fetchPlaylists = async () => {
      setIsFetchingPlaylists(true);
      setFetchError(null);
      try {
        if (!supabase) {
          throw new Error("Supabase client is not initialized. Check supabase.js configuration.");
        }

        const { data: { user } } = await supabase.auth.getUser();
        console.log("Current user:", user ? user.id : "No authenticated user");

        const { data, error } = await supabase
          .from("playlist")
          .select("id, playlistid, curator, playlistimage, playlistlink")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase query error:", error);
          throw new Error(`Failed to fetch playlists: ${error.message}`);
        }

        setPlaylists(data || []);
        if (!data || data.length === 0) {
          toast.info("No playlists found. Please scrape a playlist first.");
        }

        // Auto-fill playlist from navigation state
        const { selectedPlaylistId } = location.state || {};
        if (selectedPlaylistId && data?.find((p) => p.playlistid === selectedPlaylistId)) {
          form.setValue("playlistId", selectedPlaylistId, { shouldValidate: true });
          navigate(location.pathname, { replace: true, state: {} });
        }
      } catch (error) {
        console.error("Error fetching playlists:", error.message);
        setFetchError(error.message);
        toast.error(`Failed to fetch playlists: ${error.message}`);
      } finally {
        setIsFetchingPlaylists(false);
      }
    };

    fetchPlaylists();
  }, [form, location.state, navigate, location.pathname]);

  const handlePlaylistSelect = (playlistId) => {
    form.setValue("playlistId", playlistId, { shouldValidate: true });
  };

  const handleCancel = useCallback(() => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
      setIsLoading(false);
      toast.info("Artist search cancelled.");
    }
  }, [eventSource]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  const onSubmit = async (data) => {
    // Reset state
    setArtists([]);
    setProgress({ current: 0, total: 0, percentage: 0 });
    setIsLoading(true);

    try {
      // Use environment variable or default to localhost
      const apiUrl = import.meta.env.VITE_SPOTIFY_API_URL || 'http://localhost:5000';
      
      const payload = {
        playlistID: data.playlistId,
        minListeners: data.minListeners,
        maxListeners: data.maxListeners,
      };

      console.log("Starting artist search with:", payload);

      // Create EventSource for streaming
      const response = await fetch(`${apiUrl}/api/find-artists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      // Create EventSource-like streaming from fetch
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              if (jsonStr.trim()) {
                try {
                  const event = JSON.parse(jsonStr);
                  handleStreamEvent(event);
                } catch (e) {
                  console.error('Failed to parse SSE data:', e);
                }
              }
            }
          }
        }
      };

      await processStream();

    } catch (error) {
      console.error("Artist search error:", error);
      toast.error(`Failed to search artists: ${error.message}`);
    } finally {
      setIsLoading(false);
      setEventSource(null);
    }
  };

  const handleStreamEvent = (event) => {
    console.log("Stream event:", event);

    switch (event.type) {
      case 'artist':
        setArtists(prev => [...prev, event.data]);
        setProgress(event.progress);
        toast.success(`Found artist: ${event.data.artist}`);
        break;

      case 'progress':
        setProgress(event.data);
        break;

      case 'error':
        console.error("Artist error:", event.data);
        toast.error(`Error processing ${event.data.artist}: ${event.data.error}`);
        break;

      case 'complete':
        console.log("Search complete:", event.data);
        toast.success(`Search complete! Processed ${event.data.total_processed} artists.`);
        setIsLoading(false);
        break;

      case 'fatal_error':
        console.error("Fatal error:", event.data);
        toast.error(`Search failed: ${event.data.error}`);
        setIsLoading(false);
        break;

      case 'heartbeat':
        // Keep connection alive
        break;
    }
  };

  const selectedPlaylistId = form.watch("playlistId");

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 bg-card shadow-apple">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1 text-foreground hover:text-accent" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Find Artist</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-6 bg-background text-foreground">
        <h1 className="text-3xl font-bold text-foreground">Find Artists</h1>
        <div className="space-y-6">
          {isFetchingPlaylists ? (
            <p className="text-center">Loading playlists...</p>
          ) : fetchError ? (
            <p className="text-center text-destructive">
              Error loading playlists: {fetchError}
            </p>
          ) : playlists.length > 0 ? (
            <Carousel className="w-full max-w-4xl mx-auto">
              <CarouselContent>
                {playlists.map((playlist) => (
                  <CarouselItem key={playlist.id} className="md:basis-1/2 lg:basis-1/3">
                    <ShadcnCard
                      className={cn(
                        "rounded-apple shadow-apple bg-card border-2 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_8px_24px_rgba(20,208,97,0.2)] hover:-translate-y-1",
                        selectedPlaylistId === playlist.playlistid ? "border-accent" : "border-border"
                      )}
                      onClick={() => handlePlaylistSelect(playlist.playlistid)}
                    >
                      <img
                        src={playlist.playlistimage || "https://placehold.co/150x150?text=Playlist"}
                        alt="Playlist cover"
                        className="w-full h-48 object-cover"
                      />
                      <CardContent className="p-4">
                        <p className="text-sm font-medium truncate text-foreground">
                          {playlist.curator || "Unknown"}
                        </p>
                        <p className="text-xs truncate text-muted-foreground">{playlist.playlistid}</p>
                      </CardContent>
                    </ShadcnCard>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="bg-accent text-accent-foreground hover:bg-accent/90" />
              <CarouselNext className="bg-accent text-accent-foreground hover:bg-accent/90" />
            </Carousel>
          ) : (
            <p className="text-center text-muted-foreground">No playlists available.</p>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <ShadcnCard className="bg-card shadow-apple rounded-apple border-none">
                <CardHeader>
                  <CardTitle className="text-foreground">Artist Lookup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="playlistId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Saved Playlist</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-apple border-border bg-card text-foreground focus:ring-accent">
                                <SelectValue placeholder="Select playlist" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-apple bg-card border-border text-foreground">
                              {playlists.map((playlist) => (
                                <SelectItem
                                  key={`select-${playlist.id}`}
                                  value={playlist.playlistid}
                                  className="hover:bg-accent hover:text-accent-foreground"
                                >
                                  {playlist.curator} ({playlist.playlistid})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="minListeners"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Monthly Listeners</FormLabel>
                          <FormControl>
                            <Popover open={openMin} onOpenChange={setOpenMin}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={openMin}
                                  className="w-full justify-between rounded-apple border-border bg-card text-foreground hover:bg-accent/10 focus:ring-accent"
                                >
                                  {field.value
                                    ? listenerPresets.find((preset) => preset.value === field.value)?.label || field.value.toLocaleString()
                                    : "Select listeners..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[200px] p-0 rounded-apple bg-card border-border">
                                <Command>
                                  <CommandInput placeholder="Search listeners..." className="h-9" />
                                  <CommandList>
                                    <CommandEmpty>No listeners found.</CommandEmpty>
                                    <CommandGroup>
                                      {listenerPresets.map((preset) => (
                                        <CommandItem
                                          key={preset.value}
                                          value={preset.label}
                                          onSelect={() => {
                                            field.onChange(preset.value);
                                            setOpenMin(false);
                                          }}
                                          className="hover:bg-accent hover:text-accent-foreground"
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              field.value === preset.value ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          {preset.label}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxListeners"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Monthly Listeners</FormLabel>
                          <FormControl>
                            <Popover open={openMax} onOpenChange={setOpenMax}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={openMax}
                                  className="w-full justify-between rounded-apple border-border bg-card text-foreground hover:bg-accent/10 focus:ring-accent"
                                >
                                  {field.value
                                    ? listenerPresets.find((preset) => preset.value === field.value)?.label || field.value.toLocaleString()
                                    : "Select listeners..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[200px] p-0 rounded-apple bg-card border-border">
                                <Command>
                                  <CommandInput placeholder="Search listeners..." className="h-9" />
                                  <CommandList>
                                    <CommandEmpty>No listeners found.</CommandEmpty>
                                    <CommandGroup>
                                      {listenerPresets.map((preset) => (
                                        <CommandItem
                                          key={preset.value}
                                          value={preset.label}
                                          onSelect={() => {
                                            field.onChange(preset.value);
                                            setOpenMax(false);
                                          }}
                                          className="hover:bg-accent hover:text-accent-foreground"
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              field.value === preset.value ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          {preset.label}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="rounded-apple bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 shadow-apple"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        "Find Artists"
                      )}
                    </Button>
                    {isLoading && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        className="rounded-apple border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </ShadcnCard>
            </form>
          </Form>
          
          {isLoading && (
            <div className="space-y-4">
              <div className="text-center text-muted-foreground flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                <p>Searching for artists... {progress.current > 0 && `(${progress.current}/${progress.total})`}</p>
              </div>
              {progress.percentage > 0 && (
                <Progress value={progress.percentage} className="w-full max-w-md mx-auto" />
              )}
            </div>
          )}
          
          {/* Live results */}
          {artists.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Found {artists.length} artist{artists.length !== 1 ? 's' : ''} matching your criteria
              </h2>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {artists.map((artist, index) => (
                  <Card
                    key={`${artist.artistid}-${index}`}
                    className="rounded-apple shadow-apple bg-card border-none overflow-hidden transition-all duration-300 hover:shadow-[0_8px_24px_rgba(20,208,97,0.2)] hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    <div className="relative">
                      <img
                        src={artist.imagelink}
                        alt="Artist image"
                        className="w-full h-48 object-cover"
                      />
                      <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground hover:bg-accent/90 rounded-apple">
                        Live
                      </Badge>
                    </div>
                    <CardBody className="p-4 space-y-2">
                      <Typography variant="h6" className="text-foreground font-semibold truncate">
                        {artist.artist}
                      </Typography>
                      <div className="space-y-1">
                        <Typography variant="small" className="text-muted-foreground flex items-center gap-1">
                          <span className="font-medium text-foreground">Followers:</span>
                          <span>{artist.followers.toLocaleString()}</span>
                        </Typography>
                        <Typography variant="small" className="text-muted-foreground flex items-center gap-1">
                          <span className="font-medium text-foreground">Monthly Listeners:</span>
                          <span>{artist.monthlylisteners.toLocaleString()}</span>
                        </Typography>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="rounded-apple border-accent text-accent hover:bg-accent hover:text-accent-foreground flex items-center gap-1"
                        >
                          <a href={`https://open.spotify.com/artist/${artist.artistid}`} target="_blank" rel="noopener noreferrer">
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
                          <a href={artist.sociallink} target="_blank" rel="noopener noreferrer">
                            <Camera className="h-4 w-4" />
                            Instagram
                          </a>
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarInset>
  );
}