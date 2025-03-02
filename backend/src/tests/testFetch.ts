import { fetchTelegramMessagesWithRateLimit } from '../services/fetchers/telegramFetcher';
import dotenv from 'dotenv';

dotenv.config();

async function testFetch() {
    console.log('Fetching first batch...');
    const messages1 = await fetchTelegramMessagesWithRateLimit('telegram');
    console.log('First batch received');
    
    console.log('Fetching second batch...');
    const messages2 = await fetchTelegramMessagesWithRateLimit('telegram');
    console.log('Second batch received');
    
    console.log(JSON.stringify({ messages1, messages2 }, null, 2));
}

testFetch();