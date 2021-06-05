import { Injectable } from '@nestjs/common';
import {
  SerializableOrJSHandle,
  Page,
  launch as launchBrowser,
  Browser,
} from 'puppeteer';
import { Cluster } from 'puppeteer-cluster';
import { RglPages } from 'src/rgl/enums/rgl.enum';

@Injectable()
export class PuppeteerService {
  private async generateClipBounds(
    options: SerializableOrJSHandle,
    page: Page,
  ) {
    return await page.evaluate(options => {
      let bounds = {
        x: 0,
        y: 0,
        width: document.body.clientWidth,
        height: document.body.clientHeight,
      };

      ['top', 'left', 'bottom', 'right'].forEach(edge => {
        const currentOption = options[edge];
        if (!currentOption) return;

        if (typeof currentOption == 'number') {
          if (edge == 'top') bounds.y = currentOption;
          if (edge == 'left') bounds.x = currentOption;
          if (edge == 'bottom') bounds.height = currentOption - bounds.y;
          if (edge == 'right') bounds.width = currentOption - bounds.x;
        } else if (typeof currentOption == 'object') {
          if (!document.querySelector(currentOption.selector))
            throw new Error('Top element not found.');

          const element = document.querySelector(currentOption.selector);
          const boundingClientRect = element.getBoundingClientRect();

          if (edge == 'top') bounds.y = boundingClientRect[currentOption.edge];
          if (edge == 'left') bounds.x = boundingClientRect[currentOption.edge];
          if (edge == 'bottom')
            bounds.height = boundingClientRect[currentOption.edge] - bounds.y;
          if (edge == 'right')
            bounds.width = boundingClientRect[currentOption.edge] - bounds.x;
        }
      });

      return bounds;
    }, options);
  }

  private async createPage(url: string) {
    const browser = await launchBrowser({
      // testing purposes
      // headless: false,
      // args: ['--proxy-server="direct://"', '--proxy-bypass-list=*'],
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: {
        // Needed or else screenshots can't be created
        height: 925,
        width: 1000,
      },
    });

    const page = await browser.newPage();
    await page.goto(url);

    return { page, browser };
  }

  private async closeBrowser(browser: Browser) {
    await Promise.all(
      (await browser.pages()).map(async page => await page.close()),
    );
    await browser.close();
  }

  async generateBulkBanScreenshots(banIds: string[]) {
    const buffers: Buffer[] = [];

    const { page, browser } = await this.createPage(RglPages.BAN_PAGE);

    for (const id of banIds) {
      const [button] = await page.$x(`//tr[@id=${id}]//td//span`);

      await button.click();

      await page.waitForTimeout(250);

      const options = {
        top: {
          selector: `[data-target="#LFT-${id}"]`,
          edge: 'top',
        },
        bottom: {
          selector: `[data-target="#LFT-${id}"] + tr`,
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

      const clipBounds = await this.generateClipBounds(options, page);

      const screenshotBuffer = await page.screenshot({
        clip: clipBounds,
      });

      buffers.push(screenshotBuffer as Buffer);
    }

    await this.closeBrowser(browser);

    return buffers;
  }

  async scrapeBulkProfilePages(steamIds: string[]): Promise<string[]> {
    const cluster = await Cluster.launch({
      puppeteerOptions: {
        // testing purposes
        // headless: false,
        // args: ['--proxy-server="direct://"', '--proxy-bypass-list=*'],
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      } as any,
      skipDuplicateUrls: true,
      concurrency: Cluster.CONCURRENCY_PAGE,
      maxConcurrency: 4,
    });

    const documents: string[] = [];
    await cluster.task(async ({ page, data }) => {
      await page.goto(RglPages.PROFILE_PAGE + data, {
        waitUntil: 'domcontentloaded',
      });

      // Holy hackathon...
      const body = await page.$eval('body', el => el.innerHTML);
      documents.push(body);
    });

    steamIds.forEach(sid => cluster.queue(sid));

    await cluster.idle();
    await cluster.close();

    return documents;
  }
}
