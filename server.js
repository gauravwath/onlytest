import cors from 'cors';
import express from 'express';
import axios from 'axios';
import UserAgent from 'user-agents';

const baseURL = 'https://www.nseindia.com/';

const getOptionsWithUserAgent = () => {
  const userAgent = new UserAgent();
  return {
    headers: {
      "Accept": "*/*",
      "User-Agent": userAgent.toString(),
      "Connection": "keep-alive",
    },
    timeout: 6000
  };
};

const app = express();

const MAX_RETRY_COUNT = 3;

const getOptionChainWithRetry = async (cookie, identifier, retryCount = 0) => {
  const isIndex = ["NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY"].includes(identifier);
  const apiEndpoint = "api/option-chain-" + (isIndex ? "indices" : "equities");
  const options = getOptionsWithUserAgent();
  try {
    const url = baseURL + apiEndpoint + "?symbol=" + encodeURIComponent(identifier);
    const response = await axios.get(url, { ...options, headers: { ...options.headers, Cookie: cookie } });
    return response.data;
  } catch (error) {
    console.error(`Error fetching option chain. Retry count: ${retryCount}`, error);
    if (retryCount < MAX_RETRY_COUNT) {
      return getOptionChainWithRetry(cookie, identifier, retryCount + 1);
    } else {
      throw new Error('Failed to fetch option chain after multiple retries');
    };
  };
};


const getOptionChainWithRetry_Test = async (cookie, identifier, retryCount = 0) => {
  const isIndex = ["NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY"].includes(identifier);
  const apiEndpoint = "api/option-chain-" + (isIndex ? "indices" : "equities");
  const options = getOptionsWithUserAgent();
  try {
    const url = baseURL  + "/api/quote-equity?symbol="+ encodeURIComponent(identifier);
    console.log(url)
    const response = await axios.get(url, { ...options, headers: { ...options.headers, Cookie: cookie } });
    return response.data;
  } catch (error) {
    console.error(`Error fetching option chain. Retry count: ${retryCount}`, error);
    if (retryCount < MAX_RETRY_COUNT) {
      return getOptionChainWithRetry_Test(cookie, identifier, retryCount + 1);
    } else {
      throw new Error('Failed to fetch option chain after multiple retries');
    };
  };
};


const getmarketStatus_Test = async (cookie, retryCount = 0) => {
  const options = getOptionsWithUserAgent();
  try {
    const url = baseURL  + "/api/marketStatus";
    console.log(url)
    const response = await axios.get(url, { ...options, headers: { ...options.headers, Cookie: cookie } });
    return response.data;
  } catch (error) {
    console.error(`Error fetching option chain. Retry count: ${retryCount}`, error);
    if (retryCount < MAX_RETRY_COUNT) {
      return getmarketStatus_Test(cookie, retryCount + 1);
    } else {
      throw new Error('Failed to fetch option chain after multiple retries');
    };
  };
};

const getCookiesWithRetry = async () => {
  const options = getOptionsWithUserAgent();
  try {
    const response = await axios.get(baseURL, options);
    const cookie = response.headers['set-cookie'];
    return cookie;
  } catch (error) {
    console.error('Error fetching cookies:');
    throw new Error('Failed to fetch cookies');
  };
};

const whitelist = ['/']//['http://localhost:5173,*/*']
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      //callback(new Error('Not allowed by CORS'))
      callback(null, true)
    }
  }
};

app.get('/', cors(corsOptions), async (req, res) => {
  const now = new Date();
  const time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
  console.log(`Request received at ${time}`);

  const { identifier } = req.query;

  if (!identifier) {
    res.status(400).json({ error: 'Invalid request. No identifier was given.' });
    return;
  };

  try {
    const cookie = await getCookiesWithRetry();
    const data = await getOptionChainWithRetry(cookie, identifier.toUpperCase());
    res.json(data).status(200).end();
  } catch (error) {
    console.error('Proxy request error: here', error);
    res.status(500).json({ error: 'Proxy request failed.' });
  };
});
// npm run dev
//http://localhost:6123/?identifier=ABB
//http://localhost:6123/api/equity/?identifier=infy

app.get('/api/equity/', cors(corsOptions), async (req, res) => {
  const now = new Date();
  const time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
  console.log(`Request received at ${time}`);

  const { identifier } = req.query;

  if (!identifier) {
    res.status(400).json({ error: 'Invalid request. No identifier was given.' });
    return;
  }; 

  try {
    const cookie = await getCookiesWithRetry();
    const data = await getOptionChainWithRetry_Test(cookie, identifier.toUpperCase());
    res.json(data).status(200).end();
  } catch (error) {
    console.error('Proxy request error: here', error);
    res.status(500).json({ error: 'Proxy request failed.' });
  };
});

//http://localhost:6123/api/marketStatus
app.get('/api/marketStatus/', cors(corsOptions), async (req, res) => {
  const now = new Date();
  const time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
  console.log(`Request received at ${time}`);

  try {
    const cookie = await getCookiesWithRetry();
    const data = await getmarketStatus_Test(cookie);
    res.json(data).status(200).end();
  } catch (error) {
    console.error('Proxy request error: here', error);
    res.status(500).json({ error: 'Proxy request failed.' });
  };
});



app.listen(6123, () => {
  console.log('Server running on port 6123');
});
