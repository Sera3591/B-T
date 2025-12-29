import { db } from "./db";
import {
  users, entries,
  type InsertUser, type User,
  type InsertEntry, type Entry
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getEntries(): Promise<Entry[]>;
  createEntry(entry: InsertEntry): Promise<Entry>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getEntries(): Promise<Entry[]> {
    return await db.select().from(entries);
  }

  async createEntry(insertEntry: InsertEntry): Promise<Entry> {
    const [entry] = await db.insert(entries).values(insertEntry).returning();
    return entry;
  }
}

export const storage = new DatabaseStorage();
