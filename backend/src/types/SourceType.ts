export const SourceType = {
    TWITTER: 'twitter',
    TELEGRAM: 'telegram',
    MEDIUM: 'medium'
} as const;

export type SourceType = typeof SourceType[keyof typeof SourceType];