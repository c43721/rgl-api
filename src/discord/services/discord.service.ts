import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EmbedFieldData,
  MessageAttachment,
  MessageEmbed,
  WebhookClient,
} from 'discord.js';
import * as moment from 'moment';
import { Ban } from 'src/bans/interfaces/bans.interface';
import { Colors } from 'src/enums/colors.enum';

enum BanTypes {
  WARNING = 'warned',
  BANNED = 'banned',
}

interface EmbedObject {
  file: MessageAttachment;
  embed: MessageEmbed;
}

interface BanType {
  type: BanTypes;
  color: Colors;
}

@Injectable()
export class DiscordService {
  private webhookClient: WebhookClient;
  private role: string;

  constructor(private configService: ConfigService) {
    this.role = this.configService.get('DISCORD_ROLE');

    const webhookUrl = this.configService
      .get('WEBHOOK_URL')
      .split('/')
      .slice(5);

    this.webhookClient = new WebhookClient(webhookUrl[0], webhookUrl[1]);
  }

  async sendDiscordEmbeds(bans: Ban[], buffers: Buffer[]) {
    const embedObjects = this.createEmbedObjects(bans, buffers);

    this.sendDiscordNotification(embedObjects);
  }

  private getTypeOfBan(ban: Ban): BanType {
    // Basically, if the ban has already "expired", it's a warning
    if (moment(ban.expiresAt).isBefore(moment())) {
      return {
        type: BanTypes.WARNING,
        color: Colors.WARN_COLOR,
      };
    }

    // We now can assume that all bans now are going to be real
    return {
      type: BanTypes.BANNED,
      color: Colors.BAN_COLOR,
    };
  }

  private createFields(ban: Ban): EmbedFieldData[] {
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

    return fields;
  }

  private createEmbedObjects(
    banArray: Ban[],
    buffers: Buffer[],
  ): MessageEmbed[] {
    const embedObjects: MessageEmbed[] = [];

    for (let i = banArray.length - 1; i >= 0; i--) {
      const ban = banArray[i];
      const banType = this.getTypeOfBan(ban);
      const fields = this.createFields(ban);

      const discordAttachment = new MessageAttachment(buffers[i], 'ban.png');

      const embed = new MessageEmbed({
        title: `${ban.name} ${banType.type}`,
        timestamp: Date.now(),
        color: banType.color,
        description: `<@&${this.role}>\n**Reason:**\n${ban.reason}`,
        url: ban.link,
        fields,
        image: {
          url: `attachment://ban.png`,
        },
        files: [discordAttachment],
      });

      embedObjects.push(embed);
    }

    return embedObjects;
  }

  private async sendDiscordNotification(embeds: MessageEmbed[]) {
    await this.webhookClient.send('', { embeds });
  }
}
