import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { SourceChannel } from "./SourceChannels";

@Entity('user_source_preferences')
export class UserSourcePreference {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User)
    user!: User;

    @Column()
    userId!: number;

    @ManyToOne(() => SourceChannel)
    source!: SourceChannel;

    @Column()
    sourceId!: number;

    @Column({ type: 'text', nullable: true })
    translationPrompt?: string;

    @Column({ default: true })
    autoTranslate!: boolean;

    @Column({ default: 3600 })
    customFetchIntervalSeconds!: number;

    @Column({ type: 'json', nullable: true })
    filters?: string;  // JSON string for content filtering rules

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;
}