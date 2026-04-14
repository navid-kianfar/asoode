import { useRouter } from 'vue-router';
import type { ProjectViewModel } from '@asoode/shared';

export function useProjectNavigation() {
  const router = useRouter();

  function navigateToProject(project: ProjectViewModel) {
    if (project.complex) {
      router.push(`/project/${project.id}`);
    } else if (project.workPackages?.length) {
      router.push(`/work-package/${project.workPackages[0].id}`);
    } else {
      // Fallback to project detail if no workpackage exists (shouldn't happen)
      router.push(`/project/${project.id}`);
    }
  }

  return { navigateToProject };
}
