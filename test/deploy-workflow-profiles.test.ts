import * as fs from 'node:fs';
import * as path from 'node:path';

describe('deploy workflow run profiles', () => {
  test('defines full, bootstrap-proof, warm-host-partial, and smoke-only run profiles', () => {
    const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'deploy-ecs.yml');
    const workflowSource = fs.readFileSync(workflowPath, 'utf8');

    expect(workflowSource).toContain('run_profile:');
    expect(workflowSource).toContain('- full');
    expect(workflowSource).toContain('- bootstrap-proof');
    expect(workflowSource).toContain('- warm-host-partial');
    expect(workflowSource).toContain('- smoke-only');
  });

  test('runs preflight for full and warm-host-partial, but keeps unit tests on full only', () => {
    const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'deploy-ecs.yml');
    const workflowSource = fs.readFileSync(workflowPath, 'utf8');

    expect(workflowSource).toContain(
      "if: ${{ env.RUN_PROFILE == 'full' || env.RUN_PROFILE == 'warm-host-partial' }}\n        run: npm run preflight"
    );
    expect(workflowSource).toContain("if: ${{ env.RUN_PROFILE == 'full' }}\n        run: npm test -- --runInBand");
  });

  test('runs synth and deploy for bootstrap-proof and smoke for every profile', () => {
    const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'deploy-ecs.yml');
    const workflowSource = fs.readFileSync(workflowPath, 'utf8');

    expect(workflowSource).toContain("if: ${{ env.RUN_PROFILE != 'smoke-only' }}\n        run: npx cdk synth");
    expect(workflowSource).toContain("if: ${{ env.RUN_PROFILE != 'smoke-only' }}\n        run: npx cdk deploy --require-approval never");
    expect(workflowSource).toContain('- name: Run post-deploy public smoke');
  });

  test('exports cockpit hosts into the deploy environment', () => {
    const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'deploy-ecs.yml');
    const workflowSource = fs.readFileSync(workflowPath, 'utf8');

    expect(workflowSource).toContain('COCKPIT_HOSTS: ${{ vars.COCKPIT_HOSTS }}');
  });

  test('passes the explicit release manifest path into warm-host partial runs', () => {
    const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'deploy-ecs.yml');
    const workflowSource = fs.readFileSync(workflowPath, 'utf8');

    expect(workflowSource).toContain('release_manifest_path:');
    expect(workflowSource).toContain('RELEASE_MANIFEST_PATH: ${{ github.event.inputs.release_manifest_path }}');
  });
});
