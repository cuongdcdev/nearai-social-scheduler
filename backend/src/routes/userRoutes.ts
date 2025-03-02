import { Router } from 'express';
import { User } from '../entities/User';
import { AppDataSource } from '../dataSource';
import { Post } from '../entities/Post';
import { UserSourcePreference } from '../entities/UserSourcePreference';
import { SourceChannel, PlatformType } from '../entities/SourceChannels';
import { Not, IsNull } from 'typeorm';
import { DistributionChannel } from '../entities/DistributionChannel';
import { In } from 'typeorm';


const userRoutes = Router();

// Get user settings
userRoutes.get('/', async (req, res) => {
    try {
        if(!req.query.userId){
            return res.status(400).json({ message: 'userId is required' });
        }
        const userId = req.query.userId;
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: Number(userId) } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error });
    }
});

// Create user
userRoutes.post('/', async (req, res) => {
    try {
        const { name, telegram_bot_token } = req.body;
        const userRepository = AppDataSource.getRepository(User);

        const user = userRepository.create({
            name,
            telegram_bot_token: req.body.telegram_bot_token ? req.body.telegram_bot_token : process.env.DEFAULT_TG_BOT_TOKEN
        });

        await userRepository.save(user);
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error });
    }
});

// Get user by ID
userRoutes.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({
            where: { id: Number(id) },
            // relations: ['distributionChannels', 'sourcePreferences']
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error });
    }
});

// Update user
userRoutes.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: Number(id) } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name;

        await userRepository.save(user);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error });
    }
});

// Get user's distribution channels
userRoutes.get('/:id/distribution-channels', async (req, res) => {
    try {
        const { id } = req.params;
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({
            where: { id: Number(id) },
            relations: ['distributionChannels']
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user.distributionChannels);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user distribution channels', error });
    }
});

// Delete a distribution channel
userRoutes.delete('/:userId/distribution-channels/:channelId', async (req, res) => {
    try {
        const { userId, channelId } = req.params;
        const userRepository = AppDataSource.getRepository(User);
        const channelRepository = AppDataSource.getRepository(DistributionChannel);
        
        // Find user
        const user = await userRepository.findOne({ 
            where: { id: Number(userId) } 
        });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Find the channel
        const channel = await channelRepository.findOne({
            where: { 
                id: Number(channelId),
                user: { id: Number(userId) } // Make sure it belongs to this user
            }
        });
        
        if (!channel) {
            return res.status(404).json({ 
                message: 'Distribution channel not found or does not belong to this user' 
            });
        }
        
        // Delete the channel
        await channelRepository.remove(channel);
        
        res.json({ 
            message: 'Distribution channel deleted successfully',
            channelId: Number(channelId) 
        });
    } catch (error) {
        console.error('Error deleting distribution channel:', error);
        res.status(500).json({ message: 'Error deleting distribution channel', error });
    }
});

// Add a new distribution channel for a user
userRoutes.post('/:userId/distribution-channels', async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, platformId } = req.body;
        
        const platformType = "telegram";

        // Validate required fields
        if (!name  || !platformId) {
            return res.status(400).json({
                message: 'Missing required fields: name, and platformId are required'
            });
        }
        
        const userRepository = AppDataSource.getRepository(User);
        const channelRepository = AppDataSource.getRepository(DistributionChannel);
        
        // Find user
        const user = await userRepository.findOne({
            where: { id: Number(userId) }
        });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if the user already has a channel with the same platform details
        const existingChannel = await channelRepository.findOne({
            where: {
                platformType,
                platformId,
                user: { id: Number(userId) }
            }
        });
        
        if (existingChannel) {
            return res.status(409).json({
                message: 'User already has a distribution channel with these platform details',
                channel: existingChannel
            });
        }
        
        // Create new distribution channel
        const channel = channelRepository.create({
            name,
            platformType,
            platformId,
            user,
            isActive: true
        });
        
        await channelRepository.save(channel);
        
        res.status(201).json({
            message: 'Distribution channel created successfully',
            channel
        });
    } catch (error) {
        console.error('Error creating distribution channel:', error);
        res.status(500).json({ message: 'Error creating distribution channel', error });
    }
});

