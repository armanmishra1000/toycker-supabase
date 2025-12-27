export const buildPlaceholderStyles = (id: string): string => {
    // Simple hash for consistent color selection
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const colors = [
        'bg-gradient-to-br from-rose-100 to-rose-200',
        'bg-gradient-to-br from-amber-100 to-amber-200',
        'bg-gradient-to-br from-emerald-100 to-emerald-200',
        'bg-gradient-to-br from-sky-100 to-sky-200',
        'bg-gradient-to-br from-violet-100 to-violet-200',
    ]
    return colors[hash % colors.length]
}
