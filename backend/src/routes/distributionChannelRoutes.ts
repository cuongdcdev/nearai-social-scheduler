import { Router } from 'express';
import { AppDataSource } from '../dataSource';
import { DistributionChannel } from '../entities/DistributionChannel';

const distributionChannelRoutes = Router();

distributionChannelRoutes.get('/', async (req, res) => {
    try {
        const channelRepo = AppDataSource.getRepository(DistributionChannel);
        const channels = await channelRepo.find({
            relations: ['user']
        });
        res.json(channels);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching channels', error });
    }
});

distributionChannelRoutes.post('/', async (req, res) => {
    try {
        const { name, platformType, platformId, userId } = req.body;
        const channelRepo = AppDataSource.getRepository(DistributionChannel);
        
        // Check if channel already exists
        const existingChannel = await channelRepo.findOne({
            where: {
                platformType,
                platformId
            }
        });

        if (existingChannel) {
            return res.status(200).json({ message: 'Channel already exists' });
        }
        
        const channel = channelRepo.create({
            name,
            platformType,
            platformId,
            user: { id: userId }
        });
        
        await channelRepo.save(channel);
        res.status(201).json(channel);
    } catch (error) {
        res.status(500).json({ message: 'Error creating channel', error });
    }
});

export default distributionChannelRoutes;