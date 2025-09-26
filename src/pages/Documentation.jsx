import { useState, useEffect, useRef } from "react";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { cn } from "@/lib/utils";

export default function Documentation() {
  const [activeTab, setActiveTab] = useState("introduction");
  const sectionRefs = {
    introduction: useRef(null),
    gettingStarted: useRef(null),
    features: useRef(null),
    backend: useRef(null),
    support: useRef(null),
  };

  const scrollToSection = (sectionId) => {
    const ref = sectionRefs[sectionId];
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
      setActiveTab(sectionId);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveTab(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
    );

    Object.values(sectionRefs).forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
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
                <BreadcrumbPage>Documentation</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-6 bg-background text-foreground">
        <h1 className="text-3xl font-bold text-foreground">ArtistFindr Documentation</h1>
        <div className="flex gap-6">
          {/* Table of Contents Sidebar */}
          <div className="hidden md:block w-64 shrink-0">
            <ShadcnCard className="bg-card shadow-apple rounded-apple border-none sticky top-6">
              <CardHeader>
                <CardTitle className="text-foreground text-lg">Contents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { id: "introduction", label: "Introduction" },
                  { id: "gettingStarted", label: "Getting Started" },
                  { id: "features", label: "Features" },
                  { id: "backend", label: "Backend Workflow" },
                  { id: "support", label: "Support & Contact" },
                ].map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => scrollToSection(item.id)}
                    className={cn(
                      "w-full justify-start text-foreground hover:bg-accent hover:text-accent-foreground",
                      activeTab === item.id && "bg-accent text-accent-foreground"
                    )}
                  >
                    {item.label}
                  </Button>
                ))}
              </CardContent>
            </ShadcnCard>
          </div>
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 rounded-apple bg-card">
                <TabsTrigger value="introduction" className="rounded-apple">Introduction</TabsTrigger>
                <TabsTrigger value="gettingStarted" className="rounded-apple">Getting Started</TabsTrigger>
                <TabsTrigger value="features" className="rounded-apple">Features</TabsTrigger>
                <TabsTrigger value="backend" className="rounded-apple">Backend</TabsTrigger>
                <TabsTrigger value="support" className="rounded-apple">Support</TabsTrigger>
              </TabsList>
              <TabsContent value="introduction" id="introduction" ref={sectionRefs.introduction}>
                <ShadcnCard className="bg-card shadow-apple rounded-apple border-none mt-4">
                  <CardHeader>
                    <CardTitle className="text-foreground">Introduction</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Typography variant="paragraph" className="text-foreground">
                      Welcome to the ArtistFindr User Documentation. ArtistFindr is a powerful web application designed for music industry professionals to discover Spotify playlists and artists based on specific criteria. This document provides detailed instructions on using the two main features: Scrape Playlists and Find Artists. These features allow users to scrape Spotify playlists from Reddit and find artists within a specified listener range from saved playlists.
                    </Typography>
                    <Typography variant="paragraph" className="text-foreground mt-2">
                      This guide assumes you have access to the ArtistFindr web application and a stable internet connection. If you encounter issues, please contact our support team at <a href="mailto:support@artistfindr.com" className="text-accent hover:underline">support@artistfindr.com</a>.
                    </Typography>
                  </CardContent>
                </ShadcnCard>
              </TabsContent>
              <TabsContent value="gettingStarted" id="gettingStarted" ref={sectionRefs.gettingStarted}>
                <ShadcnCard className="bg-card shadow-apple rounded-apple border-none mt-4">
                  <CardHeader>
                    <CardTitle className="text-foreground">Getting Started</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="accessing">
                        <AccordionTrigger className="text-foreground">Accessing ArtistFindr</AccordionTrigger>
                        <AccordionContent>
                          <Typography variant="paragraph" className="text-foreground">
                            To use ArtistFindr:
                            <ol className="list-decimal ml-6">
                              <li>Open your web browser (e.g., Chrome, Firefox, Safari).</li>
                              <li>Navigate to <a href="https://artistfindr.com" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">https://artistfindr.com</a>.</li>
                              <li>Log in with your credentials. If you do not have an account, sign up by following the on-screen instructions.</li>
                            </ol>
                          </Typography>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="navigating">
                        <AccordionTrigger className="text-foreground">Navigating the Interface</AccordionTrigger>
                        <AccordionContent>
                          <Typography variant="paragraph" className="text-foreground">
                            The ArtistFindr dashboard features a responsive and intuitive interface:
                            <ul className="list-disc ml-6">
                              <li><strong>Sidebar:</strong> Located on the left, it contains navigation links to Scrape Playlists, Find Artists, and other dashboard sections.</li>
                              <li><strong>Navbar:</strong> At the top, it displays contact information (email, phone) and social media icons linking to ArtistFindr's profiles.</li>
                              <li><strong>Main Content Area:</strong> Displays the selected feature's interface (e.g., Scrape Playlists or Find Artists).</li>
                            </ul>
                          </Typography>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </ShadcnCard>
              </TabsContent>
              <TabsContent value="features" id="features" ref={sectionRefs.features}>
                <ShadcnCard className="bg-card shadow-apple rounded-apple border-none mt-4">
                  <CardHeader>
                    <CardTitle className="text-foreground">Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="scrape-playlists">
                        <AccordionTrigger className="text-foreground">Scrape Playlists Feature</AccordionTrigger>
                        <AccordionContent>
                          <Typography variant="paragraph" className="text-foreground">
                            The Scrape Playlists feature allows you to discover Spotify playlists from the <a href="https://www.reddit.com/r/SpotifyPlaylists" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">r/SpotifyPlaylists</a> subreddit.
                          </Typography>
                          <Typography variant="h6" className="text-foreground font-semibold mt-4 mb-2">
                            Accessing Scrape Playlists
                          </Typography>
                          <Typography variant="paragraph" className="text-foreground">
                            <ol className="list-decimal ml-6">
                              <li>From the sidebar, click Scrape Playlists.</li>
                              <li>The main content area will display the Playlist Scraper form and results section.</li>
                            </ol>
                          </Typography>
                          <Typography variant="h6" className="text-foreground font-semibold mt-4 mb-2">
                            Using the Playlist Scraper
                          </Typography>
                          <Typography variant="paragraph" className="text-foreground">
                            The scraper form includes three fields:
                            <ul className="list-disc ml-6">
                              <li><strong>Genre:</strong> Select a music genre from the dropdown (e.g., Lo-Fi, Hip Hop, Jazz). The system supports over 30 genres.</li>
                              <li><strong>Type:</strong> Choose the type of Reddit posts to scrape:
                                <ul className="list-disc ml-6">
                                  <li>New Posts: Recently submitted posts.</li>
                                  <li>Top Posts: Highly upvoted posts.</li>
                                  <li>Hot Posts: Currently trending posts.</li>
                                  <li>Rising Posts: Posts gaining traction.</li>
                                </ul>
                              </li>
                              <li><strong>Scrape Count:</strong> Enter the number of playlists to scrape (1 to 500). The default is 50.</li>
                            </ul>
                            To scrape playlists:
                            <ol className="list-decimal ml-6">
                              <li>Select a Genre from the dropdown.</li>
                              <li>Choose a Type of post.</li>
                              <li>Enter a Scrape Count or keep the default value.</li>
                              <li>Click the Scrape Playlists button.</li>
                            </ol>
                          </Typography>
                          <Typography variant="h6" className="text-foreground font-semibold mt-4 mb-2">
                            Viewing Results
                          </Typography>
                          <Card className="bg-card shadow-apple rounded-apple border-none mt-2">
                            <CardBody className="p-4">
                              <Typography variant="paragraph" className="text-foreground">
                                <ul className="list-disc ml-6">
                                  <li>Once the scrape is complete, results appear below the form in a grid layout (responsive for desktop and mobile).</li>
                                  <li>Each playlist is displayed as a card with:
                                    <ul className="list-disc ml-6">
                                      <li>Cover Image: The playlist's Spotify image or a placeholder.</li>
                                      <li>Name: The playlist ID (used as a name; may be updated if the webhook provides a name).</li>
                                      <li>Curator: The playlist creator's name or 'Unknown' if unavailable.</li>
                                      <li>Genre: The selected genre from the form.</li>
                                      <li>Playlist ID: The unique Spotify playlist ID.</li>
                                      <li>Link: A clickable link to the playlist on Spotify.</li>
                                      <li>Saved Badge: Indicates the playlist is saved to the database.</li>
                                    </ul>
                                  </li>
                                  <li>Hover over a card to see a subtle animation (shadow and slight lift effect).</li>
                                  <li>Click the playlist name to open it in Spotify.</li>
                                </ul>
                              </Typography>
                            </CardBody>
                          </Card>
                          <Typography variant="h6" className="text-foreground font-semibold mt-4 mb-2">
                            Troubleshooting
                          </Typography>
                          <Card className="bg-card shadow-apple rounded-apple border-none mt-2">
                            <CardBody className="p-4">
                              <Typography variant="paragraph" className="text-foreground">
                                <ul className="list-disc ml-6">
                                  <li><strong>No Playlists Found:</strong> Ensure the genre matches the subreddit’s flair and that posts exist for the selected type. Check the console (F12 - Console) for details.</li>
                                  <li><strong>Webhook Error:</strong> Verify your internet connection and try again. Contact support if the issue persists.</li>
                                  <li><strong>Invalid Input:</strong> Ensure the scrape count is between 1 and 500 and all fields are filled.</li>
                                </ul>
                              </Typography>
                            </CardBody>
                          </Card>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="find-artists">
                        <AccordionTrigger className="text-foreground">Find Artists Feature</AccordionTrigger>
                        <AccordionContent>
                          <Typography variant="paragraph" className="text-foreground">
                            The Find Artists feature enables you to discover artists from a saved playlist, filtered by minimum and maximum monthly listeners.
                          </Typography>
                          <Typography variant="h6" className="text-foreground font-semibold mt-4 mb-2">
                            Accessing Find Artists
                          </Typography>
                          <Typography variant="paragraph" className="text-foreground">
                            <ol className="list-decimal ml-6">
                              <li>From the sidebar, click Find Artists.</li>
                              <li>The main content area will display a playlist carousel, the Artist Lookup form, and results section.</li>
                            </ol>
                          </Typography>
                          <Typography variant="h6" className="text-foreground font-semibold mt-4 mb-2">
                            Selecting a Playlist
                          </Typography>
                          <Typography variant="paragraph" className="text-foreground">
                            <ul className="list-disc ml-6">
                              <li>A carousel displays saved playlists from the database (populated via Scrape Playlists).</li>
                              <li>Each playlist card shows:
                                <ul className="list-disc ml-6">
                                  <li>Cover Image: The playlist's Spotify image or a placeholder.</li>
                                  <li>Curator: The playlist creator's name or 'Unknown.'</li>
                                  <li>Playlist ID: The unique Spotify playlist ID.</li>
                                </ul>
                              </li>
                              <li>Click a playlist card to select it, or use the Saved Playlist dropdown in the form.</li>
                              <li>Navigate the carousel using the Previous and Next buttons.</li>
                              <li>If no playlists appear, ensure you have scraped and saved playlists using the Scrape Playlists feature.</li>
                            </ul>
                          </Typography>
                          <Typography variant="h6" className="text-foreground font-semibold mt-4 mb-2">
                            Using the Artist Lookup
                          </Typography>
                          <Typography variant="paragraph" className="text-foreground">
                            The lookup form includes three fields:
                            <ul className="list-disc ml-6">
                              <li><strong>Saved Playlist:</strong> Select a playlist by its curator and ID.</li>
                              <li><strong>Minimum Monthly Listeners:</strong> Choose a minimum listener count (e.g., 10,000, 50,000) using the dropdown.</li>
                              <li><strong>Maximum Monthly Listeners:</strong> Choose a maximum listener count (e.g., 100,000, 1,000,000) using the dropdown.</li>
                            </ul>
                            To find artists:
                            <ol className="list-decimal ml-6">
                              <li>Select a Saved Playlist from the dropdown or carousel.</li>
                              <li>Choose a Minimum Monthly Listeners value.</li>
                              <li>Choose a Maximum Monthly Listeners value.</li>
                              <li>Click the Find Artists button.</li>
                              <li>The search may take up to 10 minutes, depending on the playlist size and listener filters.</li>
                            </ol>
                          </Typography>
                          <Typography variant="h6" className="text-foreground font-semibold mt-4 mb-2">
                            Cancelling a Search
                          </Typography>
                          <Typography variant="paragraph" className="text-foreground">
                            <ul className="list-disc ml-6">
                              <li>If a search is taking too long, click the Cancel button (appears during loading).</li>
                              <li>A toast notification will confirm the cancellation.</li>
                            </ul>
                          </Typography>
                          <Typography variant="h6" className="text-foreground font-semibold mt-4 mb-2">
                            Viewing Results
                          </Typography>
                          <Card className="bg-card shadow-apple rounded-apple border-none mt-2">
                            <CardBody className="p-4">
                              <Typography variant="paragraph" className="text-foreground">
                                <ul className="list-disc ml-6">
                                  <li>Results appear below the form in a grid layout.</li>
                                  <li>Each artist is displayed as a card with:
                                    <ul className="list-disc ml-6">
                                      <li>Image: The artist's Spotify image or a placeholder.</li>
                                      <li>Name: The artist's name or 'Unknown Artist.'</li>
                                      <li>Followers: The artist's Spotify follower count.</li>
                                      <li>Monthly Listeners: The artist's monthly listener count.</li>
                                      <li>Spotify Button: Links to the artist's Spotify profile.</li>
                                      <li>Instagram Button: Links to the artist's Instagram profile (if available).</li>
                                      <li>Saved Badge: Indicates the artist is saved to the database.</li>
                                    </ul>
                                  </li>
                                  <li>Hover over a card to see an animation (shadow and lift effect).</li>
                                  <li>Click the Spotify or Instagram buttons to visit the artist's profiles.</li>
                                </ul>
                              </Typography>
                            </CardBody>
                          </Card>
                          <Typography variant="h6" className="text-foreground font-semibold mt-4 mb-2">
                            Troubleshooting
                          </Typography>
                          <Card className="bg-card shadow-apple rounded-apple border-none mt-2">
                            <CardBody className="p-4">
                              <Typography variant="paragraph" className="text-foreground">
                                <ul className="list-disc ml-6">
                                  <li><strong>No Playlists Available:</strong> Scrape playlists first using the Scrape Playlists feature.</li>
                                  <li><strong>No Artists Found:</strong> Ensure the playlist contains artists within the specified listener range. Check the console for details.</li>
                                  <li><strong>Webhook Error:</strong> Verify your internet connection and try again. Contact support if the issue persists.</li>
                                  <li><strong>Database Error:</strong> Ensure Row Level Security (RLS) permissions are correctly configured in Supabase.</li>
                                </ul>
                              </Typography>
                            </CardBody>
                          </Card>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </ShadcnCard>
              </TabsContent>
              <TabsContent value="backend" id="backend" ref={sectionRefs.backend}>
                <ShadcnCard className="bg-card shadow-apple rounded-apple border-none mt-4">
                  <CardHeader>
                    <CardTitle className="text-foreground">Understanding the Backend Workflow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Typography variant="paragraph" className="text-foreground">
                      ArtistFindr uses an n8n workflow to process requests, integrating with Reddit, Spotify, and Supabase. While users do not interact directly with the workflow, understanding its functionality can help troubleshoot issues.
                    </Typography>
                    <Accordion type="single" collapsible className="w-full mt-4">
                      <AccordionItem value="scrape-playlists-workflow">
                        <AccordionTrigger className="text-foreground">Scrape Playlists Workflow</AccordionTrigger>
                        <AccordionContent>
                          <Card className="bg-card shadow-apple rounded-apple border-none">
                            <CardBody className="p-4">
                              <Typography variant="paragraph" className="text-foreground">
                                <ul className="list-disc ml-6">
                                  <li><strong>Reddit Scraping:</strong> Fetches posts from r/SpotifyPlaylists based on genre and post type (new, top, hot, rising).</li>
                                  <li><strong>Playlist ID Extraction:</strong> Extracts Spotify playlist IDs from post URLs.</li>
                                  <li><strong>Spotify API:</strong> Retrieves playlist details (ID, curator, image, link).</li>
                                  <li><strong>Supabase Storage:</strong> Saves valid playlists to the playlist and run tables.</li>
                                  <li><strong>Output:</strong> Returns an aggregated list of playlists to the frontend.</li>
                                </ul>
                              </Typography>
                            </CardBody>
                          </Card>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="find-artists-workflow">
                        <AccordionTrigger className="text-foreground">Find Artists Workflow</AccordionTrigger>
                        <AccordionContent>
                          <Card className="bg-card shadow-apple rounded-apple border-none">
                            <CardBody className="p-4">
                              <Typography variant="paragraph" className="text-foreground">
                                <ul className="list-disc ml-6">
                                  <li><strong>Playlist Selection:</strong> Uses the provided playlist ID to fetch tracks via the Spotify API.</li>
                                  <li><strong>Artist Extraction:</strong> Identifies artists from the playlist's tracks.</li>
                                  <li><strong>Listener Filtering:</strong> Filters artists based on monthly listeners (min and max).</li>
                                  <li><strong>Instagram Scraping:</strong> Fetches Instagram links via an external scraper.</li>
                                  <li><strong>Supabase Storage:</strong> Saves artist data to the artist table.</li>
                                  <li><strong>Output:</strong> Returns an aggregated list of artists to the frontend.</li>
                                </ul>
                              </Typography>
                            </CardBody>
                          </Card>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="common-issues">
                        <AccordionTrigger className="text-foreground">Common Backend Issues</AccordionTrigger>
                        <AccordionContent>
                          <Card className="bg-card shadow-apple rounded-apple border-none">
                            <CardBody className="p-4">
                              <Typography variant="paragraph" className="text-foreground">
                                <ul className="list-disc ml-6">
                                  <li><strong>Supabase Errors:</strong> Check RLS policies and ensure the Supabase API key is valid.</li>
                                  <li><strong>Spotify API Errors:</strong> Verify the Spotify OAuth2 credentials in n8n.</li>
                                  <li><strong>Reddit API Errors:</strong> Ensure the Reddit OAuth2 credentials are valid and the subreddit is accessible.</li>
                                  <li><strong>Scraper Errors:</strong> Confirm the external scraper service is running and accessible.</li>
                                </ul>
                              </Typography>
                            </CardBody>
                          </Card>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </ShadcnCard>
              </TabsContent>
              <TabsContent value="support" id="support" ref={sectionRefs.support}>
                <ShadcnCard className="bg-card shadow-apple rounded-apple border-none mt-4">
                  <CardHeader>
                    <CardTitle className="text-foreground">Support and Contact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Typography variant="paragraph" className="text-foreground">
                      For assistance, contact the ArtistFindr support team:
                      <ul className="list-disc ml-6">
                        <li><strong>Email:</strong> <a href="mailto:support@artistfindr.com" className="text-accent hover:underline">support@artistfindr.com</a></li>
                        <li><strong>Phone:</strong> +1 (800) 555-1234</li>
                        <li><strong>Social Media:</strong> Follow us on Instagram, Twitter, and LinkedIn via the navbar links.</li>
                      </ul>
                    </Typography>
                    <Typography variant="paragraph" className="text-foreground mt-2">
                      If you encounter technical issues, provide the following details:
                      <ul className="list-disc ml-6">
                        <li>Feature used (Scrape Playlists or Find Artists).</li>
                        <li>Input values (e.g., genre, playlist ID, listener range).</li>
                        <li>Error message or console logs (F12 - Console).</li>
                      </ul>
                    </Typography>
                    <Typography variant="h6" className="text-foreground font-semibold mt-4 mb-2">
                      Conclusion
                    </Typography>
                    <Typography variant="paragraph" className="text-foreground">
                      ArtistFindr simplifies the process of discovering Spotify playlists and artists tailored to your needs. By following this documentation, you can effectively use the Scrape Playlists and Find Artists features to support your music industry goals. For updates and new features, check our website or follow our social media channels.
                    </Typography>
                  </CardContent>
                </ShadcnCard>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}