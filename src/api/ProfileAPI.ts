import { supabase } from "@/lib/supabase";
import type { UpdateCurrentUserPasswordForm, UserProfileForm } from "../types";


export async function updateProfile(formData: UserProfileForm) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Usuario no autenticado")

    // Update profiles table
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            name: formData.name,
            email: formData.email
        })
        .eq('id', user.id)

    if (profileError) {
        throw new Error(profileError.message)
    }

    // Update auth metadata if needed
    const { error: authError } = await supabase.auth.updateUser({
        email: formData.email,
        data: { name: formData.name }
    })

    if (authError) {
        throw new Error(authError.message)
    }

    return "Perfil actualizado correctamente"
}

export async function changePassword(formData: UpdateCurrentUserPasswordForm) {
    const { error } = await supabase.auth.updateUser({
        password: formData.password
    })

    if (error) {
        throw new Error(error.message)
    }

    return "Password actualizado correctamente"
}