import {BasicController} from "./types";
import * as cheerio from 'cheerio';
import axios from 'axios';


export class OtomotoController implements BasicController {
  parsingLink = 'https://www.otomoto.pl/osobowe/tesla/model-3/od-2020?search%5Bfilter_enum_damaged%5D=0&search%5Bfilter_float_mileage:to%5D=140000&search%5Bfilter_float_price:to%5D=110000&search%5Border%5D=created_at_first:desc';

  async checkForNewListings(): Promise<Record<string, string>> {
    const newListingUrls: Record<string, string> = {};
    try {
      const response = await axios.get(this.parsingLink, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/85.0.4183.83 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }
      });
      const html = response.data;
      const $ = cheerio.load(html as string);

      const articles = $('article');
      articles.each((_, element) => {
        const articleId = $(element).attr('data-id');
        const section = $(element).find('h2').first();
        const link = section.find('a').first().attr('href');
        if (articleId) {
          newListingUrls[articleId] = link;
        }
      });

      return newListingUrls;
    } catch (error) {
      console.log(`❌ Error fetching data: ${error.message}`);
    }
  }
}
