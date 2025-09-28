import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { v4 as uuidv4 } from "uuid";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, Typography } from "@material-tailwind/react";

const formSchema = z.object({
  genre: z.string().nonempty("Please select a genre"),
  type: z.enum(["New Posts", "Top Posts", "Hot Posts", "Rising Posts"], {
    required_error: "Please select a type",
  }),
  scrapeCount: z
    .number()
    .min(1, "Must be at least 1")
    .max(500, "Cannot exceed 500")
    .default(50),
});

const genres = [
  "Lo-Fi",
  "RnB",
  "Mood",
  "EDM/Dance",
  "Hip Hop",
  "Classical",
  "Rock",
  "Gospel",
  "Blues",
  "Kids",
  "Workout",
  "Pop",
  "Romance",
  "Kawaii",
  "Electronica",
  "Instrumental",
  "House Music",
  "Podcast",
  "Jazz",
  "Various",
  "Punk",
  "Latino",
  "Party",
  "Focus",
  "Chill",
  "Folk",
  "Indie/Alternative",
  "Foreign",
  "Alternative Rock",
  "Decades",
  "Funk",
  "Country",
  "Soul",
  "Sleep",
  "Reggae",
  "Metal",
];

export default function ScrapePlaylist() {
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      genre: "",
      type: "",
      scrapeCount: 50,
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    const requestId = uuidv4();

    try {
      const response = await fetch(
        // "https://n8n.srv1023790.hstgr.cloud/webhook-test/667d98e7-f5ca-4060-8f04-55f1d63eaecd",
        "https://n8n.srv1023790.hstgr.cloud/webhook-test/667d98e7-f5ca-4060-8f04-55f1d63eaecd",

        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceType: "scrape_playlist",
            genre: data.genre,
            type: data.type,
            scrapeCount: data.scrapeCount,
            requestId,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Webhook request failed: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log("Webhook response:", responseData);

      if (
        responseData &&
        Array.isArray(responseData.playlistID) &&
        Array.isArray(responseData.curator) &&
        Array.isArray(responseData.playlistImage) &&
        Array.isArray(responseData.playlistLink)
      ) {
        const { playlistID, curator, playlistImage, playlistLink } = responseData;
        const playlistArray = playlistID.map((id, index) => ({
          playlistID: id,
          name: id, // Use playlistID as name, update if webhook provides 'name'
          curator: curator[index] || "Unknown",
          genre: data.genre, // Use form's genre input
          playlistImage: playlistImage[index] || "https://placehold.co/150x150?text=Playlist",
          playlistLink: playlistLink[index] || "#",
        }));
        setPlaylists(playlistArray); // Clear previous results
        form.reset();
        toast.success(`Received ${playlistArray.length} playlists!`);
      } else {
        console.warn("Invalid response structure:", responseData);
        toast.warning("No playlists found in response. Check console for details.");
      }
    } catch (error) {
      console.error("Webhook error:", error);
      toast.error(`Failed to process webhook: ${error.message}`);
    } finally {
      setIsLoading(false);
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
                <BreadcrumbPage>Scrape Playlist</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-6 bg-background text-foreground">
        <h1 className="text-3xl font-bold text-foreground">Scrape Playlists</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ShadcnCard className="bg-card shadow-apple rounded-apple border-none">
              <CardHeader>
                <CardTitle className="text-foreground">Playlist Scraper</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="genre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Genre</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-apple border-border bg-card text-foreground focus:ring-accent">
                              <SelectValue placeholder="Select genre" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-apple bg-card border-border text-foreground">
                            {genres.map((genre) => (
                              <SelectItem
                                key={genre}
                                value={genre}
                                className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              >
                                {genre}
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
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-apple border-border bg-card text-foreground focus:ring-accent">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-apple bg-card border-border text-foreground">
                            {["New Posts", "Top Posts", "Hot Posts", "Rising Posts"].map((type) => (
                              <SelectItem
                                key={type}
                                value={type}
                                className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              >
                                {type}
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
                    name="scrapeCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scrape Count</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="500"
                            placeholder="50"
                            className="rounded-apple border-border bg-card text-foreground focus:ring-accent"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-apple bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 shadow-apple"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    "Scrape Playlists"
                  )}
                </Button>
              </CardContent>
            </ShadcnCard>
          </form>
        </Form>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {playlists.map((playlist, index) => (
            <Card
              key={`${playlist.playlistID}-${index}`}
              className="rounded-apple shadow-apple bg-card border-none overflow-hidden transition-all duration-300 hover:shadow-[0_8px_24px_rgba(20,208,97,0.2)] hover:-translate-y-1"
            >
              <div className="relative">
                <img
                  src={playlist.playlistImage}
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
                    href={playlist.playlistLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent transition-colors"
                  >
                    {playlist.name}
                  </a>
                </Typography>
                <div className="space-y-1">
                  <Typography variant="small" className="text-muted-foreground flex items-center gap-1">
                    <span className="font-medium text-foreground">Curator:</span>
                    <span className="truncate">{playlist.curator}</span>
                  </Typography>
                  <Typography variant="small" className="text-muted-foreground flex items-center gap-1">
                    <span className="font-medium text-foreground">Genre:</span>
                    <span>{playlist.genre}</span>
                  </Typography>
                  <Typography variant="small" className="text-muted-foreground flex items-center gap-1">
                    <span className="font-medium text-foreground">Playlist ID:</span>
                    <span className="truncate">{playlist.playlistID}</span>
                  </Typography>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </SidebarInset>
  );
}