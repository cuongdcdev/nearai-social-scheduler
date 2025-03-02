import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany } from "typeorm";
import { User } from "./User";
import { UserSourcePreference } from "./UserSourcePreference";

export enum PlatformType {
    TWITTER = 'twitter',
    TELEGRAM = 'telegram',
    MEDIUM = 'medium'
}

@Entity('source_channel')
export class SourceChannel {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({
        type: 'text'  // Using text for SQLite compatibility
    })
    platformType!: PlatformType | string;

    @Column()
    platformId!: string;  // Twitter username, Telegram channel ID, etc.

    @Column({ nullable: true })
    lastFetchedId?: string;  // Last tweet ID, telegram message ID, etc.

    @Column({ type: 'datetime', nullable: true })
    lastFetchAt?: Date ;

    @Column({ type: 'datetime', nullable: true })
    nextFetchAt?: Date;

    @Column({ default: 3600 })  // Default 1 hour
    fetchIntervalSeconds!: number;

    @Column({ default: true })
    isActive!: boolean;

    @ManyToMany(() => User, user => user.sourcesTracked)
    trackedBy!: User[];

    @OneToMany(() => UserSourcePreference, preference => preference.source)
    userPreferences!: UserSourcePreference[];

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;

    @Column({ type: 'json', nullable: true })
    fetchConfig?: string;  // Store platform-specific fetch config as JSON

    @Column({ type: 'integer', default: 0 })
    errorCount!: number;

    @Column({ type: 'datetime', nullable: true })
    lastErrorAt?: Date;

    @Column({ type: 'text', nullable: true })
    lastErrorMessage?: string;
}