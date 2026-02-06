import type { Context } from 'hono';
import { db } from '../db/index.js';
import { projects, githubStats } from '../db/schema.js';
import { fetchGithubProjectStats } from '../services/github.service.js';

export const syncGithubData = async (c: Context) => {
  const allProjects = await db.select().from(projects);
  
  let successCount = 0;
  let errorCount = 0;

  for (const project of allProjects) {
    if (!project.repoUrl) continue;

    const stats = await fetchGithubProjectStats(project.repoUrl);

    if (stats) {
      await db.insert(githubStats)
        .values({
          projectId: project.id,
          stars: stats.stars,
          languages: stats.languages,
          topics: stats.topics,
          syncedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: githubStats.projectId,
          set: {
            stars: stats.stars,
            languages: stats.languages,
            topics: stats.topics,
            syncedAt: new Date(),
          },
        });

      successCount++;
    } else {
      errorCount++;
    }
  }

  return c.json({ 
    success: true, 
    updated: successCount, 
    failed: errorCount,
    message: 'Sincronização finalizada com sucesso'
  });
};