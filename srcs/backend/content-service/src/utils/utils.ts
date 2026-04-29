
function stripBrackets(input: string, opening: string): string {
    let result: string = "";
    let depth: number = 0;
    let closing: string = '';

    if (opening === '[') closing = ']';
    else if (opening === '(') closing = ')';

    for (let i = 0; i < input.length; i++) {
        const char = input[i];

        if (char === opening) {
            depth++;
        } else if (char === closing) {
            if (depth > 0) depth--;
        } else if (depth === 0) {
            // Only append characters when not inside any brackets
            result += char;
        }
    }

    return result;
}

/**
 * @brief Normalizes a string by removing brackets and whitespace.
 * 
 * @details This function processes a string through the following steps:
 * - Removes content within parentheses ()
 * - Removes content within square brackets []
 * - Removes everything after dashes (-, –, —)
 * - Removes all whitespace characters
 * - Converts the string to lowercase
 * - Normalize the result
 * 
 * @param str The input string to normalize
 * @return A normalized string with brackets removed, lowercased, and whitespace stripped
 * 
 * @example
 * normalizeString("The Title (Remix) - Extended") // Returns "thetitle"
 * normalizeString("Song [Feat. Artist]") // Returns "song"
 */
export function normalizeString(str: string): string {
    let result: string = '';

    result = stripBrackets(str, '(');
    result = stripBrackets(result, '[');

    return result
        .replace(/\s+[-–—]\s+.*/g, '')
        .replace(/\s+/g, '')
        .toLowerCase()
        .normalize();
}

/**
 * @brief Clears a string by removing brackets and normalizing whitespace.
 * 
 * @details This function processes a string through the following steps:
 * - Removes content within parentheses ()
 * - Removes content within square brackets []
 * - Removes everything after dashes (-, –, —)
 * - Replaces multiple consecutive whitespaces with a single space
 * - Trims leading and trailing whitespace
 * 
 * @param str The input string to clear
 * @return A cleared string with brackets removed, normalized whitespace, and trimmed
 * 
 * @example
 * clearString("The Title (Remix) - Extended") // Returns "The Title"
 * clearString("Song  [Feat. Artist]") // Returns "Song"
 * 
 * @note Unlike normalizeString(), this function preserves the original case
 * and maintains spacing between words (normalized to single spaces).
 */
export function clearString(str: string): string {
    let result: string = '';

    result = stripBrackets(str, '(');
    result = stripBrackets(result, '[');

    return result
        .replace(/\s+[-–—]\s+.*/g, '')
        .trim()
        .replace(/\s\s+/g, ' ');
}
