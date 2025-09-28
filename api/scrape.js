const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getMonthlyListenersByArtistId(artistId) {
  try {
    // Launch a visible browser
    const browser = await puppeteer.launch({
      headless: false, // Non-headless for inspection
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 720 }
    });
    const page = await browser.newPage();

    // Set user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Navigate directly to artist page
    const artistUrl = `https://open.spotify.com/artist/${artistId}`;
    await page.goto(artistUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Pause for 30 seconds to allow inspection
    console.log('Page loaded. Pausing for 30 seconds to inspect selectors/XPath...');
    console.log('Open DevTools (Right-click > Inspect or Ctrl+Shift+I) to find elements.');
    await sleep(3000000); // 30-second sleep

    // Click the audience insights button using XPath
    const buttonXPath = '//*[@id="main-view"]/div/div[2]/div[1]/div/main/section/div/div[2]/div[3]/div[3]/div/div/button';
    let buttonFound = false;
    for (let i = 0; i < 10; i++) {
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
    if (!buttonFound) {
      throw new Error('Audience insights button not found');
    }

    // Wait 2 seconds for dialog to load
    await sleep(2000);

    // Extract artist name, monthly listeners, image src, followers, and top 5 cities
    const data = await page.evaluate(() => {
      // Artist name XPath
      const artistNameNode = document.evaluate(
        '//*[@id="main-view"]/div/div[2]/div[1]/div/main/section/div/div[1]/div[3]/div[3]/span[2]/h1',
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
      const artistName = artistNameNode ? artistNameNode.textContent.trim() : 'Unknown Artist';

      // Monthly listeners XPath
      const monthlyListenersNode = document.evaluate(
        '/html/body/div[4]/div/div[2]/div[5]/div/div[2]/div[1]/div/main/section/div/div[1]/div[3]/div[3]/span[3]',
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
      const monthlyListenersText = monthlyListenersNode ? monthlyListenersNode.textContent.trim() : '0';
      const monthlyListeners = parseInt(monthlyListenersText.replace(/[^0-9]/g, '')) || 0;

      // Artist image src XPath
      const imageNode = document.evaluate(
        '/html/body/div[4]/div/div[2]/div[5]/div/div[2]/div[1]/div/main/section/div/div[1]/div[3]/div[2]/div/img',
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
      const imageSrc = imageNode ? imageNode.getAttribute('src') : 'No image found';

      // Followers XPath
      const followersNode = document.evaluate(
        '/html/body/div[4]/div/div[2]/div[5]/div/div[2]/div[1]/div/main/section/div/div[2]/div[3]/div[3]/div/dialog/div/div[1]/div/div/div[1]/div[1]/div[1]',
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
      const followersText = followersNode ? followersNode.textContent.trim() : '0';
      const followers = parseInt(followersText.replace(/[^0-9]/g, '')) || 0;

      // Top 5 cities (state and listeners)
      const cities = [];
      for (let i = 3; i <= 7; i++) {
        const stateNode = document.evaluate(
          `/html/body/div[4]/div/div[2]/div[5]/div/div[2]/div[1]/div/main/section/div/div[2]/div[3]/div[3]/div/dialog/div/div[1]/div/div/div[1]/div[${i}]/div[1]`,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
        const state = stateNode ? stateNode.textContent.trim() : 'Unknown City';

        const listenersNode = document.evaluate(
          `/html/body/div[4]/div/div[2]/div[5]/div/div[2]/div[1]/div/main/section/div/div[2]/div[3]/div[3]/div/dialog/div/div[1]/div/div/div[1]/div[${i}]/div[2]`,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
        const listenersText = listenersNode ? listenersNode.textContent.trim() : '0';
        const listeners = parseInt(listenersText.replace(/[^0-9]/g, '')) || 0;

        cities.push({ state, listeners });
      }

      return { artistName, monthlyListeners, imageSrc, followers, cities };
    });

    // Log results
    console.log(`Artist: ${data.artistName}`);
    console.log(`Monthly Listeners: ${data.monthlyListeners.toLocaleString()}`);
    console.log(`Image URL: ${data.imageSrc}`);
    console.log(`Followers: ${data.followers.toLocaleString()}`);
    console.log('Top 5 Cities:');
    data.cities.forEach((city, index) => {
      console.log(`  ${index + 1}. ${city.state}: ${city.listeners.toLocaleString()} listeners`);
    });

    // Close browser
    await browser.close();

    return data;
  } catch (error) {
    console.error('Error scraping data:', error.message);
    throw error;
  }
}

// Example usage
const artistId = '0htlZDCG9I8LSENteF1TyQ'; // Replace with desired Spotify Artist ID
getMonthlyListenersByArtistId(artistId);