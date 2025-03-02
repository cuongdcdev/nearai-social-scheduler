import { AppDataSource } from '../../dataSource';
import { Post } from '../../entities/Post';
import { PlatformType, SourceChannel } from '../../entities/SourceChannels';
import { UserSourcePreference } from '../../entities/UserSourcePreference';
import { SourceType } from '../../types/SourceType';
import { PostDistributionService } from '../postDistributionService';
import { NodeHtmlMarkdown } from 'node-html-markdown';

// Add rate limiting utility
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const RATE_LIMIT_DELAY = 5000; // 5 seconds

// Initialize Turndown service
const htmlMdConverter = new NodeHtmlMarkdown();

interface TelegramMessage {
    id: string;
    author: string;
    date: string;
    text: string;
    html: string;
    photo?: {
        url: string;
        caption?: string;
    };
    err_msg?: string;
}

export const fetchTelegramMessages = async (channelName: string): Promise<TelegramMessage[]> => {
    try {
        // Remove @ from channel name if present
        const cleanChannelName = channelName.replace('@', '');
        
        const url = `https://telegram-channel.p.rapidapi.com/channel/message?channel=${cleanChannelName}&limit=5&max_id=999999999`;
        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY || '',
                'x-rapidapi-host': 'telegram-channel.p.rapidapi.com'
            }
        };

        const response = await fetch(url, options);
        const data = await response.json();
        
        if (data.err_msg) {
            throw new Error(`Telegram API Error: ${data.err_msg}`);
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching Telegram messages:', error);
        return [];
    }
};

export const initializeTelegramFetcher = async () => {
    console.log("Initializing Telegram fetcher");

    const sourceRepository = AppDataSource.getRepository(SourceChannel);
    const preferenceRepository = AppDataSource.getRepository(UserSourcePreference);
    const postRepository = AppDataSource.getRepository(Post);

    try {
// Get all active Telegram sources
        const sources = await sourceRepository.find({
            where: {
                platformType: PlatformType.TELEGRAM,
                isActive: true
            }
        });

        console.log(`Found ${sources.length} active Telegram sources`);

        for (const source of sources) {
            try {

                // Check if it's time to fetch this source
                if (source.nextFetchAt && source.nextFetchAt > new Date()) {
                    console.log(`Skipping source ${source.platformId} - next fetch at ${source.nextFetchAt}`);
                    continue;
                }
                                
                await sleep(RATE_LIMIT_DELAY);
                const messages = await fetchTelegramMessages(source.platformId);
                console.log("TelegramFetcher total messages from API: ", messages.length);
                for (const message of messages) {
                    if (source.lastFetchedId && message.id <= source.lastFetchedId) {
                        continue;
                    }

                    // Convert HTML to Markdown
                    // const formatedContent = htmlMdConverter.translate(message.html || '');
                    const rawContent = message.html;

                    await PostDistributionService.processNewContent(
                        source,
                        rawContent,
                        {
                            id: message.id,
                            sourceType: SourceType.TELEGRAM,
                            url: `https://t.me/${source.platformId}/${message.id}`,
                            photo: message.photo
                        }
                    );
                }

                // Update source metadata
                if (messages.length > 0) {
                    source.lastFetchedId = messages[0].id;
                    source.lastFetchAt = new Date();
                    source.nextFetchAt = new Date(Date.now() + source.fetchIntervalSeconds * 1000);
                    source.errorCount = 0;
                    source.lastErrorMessage = '';
                    await sourceRepository.save(source);
                    console.log(`Updated source ${source.platformId} metadata, next fetch at ${source.nextFetchAt}`);
                }
            } catch (error:any) {
                  // Update error tracking
                  source.errorCount = (source.errorCount || 0) + 1;
                  source.lastErrorAt = new Date();
                  source.lastErrorMessage = error.message;
                  await sourceRepository.save(source);
                
                  
                console.error(`Error processing source ${source.platformId}:`, error);
            }
        }
    } catch (error) {
        console.error('Failed to initialize Telegram fetcher:', error);
        throw error;
    }
};

// Add a rate-limited version for manual testing
export const fetchTelegramMessagesWithRateLimit = async (channelName: string): Promise<TelegramMessage[]> => {
    await sleep(RATE_LIMIT_DELAY);
    return fetchTelegramMessages(channelName);
};