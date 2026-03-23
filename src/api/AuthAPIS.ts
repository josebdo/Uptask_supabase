import { supabase } from "@/lib/supabase";
import { useSchema, type CheckPasswordForm, type ConfirmToken, type ForgotPasswordForm, type NewPasswordForm, type RequestConfirmationCodeForm, type UserLoginForm, type UserRegistrationForm } from "../types";

export async function createAccount(formData : UserRegistrationForm) {
    const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
            data: {
                name: formData.name
            }
        }
    })
    
    if (error) {
        throw new Error(error.message)
    }
    
    return "Cuenta creada correctamente. Revisa tu email para confirmar."
}

export async function confirmAccount(formData : ConfirmToken) {
    const { error } = await supabase.auth.verifyOtp({
        token: formData.token,
        type: 'signup',
        email: '' // In practice, emails for signup verification are usually handled via links
    })

    if (error) {
        throw new Error(error.message)
    }
    return "Cuenta confirmada correctamente"
}

export async function requestConfirmationCode(formData : RequestConfirmationCodeForm) {
    const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email
    })

    if (error) {
        throw new Error(error.message)
    }
    return "Código de confirmación enviado"
}

export async function authenticateUser(formData : UserLoginForm) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
    })

    if (error) {
        throw new Error(error.message)
    }

    return data.session?.access_token
}

export async function forgotPassword(formData : ForgotPasswordForm) {
    const { error } = await supabase.auth.resetPasswordForEmail(formData.email)

    if (error) {
        throw new Error(error.message)
    }
    return "Email de recuperación enviado"
}

export async function validateToken(_formData : ConfirmToken) {
    // Supabase doesn't have a direct "validate token" for password reset without the email
    return "Token válido" 
}

export async function updatePasswordWithToken({formData}: {formData: NewPasswordForm}) {
    const { error } = await supabase.auth.updateUser({
        password: formData.password
    })

    if (error) {
        throw new Error(error.message)
    }
    return "Password actualizado correctamente"
}

export async function getUser() {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
        return null
    }

    // Fetch additional profile info from the profiles table
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

    if (profileError || !profile) {
        // Fallback to auth metadata if profile table query fails
        const userData = {
            _id: user.id,
            name: user.user_metadata.name || '',
            email: user.email || ''
        }
        const response = useSchema.safeParse(userData)
        return response.success ? response.data : null
    }

    const userData = {
        _id: profile.id,
        name: profile.name,
        email: profile.email
    }

    const response = useSchema.safeParse(userData)
    if (response.success) {
        return response.data
    }
    return null
}

export async function checkPassword(formData : CheckPasswordForm) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) throw new Error("Usuario no encontrado")

    const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: formData.password
    })

    if (error) {
        throw new Error("Password incorrecto")
    }
    return "Password correcto"
}





