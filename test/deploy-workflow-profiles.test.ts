import * as fs from 'node:fs';
import * as path from 'node:path';

describe('deploy workflow run profiles', () => {
  test('defines full, bootstrap-proof, and smoke-only run profiles', () => {
    const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'deploy-ecs.yml');
    const workflowSource = fs.readFileSync(workflowPath, 'utf8');

    expect(workflowSource).toContain('run_profile:');
    expect(workflowSource).toContain('- full');
    expect(workflowSource).toContain('- bootstrap-proof');
    expect(workflowSource).toContain('- smoke-only');
  });

  test('skips preflight and unit tests outside the full profile', () => {
    const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'deploy-ecs.yml');
    const workflowSource = fs.readFileSync(workflowPath, 'utf8');

    expect(workflowSource).toContain("if: ${{ env.RUN_PROFILE == 'full' }}\n        run: npm run preflight");
    expect(workflowSource).toContain("if: ${{ env.RUN_PROFILE == 'full' }}\n        run: npm test -- --runInBand");
  });

  test('runs synth and deploy for bootstrap-proof and smoke for every profile', () => {
    const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'deploy-ecs.yml');
    const workflowSource = fs.readFileSync(workflowPath, 'utf8');

    expect(workflowSource).toContain("if: ${{ env.RUN_PROFILE != 'smoke-only' }}\n        run: npx cdk synth");
    expect(workflowSource).toContain("if: ${{ env.RUN_PROFILE != 'smoke-only' }}\n        run: npx cdk deploy --require-approval never");
    expect(workflowSource).toContain('- name: Run post-deploy public smoke');
  });
});
