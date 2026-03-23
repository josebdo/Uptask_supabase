import { supabase } from "@/lib/supabase";
import { taskSchema, type Project, type Task, type TaskFormData } from "../types";

type TaskAPI = {
    formData: TaskFormData
    projectId: Project['_id']
    taskId: Task['_id']
    status: Task['status']
}

export async function createTask({formData, projectId} : Pick<TaskAPI,'formData'|'projectId'>) {
    const { error } = await supabase
        .from('tasks')
        .insert({
            name: formData.name,
            description: formData.description,
            project_id: projectId
        })
        .select()
        .single()

    if (error) {
        throw new Error(error.message)
    }
    return "Tarea creada correctamente"
}

export async function getTaskById({taskId} : Pick<TaskAPI, 'taskId'>) {
    const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select(`
            *,
            task_completions (
                id,
                status,
                created_at,
                user_id
            ),
            notes (
                id,
                content,
                created_at,
                created_by
            )
        `)
        .eq('id', taskId)
        .single()

    if (taskError) {
        throw new Error(taskError.message)
    }

    // Collect all unique user IDs from completions and notes
    const userIds = new Set<string>()
    task.task_completions.forEach((c: any) => { if (c.user_id) userIds.add(c.user_id) })
    task.notes.forEach((n: any) => { if (n.created_by) userIds.add(n.created_by) })

    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', Array.from(userIds))

    const mappedCompletions = task.task_completions.map((c: any) => {
        const profile = profiles?.find(p => p.id === c.user_id)
        return {
            _id: c.id,
            status: c.status,
            user: {
                _id: profile?.id || c.user_id,
                name: profile?.name || 'Usuario desconocido',
                email: profile?.email || ''
            }
        }
    })

    const mappedNotes = task.notes.map((n: any) => {
        const profile = profiles?.find(p => p.id === n.created_by)
        return {
            _id: n.id,
            content: n.content,
            createdAt: n.created_at,
            task: taskId,
            createdBy: {
                _id: profile?.id || n.created_by,
                name: profile?.name || 'Usuario desconocido',
                email: profile?.email || ''
            }
        }
    })

    const mappedData = {
        _id: task.id,
        name: task.name,
        description: task.description,
        project: task.project_id,
        status: task.status,
        completedBy: mappedCompletions,
        notes: mappedNotes,
        createdAt: task.created_at,
        updatedAt: task.updated_at
    }

    const response = taskSchema.safeParse(mappedData)
    if (response.success) {
        return response.data
    }
    console.error(response.error)
    throw new Error("Error al validar la tarea")
}

export async function updateTask({taskId, formData} : Pick<TaskAPI, 'taskId' | 'formData'>) {
    const { error } = await supabase
        .from('tasks')
        .update({
            name: formData.name,
            description: formData.description
        })
        .eq('id', taskId)

    if (error) {
        throw new Error(error.message)
    }
    return "Tarea actualizada correctamente"
}

export async function deleteTask({taskId} : Pick<TaskAPI, 'taskId'>) {
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

    if (error) {
        throw new Error(error.message)
    }
    return "Tarea eliminada correctamente"
}

export async function updateStatus({taskId, status} : Pick<TaskAPI, 'taskId' | 'status'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Usuario no autenticado")

    // Update status in tasks table
    const { error: updateError } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId)

    if (updateError) {
        throw new Error(updateError.message)
    }

    // Log completion/status change
    const { error: completionError } = await supabase
        .from('task_completions')
        .insert({
            task_id: taskId,
            user_id: user.id,
            status: status
        })

    if (completionError) {
        console.error("Error logging task completion:", completionError.message)
    }

    return "Estado de la tarea actualizado"
}

