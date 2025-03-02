// src/lib/constants.ts
export const DUMMY_POSTS = [
  {
    id: 1,
    title: 'First Scheduled Post',
    content: 'This is the content of the first post that will be published automatically.',
    scheduledFor: '2024-01-20T10:00:00Z',
    status: 'scheduled',
    channels: ['telegram-channel-1']
  },
  {
    id: 2,
    title: 'Second Scheduled Post',
    content: 'Content for the second scheduled post with some important information.',
    scheduledFor: '2024-01-21T08:30:00Z',
    status: 'scheduled',
    channels: ['telegram-channel-1', 'telegram-channel-2']
  },
  {
    id: 3,
    title: 'Third Scheduled Post',
    content: 'Content for the third scheduled post that contains updates about product features.',
    scheduledFor: '2024-01-20T12:00:00Z',
    status: 'scheduled',
    channels: ['telegram-channel-2']
  }
];

export const DUMMY_SOURCE_CHANNELS = [
  {
    id: 1,
    name: 'Tech News Twitter',
    type: 'twitter',
    connectionStatus: 'active',
    lastSync: '2024-01-18T14:30:00Z'
  },
  {
    id: 2,
    name: 'Product Updates Medium',
    type: 'medium',
    connectionStatus: 'active',
    lastSync: '2024-01-17T09:15:00Z'
  },
  {
    id: 3,
    name: 'Industry Updates Medium',
    type: 'medium',
    connectionStatus: 'active',
    lastSync: '2024-01-19T11:45:00Z'
  }
];

export const DUMMY_DISTRIBUTION_CHANNELS = [
  {
    id: 1,
    name: 'Main Telegram Channel',
    type: 'telegram',
    connectionStatus: 'active',
    subscriberCount: 1250
  },
  {
    id: 2,
    name: 'Tech Updates Channel',
    type: 'telegram',
    connectionStatus: 'active',
    subscriberCount: 875
  }
];