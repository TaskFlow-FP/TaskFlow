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
            console.error("Failed to fetch projects:", await resp.text());
            return [];
        }

        const data = await resp.json();
        return data.projects || [];
    } catch (error) {
        console.error("Error in getProjects:", error);
        return [];
    }
}

export default async function ProjectPage() {
    const projects = await getProjects()

    return (
        <SidebarLayout>
            <div className="px-6 py-8">
                <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Your Projects</h1>
                    <p className="text-gray-400">Manage, collaborate, and track your work.</p>
                </div>
                <CreateProjectButton />
                </div>

                {projects.length === 0 ? (
                <div className="text-center bg-gray-800 rounded-xl p-12 border-2 border-dashed border-gray-700">
                    <h2 className="text-2xl font-bold text-white mb-2">No Projects Found</h2>
                    <p className="text-gray-400 mb-6">Get started by creating your first project.</p>
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
        </SidebarLayout>
    )
}

function ProjectCard({ project }: { project: ProjectType }) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 h-full flex flex-col justify-between hover:border-blue-500 transition-all duration-200">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">{project.name}</h3>
        <p className="text-gray-400 text-sm line-clamp-3">
          {project.description || "No description provided."}
        </p>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">
            Created on {new Date(project.createdAt).toLocaleDateString()}
          </span>
        </div>
        <Link href={`/project/${project._id}`}>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">
            View Details
          </button>
        </Link>
      </div>
    </div>
  );
}