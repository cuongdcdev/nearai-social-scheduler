import { AppDataSource } from '../dataSource';
import { Telegraf } from 'telegraf';
import cron from 'node-cron';
import { Post } from '../entities/Post';
import { User } from '../entities/User';

const {convert:html2Text} = require('html-to-text');

function escapeMarkdown(text: string): string {
    return text
        .replace(/[_[\]()~`>#+\-=|{}.!]/g, '\\$&') // Escape special characters
        //replace ** too
        .replace(/\*\*/g, '')
        .replace(/\n/g, '\n'); 
}

function addCredit(text: string): string {
    return text + '\n\n' + ' 🤖 Powered by [NEAR AI FE_Man](https://app.near.ai/agents/cuongdcdev.near/ironman/latest)';
}

export const initializeScheduler = async () => {
    try {
        const userRepo = AppDataSource.getRepository(User);
        const users = await userRepo.find({
            relations: ['distributionChannels']
        });

        for (const user of users) {
            if (!user.telegram_bot_token) continue;

            const bot = new Telegraf(user.telegram_bot_token);

            cron.schedule('* * * * *', async () => {
                try {
                    const postRepo = AppDataSource.getRepository(Post);
                    const pendingPosts = await postRepo
                        .createQueryBuilder('post')
                        .leftJoinAndSelect('post.distributionChannels', 'channel')
                        .where('channel.user = :userId', { userId: user.id })
                        .andWhere('post.isPosted = :isPosted', { isPosted: false })
                        .getMany();

                    console.log(`Found ${pendingPosts.length} pending posts for user ${user.id}`);

                    for (const post of pendingPosts) {
                        //if scheduledAt is on the future, skip
                        if (post.scheduledAt.getTime() > Date.now()) {
                            console.log(`Post scheduled for future ${post.scheduledAt}, skipping`);
                            continue;
                        }
                        try {
                            for (const channel of post.distributionChannels) {

                                if (channel.platformType === 'telegram') {
                                    const plainText = html2Text(post.content, {
                                        wordwrap: false,
                                        preserveNewlines: true
                                    });
                                    
                                    const finalContent = (escapeMarkdown(addCredit(plainText)));

                                    if (post.mediaUrl && finalContent.length < 1020 ) {
                                        await bot.telegram.sendPhoto(
                                            channel.platformId,
                                            post.mediaUrl,
                                            { 
                                                caption: finalContent,
                                                parse_mode: 'MarkdownV2'
                                            }
                                        );
                                    } else {
                                        await bot.telegram.sendMessage(
                                            channel.platformId,
                                            finalContent,
                                            { parse_mode: 'MarkdownV2' }
                                        );
                                    }
                                } //telegram source 

                                // other platform sources
                            }

                            post.isPosted = true;
                            await postRepo.save(post);
                        } catch (error) {
                            console.error(`Error posting to channels: ${error}`);
                            // Mark post as failed
                            post.isPosted = true;
                            await postRepo.save(post);
                        }
                    }
                } catch (error) {
                    console.error(`Scheduler error for user ${user.id}: ${error}`);
                }
            });
        }
    } catch (error) {
        console.error('Failed to initialize scheduler:', error);
    }
};

