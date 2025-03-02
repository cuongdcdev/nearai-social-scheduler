import { DataSource } from "typeorm"
import { User } from "./entities/User"
import { Post } from "./entities/Post"
import { DistributionChannel } from "./entities/DistributionChannel"
import { SourceChannel } from "./entities/SourceChannels"
import { UserSourcePreference } from "./entities/UserSourcePreference"
// import { CreateSourceChannels1708848000000 } from "./migrations/CreateSourceChannels1708848000000"

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "database.sqlite",
    synchronize: true,
    logging: true,
    entities: [User, Post, DistributionChannel, SourceChannel,UserSourcePreference],
    subscribers: [],
    migrations: [],
})