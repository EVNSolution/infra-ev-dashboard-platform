import * as fs from 'node:fs';
import * as path from 'node:path';

describe('deploy workflow bootstrap precheck gate', () => {
  test('keeps bootstrap precheck before deploy and post-deploy smoke after deploy', () => {
    const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'deploy-ecs.yml');
    const workflowSource = fs.readFileSync(workflowPath, 'utf8');

    const preflightIndex = workflowSource.indexOf('- name: Run preflight gate');
    const testsIndex = workflowSource.indexOf('- name: Run unit tests');
    const synthIndex = workflowSource.indexOf('- name: Synthesize stack');
    const bootstrapPrecheckIndex = workflowSource.indexOf('- name: Run bootstrap precheck');
    const deployIndex = workflowSource.indexOf('- name: Deploy stack');
    const smokeIndex = workflowSource.indexOf('- name: Run post-deploy public smoke');

    expect(preflightIndex).toBeGreaterThan(-1);
    expect(testsIndex).toBeGreaterThan(preflightIndex);
    expect(synthIndex).toBeGreaterThan(testsIndex);
    expect(bootstrapPrecheckIndex).toBeGreaterThan(synthIndex);
    expect(deployIndex).toBeGreaterThan(bootstrapPrecheckIndex);
    expect(smokeIndex).toBeGreaterThan(deployIndex);
  });
});
