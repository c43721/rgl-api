import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbedFieldData, MessageAttachment, WebhookClient } from 'discord.js';
import * as moment from 'moment';
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
      const expirationMomentObject = moment(ban.expiresAt);

      const fields: EmbedFieldData[] = [
        {
          name: 'Steam ID',
          value: ban.steamId,
          inline: true,
        },
        {
          name: 'Expires',
          value: `${expirationMomentObject.format('MM-DD-YYYY')}${
            expirationMomentObject.isBetween(
              moment(),
              moment().add(5, 'years'),
              undefined,
              '(]',
            )
              ? ` (${expirationMomentObject.toNow(true)})`
              : ''
          }`,
          inline: true,
        },
        // Needed or else we get a 3/2 distribution of inline-embeds
        {
          name: '\u200b',
          value: '\u200b',
          inline: true,
        },
      ];

      if (!!ban.teamDetails?.name) {
        const { link, div, name } = ban.teamDetails;

        fields.push(
          {
            name: 'Team Name',
            value: name,
            inline: true,
          },
          {
            name: 'Team Division',
            value: div,
            inline: true,
          },
          {
            name: 'Team URL',
            value: `[Team page](${link})`,
            inline: true,
          },
        );
      }

      // This is inefficient. I should recieve an array beforhand of screenshot elements, so I can re-use a puppeteer instance.
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
