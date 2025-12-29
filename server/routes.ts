import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post(api.users.create.path, async (req, res) => {
    try {
      const input = api.users.create.input.parse(req.body);
      const user = await storage.createUser(input);
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.users.get.path, async (req, res) => {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  });

  app.get(api.entries.list.path, async (req, res) => {
    const entries = await storage.getEntries();
    res.json(entries);
  });

  app.post(api.entries.create.path, async (req, res) => {
    try {
      const input = api.entries.create.input.parse(req.body);
      const entry = await storage.createEntry(input);
      res.status(201).json(entry);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Seed data
  const users = await storage.getEntries(); // Using entries to check, assuming empty
  if (users.length === 0) {
    console.log("Seeding database...");
    const testUser = await storage.createUser({ username: "testuser" });
    await storage.createEntry({ userId: testUser.id, content: "Welcome to Being and Time!" });
    console.log("Database seeded!");
  }

  return httpServer;
}
