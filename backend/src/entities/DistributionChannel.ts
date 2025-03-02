import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany } from "typeorm";
import { User } from "./User";
import { Post } from "./Post";

@Entity()
export class DistributionChannel {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    platformType!: string;  // 'telegram', 'discord', etc.

    @Column()
    platformId!: string;    // telegramId, discordChannelId, etc.

    @Column({ default: true })
    isActive!: boolean;

    @ManyToOne(() => User, user => user.distributionChannels)
    user!: User;

    @ManyToMany(() => Post, post => post.distributionChannels)
    posts!: Post[];

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;
}