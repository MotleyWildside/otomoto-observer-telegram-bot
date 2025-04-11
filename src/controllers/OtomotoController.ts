import {BasicController} from "./types";
import * as cheerio from 'cheerio';
import axios from 'axios';


export class OtomotoController implements BasicController {
  parsingLink = 'https://www.otomoto.pl/osobowe/seg-sedan--seg-suv/od-2018?search%5Bfilter_enum_damaged%5D=0&search%5Bfilter_enum_driver_seat_electrically_adjustable%5D=1&search%5Bfilter_enum_gearbox%5D=automatic&search%5Bfilter_enum_registered%5D=1&search%5Bfilter_enum_upholstery_type%5D=leather-upholstery&search%5Bfilter_float_mileage%3Ato%5D=125000&search%5Bfilter_float_price%3Afrom%5D=55000&search%5Bfilter_float_price%3Ato%5D=86000&search%5Border%5D=created_at_first%3Adesc&search%5Badvanced_search_expanded%5D=true';

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
