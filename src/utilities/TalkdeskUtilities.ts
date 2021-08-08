export default class TalkdeskUtilties {
    public static buildI18NEnvUrl(
        projectName: string,
        env: string,
        language: string,
        namespace: string
    ): string {
        const cdnUrl = 'https://prd-cdn-talkdesk.talkdesk.com';
        return `${cdnUrl}/i18n/${env}/${projectName}/${language}/latest/${encodeURI(
            namespace
        )}.json`;
    }
    public static ENVS = ['preview', 'live'];
}
