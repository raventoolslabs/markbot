export interface Document {
    id: string;
    creationDate: Date;
    modificationDate: Date;
    organization: string;
    path: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: any;
}
