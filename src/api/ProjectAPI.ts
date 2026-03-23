import { supabase } from "@/lib/supabase";
import { dashboardProjectSchema, editProjectSchema, projectSchema, type Project, type ProjectFormData } from "../types";

export async function createProject(formData : ProjectFormData) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Usuario no autenticado")

    const { data, error } = await supabase
        .from('projects')
        .insert({
            project_name: formData.projectName,
            client_name: formData.clientName,
            description: formData.description,
            manager_id: user.id
        })
        .select()
        .single()

    if (error) {
        throw new Error(error.message)
    }
    return data
}

export async function getProjects() {
    const { data, error } = await supabase
        .from('projects')
        .select(`
            id,
            project_name,
            client_name,
            description,
            manager_id
        `)

    if (error) {
        throw new Error(error.message)
    }

    // Map id to _id and snake_case to camelCase for dashboardProjectSchema
    const mappedData = data.map(project => ({
        _id: project.id,
        projectName: project.project_name,
        clientName: project.client_name,
        description: project.description,
        manager: project.manager_id
    }))

    const response = dashboardProjectSchema.safeParse(mappedData)
    if (response.success) {
        return response.data
    }
    console.error(response.error)
    return []
}

export async function getProjectById(id: Project['_id']) {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        throw new Error(error.message)
    }

    const mappedData = {
        _id: data.id,
        projectName: data.project_name,
        clientName: data.client_name,
        description: data.description,
        manager: data.manager_id
    }

    const response = editProjectSchema.safeParse(mappedData)
    if (response.success) {
        return response.data
    }
    throw new Error("Error al validar los datos del proyecto")
}

export async function getFullProject(id: Project['_id']) {
    // In Supabase, we fetch the project and its tasks/team in separate queries or joined
    const { data: project, error: projectError } = await supabase
        .from('projects')
        .select(`
            *,
            tasks (
                id,
                name,
                description,
                status
            )
        `)
        .eq('id', id)
        .single()

    if (projectError) {
        throw new Error(projectError.message)
    }

    // Fetch team members
    const { data: teamData, error: teamError } = await supabase
        .from('project_team')
        .select('user_id')
        .eq('project_id', id)

    if (teamError) {
        throw new Error(teamError.message)
    }

    const mappedData = {
        _id: project.id,
        projectName: project.project_name,
        clientName: project.client_name,
        description: project.description,
        manager: project.manager_id,
        tasks: project.tasks.map((t: any) => ({
            _id: t.id,
            name: t.name,
            description: t.description,
            status: t.status
        })),
        team: teamData.map(t => t.user_id)
    }

    const response = projectSchema.safeParse(mappedData)
    if (response.success) {
        return response.data
    }
    console.error(response.error)
    throw new Error("Error al validar el proyecto completo")
}

type ProjectAPIType = {
    formData: ProjectFormData
    projectId: Project['_id']
}

export async function updateProject({formData, projectId} : ProjectAPIType ) {
    const { data, error } = await supabase
        .from('projects')
        .update({
            project_name: formData.projectName,
            client_name: formData.clientName,
            description: formData.description
        })
        .eq('id', projectId)
        .select()
        .single()

    if (error) {
        throw new Error(error.message)
    }
    return data
}

export async function deleteProject(id: Project['_id']) {
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

    if (error) {
        throw new Error(error.message)
    }
    return "Proyecto eliminado correctamente"
}
