import { useState, useEffect } from "react";
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
import { cn } from "@/lib/utils";

// Fetch wrapper with abort signal and custom timeout
const fetchWithAbort = async (url, options, timeoutMs = 600000) => {
  const controller = options.signal ? new AbortController() : options.controller;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

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
  const [abortController, setAbortController] = useState(null);
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

        // Use lowercase column names
        const { data, error } = await supabase
          .from("playlist")
          .select("id, playlistid, curator, playlistimage, playlistlink")
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
          toast.info("No playlists found in the database. Ensure playlists are saved via Scrape Playlist or check RLS permissions.");
        }

        // Auto-fill playlist from navigation state
        const { selectedPlaylistId } = location.state || {};
        if (selectedPlaylistId && data?.find((p) => p.playlistid === selectedPlaylistId)) {
          form.setValue("playlistId", selectedPlaylistId, { shouldValidate: true });
          console.log("Auto-filled playlist:", selectedPlaylistId);
          // Clear state after using it
          navigate(location.pathname, { replace: true, state: {} });
        }
      } catch (error) {
        console.error("Error fetching playlists:", error.message);
        setFetchError(error.message);
        toast.error(`Failed to fetch playlists: ${error.message}. Check console for details.`);
      } finally {
        setIsFetchingPlaylists(false);
      }
    };

    fetchPlaylists();
  }, [form, location.state, navigate, location.pathname]);

  const handlePlaylistSelect = (playlistId) => {
    form.setValue("playlistId", playlistId, { shouldValidate: true });
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setIsLoading(false);
      toast.info("Artist search cancelled.");
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
      if (!webhookUrl) {
        throw new Error("Webhook URL is not defined in environment variables.");
      }

      const selectedPlaylist = playlists.find((p) => p.playlistid === data.playlistId);
      if (!selectedPlaylist) {
        throw new Error("Selected playlist not found.");
      }

      const payload = {
        serviceType: "find_artist",
        playlistID: data.playlistId,
        playlistLink: selectedPlaylist.playlistlink,
        minListeners: data.minListeners,
        maxListeners: data.maxListeners,
      };
      console.log("FindArtist webhook request:", JSON.stringify(payload, null, 2));

      const response = await fetchWithAbort(
        webhookUrl,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        },
        600000 // 10-minute timeout
      );

      console.log("FindArtist webhook response status:", response.status);
      console.log("FindArtist webhook response headers:", Object.fromEntries(response.headers));

      if (!response.ok) {
        const errorText = await response.text();
        console.error("FindArtist webhook error text:", errorText);
        throw new Error(`Webhook request failed: ${response.status} - ${errorText}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("FindArtist non-JSON response:", text);
        throw new Error(`Expected JSON, received ${contentType || "unknown content type"}: ${text}`);
      }

      const responseText = await response.text();
      if (!responseText) {
        console.error("FindArtist empty response body");
        throw new Error("Webhook returned an empty response");
      }

      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log("FindArtist webhook response data:", JSON.stringify(responseData, null, 2));
      } catch (jsonError) {
        console.error("FindArtist JSON parse error:", jsonError);
        console.error("FindArtist raw response text:", responseText);
        throw new Error(`Failed to parse webhook response as JSON: ${jsonError.message}`);
      }

      // Normalize response to array
      const normalizedData = Array.isArray(responseData) ? responseData : [responseData];
      console.log("FindArtist normalized data:", JSON.stringify(normalizedData, null, 2));

      // Extract artists from response.body or directly from response
      let artistArray = [];
      let body;

      // Check for nested response.body structure
      if (normalizedData.length > 0 && normalizedData[0].response?.body) {
        body = normalizedData[0].response.body;
        console.log("Using nested response.body structure");
      } else if (normalizedData.length > 0 && normalizedData[0].artist) {
        body = normalizedData[0];
        console.log("Using flatter response structure");
      } else {
        console.warn("FindArtist invalid response structure:", responseData);
        throw new Error("Invalid webhook response structure: missing artist data");
      }

      console.log("FindArtist response body:", JSON.stringify(body, null, 2));

      const artistCount = Math.min(
        body.artist?.length || 0,
        body.followers?.length || 0,
        body.monthlyListeners?.length || 0,
        body.socialLink?.length || 0,
        body.artistID?.length || 0,
        body.imageLink?.length || 0
      );
      console.log("FindArtist artist count:", artistCount);

      for (let i = 0; i < artistCount; i++) {
        artistArray.push({
          artistId: body.artistID[i] || `unknown-${i}`,
          name: body.artist[i] || "Unknown Artist",
          followers: Number(body.followers[i]) || 0,
          monthlyListeners: Number(body.monthlyListeners[i]) || 0,
          socialLink: body.socialLink[i] || "#",
          imageLink: body.imageLink[i] || "https://placehold.co/150x150?text=Artist",
        });
      }
      console.log("FindArtist artist array:", JSON.stringify(artistArray, null, 2));

      if (artistArray.length > 0) {
        setArtists(artistArray);
        form.reset();
        toast.success(`Received ${artistArray.length} artists!`);
      } else {
        console.warn("FindArtist no valid artists found in response:", responseData);
        toast.warning("No artists found in response. Check console for details.");
      }
    } catch (error) {
      console.error("FindArtist webhook error:", error);
      if (error.name === 'AbortError') {
        toast.info("Artist search was cancelled or timed out after 10 minutes.");
      } else {
        toast.error(`Failed to process webhook: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  // Debug state changes
  useEffect(() => {
    console.log("Artists state updated:", JSON.stringify(artists, null, 2));
  }, [artists]);

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
              Error loading playlists: {fetchError}. Check console for details.
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
            <p className="text-center text-muted-foreground">No playlists available. Ensure playlists are saved via Scrape Playlist or check RLS permissions.</p>
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
            <div className="text-center text-muted-foreground flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p>Searching for artists, this may take up to 10 minutes...</p>
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {artists.map((artist, index) => {
              console.log(`Rendering artist ${index}:`, artist);
              return (
                <Card
                  key={`${artist.artistId}-${index}`}
                  className="rounded-apple shadow-apple bg-card border-none overflow-hidden transition-all duration-300 hover:shadow-[0_8px_24px_rgba(20,208,97,0.2)] hover:-translate-y-1"
                >
                  <div className="relative">
                    <img
                      src={artist.imageLink}
                      alt="Artist image"
                      className="w-full h-48 object-cover"
                    />
                    <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground hover:bg-accent/90 rounded-apple">
                      Saved
                    </Badge>
                  </div>
                  <CardBody className="p-4 space-y-2">
                    <Typography variant="h6" className="text-foreground font-semibold truncate">
                      {artist.name}
                    </Typography>
                    <div className="space-y-1">
                      <Typography variant="small" className="text-muted-foreground flex items-center gap-1">
                        <span className="font-medium text-foreground">Followers:</span>
                        <span>{artist.followers.toLocaleString()}</span>
                      </Typography>
                      <Typography variant="small" className="text-muted-foreground flex items-center gap-1">
                        <span className="font-medium text-foreground">Monthly Listeners:</span>
                        <span>{artist.monthlyListeners.toLocaleString()}</span>
                      </Typography>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="rounded-apple border-accent text-accent hover:bg-accent hover:text-accent-foreground flex items-center gap-1"
                      >
                        <a href={`https://open.spotify.com/artist/${artist.artistId}`} target="_blank" rel="noopener noreferrer">
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
                        <a href={artist.socialLink} target="_blank" rel="noopener noreferrer">
                          <Camera className="h-4 w-4" />
                          Instagram
                        </a>
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}