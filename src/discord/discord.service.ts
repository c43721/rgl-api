import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbedFieldData, MessageAttachment, WebhookClient } from 'discord.js';
import { Ban } from 'src/bans/bans.interface';
import { Colors } from 'src/enums/colors.enum';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';

@Injectable()
export class DiscordService {
  private webhookUrl: string;
  private role: string;

  constructor(
    private configService: ConfigService,
    private puppeteerService: PuppeteerService,
  ) {
    this.role = this.configService.get('DISCORD_ROLE');
    this.webhookUrl = this.configService.get('WEBHOOK_URL');
  }

  async sendDiscordNotification(banArray: Ban[]) {
    const [WEBHOOK_ID, WEBHOOK_TOKEN] = [
      this.webhookUrl.split('/').slice(5)[0],
      this.webhookUrl.split('/').slice(5)[1],
    ];

    const webhookClient = new WebhookClient(WEBHOOK_ID, WEBHOOK_TOKEN);

    for (const ban of banArray.reverse()) {
      let fields: Array<EmbedFieldData> | null = null;
      if (!!ban.teamDetails?.currentTeam) {
        const { currentTeam, div, teamLink } = ban.teamDetails;
        fields = [
          {
            name: 'Team Name',
            value: currentTeam,
            inline: true,
          },
          {
            name: 'Team Division',
            value: div,
            inline: true,
          },
          {
            name: 'Team URL',
            value: `[Team page](${teamLink})`,
            inline: true,
          },
        ];
      }

      const screenshot = await this.puppeteerService.generateBanScreenshot(
        ban.banId,
      );
      const discordAttachment = new MessageAttachment(screenshot, 'ban.png');

      await webhookClient.send('', {
        files: [discordAttachment],
        embeds: [
          {
            title: `${ban.name} banned`,
            timestamp: Date.now(),
            color: Colors.BAN_COLOR,
            description: `<@&${this.role}>\n**Reason:**\n${ban.reason}`,
            url: ban.link,
            fields,
            image: {
              url: `attachment://ban.png`,
            },
          },
        ],
      });
    }
  }
}
