# README for Social Media Scheduler

## Overview

The Social Media Scheduler is an application designed to automate the posting of content to a Telegram group. It collects posts from multiple sources, schedules them, and posts them at specified times using a Telegram bot.

## Features

- **User-friendly Interface**: Easy navigation and management of scheduled posts.
- **Scheduling Posts**: Create and manage scheduled content effortlessly.
- **Post Overview**: View a list of scheduled and published posts.
- **Settings Configuration**: Configure application settings, including Telegram bot credentials.

## Project Structure

```
social-media-scheduler
├── src
│   ├── app
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── schedule
│   │   │   └── page.tsx
│   │   ├── posts
│   │   │   └── page.tsx
│   │   └── settings
│   │       └── page.tsx
│   ├── components
│   │   ├── ui
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Card.tsx
│   │   ├── ScheduleForm.tsx
│   │   ├── PostList.tsx
│   │   └── Navigation.tsx
│   ├── types
│   │   └── index.ts
│   └── lib
│       ├── utils.ts
│       └── api.ts
├── public
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Getting Started

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd social-media-scheduler
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Run the application:
   ```
   npm run dev
   ```

5. Open your browser and go to `http://localhost:3000` to view the application.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.