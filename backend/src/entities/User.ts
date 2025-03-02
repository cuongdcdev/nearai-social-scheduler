import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany } from "typeorm";
import { DistributionChannel } from "./DistributionChannel";
import { SourceChannel } from "./SourceChannels";
import { UserSourcePreference } from "./UserSourcePreference";
import { Post } from "./Post";

@Entity('user')
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    telegram_bot_token!: string;

    @OneToMany(() => DistributionChannel, channel => channel.user)
    distributionChannels!: DistributionChannel[];

    @OneToMany( ()=>Post, post => post.user )
    posts!: Post[];

    @ManyToMany(() => SourceChannel, source => source.trackedBy)
    sourcesTracked!: SourceChannel[];

    @OneToMany(() => UserSourcePreference, preference => preference.user)
    sourcePreferences!: UserSourcePreference[];

    @Column({ type: 'boolean', default: true })
    enableTranslation!: boolean;

    @Column({ type: 'json', nullable: true })
    translationPreferences?: string;  // Store user's translation preferences as JSON

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;
}