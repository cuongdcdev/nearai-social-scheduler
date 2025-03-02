import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, ManyToOne } from "typeorm";
import { DistributionChannel } from "./DistributionChannel";
import { User } from "./User";

@Entity('post')
export class Post {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('text')
    content!: string;

    @Column({ nullable: true })
    mediaUrl?: string;

    @Column({ type: 'datetime' })
    scheduledAt!: Date;

    @Column({ default: false })
    isPosted!: boolean;

    @Column({  
        type: 'text',  
        nullable: true 
    })
    sourceType?: string;

    @Column({ nullable: true })
    sourceId?: string;    // Original post ID from source

    @Column({ nullable: true })
    sourceUrl?: string;   // Original post URL

    @ManyToMany(() => DistributionChannel, channel => channel.posts)
    @JoinTable({
        name: "post_distribution_channels",
        joinColumn: {
            name: "postId",
            referencedColumnName: "id"
        },
        inverseJoinColumn: {
            name: "channelId",
            referencedColumnName: "id"
        }
    })
    distributionChannels!: DistributionChannel[];

    @ManyToOne(() => User, user => user.posts, { nullable: false })
    user!: User;

    @Column()
    userId!: number;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;
}