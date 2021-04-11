import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbedFieldData, MessageAttachment, WebhookClient } from 'discord.js';
import * as moment from 'moment';
import { Ban } from 'src/bans/bans.interface';
import { Colors } from 'src/enums/colors.enum';

@Injectable()
export class DiscordService {
  private webhookUrl: string;
  private role: string;

  constructor(
    private configService: ConfigService,
  ) {
    this.role = this.configService.get('DISCORD_ROLE');
    this.webhookUrl = this.configService.get('WEBHOOK_URL');
  }

  private get webhookCredentials() {
    return {
      id: this.webhookUrl.split('/').slice(5)[0],
      token: this.webhookUrl.split('/').slice(5)[1],
    };
  }

  async sendDiscordNotification(banArray: Ban[], screenshots: Buffer[]) {
    const webhookClient = new WebhookClient(
      this.webhookCredentials.id,
      this.webhookCredentials.token,
    );

    for (let i = banArray.length - 1; i >= 0; i--) {
      const ban = banArray[i];
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

      const discordAttachment = new MessageAttachment(screenshots[i], 'ban.png');

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