// Add or update source channel to a user's preferences
userRoutes.post('/:id/add-source', async (req, res) => {
    try {
        const { id } = req.params;
        var { 
            sourceId,                    // Optional - ID of existing source channel
            name,                        // Required if creating new source
            platformType,                // Required if creating new source
            platformId,                  // Required if creating new source
            fetchIntervalSeconds = 3600, // Default 1 hour for new source
            isActive = true,             // Default active for new source
            customFetchIntervalSeconds,  // Optional for updates
            autoTranslate,               // Optional for updates
            translationPrompt,           // Required for all operations
            filters = null
        } = req.body;
        
        // Validate required translationPrompt
        if (translationPrompt === undefined || translationPrompt === null) {
            return res.status(400).json({ 
                message: 'translationPrompt is required' 
            });
        }
        
        // Repositories
        const userRepository = AppDataSource.getRepository(User);
        const sourceRepository = AppDataSource.getRepository(SourceChannel);
        const prefRepository = AppDataSource.getRepository(UserSourcePreference);
        
        // Find user
        const user = await userRepository.findOne({ where: { id: Number(id) } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Find or create the source channel
        let source: SourceChannel | null;
        
        if (sourceId) {
            // Try to find existing source by ID
            source = await sourceRepository.findOne({ where: { id: Number(sourceId) } });
            
            if (!source) {
                return res.status(404).json({ message: 'Source channel not found' });
            }
        } else {
            // Create new source channel
            if (!name || !platformType || !platformId) {
                return res.status(400).json({ 
                    message: 'Missing required fields for creating a new source channel' 
                });
            }
            
            // Check if source with same platform details already exists
            const existingSource = await sourceRepository.findOne({
                where: {
                    platformType,
                    platformId
                }
            });
            
            if (existingSource) {
                // Use existing source if found
                source = existingSource;
            } else {
                // Create new source
                source = sourceRepository.create({
                    name,
                    platformType,
                    platformId,
                    fetchIntervalSeconds,
                    isActive,
                    lastFetchAt: new Date(),
                    nextFetchAt: new Date(Date.now() + fetchIntervalSeconds * 1000)
                });
                
                await sourceRepository.save(source);
            }
        }
        
        // Check if the user already has this source
        const existingPref = await prefRepository.findOne({
            where: {
                user: { id: user.id },
                source: { id: source.id }
            }
        });
        
        let preference: UserSourcePreference;
        let isUpdate = false;
        
        if (existingPref) {
            // Update the existing preference
            preference = existingPref;
            isUpdate = true;
            
            // Always update translationPrompt since it's required
            preference.translationPrompt = translationPrompt;
            
            // Only update optional fields if provided
            if (customFetchIntervalSeconds !== undefined) {
                preference.customFetchIntervalSeconds = customFetchIntervalSeconds;
            }
            
            if (autoTranslate !== undefined) {
                preference.autoTranslate = autoTranslate;
            }
            
            // Only update filters if provided
            if (filters !== null) {
                preference.filters = filters;
            }
        } else {
            // For new preferences, set defaults for optional fields
            const finalCustomFetchInterval = 
                customFetchIntervalSeconds !== undefined ? 
                customFetchIntervalSeconds : 3600;
                
            const finalAutoTranslate = 
                autoTranslate !== undefined ? 
                autoTranslate : false;

            //if translationPrompt is not provided, get user's last translation prompt to fill in
            if (!translationPrompt) {
                const lastPref = await prefRepository.findOne({
                    where: { user: { id: user.id } },
                    order: { id: 'DESC' }
                });
                translationPrompt = lastPref ? lastPref.translationPrompt : '';
            }
            // Create the new preference
            preference = prefRepository.create({
                user,
                source,
                customFetchIntervalSeconds: finalCustomFetchInterval,
                autoTranslate: finalAutoTranslate,
                translationPrompt, // Already validated as required
                filters
            });
        }
        
        // Save the preference (both for update and create)
        await prefRepository.save(preference);
        
        // Return the preference with source details
        const savedPref = await prefRepository.findOne({
            where: { id: preference.id },
            relations: ['source'],
            select: {
                id: true,
                customFetchIntervalSeconds: true,
                autoTranslate: true,
                translationPrompt: true,
                filters: true,
                createdAt: true,
                updatedAt: true,
                source: {
                    id: true,
                    name: true,
                    platformType: true,
                    platformId: true,
                    isActive: true,
                    fetchIntervalSeconds: true
                }
            }
        });
        
        res.status(isUpdate ? 200 : 201).json({
            message: isUpdate ? 'Source preference updated' : 'Source preference created',
            preference: savedPref
        });
    } catch (error) {
        console.error('Error adding/updating source preference:', error);
        res.status(500).json({ message: 'Error adding/updating source preference', error });
    }
});

// Get user's posts
// Get user's posts with optional filter for unposted content
userRoutes.get('/:id/posts', async (req, res) => {
    try {
        const { id } = req.params;
        const { unpostedOnly } = req.query;
        const postRepository = AppDataSource.getRepository(Post);
        
        // Build where condition based on query parameters
        const whereCondition: any = { user: { id: Number(id) } };
        
        // Add filter for unposted content if requested
        if (unpostedOnly === 'true') {
            whereCondition.isPosted = false;
        }
        
        const posts = await postRepository.find({
            where: whereCondition,
            relations: ['distributionChannels'],
            order: { 
                scheduledAt: 'ASC',  // Show upcoming posts first when filtering unposted
                id: 'DESC'           // For posts with same schedule time, show newest first
            }
        });

        res.json(posts);
    } catch (error) {
        console.error('Error fetching user posts:', error);
        res.status(500).json({ message: 'Error fetching user posts', error });
    }
});

// Get user's source preferences
userRoutes.get('/:id/source-preferences', async (req, res) => {
    try {
        const { id } = req.params;
        const preferenceRepository = AppDataSource.getRepository(UserSourcePreference);
        const preferences = await preferenceRepository.find({
            where: { user: { id: Number(id) } },
            relations: ['source'],
            select: {
                id: true,
                customFetchIntervalSeconds: true,
                autoTranslate: true,
                translationPrompt: true,
                // filters: true,
                createdAt: true,
                updatedAt: true,
                source: {
                    id: true,
                    name: true,
                    platformType: true,
                    platformId: true,
                    isActive: true
                }
            }
        });

        res.json(preferences);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user source preferences', error });
    }
});



// Create a post for a user, post to distribution channels
userRoutes.post('/:id/new-post', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            content, 
            scheduledAt = null, 
            distributionChannelIds = [] 
        } = req.body;
        
        // Validate required fields
        if (!content || distributionChannelIds.length === 0) {
            return res.status(400).json({ message: 'Post content and distribution channels are required' });
        }
        
        const userRepository = AppDataSource.getRepository(User);
        const postRepository = AppDataSource.getRepository(Post);
        const channelRepository = AppDataSource.getRepository(DistributionChannel);
        
        // Find user
        const user = await userRepository.findOne({ where: { id: Number(id) } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Create new post
        const post = postRepository.create({
            content,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(), // Use provided time or now
            isPosted: false,
            userId: user.id,
            user
        });
        
        // Add distribution channels if specified
        if (distributionChannelIds.length > 0) {
            // Fetch only channels that belong to this user
            const channels = await channelRepository.find({
                where: {
                    id: In(distributionChannelIds),
                    user: { id: user.id }
                }
            });
            
            if (channels.length !== distributionChannelIds.length) {
                return res.status(400).json({ 
                    message: 'One or more distribution channels do not exist or do not belong to this user' 
                });
            }
            
            post.distributionChannels = channels;
        } else {
            // If no channels specified, use all of the user's active channels
            const channels = await channelRepository.find({
                where: {
                    user: { id: user.id },
                    isActive: true
                }
            });
            
            post.distributionChannels = channels;
        }
        
        // Save the post
        await postRepository.save(post);
        
        // Return the created post with distribution channels
        const savedPost = await postRepository.findOne({
            where: { id: post.id },
            relations: ['distributionChannels']
        });
        
        res.status(201).json({
            message: 'Post created successfully',
            post: savedPost
        });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ message: 'Error creating post', error });
    }
});

