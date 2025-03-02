import { Router } from 'express';
import { AppDataSource } from '../dataSource';
import { SourceChannel, PlatformType } from '../entities/SourceChannels';
import { UserSourcePreference } from '../entities/UserSourcePreference';
import { User } from '../entities/User';

const sourceChannelRoutes = Router();

// Get all source channels
sourceChannelRoutes.get('/', async (req, res) => {
    try {
        const sourceRepo = AppDataSource.getRepository(SourceChannel);
        const sources = await sourceRepo.find();
        res.json(sources);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching source channels', error });
    }
});

// Get a specific source channel
sourceChannelRoutes.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sourceRepo = AppDataSource.getRepository(SourceChannel);
        const source = await sourceRepo.findOne({ 
            where: { id: Number(id) },
            relations: ['userPreferences', 'userPreferences.user']
        });
        
        if (!source) {
            return res.status(404).json({ message: 'Source channel not found' });
        }
        
        res.json(source);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching source channel', error });
    }
});

// Create a new source channel
sourceChannelRoutes.post('/', async (req, res) => {
    try {
        const { 
            name, 
            platformType, 
            platformId, 
            fetchIntervalSeconds = 3600,
            isActive = true
        } = req.body;
        
        const sourceRepo = AppDataSource.getRepository(SourceChannel);
        
        // Check if source already exists
        const existingSource = await sourceRepo.findOne({
            where: {
                platformType,
                platformId
            }
        });
        
        if (existingSource) {
            return res.status(409).json({ 
                message: 'Source channel with this platform ID already exists',
                source: existingSource 
            });
        }
        
        const source: SourceChannel = sourceRepo.create({
            name,
            platformType,
            platformId,
            fetchIntervalSeconds,
            isActive,
            lastFetchAt: undefined,
            nextFetchAt: new Date()
        });
        
        await sourceRepo.save(source);
        res.status(201).json(source);
    } catch (error) {
        res.status(500).json({ message: 'Error creating source channel', error });
    }
});

// Update a source channel
sourceChannelRoutes.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            name, 
            fetchIntervalSeconds, 
            isActive
        } = req.body;
        
        const sourceRepo = AppDataSource.getRepository(SourceChannel);
        const source = await sourceRepo.findOne({ where: { id: Number(id) } });
        
        if (!source) {
            return res.status(404).json({ message: 'Source channel not found' });
        }
        
        // Update fields
        if (name !== undefined) source.name = name;
        if (fetchIntervalSeconds !== undefined) source.fetchIntervalSeconds = fetchIntervalSeconds;
        if (isActive !== undefined) source.isActive = isActive;
        
        await sourceRepo.save(source);
        res.json(source);
    } catch (error) {
        res.status(500).json({ message: 'Error updating source channel', error });
    }
});

// Delete a source channel
sourceChannelRoutes.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sourceRepo = AppDataSource.getRepository(SourceChannel);
        const source = await sourceRepo.findOne({ where: { id: Number(id) } });
        
        if (!source) {
            return res.status(404).json({ message: 'Source channel not found' });
        }
        
        await sourceRepo.remove(source);
        res.json({ message: 'Source channel deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting source channel', error });
    }
});

// Subscribe a user to a source channel
sourceChannelRoutes.post('/:id/subscribe', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            userId,
            customFetchIntervalSeconds = 3600,
            autoTranslate = false,
            translationPrompt = null,
            filters = null
        } = req.body;
        
        const sourceRepo = AppDataSource.getRepository(SourceChannel);
        const userRepo = AppDataSource.getRepository(User);
        const prefRepo = AppDataSource.getRepository(UserSourcePreference);
        
        // Find source and user
        const source = await sourceRepo.findOne({ where: { id: Number(id) } });
        const user = await userRepo.findOne({ where: { id: Number(userId) } });
        
        if (!source) {
            return res.status(404).json({ message: 'Source channel not found' });
        }
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if preference already exists
        const existingPref = await prefRepo.findOne({
            where: {
                user: { id: user.id },
                source: { id: source.id }
            }
        });
        
        if (existingPref) {
            // Update existing preference
            existingPref.customFetchIntervalSeconds = customFetchIntervalSeconds;
            existingPref.autoTranslate = autoTranslate;
            existingPref.translationPrompt = translationPrompt;
            existingPref.filters = filters;
            
            await prefRepo.save(existingPref);
            return res.json(existingPref);
        }
        
        // Create new preference
        const preference = prefRepo.create({
            user,
            source,
            customFetchIntervalSeconds,
            autoTranslate,
            translationPrompt,
            filters
        });
        
        await prefRepo.save(preference);
        res.status(201).json(preference);
    } catch (error) {
        res.status(500).json({ message: 'Error subscribing to source channel', error });
    }
});

// Unsubscribe a user from a source channel
// Unsubscribe a user from a source channel
sourceChannelRoutes.delete('/:id/unsubscribe/:userId', async (req, res) => {
    try {
        const { id, userId } = req.params;
        const prefRepo = AppDataSource.getRepository(UserSourcePreference);
        const sourceRepo = AppDataSource.getRepository(SourceChannel);
        
        // Find the preference
        const preference = await prefRepo.findOne({
            where: {
                user: { id: Number(userId) },
                source: { id: Number(id) }
            }
        });
        
        if (!preference) {
            return res.status(404).json({ message: 'Subscription not found' });
        }
        
        // Store the source ID before removing the preference
        const sourceId = Number(id);
        
        // Remove the preference by ID instead of by entity object
        await prefRepo.delete(preference.id);
        
        // Check if there are any other users subscribed to this source
        const otherPreferencesCount = await prefRepo.count({
            where: { 
                source: { id: sourceId } 
            }
        });
        
        // If no other users are subscribed, delete the source channel
        if (otherPreferencesCount === 0) {
            // Delete by ID to avoid relation loading issues
            await sourceRepo.delete(sourceId);
            
            return res.json({ 
                message: 'Successfully unsubscribed from source channel and removed unused source',
                sourceRemoved: true
            });
        }
        
        res.json({ 
            message: 'Successfully unsubscribed from source channel',
            sourceRemoved: false
        });
    } catch (error) {
        console.error('Error unsubscribing from source channel:', error);
        res.status(500).json({ message: 'Error unsubscribing from source channel', error });
    }
});

// Get all users subscribed to a source channel
sourceChannelRoutes.get('/:id/subscribers', async (req, res) => {
    try {
        const { id } = req.params;
        const prefRepo = AppDataSource.getRepository(UserSourcePreference);
        
        const preferences = await prefRepo.find({
            where: { source: { id: Number(id) } },
            relations: ['user']
        });
        
        // Extract just the user data
        const subscribers = preferences.map(pref => pref.user);
        
        res.json(subscribers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching subscribers', error });
    }
});

export default sourceChannelRoutes;