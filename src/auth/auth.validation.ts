type ValidationResult = { error: Error | null; value: string };

export function validateName(name: string): ValidationResult {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 100) {
        return { error: new Error("Name must be between 2 and 100 characters"), value: trimmed };
    }
    return { error: null, value: trimmed };
}

export function validateEmail(mail: string): ValidationResult {
    const trimmed = mail.trim().toLowerCase();
    if (trimmed.length < 2 || trimmed.length > 255) {
        return { error: new Error("Email must be between 2 and 255 characters"), value: trimmed };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
        return { error: new Error("Email is not valid"), value: trimmed };
    }
    return { error: null, value: trimmed };
}

export function validatePassword(password: string): ValidationResult {
    if (password.length < 8 || password.length > 72) {
        return { error: new Error("Password must be between 8 and 72 characters"), value: password };
    }
    return { error: null, value: password };
}

export function validateGlobalRole(global_role: string): ValidationResult {
    if (global_role != 'student' && global_role != 'teacher') {
        return { error: new Error("Global role must be either 'student' or 'teacher'"), value: global_role }
    }
    return { error: null, value: global_role }
}