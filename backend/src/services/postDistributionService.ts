import { AppDataSource } from '../dataSource';
import { Post } from '../entities/Post';
import { SourceChannel } from '../entities/SourceChannels';
import { UserSourcePreference } from '../entities/UserSourcePreference';
import { translateWithNearAI } from './NearAI';

interface PostProcessingConfig {
    translationPrompt?: string;
    filters?: {
        keywords?: string[];
        minLength?: number;
        maxLength?: number;
    };
}

export class PostDistributionService {
    private static async shouldProcessPost(
        content: string,
        filters?: string
    ): Promise<boolean> {
        if (!filters) return true;

        const filterConfig = JSON.parse(filters);

        // Check content length
        if (filterConfig.minLength && content.length < filterConfig.minLength) {
            return false;
        }
        if (filterConfig.maxLength && content.length > filterConfig.maxLength) {
            return false;
        }

        // Check keywords
        if (filterConfig.keywords?.length > 0) {
            const hasKeyword = filterConfig.keywords.some((keyword: string) =>
                content.toLowerCase().includes(keyword.toLowerCase())
            );
            if (!hasKeyword) return false;
        }

        return true;
    }

    private static async createPostForUser(
        originalContent: string,
        sourceMessage: any,
        preference: UserSourcePreference,
    ): Promise<Post | null> {
        try {
            // Check if post matches user's filters
            if (!await this.shouldProcessPost(originalContent, preference.filters)) {
                return null;
            }

            // Translate content based on user preference
            const translatedContent = preference.autoTranslate
                ? await translateWithNearAI(originalContent, preference.translationPrompt)
                : originalContent;
            console.log('custom fetch inverval in secs:', preference.customFetchIntervalSeconds);

            // Find the user's most recent scheduled post
            const postRepo = AppDataSource.getRepository(Post);
            const lastPost = await postRepo.findOne({
                where: { userId: preference.user.id },
                order: { scheduledAt: 'DESC', id: 'DESC' }
            });

            // Calculate scheduledAt time
            let postScheduledAt: Date;

            if (lastPost) {
                let basetime = lastPost.scheduledAt.getTime() > Date.now() ? lastPost.scheduledAt.getTime(): Date.now();
                // If user has previous posts, schedule after their last post + interval
                postScheduledAt = new Date(basetime + (preference.customFetchIntervalSeconds * 1000) );
            } else {
                // If this is the user's first post, schedule it run right now
                postScheduledAt = new Date( Date.now());
            }

            const post = new Post();
            post.content = translatedContent;
            post.sourceType = sourceMessage.sourceType;
            post.sourceId = sourceMessage.id;
            post.sourceUrl = sourceMessage.url;
            post.mediaUrl = sourceMessage.photo?.url;
            post.scheduledAt = postScheduledAt; 
            post.isPosted = false;
            post.userId = preference.user.id;
            console.log("new post scheduled at: ", post.scheduledAt);
            return post;
        } catch (error) {
            console.error('Error creating post for user:', error);
            return null;
        }
    }

    public static async processNewContent(
        source: SourceChannel,
        content: string,
        sourceMessage: any
    ): Promise<void> {
        const userPrefRepo = AppDataSource.getRepository(UserSourcePreference);
        const postRepo = AppDataSource.getRepository(Post);

        // Find all users tracking this source
        const userPreferences = await userPrefRepo.find({
            where: { sourceId: source.id },
            relations: ['user', 'user.distributionChannels']
        });

        // Process for each user's preferences

        for (const pref of userPreferences) {
            const post = await this.createPostForUser(content, sourceMessage, pref);

            if (post) {
                // Link post to user's distribution channels
                post.distributionChannels = pref.user.distributionChannels;
                await postRepo.save(post);
            }
        }
    }
}