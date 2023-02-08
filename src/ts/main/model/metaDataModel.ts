// interface for metadata
export interface MetaDataModel {
  title: string;
  author?: string;
  written?: string;
  textPath?: string[];
  dateStarted: Date;
  division: string;
  coverHTML?: string;
  coverImage?: string;
  coverStyle?: string[][];
}