// Delete a post
userRoutes.delete('/:userId/posts/:postId', async (req, res) => {
    try {
        const { userId, postId } = req.params;
        const userRepository = AppDataSource.getRepository(User);
        const postRepository = AppDataSource.getRepository(Post);
        
        // Find user
        const user = await userRepository.findOne({ 
            where: { id: Number(userId) } 
        });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Find the post and ensure it belongs to this user
        const post = await postRepository.findOne({
            where: { 
                id: Number(postId),
                user: { id: Number(userId) } // Make sure it belongs to this user
            },
            relations: ['distributionChannels']
        });
        
        if (!post) {
            return res.status(404).json({ 
                message: 'Post not found or does not belong to this user' 
            });
        }
        
        // If post is already published, prevent deletion
        if (post.isPosted) {
            return res.status(400).json({ 
                message: 'Cannot delete a post that has already been published' 
            });
        }
        
        // Delete the post
        await postRepository.remove(post);
        
        res.json({ 
            message: 'Post deleted successfully',
            postId: Number(postId) 
        });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'Error deleting post', error });
    }
});

//update user telegram bot token
userRoutes.put('/update-bot-token/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { telegram_bot_token } = req.body;

        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: Number(id) } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Only update allowed fields
        if (telegram_bot_token) user.telegram_bot_token = telegram_bot_token;

        await userRepository.save(user);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error });
    }
});

//get source channels of a user id
userRoutes.get('/:id/source-channels', async (req, res) => {
    try {
        const { id } = req.params;
        const preferenceRepository = AppDataSource.getRepository(UserSourcePreference);

        // Get preferences with source data
        const preferences = await preferenceRepository.find({
            where: { user: { id: Number(id) } },
            relations: ['source'],
            select: {
                id: true,
                customFetchIntervalSeconds: true,
                autoTranslate: true,           // Include autoTranslate flag
                translationPrompt: true,       // Include translation prompt
                filters: true,
                createdAt: true,
                updatedAt: true,
                source: {
                    id: true,
                    name: true,
                    platformType: true,
                    platformId: true,
                    isActive: true,
                    fetchIntervalSeconds: true
                }
            }
        });

        if (preferences.length === 0) {
            // If no preferences found, check if the user exists
            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOne({ where: { id: Number(id) } });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // User exists but has no source preferences
            return res.json([]);
        }

        res.json(preferences);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user source channels', error });
    }
});
export default userRoutes;