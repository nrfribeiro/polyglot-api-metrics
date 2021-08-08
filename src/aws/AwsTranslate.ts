import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate';
import Logger from '../utilities/Logger';

export default class AwsTranslate {
    private static client = new TranslateClient({ region: 'us-east-1' });
    public static async translateValue(
        source: string,
        destination: string,
        value: string
    ): Promise<string> {
        const commandInput = {
            SourceLanguageCode: source,
            TargetLanguageCode: destination,
            Text: value,
        };
        commandInput.Text = commandInput.Text.replace('{{', '<p translate=no>{{').replace(
            '}}',
            '}}</p>'
        );
        const command = new TranslateTextCommand(commandInput);
        try {
            const response = await AwsTranslate.client.send(command);
            return response.TranslatedText.replace('<p translate=no>{{', '{{').replace(
                '}}</p>',
                '}}'
            );
        } catch (error) {
            Logger.log(
                'error',
                'Auto Tranlate Error ' + error.message + JSON.stringify(commandInput)
            );
            return '';
        }
    }
}
