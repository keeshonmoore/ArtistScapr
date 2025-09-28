const puppeteer = require('puppeteer');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeArtistData(page, artistId, enablePause = false) {
  const startTime = performance.now();

  try {
    // Navigate to artist page
    const artistUrl = `https://open.spotify.com/artist/${artistId}`;
    await page.goto(artistUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3000); // 3-second sleep (reduced from 30 for API efficiency)
    // Optional pause for inspection
    if (enablePause) {
      console.log(`Page loaded for artist ID ${artistId}. Pausing for 30 seconds to inspect selectors/XPath...`);
      console.log('Open DevTools (Right-click > Inspect or Ctrl+Shift+I) to find elements.');
      await sleep(5000); // 3-second sleep (reduced from 30 for API efficiency)
    }

    // Click the audience insights button using primary and secondary XPath
    const buttonXPaths = [
      '//*[@id="main-view"]/div/div[2]/div[1]/div/main/section/div/div[2]/div[3]/div[3]/div/div/button',
      '//*[@id="main-view"]/div/div[2]/div[1]/div/main/section/div/div[2]/div[3]/div[2]/div/div/button'
    ];
    let buttonFound = false;

    for (const buttonXPath of buttonXPaths) {
      console.log(`Trying XPath for artist ID ${artistId}: ${buttonXPath}`);
      for (let i = 0; i < 2; i++) {
        const buttonElement = await page.evaluate((xpath) => {
          const node = document.evaluate(
            xpath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;
          if (node) {
            node.click();
            return true;
          }
          return false;
        }, buttonXPath);
        if (buttonElement) {
          buttonFound = true;
          break;
        }
        await sleep(1000); // Wait 1 second and retry
      }
      if (buttonFound) break;
    }

    if (!buttonFound) {
      throw new Error('Audience insights button not found with either XPath');
    }

    // Wait 5 seconds for dialog to load
    await sleep(5000);

    // Extract all data from the dialog
    const data = await page.evaluate((artistId) => {
      // Helper function to evaluate XPath and log failures
      function evaluateXPath(xpath, logMessage) {
        const node = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
        if (!node) {
          console.log(`[Artist ID ${artistId}] ${logMessage}: XPath ${xpath} returned no result`);
        }
        return node;
      }

      // Artist name (primary and fallback)
      let artistNameNode = evaluateXPath(
        '/html/body/div[4]/div/div[2]/div[6]/div/div[2]/div[1]/div/main/section/div/div[2]/div[3]/div[2]/div/dialog/div/div[1]/div/div/div[2]/div[2]/div',
        'Artist name primary XPath failed'
      );
      if (!artistNameNode) {
        artistNameNode = evaluateXPath(
          '//div[@data-encore-id="text" and contains(text(), "Posted By")]',
          'Artist name fallback XPath failed'
        );
      }
      const artistName = artistNameNode ? artistNameNode.textContent.trim().replace('Posted By ', '') : 'Unknown Artist';

      // Artist image src (primary and fallback)
      let imageNode = evaluateXPath(
        '/html/body/div[4]/div/div[2]/div[6]/div/div[2]/div[1]/div/main/section/div/div[2]/div[3]/div[2]/div/dialog/div/div[1]/div/div/div[2]/div[2]/figure/div/img',
        'Image primary XPath failed'
      );
      if (!imageNode) {
        imageNode = evaluateXPath(
          '//img[@class[contains(., "mMx2LUixlnN_Fu45JpFB")]]',
          'Image fallback XPath failed'
        );
      }
      const imageSrc = imageNode ? imageNode.getAttribute('src') : 'No image found';

      // Artist username (primary and fallback)
      let usernameNode = evaluateXPath(
        '/html/body/div[4]/div/div[2]/div[6]/div/div[2]/div[1]/div/main/section/div/div[2]/div[3]/div[2]/div/dialog/div/div[1]/div/div/div[2]/div[1]/p',
        'Username primary XPath failed'
      );
      if (!usernameNode) {
        usernameNode = evaluateXPath(
          '//p[@data-encore-id="type" and starts-with(text(), "@")]',
          'Username fallback XPath failed'
        );
      }
      const username = usernameNode ? usernameNode.textContent.trim() : 'No username found';

      // Followers (primary and fallback)
      let followersNode = evaluateXPath(
        '/html/body/div[4]/div/div[2]/div[6]/div/div[2]/div[1]/div/main/section/div/div[2]/div[3]/div[3]/div/dialog/div/div[1]/div[2]/div/div[1]/div[1]/div[1]',
        'Followers primary XPath failed'
      );
      if (!followersNode) {
        followersNode = evaluateXPath(
          '//*[@id="main-view"]/div/div[2]/div[1]/div/main/section/div/div[2]/div[3]/div[2]/div/dialog/div/div[1]/div/div/div[1]/div[1]/div[1]',
          'Followers fallback XPath failed'
        );
      }
      const followersText = followersNode ? followersNode.textContent.trim() : '0';
      const followers = parseInt(followersText.replace(/[^0-9]/g, '')) || 0;

      // Monthly listeners (primary and fallback)
      let monthlyListenersNode = evaluateXPath(
        '/html/body/div[4]/div/div[2]/div[6]/div/div[2]/div[1]/div/main/section/div/div[2]/div[3]/div[3]/div/dialog/div/div[1]/div[2]/div/div[1]/div[2]/div[1]',
        'Monthly listeners primary XPath failed'
      );
      if (!monthlyListenersNode) {
        monthlyListenersNode = evaluateXPath(
          '/html/body/div[4]/div/div[2]/div[6]/div/div[2]/div[1]/div/main/section/div/div[2]/div[3]/div[2]/div/dialog/div/div[1]/div/div/div[1]/div[2]/div[1]',
          'Monthly listeners fallback XPath failed'
        );
      }
      const monthlyListenersText = monthlyListenersNode ? monthlyListenersNode.textContent.trim() : '0';
      const monthlyListeners = parseInt(monthlyListenersText.replace(/[^0-9]/g, '')) || 0;

      // Top 5 cities (state and listeners) with fallbacks
      const cities = [];
      for (let i = 3; i <= 7; i++) {
        let stateNode = evaluateXPath(
          `/html/body/div[4]/div/div[2]/div[6]/div/div[2]/div[1]/div/main/section/div/div[2]/div[3]/div[3]/div/dialog/div/div[1]/div[2]/div/div[1]/div[${i}]/div[1]`,
          `City ${i-2} state primary XPath failed`
        );
        if (!stateNode) {
          stateNode = evaluateXPath(
            `//*[@id="main-view"]/div/div[2]/div[1]/div/main/section/div/div[2]/div[3]/div[2]/div/dialog/div/div[1]/div/div/div[1]/div[${i}]/div[1]`,
            `City ${i-2} state fallback XPath failed`
          );
        }
        const state = stateNode ? stateNode.textContent.trim() : 'Unknown City';

        let listenersNode = i <= 4 ? evaluateXPath(
          `/html/body/div[4]/div/div[2]/div[6]/div/div[2]/div[1]/div/main/section/div/div[2]/div[3]/div[3]/div/dialog/div/div[1]/div[2]/div/div[1]/div[${i}]/div[2]`,
          `City ${i-2} listeners primary XPath failed`
        ) : null;
        if (!listenersNode) {
          listenersNode = evaluateXPath(
            `//*[@id="main-view"]/div/div[2]/div[1]/div/main/section/div/div[2]/div[3]/div[2]/div/dialog/div/div[1]/div/div/div[1]/div[${i}]/div[2]`,
            `City ${i-2} listeners fallback XPath failed`
          );
        }
        const listenersText = listenersNode ? listenersNode.textContent.trim() : '0';
        const listeners = parseInt(listenersText.replace(/[^0-9]/g, '')) || 0;

        cities.push({ state, listeners });
      }

      // Social media link (primary and fallback)
      let socialNode = evaluateXPath(
        '//*[@id="main-view"]/div/div[2]/div[1]/div/main/section/div/div[2]/div[3]/div[2]/div/dialog/div/div[1]/div/div/div[1]/div[8]/a',
        'Social link primary XPath failed'
      );
      if (!socialNode) {
        socialNode = evaluateXPath(
          '//a[contains(@href, "instagram.com") or contains(@href, "facebook.com")]',
          'Social link fallback XPath failed'
        );
      }
      const socialLink = socialNode ? socialNode.getAttribute('href') : 'No social link found';

      return { artistName, imageSrc, username, followers, monthlyListeners, cities, socialLink };
    }, artistId);

    // Calculate duration
    const durationMs = performance.now() - startTime;
    const durationSec = (durationMs / 1000).toFixed(2);

    return { ...data, durationMs, artistId, error: null };
  } catch (error) {
    console.error(`Error scraping artist ID ${artistId}:`, error.message);
    return { artistId, error: error.message };
  }
}

async function scrapeMultipleArtists(artistIds, enablePause = false) {
  const startTime = performance.now();
  const results = [];

  // Launch a single browser instance
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    for (const artistId of artistIds) {
      console.log(`Processing artist ID: ${artistId}`);
      const result = await scrapeArtistData(page, artistId, enablePause);
      results.push(result);
      await sleep(2000); // 2-second delay between artists to avoid rate-limiting
    }

    await browser.close();
  } catch (error) {
    console.error('Error in bulk scraping:', error.message);
    await browser.close();
    throw error;
  }

  // Calculate total duration
  const totalDurationMs = performance.now() - startTime;
  const totalDurationSec = (totalDurationMs / 1000).toFixed(2);

  return {
    results,
    totalDurationMs,
    totalDurationSec
  };
}

// API endpoint to scrape artists
app.post('/scrape', async (req, res) => {
  try {
    const { artistIds, enablePause = false } = req.body;

    // Validate input
    if (!Array.isArray(artistIds) || artistIds.length === 0) {
      return res.status(400).json({ error: 'artistIds must be a non-empty array' });
    }

    // Scrape data
    const { results, totalDurationMs, totalDurationSec } = await scrapeMultipleArtists(artistIds, enablePause);

    // Send response
    res.status(200).json({
      results,
      totalDurationMs,
      totalDurationSec
    });
  } catch (error) {
    console.error('API error:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});