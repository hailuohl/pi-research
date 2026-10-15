import { ResearchApp } from '../../packages/research-app.js';
const [dataDir, repoRoot, taskId, rawGeneration] = process.argv.slice(2), generation = Number(rawGeneration);
if (!dataDir || !repoRoot || !taskId || !Number.isSafeInteger(generation) || generation < 1)
    throw Error('Expected a fixed literature task and generation');
const app = new ResearchApp(dataDir, repoRoot);
try {
    await app.literatureTasks.execute(taskId, generation);
}
finally {
    await app.compute.stop();
    await app.git.stop();
    app.close();
}
//# sourceMappingURL=index.js.map