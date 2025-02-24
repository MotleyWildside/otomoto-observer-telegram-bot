export interface BasicController {
  parsingLink: string;
  checkForNewListings(): Promise<Record<string, string>>;
}
