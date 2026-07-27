import { listProjects } from "@/lib/repos/projects";
import SettingsPanel from "@/components/SettingsPanel";
import ProjectManager from "@/components/ProjectManager";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const projects = await listProjects();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <SettingsPanel />
      <ProjectManager projects={projects} />
    </div>
  );
}
