import { cookies } from "next/headers";
import SidebarLayout from "../components/SidebarLayout";
import CreateProjectButton from "../components/CreateProjectButton";
import Link from "next/link";

interface ProjectType {
    _id: string
    name: string;
    description: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
    owner: {
        _id: string;
        email: string;
        full_name: string;
        createdAt: string;
        updatedAt: string;
    };
}

async function getProjects(): Promise<ProjectType[]> {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('access_token')

        if (!token) {
            return []
        }

        const resp = await fetch('http://localhost:3000/api/projects', {
            headers: {
                'Cookie': `access_token=${token.value}`
            }
        }) 

        if (!resp.ok) {
            return [];
        }

        const data = await resp.json();
        return data.projects || [];
    } catch (error) {
        return [];
    }
}

export default async function ProjectPage() {
    const projects = await getProjects()

    return (
        <SidebarLayout>
            <div className="min-h-screen bg-gray-50">
                <div className="bg-white border-b border-gray-200 px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Your Projects</h1>
                            <p className="text-sm text-gray-600">Manage, collaborate, and track your work.</p>
                        </div>
                        <CreateProjectButton />
                    </div>
                </div>

                <div className="px-8 py-6">
                    {projects.length === 0 ? (
                        <div className="text-center bg-white rounded-lg p-12 border border-gray-200 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Projects Found</h2>
                            <p className="text-gray-600 mb-6">Get started by creating your first project.</p>
                            <CreateProjectButton />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map((project) => (
                                <ProjectCard key={project._id} project={project} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </SidebarLayout>
    )
}

function ProjectCard({ project }: { project: ProjectType }) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.1)] h-full flex flex-col justify-between hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-200">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
        <p className="text-sm text-gray-600 line-clamp-3">
          {project.description || "No description provided."}
        </p>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">
            {new Date(project.createdAt).toLocaleDateString()}
          </span>
        </div>
        <Link href={`/project/${project._id}`}>
          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm">
            View Details
          </button>
        </Link>
      </div>
    </div>
  );
}
