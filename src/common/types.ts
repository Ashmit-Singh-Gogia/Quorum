export interface User {
    id: string
    name: string
    email: string
    password_hash: string
    global_role: 'site_admin' | 'teacher' | 'student'
    created_at: Date
}
