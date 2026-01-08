/**
 * Extracts YouTube Video ID from various URL formats.
 * Supports:
 * - Standard: https://www.youtube.com/watch?v=VIDEO_ID
 * - Shorts: https://www.youtube.com/shorts/VIDEO_ID
 * - Shortened/Sharing: https://youtu.be/VIDEO_ID
 * - Embedded: https://www.youtube.com/embed/VIDEO_ID
 * - Mobile: https://m.youtube.com/watch?v=VIDEO_ID
 * 
 * @param url The YouTube URL to parse
 * @returns The 11-character video ID or null if not found
 */
export function getYoutubeId(url: string | null | undefined): string | null {
    if (!url) return null;

    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);

    return match ? match[1] : null;
}

/**
 * Generates a YouTube embed URL from a video ID.
 * 
 * @param videoId The 11-character YouTube video ID
 * @returns A safe embed URL
 */
export function getYoutubeEmbedUrl(videoId: string | null | undefined): string | null {
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}`;
}
