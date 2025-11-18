import { cookies } from "next/headers";
import SidebarLayout from "@/app/components/SidebarLayout"
import ProjectClientPage from "./ProjectClientPage"

export interface IUser {
    _id: string
    email: string
    full_name: string
    createdAt?: string
    updatedAt?: string
}

export interface IMember {
    _id: string
    email: string
    full_name: string
    createdAt?: string
    updatedAt?: string
}

export interface ITask {
    _id: string
    projectId: string
    title: string
    description: string
    status: string
    priority: string
    due_date: string | null
    google_calendar_event_id: string | null
    createdAt: string
    updatedAt: string
}

export interface IProject {
    _id: string
    name: string
    description: string
    ownerId: string
    createdAt: string
    updatedAt: string
    tasks: ITask[]
    members: IMember[]
    owner: IUser
}

export interface ProjectDetails {
    project: IProject;
    tasks: ITask[];
    members: IMember[];
}

async function getProjectDetail(projectId: string): Promise<ProjectDetails | null> {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('access_token')
        if (!token) {
            return null
        }

        const resp = await fetch(`http://localhost:3000/api/projects/${projectId}`, {
            headers: {
                'Cookie': `access_token=${token.value}`
            }
        })

        if (!resp.ok) {
            throw new Error("Failed to fetch project details");
        }

        const projectData: IProject = await resp.json();
        
        // Transform data untuk match dengan interface ProjectDetails
        return {
            project: projectData,
            tasks: projectData.tasks || [],
            members: projectData.members || []
        };
    } catch (error) {
        return null;
    }
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const data = await getProjectDetail(id)

    if (!data) {
        return (
            <SidebarLayout>
                <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">Project Not Found</h1>
                    <p className="text-gray-400">The project you're looking for doesn't exist or you don't have access to it.</p>
                </div>
            </SidebarLayout>
        );
    }

    return (
        <SidebarLayout>
            <ProjectClientPage initialData={data} />
        </SidebarLayout>
    );
}