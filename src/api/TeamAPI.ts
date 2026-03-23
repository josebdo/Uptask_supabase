import { supabase } from "@/lib/supabase";
import { TeamMembersSchema, type Project, type TeamMember, type TeamMemberForm } from "../types";

export async function findUserByEmail({formData} : {projectId: Project['_id'], formData : TeamMemberForm}) {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('email', formData.email)
        .single()

    if (error) {
        throw new Error("Usuario no encontrado")
    }

    return {
        _id: data.id,
        name: data.name,
        email: data.email
    }
}

export async function addUserToProject({projectId, id} : {projectId: Project['_id'], id : TeamMember['_id']}) {
    const { error } = await supabase
        .from('project_team')
        .insert({
            project_id: projectId,
            user_id: id
        })

    if (error) {
        if (error.code === '23505') {
            throw new Error("El usuario ya es parte del equipo")
        }
        throw new Error(error.message)
    }
    return "Usuario agregado correctamente"
}

export async function getProjectTeam(projectId: Project['_id']) {
    const { data, error } = await supabase
        .from('project_team')
        .select(`
            user_id,
            profiles (
                id,
                name,
                email
            )
        `)
        .eq('project_id', projectId)

    if (error) {
        throw new Error(error.message)
    }

    const mappedData = data.map((item: any) => ({
        _id: item.profiles.id,
        name: item.profiles.name,
        email: item.profiles.email
    }))

    const response = TeamMembersSchema.safeParse(mappedData)
    if (response.success) {
        return response.data
    }
    console.error(response.error)
    return []
}

export async function removeUserFromProject({projectId, userId} : {projectId: Project['_id'], userId : TeamMember['_id']}) {
    const { error } = await supabase
        .from('project_team')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId)

    if (error) {
        throw new Error(error.message)
    }
    return "Usuario eliminado correctamente"
}
