export default class StringUtilities {
    public static genStringPattern(
        char: string,
        length: number,
        numbered: boolean = false
    ): string {
        if (!numbered) {
            const out = (char + ',').repeat(length);
            return out.substring(0, out.length - 1);
        } else {
            let out: string = '';
            for (let i = 1; i <= length; i++) {
                out = out + char + i + ',';
            }
            return out.substring(0, out.length - 1);
        }
    }
}
