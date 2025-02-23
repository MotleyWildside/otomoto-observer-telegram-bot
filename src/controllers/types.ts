export interface BasicController {
  processedListingIds: Set<string>;
  parsingLink: string;
  checkForNewListings(): Promise<string[]>;
}
