import { supabase } from "@/lib/supabase";
import type { Note, NoteFormData, Project, Task } from "../types";

type NoteAPItype = {
    formData: NoteFormData
    projectId: Project['_id']
    taskId: Task['_id']
    noteId: Note['_id']
}

export async function createNote({taskId, formData} : Pick<NoteAPItype, 'taskId' | 'formData'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Usuario no autenticado")

    const { error } = await supabase
        .from('notes')
        .insert({
            content: formData.content,
            task_id: taskId,
            created_by: user.id
        })

    if (error) {
        throw new Error(error.message)
    }
    return "Nota creada correctamente"
}

export async function deleteNote({noteId} : Pick<NoteAPItype, 'noteId'>) {
    const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)

    if (error) {
        throw new Error(error.message)
    }
    return "Nota eliminada correctamente"
}