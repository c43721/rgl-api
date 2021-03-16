import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbedFieldData, MessageAttachment, WebhookClient } from 'discord.js';
import { Ban } from 'src/bans/bans.interface';
import { Colors } from 'src/enums/colors.enum';
import { RglPages } from 'src/rgl/rgl.enum';
import * as puppeteer from 'puppeteer';

@Injectable()
export class DiscordService {
	private webhookUrl: string;
	private role: string;

	constructor(private configService: ConfigService) {
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

			const screenshot = await this.generateScreenshot(ban.banId);
			const discordAttachment = new MessageAttachment(
				screenshot,
				'buffer.png',
			);

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
							url: `attachment://buffer.png`,
						},
					},
				],
			});
		}
	}

	async generateScreenshot(banId: string): Promise<Buffer> {
		const browser = await puppeteer.launch({
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		});

		const page = await browser.newPage();
		await page.goto(RglPages.BAN_PAGE);

		const [button] = await page.$x(`//tr[@id=${banId}]//td//span`);

		await button.click();

		await page.waitForTimeout(250);

		const options = {
			top: {
				selector: `[data-target="#LFT-${banId}"]`,
				edge: 'top',
			},
			bottom: {
				selector: `[data-target="#LFT-${banId}"] + tr`,
				edge: 'bottom',
			},
			left: {
				selector: 'table',
				edge: 'left',
			},
			right: {
				selector: 'table',
				edge: 'right',
			},
		};

		const clipBounds = await page.evaluate(options => {
			let bounds = {
				x: 0,
				y: 0,
				width: document.body.clientWidth,
				height: document.body.clientHeight,
			};
			['top', 'left', 'bottom', 'right'].forEach(edge => {
				let currentOption = options[edge];
				if (!currentOption) return;

				if (typeof currentOption == 'number') {
					if (edge == 'top') bounds.y = currentOption;
					if (edge == 'left') bounds.x = currentOption;
					if (edge == 'bottom')
						bounds.height = currentOption - bounds.y;
					if (edge == 'right')
						bounds.width = currentOption - bounds.x;
				} else if (typeof currentOption == 'object') {
					if (!document.querySelector(currentOption.selector))
						throw new Error('Top element not found.');

					let element = document.querySelector(
						currentOption.selector,
					);
					let boundingClientRect = element.getBoundingClientRect();

					if (edge == 'top')
						bounds.y = boundingClientRect[currentOption.edge];
					if (edge == 'left')
						bounds.x = boundingClientRect[currentOption.edge];
					if (edge == 'bottom')
						bounds.height =
							boundingClientRect[currentOption.edge] - bounds.y;
					if (edge == 'right')
						bounds.width =
							boundingClientRect[currentOption.edge] - bounds.x;
				}
			});

			return bounds;
		}, options);

		const screenshotBuffer = await page.screenshot({
			clip: clipBounds,
			encoding: 'binary',
		});

		await browser.close();

		return screenshotBuffer as Buffer;
	}
}
