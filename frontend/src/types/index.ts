// src/types/index.ts

export interface Post {
    id: string;
    title: string;
    content: string;
    scheduledTime: Date;
    status: 'scheduled' | 'published' | 'cancelled';
}

export interface UserSettings {
    telegramBotToken: string;
    scheduleFrequency: number; // in minutes
}

export interface ScheduleFormData {
    title: string;
    content: string;
    scheduledTime: Date;
}