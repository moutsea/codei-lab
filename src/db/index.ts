import { drizzle, PostgresJsDatabase, PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from './schema';
import { PgTransaction } from "drizzle-orm/pg-core";

// const globalForDb = globalThis as unknown as {
//     dbInstance?: ReturnType<typeof drizzle>;
// };

// 2. 确保这里的类型定义是正确的，特别是 `typeof schema`
const globalForDb = globalThis as unknown as {
    dbInstance: PostgresJsDatabase<typeof schema> | undefined;
};

// 3. 确保你的类型定义和下面完全一致
type TransactionClient = PgTransaction<PostgresJsQueryResultHKT, typeof schema, any>;
type FullDbClient = PostgresJsDatabase<typeof schema>;
export type DbClient = FullDbClient | TransactionClient;


export function db() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error("DATABASE_URL is not set");
    }
    // Node.js environment
    if (!globalForDb.dbInstance) {
        const client = postgres(databaseUrl, {
            max: 10,
            idle_timeout: 30,
            connect_timeout: 10,
        });
        globalForDb.dbInstance = drizzle(client, { schema });
    }

    return globalForDb.dbInstance;
}